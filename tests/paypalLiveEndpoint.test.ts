import { describe, expect, it, afterEach, vi } from "vitest";
import { getPayPalBaseUrl, getSubscription } from "@/lib/paypal";

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  delete process.env.PAYPAL_ENV;
  vi.restoreAllMocks();
});

/**
 * Intercepts OAuth and records the Basic header, so the credential encoding can
 * be asserted without a network call or real credentials.
 */
function captureOAuth(): { authHeader: () => string } {
  let header = "";

  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/v1/oauth2/token")) {
      header = (init?.headers as Record<string, string>).Authorization;
      return new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: "S-1", status: "ACTIVE" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  return { authHeader: () => header };
}

/**
 * The endpoint is pinned to live. `PAYPAL_ENV` used to select it and defaulted
 * to sandbox, which meant a deploy with live credentials and no `PAYPAL_ENV`
 * sent them to the sandbox host and got back a 401 that looked exactly like a
 * bad secret.
 */
describe("getPayPalBaseUrl", () => {
  it("returns the live API with no environment variable set", () => {
    expect(getPayPalBaseUrl()).toBe("https://api-m.paypal.com");
  });

  it("stays on live when PAYPAL_ENV still says sandbox", () => {
    process.env.PAYPAL_ENV = "sandbox";

    expect(getPayPalBaseUrl()).toBe("https://api-m.paypal.com");
  });

  it("stays on live for any PAYPAL_ENV value", () => {
    process.env.PAYPAL_ENV = "anything-else";

    expect(getPayPalBaseUrl()).toBe("https://api-m.paypal.com");
  });
});

/**
 * A secret with a trailing newline is a valid string that base64-encodes into a
 * valid-looking header, so the failure is invisible until PayPal answers 401.
 * Whatever layer trims, the encoded credential must not carry the whitespace.
 */
describe("OAuth Basic auth encoding", () => {
  it("encodes credentials without surrounding whitespace", async () => {
    process.env.PAYPAL_CLIENT_ID = "  live-client-id\n";
    process.env.PAYPAL_CLIENT_SECRET = "\t live-client-secret \r\n";

    const captured = captureOAuth();
    await getSubscription("S-1");

    const [, base64] = captured.authHeader().split(" ");
    const decoded = Buffer.from(base64, "base64").toString("utf8");

    expect(decoded).toBe("live-client-id:live-client-secret");
  });

  it("sends the token request to the live host", async () => {
    const urls: string[] = [];

    globalThis.fetch = (async (input: unknown) => {
      const url = String(input);
      urls.push(url);

      if (url.includes("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "t" }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ id: "S-1", status: "ACTIVE" }), {
        status: 200,
      });
    }) as typeof fetch;

    await getSubscription("S-1");

    expect(urls[0]).toBe("https://api-m.paypal.com/v1/oauth2/token");
  });
});

/**
 * PayPal's own body is the only thing that tells `invalid_client` (bad or
 * whitespace-padded secret) apart from a misconfigured host, so it must reach
 * the server log. The client-facing error stays generic either way.
 */
describe("OAuth failure logging", () => {
  it("logs PayPal's response body and still throws a generic 502", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          name: "invalid_client",
          message: "Client Authentication Failed",
        }),
        { status: 401 },
      )) as typeof fetch;

    await expect(getSubscription("S-1")).rejects.toMatchObject({
      status: 502,
    });

    const output = logged.mock.calls.flat().join(" ");

    expect(output).toContain("401");
    expect(output).toContain("invalid_client");
    expect(output).toContain("Client Authentication Failed");
  });
});
