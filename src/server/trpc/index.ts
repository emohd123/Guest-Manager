import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = ReturnType<typeof getDb>;

function createUnavailableDb(errorMessage: string): Db {
  return new Proxy(
    {},
    {
      get() {
        return () => {
          throw new Error(errorMessage);
        };
      },
    }
  ) as Db;
}

export type Context = {
  db: Db;
  supabase: SupabaseClient;
  userId: string | null;
  companyId: string | null;
  dashboardAccess: "none" | "limited" | "full";
  dashboardPermissions: string[];
  role: string | null;
};

export const createTRPCContext = async (): Promise<Context> => {
  let db: Db;
  try {
    db = getDb();
  } catch {
    db = createUnavailableDb("Direct database connection unavailable. This route still needs Supabase REST migration.");
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { db, supabase, userId: null, companyId: null, dashboardAccess: "none", dashboardPermissions: [], role: null };
  }

  const dbUser = await ensureAppUserForAuthUser(supabase, user);

  return {
    db,
    supabase,
    userId: user.id,
    companyId: dbUser?.companyId ?? null,
    dashboardAccess: dbUser?.dashboardAccess ?? "none",
    dashboardPermissions: dbUser?.dashboardPermissions ?? [],
    role: dbUser?.role ?? null,
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

export const dashboardProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.companyId || ctx.dashboardAccess === "none") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Dashboard access is not enabled for this account" });
  }
  return next({ ctx });
});

export const dashboardAdminProcedure = dashboardProcedure.use(async ({ ctx, next }) => {
  if (ctx.dashboardAccess !== "full" && ctx.role !== "owner" && ctx.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only full-access administrators can manage accounts" });
  }
  return next({ ctx });
});
