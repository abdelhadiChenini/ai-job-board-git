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
  paypalSubscriptionId: string | null;
  updatedAt: Date;
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

export function createFakePrisma(seed: FakeUser[] = []) {
  const users = new Map<string, FakeUser>(
    seed.map((user) => [user.id, { ...user }]),
  );
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
    logs,
    planOf: (id: string) => users.get(id)?.plan,
    subscriptionOf: (id: string) => users.get(id)?.paypalSubscriptionId,
  };
}
