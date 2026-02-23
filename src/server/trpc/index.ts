import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export type Context = {
  db: Db;
  userId: string | null;
  companyId: string | null;
};

export const createTRPCContext = async (): Promise<Context> => {
  const db = getDb();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { db, userId: null, companyId: null };
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  return {
    db,
    userId: user.id,
    companyId: dbUser?.companyId ?? null,
  };
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.companyId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      companyId: ctx.companyId,
    },
  });
});
