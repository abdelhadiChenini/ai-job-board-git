import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePrisma, type FakeUser } from "./helpers/fakePrisma";

const USER_ID = "user-1";
const ORIGINAL_FETCH = globalThis.fetch;
// The route 503s on a missing site origin before it ever calls PayPal, so the
// guard has to be satisfied for the upstream error paths to be reachable.
const SITE_URL = "https://example.com";

function seedUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: USER_ID,
    email: "customer@example.com",
    plan: "FREE",
    paypalSubscriptionId: null,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  // The route imports `getServerSession` from `next-auth` itself, whose entry
  // re-exports `next-auth/next`; mocking `@/lib/auth` alone would leave the real
  // implementation to call `headers()` outside a request scope.
  vi.doMock("next-auth", () => ({
    getServerSession: async () => ({ user: { id: USER_ID } }),
  }));
  vi.doMock("@/lib/auth", () => ({ authOptions: {} }));
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  vi.resetModules();
  vi.restoreAllMocks();
});

/**
 * Installs the in-memory database and an authenticated session, then returns a
 * function that invokes the route.
 */
async function callRoute() {
  const db = createFakePrisma([seedUser()]);
  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));

  const { POST } = await import("@/app/api/paypal/create-subscription/route");

  return POST(
    new Request("https://example.com/api/paypal/create-subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ returnPath: "/pricing", cancelPath: "/pricing" }),
    }),
  );
}

/**
 * Makes OAuth succeed, so a later failure is attributable to the subscription
 * call rather than the token exchange.
 */
function mockOAuthSuccess() {
  globalThis.fetch = (async (input: unknown) => {
    if (String(input).includes("/v1/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
      });
    }
    throw new Error(`Unexpected request to ${String(input)}`);
  }) as typeof fetch;
}

/**
 * A 502 that carries no upstream detail is the failure mode this whole change
 * exists to end. Every path that answers 502 must include something the caller
 * can act on, and must never include the credentials that caused it.
 */
describe("create-subscription upstream error surfacing", () => {
  it("returns PayPal's OAuth body when the token request is rejected", async () => {
    const upstream = JSON.stringify({
      name: "invalid_client",
      message: "Client Authentication Failed",
      debug_id: "abc123",
    });

    globalThis.fetch = (async () =>
      new Response(upstream, { status: 401 })) as typeof fetch;

    const response = await callRoute();
    const body = (await response.json()) as { details?: string };

    expect(response.status).toBe(502);
    expect(body.details).toContain("invalid_client");
    expect(body.details).toContain("Client Authentication Failed");
    expect(body.details).toContain("abc123");
  });

  it("returns PayPal's body when subscription creation is rejected", async () => {
    mockOAuthSuccess();

    const upstream = JSON.stringify({
      name: "UNPROCESSABLE_ENTITY",
      message: "The requested action could not be performed.",
      details: [{ field: "/plan_id", issue: "INVALID_PARAMETER_ID" }],
    });

    globalThis.fetch = (async (input: unknown) => {
      if (String(input).includes("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "t" }), {
          status: 200,
        });
      }
      return new Response(upstream, { status: 422 });
    }) as typeof fetch;

    const response = await callRoute();
    const body = (await response.json()) as { details?: string };

    expect(response.status).toBe(502);
    expect(body.details).toContain("UNPROCESSABLE_ENTITY");
    expect(body.details).toContain("INVALID_PARAMETER_ID");
  });

  it("surfaces a non-JSON upstream body verbatim rather than swallowing it", async () => {
    // A proxy or CDN error page in front of PayPal: not JSON, but the single
    // most diagnostic thing available.
    globalThis.fetch = (async () =>
      new Response("<html><body>502 Bad Gateway</body></html>", {
        status: 502,
      })) as typeof fetch;

    const response = await callRoute();
    const body = (await response.json()) as { details?: string };

    expect(response.status).toBe(502);
    expect(body.details).toContain("502 Bad Gateway");
  });

  it("surfaces the message when the host cannot reach PayPal at all", async () => {
    // fetch throws a TypeError before any response exists, so there is no body
    // to read — but "fetch failed" is what distinguishes blocked egress from
    // bad credentials.
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const response = await callRoute();
    const body = (await response.json()) as { details?: string };

    expect(response.status).toBe(502);
    expect(body.details).toBe("fetch failed");
  });

  it("never leaks the client id or secret in the response body", async () => {
    process.env.PAYPAL_CLIENT_ID = "super-secret-client-id";
    process.env.PAYPAL_CLIENT_SECRET = "super-secret-value";

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ name: "invalid_client" }), {
        status: 401,
      })) as typeof fetch;

    const response = await callRoute();
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain("super-secret-client-id");
    expect(serialized).not.toContain("super-secret-value");

    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
  });

  it("keeps the user-facing message generic", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ name: "invalid_client" }), {
        status: 401,
      })) as typeof fetch;

    const response = await callRoute();
    const body = (await response.json()) as { error?: string };

    expect(body.error).toBe(
      "Could not start the PayPal subscription. Try again.",
    );
  });
});
