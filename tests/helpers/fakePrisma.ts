/**
 * Minimal in-memory stand-in for the slice of PrismaClient these tests touch.
 *
 * Faithful on the behaviours the plan logic depends on: writes resolve to their
 * result (so `await tx.user.update(...)` takes effect), and an unknown id
 * throws — matching Prisma's P2025, so a missing user fails in tests the same
 * way it would in production.
 *
 * Known simplification: writes apply immediately, so a throw mid-transaction
 * does not roll back earlier writes. No test depends on rollback, and the
 * guarantee that matters for this code — a plan and its audit row are written
 * together — is asserted directly against the finished state instead.
 */

export type FakeUser = {
  id: string;
  email: string;
  plan: string;
  role?: string;
  paypalSubscriptionId: string | null;
  updatedAt: Date;
};

/**
 * Minimal stand-in for `JobOffer`. Only the columns the early-access gate reads
 * are modelled; `datePosted` and `createdAt` are both nullable here because the
 * production column is, and the gate's fallback between them is the behaviour
 * under test.
 */
export type FakeJob = {
  id: string;
  affiliateUrl: string;
  slug: string;
  datePosted: Date | null;
  createdAt: Date;
};

export type FakeApplied = {
  id: string;
  userId: string;
  opportunityId: string;
  createdAt: Date;
};

export type FakeLog = {
  id: string;
  userId: string | null;
  oldPlan: string;
  newPlan: string;
  changedBy: string;
  changedById: string | null;
  createdAt: Date;
};

type Op = { __op: string; args: Record<string, unknown> };

function project(row: Record<string, unknown>, select?: Record<string, boolean>) {
  if (!select) return { ...row };
  const out: Record<string, unknown> = {};
  for (const [key, wanted] of Object.entries(select)) {
    if (wanted) out[key] = row[key];
  }
  return out;
}

export function createFakePrisma(
  seed: FakeUser[] = [],
  jobs: FakeJob[] = [],
) {
  const users = new Map<string, FakeUser>(
    seed.map((user) => [user.id, { ...user }]),
  );
  const jobOffers = new Map<string, FakeJob>(
    jobs.map((job) => [job.id, { ...job }]),
  );
  const applications: FakeApplied[] = [];
  const logs: FakeLog[] = [];
  let sequence = 0;

  function apply(op: Op): unknown {
    if (op.__op === "user.update") {
      const { where, data } = op.args as {
        where: { id: string };
        data: Partial<FakeUser>;
      };
      const row = users.get(where.id);
      if (!row) {
        throw new Error(
          "An operation failed because it depends on one or more records that were required but not found.",
        );
      }
      const updated: FakeUser = { ...row, ...data, updatedAt: new Date() };
      users.set(where.id, updated);
      return updated;
    }

    if (op.__op === "planChangeLog.create") {
      const { data } = op.args as { data: Omit<FakeLog, "id" | "createdAt"> };
      sequence += 1;
      const row: FakeLog = { id: `log-${sequence}`, createdAt: new Date(), ...data };
      logs.push(row);
      return row;
    }

    throw new Error(`Unsupported operation: ${op.__op}`);
  }

  function buildClient() {
    return {
      user: {
        findUnique: async (args: {
          where: { id: string };
          select?: Record<string, boolean>;
        }) => {
          const row = users.get(args.where.id);
          return row ? project({ ...row }, args.select) : null;
        },

        findFirst: async (args: {
          where: { id?: string; paypalSubscriptionId?: string };
          select?: Record<string, boolean>;
        }) => {
          let rows = [...users.values()];
          if (args.where.id !== undefined) {
            rows = rows.filter((row) => row.id === args.where.id);
          }
          if (args.where.paypalSubscriptionId !== undefined) {
            rows = rows.filter(
              (row) =>
                row.paypalSubscriptionId === args.where.paypalSubscriptionId,
            );
          }
          const row = rows[0];
          return row ? project({ ...row }, args.select) : null;
        },

        findMany: async (args: {
          where?: { plan?: string };
          select?: Record<string, boolean>;
          take?: number;
          orderBy?: { updatedAt?: string };
        }) => {
          let rows = [...users.values()];
          if (args.where?.plan) {
            rows = rows.filter((row) => row.plan === args.where!.plan);
          }
          if (args.orderBy?.updatedAt) {
            rows.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
          }
          if (args.take) rows = rows.slice(0, args.take);
          return rows.map((row) => project({ ...row }, args.select));
        },

        update: (args: Record<string, unknown>) =>
          Promise.resolve(apply({ __op: "user.update", args })),
      },

      planChangeLog: {
        create: (args: Record<string, unknown>) =>
          Promise.resolve(apply({ __op: "planChangeLog.create", args })),
      },

      jobOffer: {
        findUnique: async (args: {
          where: { id: string };
          select?: Record<string, boolean>;
        }) => {
          const row = jobOffers.get(args.where.id);
          return row ? project({ ...row }, args.select) : null;
        },
      },

      appliedOpportunity: {
        findUnique: async (args: {
          where: { userId_opportunityId: { userId: string; opportunityId: string } };
          select?: Record<string, boolean>;
        }) => {
          const { userId, opportunityId } = args.where.userId_opportunityId;
          const row = applications.find(
            (a) => a.userId === userId && a.opportunityId === opportunityId,
          );
          return row ? project({ ...row }, args.select) : null;
        },

        /**
         * Counts rows inside a rolling window, mirroring the gate's daily-limit
         * query. The `gte` bound is applied against `createdAt` only — that is
         * the sole filter the production query uses.
         */
        count: async (args: { where: { userId: string; createdAt: { gte: Date } } }) =>
          applications.filter(
            (a) =>
              a.userId === args.where.userId &&
              a.createdAt.getTime() >= args.where.createdAt.gte.getTime(),
          ).length,

        upsert: async (args: {
          where: { userId_opportunityId: { userId: string; opportunityId: string } };
          create: { userId: string; opportunityId: string };
          update: Record<string, unknown>;
        }) => {
          const { userId, opportunityId } = args.where.userId_opportunityId;
          const existing = applications.find(
            (a) => a.userId === userId && a.opportunityId === opportunityId,
          );

          if (existing) {
            Object.assign(existing, args.update);
            return existing;
          }

          sequence += 1;
          const row: FakeApplied = {
            id: `applied-${sequence}`,
            createdAt: new Date(),
            ...args.create,
          };
          applications.push(row);
          return row;
        },
      },
    };
  }

  const client = buildClient();

  const prisma = {
    ...client,

    $transaction: async (
      run:
        | Promise<unknown>[]
        | ((tx: typeof client) => Promise<unknown>),
    ) => {
      if (typeof run === "function") {
        return run(client);
      }
      return Promise.all(run);
    },
  };

  return {
    prisma,
    users,
    jobs: jobOffers,
    applications,
    logs,
    planOf: (id: string) => users.get(id)?.plan,
    roleOf: (id: string) => users.get(id)?.role ?? "EXPERT",
    subscriptionOf: (id: string) => users.get(id)?.paypalSubscriptionId,
    /** Seeds applications so daily-limit behaviour can be tested directly. */
    seedApplication: (userId: string, opportunityId: string, at = new Date()) => {
      sequence += 1;
      const row: FakeApplied = {
        id: `applied-${sequence}`,
        userId,
        opportunityId,
        createdAt: at,
      };
      applications.push(row);
      return row;
    },
  };
}
