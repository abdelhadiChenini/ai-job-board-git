import { describe, expect, it, afterEach } from "vitest";
import { getPayPalConfig } from "@/lib/paypal";

const KEYS = [
  "PAYPAL_CLIENT_ID",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_SECRET",
  "PAYPAL_PLAN_ID",
  "NEXT_PUBLIC_PAYPAL_PLAN_ID",
  "PAYPAL_WEBHOOK_ID",
] as const;

afterEach(() => {
  for (const key of KEYS) {
    delete process.env[key];
  }
});

/**
 * These guards are the difference between a working checkout and a 503 that
 * tells the customer "PayPal is not configured on this server" while the
 * dashboard next to it shows a plan they already paid for. The environment has
 * used two spellings for the secret and the plan id, so both must resolve.
 */
describe("getPayPalConfig", () => {
  it("reads the canonical documented names", () => {
    process.env.PAYPAL_CLIENT_ID = "canonical-id";
    process.env.PAYPAL_CLIENT_SECRET = "canonical-secret";
    process.env.PAYPAL_PLAN_ID = "P-CANONICAL";

    const config = getPayPalConfig();

    expect(config.clientId).toBe("canonical-id");
    expect(config.clientSecret).toBe("canonical-secret");
    expect(config.planId).toBe("P-CANONICAL");
  });

  it("falls back to PAYPAL_SECRET, which the deployed envs actually use", () => {
    process.env.PAYPAL_CLIENT_ID = "id";
    process.env.PAYPAL_SECRET = "alias-secret";
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-ALIAS";

    const config = getPayPalConfig();

    expect(config.clientSecret).toBe("alias-secret");
    expect(config.planId).toBe("P-ALIAS");
  });

  it("falls back to NEXT_PUBLIC_PAYPAL_CLIENT_ID when the server one is absent", () => {
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = "public-id";

    expect(getPayPalConfig().clientId).toBe("public-id");
  });

  it("prefers the canonical name when both spellings are set", () => {
    process.env.PAYPAL_CLIENT_SECRET = "canonical-secret";
    process.env.PAYPAL_SECRET = "alias-secret";
    process.env.PAYPAL_PLAN_ID = "P-CANONICAL";
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID = "P-ALIAS";

    const config = getPayPalConfig();

    expect(config.clientSecret).toBe("canonical-secret");
    expect(config.planId).toBe("P-CANONICAL");
  });

  it("treats an empty or whitespace value as unset", () => {
    process.env.PAYPAL_CLIENT_SECRET = "   ";
    process.env.PAYPAL_SECRET = "real-secret";

    // An empty string must not shadow the fallback, or the 503 returns.
    expect(getPayPalConfig().clientSecret).toBe("real-secret");
  });

  it("reports every value as undefined when nothing is configured", () => {
    const config = getPayPalConfig();

    expect(config.clientId).toBeUndefined();
    expect(config.clientSecret).toBeUndefined();
    expect(config.planId).toBeUndefined();
    expect(config.webhookId).toBeUndefined();
  });
});
