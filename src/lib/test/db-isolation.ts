/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "child_process";

// 1. Evaluate environment configuration.
export const isTestConfigured =
  process.env.NODE_ENV === "test" &&
  process.env.ALLOW_TEST_DB_RESET === "true" &&
  !!process.env.TEST_DATABASE_URL &&
  !!process.env.EXPECTED_TEST_DB_NAME &&
  process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL;

export const REQUIRED_TEST_DB_NAME = process.env.EXPECTED_TEST_DB_NAME;

// Test isolation gate state must be on globalThis so hoisted proxy can access it
(globalThis as any).__testDb = null;

const { testDbProxy } = vi.hoisted(() => {
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (!(globalThis as any).__testDb) throw new Error("testDb is not initialized");
        return ((globalThis as any).__testDb as any)[prop];
      },
    }),
  };
});

export function setupIsolatedTestDb() {
  return testDbProxy;
}

export async function initializeTestDb() {
  if (!isTestConfigured) return null;

  const url = process.env.TEST_DATABASE_URL || "";
  const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
  const pool = new Pool({
    connectionString: url,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const testDb = new PrismaClient({ adapter });

  (globalThis as any).__testDb = testDb;

  // 5. Execute only SELECT current_database() before identity approval.
  const [{ current_database }] = await testDb.$queryRaw<
    [{ current_database: string }]
  >`SELECT current_database()`;

  // 6. Require exact equality with EXPECTED_TEST_DB_NAME.
  if (current_database !== REQUIRED_TEST_DB_NAME) {
    throw new Error(
      `Database identity mismatch. Expected ${REQUIRED_TEST_DB_NAME}, got ${current_database}.`,
    );
  }

  // 7. Only then allow migration deployment, cleanup, fixtures, or mutations.
  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL, // Isolated migration
    },
  });

  return testDb;
}

export async function teardownTestDb() {
  const testDb = (globalThis as any).__testDb as PrismaClient | null;
  if (testDb) {
    await testDb.$disconnect();
    (globalThis as any).__testDb = null;
  }
}
