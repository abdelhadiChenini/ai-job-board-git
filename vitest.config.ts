import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // The webhook logic is money-moving; run it in-process but never against
    // the real database. Every test mocks `@/lib/prisma` with an in-memory
    // double, so a stray query would throw rather than touch production.
    env: {
      PAYPAL_CLIENT_ID: "test-client-id",
      PAYPAL_CLIENT_SECRET: "test-client-secret",
      PAYPAL_PLAN_ID: "P-TESTPLAN",
      PAYPAL_WEBHOOK_ID: "WH-TEST",
      PAYPAL_ENV: "sandbox",
    },
  },
});
