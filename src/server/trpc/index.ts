import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { companies, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type Db = ReturnType<typeof getDb>;

export type Context = {
  db: Db;
  userId: string | null;
  companyId: string | null;
};

function slugifyCompanyName(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "company";
}

function getDisplayName(authUser: SupabaseUser): string | null {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const metadataName = typeof metadata?.name === "string" ? metadata.name.trim() : "";
  if (metadataName) return metadataName;
  if (authUser.email) {
    return authUser.email.split("@")[0] ?? null;
  }
  return null;
}

function getCompanyName(authUser: SupabaseUser): string {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const metadataCompanyName =
    typeof metadata?.company_name === "string" ? metadata.company_name.trim() : "";
  if (metadataCompanyName) return metadataCompanyName;
  const displayName = getDisplayName(authUser);
  return displayName ? `${displayName}'s Company` : "My Company";
}

async function createCompanyWithUniqueSlug(
  db: Db,
  authUserId: string,
  companyName: string
) {
  const baseSlug = slugifyCompanyName(companyName);

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = attempt === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
    const slug = `${baseSlug}${suffix}`;

    try {
      const [company] = await db
        .insert(companies)
        .values({
          id: authUserId,
          name: companyName,
          slug,
        })
        .returning({ id: companies.id });

      if (company) return company;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Another concurrent request already created the company for this auth user.
      if (message.toLowerCase().includes("companies_pkey")) {
        const [existingCompany] = await db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.id, authUserId))
          .limit(1);
        if (existingCompany) return existingCompany;
      }
      // Retry only if the slug conflicted; otherwise bubble up.
      if (!message.toLowerCase().includes("slug")) {
        throw err;
      }
    }
  }

  throw new Error("Failed to create company with a unique slug");
}

async function ensureAppUserForAuthUser(db: Db, authUser: SupabaseUser) {
  const [existingUser] = await db
    .select({
      id: users.id,
      companyId: users.companyId,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (existingUser?.companyId) {
    return existingUser;
  }

  if (!authUser.email) {
    return null;
  }

  const companyName = getCompanyName(authUser);
  const displayName = getDisplayName(authUser);
  const company = await createCompanyWithUniqueSlug(db, authUser.id, companyName);

  const [provisionedUser] = await db
    .insert(users)
    .values({
      id: authUser.id,
      companyId: company.id,
      email: authUser.email,
      name: displayName ?? undefined,
      emailVerified: !!authUser.email_confirmed_at,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        companyId: company.id,
        email: authUser.email,
        name: displayName ?? undefined,
        emailVerified: !!authUser.email_confirmed_at,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id, companyId: users.companyId });

  return provisionedUser ?? null;
}

export const createTRPCContext = async (): Promise<Context> => {
  const db = getDb();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { db, userId: null, companyId: null };
  }

  const dbUser = await ensureAppUserForAuthUser(db, user);

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
