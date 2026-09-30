/**
 * Guards against the worst failure mode for a test suite attached to a real
 * project: a test that silently opens a connection to the production database
 * and mutates live rows.
 *
 * The suite mocks `@/lib/prisma` with an in-memory double, but if a future
 * change makes that mock miss a call, the real Prisma client would load and
 * connect using the developer's `.env`. Pointing DATABASE_URL at an
 * unconnectable host makes that fail loudly instead of quietly succeeding
 * against production.
 */
process.env.DATABASE_URL =
  "mysql://test:test@127.0.0.1:1/unreachable_should_never_connect";
