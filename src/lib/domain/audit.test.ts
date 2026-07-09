/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { createAuditLog } from "./audit";
import { ActorContext } from "./actor";

describe("Transactional Audit Foundation", () => {
  it("merges actor snapshot into metadata without overwriting, and strips secrets recursively and case-insensitively", async () => {
    // We mock the transaction client's auditLog.create method
    let capturedData: unknown = null;
    const mockTx = {
      auditLog: {
        create: async (args: { data: unknown }) => {
          capturedData = args.data;
          return { id: "log-1" };
        },
      },
    } as unknown as Parameters<typeof createAuditLog>[0];

    const actor: ActorContext = {
      userId: "user-123",
      role: "ADMIN",
      metadata: { email: "admin@example.com", role: "ADMIN", status: "ACTIVE" },
    };

    const inputMetadata = {
      previousCode: "OLD",
      password: "secret-password",
      apiToken: "secret-token",
      nested: {
        ClientSecret: "hidden-value",
        normalKey: "visible",
      },
    };

    await createAuditLog(mockTx, actor, {
      action: "UPDATE",
      entityType: "Board",
      summary: "Updated board",
      metadata: inputMetadata,
    });

    const typedData = capturedData as Record<string, any>;
    expect(typedData.action).toBe("UPDATE");
    expect(typedData.actorUserId).toBe("user-123");

    // Check metadata merge and strip
    expect(typedData.metadata).toEqual({
      previousCode: "OLD",
      nested: {
        normalKey: "visible",
      },
      actorSnapshot: { email: "admin@example.com", role: "ADMIN", status: "ACTIVE" },
    });

    // Ensure input object wasn't mutated
    expect(inputMetadata.password).toBe("secret-password");
  });
});
