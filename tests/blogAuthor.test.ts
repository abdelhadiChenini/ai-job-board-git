import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Pins the author-attribution rule for the admin blog editor.
 *
 * Publishing from the admin panel must never silently attach a post to an
 * external expert: when no author is supplied the logged-in admin (the "Master
 * Admin") is used, while an explicit author is still honoured. These tests
 * drive the real route handlers against an in-memory Prisma double so the
 * POST/PUT contract cannot regress.
 */

const ADMIN_ID = "admin-1";
const EXPERT_ID = "expert-1";

type FakeUserRow = { id: string; email: string; role: string };

type FakePost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  metaDescription: string;
  excerpt: string;
  published: boolean;
  publishedAt: Date | null;
  authorId: string;
};

function createBlogPrisma(users: FakeUserRow[]) {
  const userById = new Map(users.map((user) => [user.id, user]));
  const posts = new Map<string, FakePost>();

  function withAuthor(post: FakePost) {
    return { ...post, author: userById.get(post.authorId) ?? null };
  }

  function applyUpdate(post: FakePost, data: Record<string, unknown>): FakePost {
    const next: FakePost = { ...post };
    for (const [key, value] of Object.entries(data)) {
      if (key === "author") {
        next.authorId = (value as { connect: { id: string } }).connect.id;
      } else if (
        value &&
        typeof value === "object" &&
        "set" in (value as Record<string, unknown>)
      ) {
        (next as unknown as Record<string, unknown>)[key] = (
          value as { set: unknown }
        ).set;
      } else {
        (next as unknown as Record<string, unknown>)[key] = value;
      }
    }
    return next;
  }

  return {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        userById.get(where.id) ?? null,
    },
    blogPost: {
      findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.slug !== undefined) {
          return (
            [...posts.values()].find((post) => post.slug === where.slug) ?? null
          );
        }
        if (where.id !== undefined) return posts.get(where.id) ?? null;
        return null;
      },
      create: async ({ data }: { data: Omit<FakePost, "id"> }) => {
        const post: FakePost = { id: `post-${posts.size + 1}`, ...data };
        posts.set(post.id, post);
        return withAuthor(post);
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = posts.get(where.id);
        if (!existing) throw new Error("Blog post not found.");
        const next = applyUpdate(existing, data);
        posts.set(where.id, next);
        return withAuthor(next);
      },
    },
  };
}

const USERS: FakeUserRow[] = [
  { id: ADMIN_ID, email: "admin@ameelai.com", role: "ADMIN" },
  { id: EXPERT_ID, email: "expert@example.com", role: "EXPERT" },
];

async function loadRoutes(admin = true) {
  vi.doMock("@/lib/admin", () => ({
    getAdminSession: async () =>
      admin ? { user: { id: ADMIN_ID, role: "ADMIN" } } : null,
    readJsonBody: async (request: Request) => {
      try {
        const body: unknown = await request.json();
        return body && typeof body === "object" && !Array.isArray(body)
          ? (body as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    },
  }));
  const prisma = createBlogPrisma(USERS);
  vi.doMock("@/lib/prisma", () => ({ prisma }));

  const { POST, PUT } = await import("@/app/api/admin/blogs/route");
  return { POST, PUT, prisma };
}

function apiRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BASE_POST = {
  slug: "hello-world",
  title: "Hello world",
  content: "<p>hi</p>",
  featuredImage: "",
  metaDescription: "",
  excerpt: "",
  published: false,
  publishedAt: null,
};

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/admin");
  vi.doUnmock("@/lib/prisma");
});

describe("admin blog author attribution", () => {
  it("refuses callers without an admin session", async () => {
    const { POST } = await loadRoutes(false);

    const response = await POST(
      apiRequest("https://example.com/api/admin/blogs", "POST", {
        ...BASE_POST,
        authorId: EXPERT_ID,
      }),
    );

    expect(response.status).toBe(401);
  });

  it("defaults a new post to the logged-in admin when no author is sent", async () => {
    const { POST } = await loadRoutes();

    const response = await POST(
      apiRequest("https://example.com/api/admin/blogs", "POST", {
        ...BASE_POST,
        authorId: "",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.authorId).toBe(ADMIN_ID);
    expect(body.author.role).toBe("ADMIN");
  });

  it("honours an explicit expert author", async () => {
    const { POST } = await loadRoutes();

    const response = await POST(
      apiRequest("https://example.com/api/admin/blogs", "POST", {
        ...BASE_POST,
        authorId: EXPERT_ID,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.authorId).toBe(EXPERT_ID);
  });

  it("keeps the explicit author when editing", async () => {
    const { POST, PUT } = await loadRoutes();
    const created = await (
      await POST(
        apiRequest("https://example.com/api/admin/blogs", "POST", {
          ...BASE_POST,
          authorId: EXPERT_ID,
        }),
      )
    ).json();

    const response = await PUT(
      apiRequest("https://example.com/api/admin/blogs", "PUT", {
        id: created.id,
        title: "Updated title",
        authorId: EXPERT_ID,
        publishedAt: null,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.title).toBe("Updated title");
    expect(body.authorId).toBe(EXPERT_ID);
  });

  it("falls back to the logged-in admin when an edit omits the author", async () => {
    const { POST, PUT } = await loadRoutes();
    const created = await (
      await POST(
        apiRequest("https://example.com/api/admin/blogs", "POST", {
          ...BASE_POST,
          authorId: "",
        }),
      )
    ).json();

    const response = await PUT(
      apiRequest("https://example.com/api/admin/blogs", "PUT", {
        id: created.id,
        title: "Still mine",
        publishedAt: null,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.authorId).toBe(ADMIN_ID);
  });
});
