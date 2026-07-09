import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  // @ts-expect-error earlyAccess not in typedefs yet
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
