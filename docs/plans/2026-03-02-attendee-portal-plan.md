# Attendee Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a self-service attendee portal (web + mobile) with dual auth realms, event history, ticket QR codes, agendas, guest lists, organizer messaging, and a browser-based QR scanner for organizers.

**Architecture:** Approach A — two separate Supabase auth flows sharing one project. `/attendee/*` routes serve attendees; `/dashboard/*` routes serve organizers. Email is the identity bridge: attendee signs up with the same email used during registration, and all past tickets/events auto-appear. Four new DB tables added; existing `devices` + `device_pair_tokens` reused for the web scanner.

**Tech Stack:** Next.js 16, Supabase auth (email+password + Google OAuth), Drizzle ORM (postgres-js), tRPC v11, zod v3 (NOT v4), shadcn/ui (new-york), Tailwind CSS, `qrcode.react` for QR rendering, `html5-qrcode` for camera scanning.

---

## Phase 1 — Foundation

### Task 1: DB Schema — `attendee_profiles`

**Files:**
- Create: `src/server/db/schema/attendee-profiles.ts`
- Modify: `src/server/db/schema/index.ts`

**Step 1: Create the schema file**

```typescript
// src/server/db/schema/attendee-profiles.ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const attendeeProfiles = pgTable("attendee_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseUserId: uuid("supabase_user_id").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**Step 2: Export from schema index**

Add to the bottom of `src/server/db/schema/index.ts`:
```typescript
export * from "./attendee-profiles";
```

**Step 3: Verify TypeScript compiles**
```bash
cd "C:\Users\cactu\OneDrive\Desktop\app\Events Hub"
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors (or only pre-existing unrelated errors)

**Step 4: Commit**
```bash
git add src/server/db/schema/attendee-profiles.ts src/server/db/schema/index.ts
git commit -m "feat: add attendee_profiles schema"
```

---

### Task 2: DB Schema — `event_agenda_items`

**Files:**
- Create: `src/server/db/schema/event-agenda-items.ts`
- Modify: `src/server/db/schema/index.ts`

**Step 1: Create the schema file**

```typescript
// src/server/db/schema/event-agenda-items.ts
import { pgTable, uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { events } from "./events";
import { companies } from "./companies";

export const eventAgendaItems = pgTable("event_agenda_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  speakerName: varchar("speaker_name", { length: 255 }),
  speakerBio: text("speaker_bio"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**Step 2: Export from schema index**

Add to `src/server/db/schema/index.ts`:
```typescript
export * from "./event-agenda-items";
```

**Step 3: Commit**
```bash
git add src/server/db/schema/event-agenda-items.ts src/server/db/schema/index.ts
git commit -m "feat: add event_agenda_items schema"
```

---

### Task 3: DB Schema — `attendee_messages` and `attendee_notifications`

**Files:**
- Create: `src/server/db/schema/attendee-messages.ts`
- Create: `src/server/db/schema/attendee-notifications.ts`
- Modify: `src/server/db/schema/index.ts`

**Step 1: Create attendee_messages**

```typescript
// src/server/db/schema/attendee-messages.ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { events } from "./events";
import { companies } from "./companies";
import { attendeeProfiles } from "./attendee-profiles";

export const attendeeMessages = pgTable("attendee_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  attendeeProfileId: uuid("attendee_profile_id")
    .notNull()
    .references(() => attendeeProfiles.id, { onDelete: "cascade" }),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // 'attendee' | 'organizer'
  senderId: uuid("sender_id").notNull(),
  senderName: varchar("sender_name", { length: 255 }),
  message: text("message").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**Step 2: Create attendee_notifications**

```typescript
// src/server/db/schema/attendee-notifications.ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { events } from "./events";
import { companies } from "./companies";
import { attendeeProfiles } from "./attendee-profiles";

export const attendeeNotifications = pgTable("attendee_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  attendeeProfileId: uuid("attendee_profile_id")
    .notNull()
    .references(() => attendeeProfiles.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  // types: 'event_updated' | 'time_changed' | 'venue_changed' | 'cancelled' | 'message'
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**Step 3: Export both from schema index**

Add to `src/server/db/schema/index.ts`:
```typescript
export * from "./attendee-messages";
export * from "./attendee-notifications";
```

**Step 4: Commit**
```bash
git add src/server/db/schema/attendee-messages.ts src/server/db/schema/attendee-notifications.ts src/server/db/schema/index.ts
git commit -m "feat: add attendee_messages and attendee_notifications schema"
```

---

### Task 4: Drizzle Migration

**Files:**
- Run drizzle-kit generate and push

**Step 1: Generate migration**
```bash
cd "C:\Users\cactu\OneDrive\Desktop\app\Events Hub"
npx drizzle-kit generate
```
Expected: creates a new `.sql` file in `drizzle/` containing CREATE TABLE for all 4 new tables.

**Step 2: Inspect the generated SQL**

Open the new migration file and confirm it contains:
- `CREATE TABLE IF NOT EXISTS "attendee_profiles"`
- `CREATE TABLE IF NOT EXISTS "event_agenda_items"`
- `CREATE TABLE IF NOT EXISTS "attendee_messages"`
- `CREATE TABLE IF NOT EXISTS "attendee_notifications"`

**Step 3: Push migration to DB**
```bash
npx drizzle-kit push
```
Expected: "All changes applied"

**Step 4: Commit the migration**
```bash
git add drizzle/
git commit -m "feat: migrate attendee portal tables to DB"
```

---

### Task 5: `attendeeProcedure` — tRPC middleware for attendee auth

**Files:**
- Modify: `src/server/trpc/index.ts`

**Step 1: Add `attendeeProfileId` to Context type and create the procedure**

In `src/server/trpc/index.ts`, update `Context` type and add the new procedure at the bottom:

```typescript
// Add to Context type (after companyId):
  attendeeProfileId: string | null;

// In createTRPCContext, add to the return:
  attendeeProfileId: null, // populated by attendeeProcedure middleware

// Add after protectedProcedure export:
import { attendeeProfiles } from "@/server/db/schema";

export const attendeeProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(attendeeProfiles)
    .where(eq(attendeeProfiles.supabaseUserId, ctx.userId))
    .limit(1);

  if (!profile) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Attendee profile not found" });
  }

  return next({
    ctx: {
      ...ctx,
      attendeeProfileId: profile.id,
      attendeeEmail: profile.email,
    },
  });
});
```

**Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**
```bash
git add src/server/trpc/index.ts
git commit -m "feat: add attendeeProcedure tRPC middleware"
```

---

### Task 6: Middleware — dual auth realms

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

**Step 1: Replace the middleware with dual-realm logic**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith("http")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // --- Organizer realm ---
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // --- Attendee realm ---
  if (pathname.startsWith("/attendee/dashboard") ||
      pathname.startsWith("/attendee/events") ||
      pathname.startsWith("/attendee/profile")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/attendee/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // If an organizer hits attendee login → send to dashboard
  if (user && pathname === "/attendee/login") {
    // Check user_metadata role to avoid redirect loop for attendees
    const role = (user.user_metadata as Record<string, unknown>)?.role;
    if (role === "organizer") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

**Step 2: Verify dev server still starts without error**
```bash
# Check preview server logs
# Expected: no middleware compilation errors
```

**Step 3: Commit**
```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat: dual auth realm middleware (organizer + attendee)"
```

---

### Task 7: Attendee Auth Callback

**Files:**
- Check: `src/app/auth/callback/route.ts` (should already exist for organizer OAuth)

**Step 1: Read the existing callback**
```bash
cat src/app/auth/callback/route.ts
```

**Step 2: Ensure the callback handles both realms**

The callback receives a `redirectTo` param. Since attendee OAuth sets `redirectTo=/attendee/dashboard`, the existing callback should work. Just verify it does a `redirect(redirectTo)` — if so, no change needed.

If it doesn't exist, create it:
```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
```

**Step 3: Commit if changed**
```bash
git add src/app/auth/callback/route.ts
git commit -m "feat: ensure auth callback supports attendee redirectTo"
```

---

### Task 8: Attendee Login Page

**Files:**
- Create: `src/app/(attendee)/attendee/login/page.tsx`
- Create: `src/app/(attendee)/layout.tsx`

**Step 1: Create attendee layout**

```typescript
// src/app/(attendee)/layout.tsx
export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 2: Create the login page**

```typescript
// src/app/(attendee)/attendee/login/page.tsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AttendeeLoginPage() {
  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <AttendeeLoginForm />
      </Suspense>
    </div>
  );
}

function AttendeeLoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/attendee/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.assign(redirectTo);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          <span className="text-primary">Guest</span>Manager
        </CardTitle>
        <CardDescription>Sign in to your attendee account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>
        <Button variant="outline" className="w-full" type="button"
          onClick={handleGoogleLogin} disabled={googleLoading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/attendee/signup" className="text-primary hover:underline">Create one free</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
```

**Step 3: Verify page loads**
Navigate to `http://localhost:3000/attendee/login` — should show the attendee login card.

**Step 4: Commit**
```bash
git add src/app/(attendee)/
git commit -m "feat: attendee login page"
```

---

### Task 9: Attendee Signup Page

**Files:**
- Create: `src/app/(attendee)/attendee/signup/page.tsx`

**Step 1: Create the signup page**

```typescript
// src/app/(attendee)/attendee/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function AttendeeSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "attendee" },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/attendee/dashboard`,
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-mesh flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/attendee/login">
              <Button variant="outline" className="w-full">Back to sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <span className="text-primary">Guest</span>Manager
          </CardTitle>
          <CardDescription>Create your attendee account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Jane Smith"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={8} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/attendee/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(attendee)/attendee/signup/page.tsx
git commit -m "feat: attendee signup page"
```

---

## Phase 2 — Attendee tRPC Routers

### Task 10: `attendeeAuth` router — profile upsert

**Files:**
- Create: `src/server/trpc/routers/attendeeAuth.ts`

**Step 1: Create the router**

```typescript
// src/server/trpc/routers/attendeeAuth.ts
import { z } from "zod";
import { router, publicProcedure } from "../index";
import { attendeeProfiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export const attendeeAuthRouter = router({
  // Called after sign-in to ensure attendee_profiles row exists.
  // Uses the Supabase session directly (not tRPC context) because
  // attendeeProcedure requires the profile to already exist.
  upsertProfile: publicProcedure
    .input(z.object({ displayName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      const db = getDb();
      const [existing] = await db
        .select()
        .from(attendeeProfiles)
        .where(eq(attendeeProfiles.supabaseUserId, user.id))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(attendeeProfiles)
          .set({
            displayName: input.displayName ?? existing.displayName,
            updatedAt: new Date(),
          })
          .where(eq(attendeeProfiles.supabaseUserId, user.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(attendeeProfiles)
        .values({
          supabaseUserId: user.id,
          email: user.email,
          displayName: input.displayName ??
            (user.user_metadata as Record<string,string>)?.name ??
            user.email.split("@")[0],
        })
        .returning();
      return created;
    }),

  getProfile: publicProcedure.query(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const db = getDb();
    const [profile] = await db
      .select()
      .from(attendeeProfiles)
      .where(eq(attendeeProfiles.supabaseUserId, user.id))
      .limit(1);
    return profile ?? null;
  }),
});
```

**Step 2: Register in `src/server/trpc/router.ts`**

```typescript
import { attendeeAuthRouter } from "./routers/attendeeAuth";
// Add to appRouter:
attendeeAuth: attendeeAuthRouter,
```

**Step 3: Commit**
```bash
git add src/server/trpc/routers/attendeeAuth.ts src/server/trpc/router.ts
git commit -m "feat: attendeeAuth tRPC router (upsertProfile, getProfile)"
```

---

### Task 11: `attendeeEvents` router

**Files:**
- Create: `src/server/trpc/routers/attendeeEvents.ts`

**Step 1: Create the router**

```typescript
// src/server/trpc/routers/attendeeEvents.ts
import { z } from "zod";
import { router, attendeeProcedure } from "../index";
import { tickets, orders, events, companies, attendeeProfiles, guests } from "@/server/db/schema";
import { eq, and, desc, or } from "drizzle-orm";

export const attendeeEventsRouter = router({
  // List all events for the signed-in attendee (via ticket email match)
  list: attendeeProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select()
      .from(attendeeProfiles)
      .where(eq(attendeeProfiles.id, ctx.attendeeProfileId))
      .limit(1);
    if (!profile) return [];

    // Find all tickets with this email
    const myTickets = await ctx.db
      .select({
        eventId: tickets.eventId,
        barcode: tickets.barcode,
        status: tickets.status,
        ticketId: tickets.id,
        checkedIn: tickets.checkedIn,
        checkedInAt: tickets.checkedInAt,
        pdfUrl: tickets.pdfUrl,
        walletUrl: tickets.walletUrl,
      })
      .from(tickets)
      .where(eq(tickets.attendeeEmail, profile.email));

    if (myTickets.length === 0) return [];

    const eventIds = [...new Set(myTickets.map((t) => t.eventId))];

    const eventRows = await ctx.db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        timezone: events.timezone,
        coverImageUrl: events.coverImageUrl,
        venue: events.venue,
        status: events.status,
        companySlug: companies.slug,
        companyName: companies.name,
      })
      .from(events)
      .leftJoin(companies, eq(events.companyId, companies.id))
      .where(or(...eventIds.map((id) => eq(events.id, id))));

    return eventRows
      .map((ev) => ({
        ...ev,
        ticket: myTickets.find((t) => t.eventId === ev.id) ?? null,
      }))
      .sort((a, b) => {
        const aDate = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const bDate = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return bDate - aDate; // newest first
      });
  }),

  // Get single event + ticket for this attendee
  get: attendeeProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select()
        .from(attendeeProfiles)
        .where(eq(attendeeProfiles.id, ctx.attendeeProfileId))
        .limit(1);
      if (!profile) return null;

      const [event] = await ctx.db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          description: events.description,
          startsAt: events.startsAt,
          endsAt: events.endsAt,
          timezone: events.timezone,
          coverImageUrl: events.coverImageUrl,
          venue: events.venue,
          status: events.status,
          companyId: events.companyId,
          companySlug: companies.slug,
          companyName: companies.name,
        })
        .from(events)
        .leftJoin(companies, eq(events.companyId, companies.id))
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (!event) return null;

      const [ticket] = await ctx.db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.eventId, input.eventId),
            eq(tickets.attendeeEmail, profile.email)
          )
        )
        .limit(1);

      return { event, ticket: ticket ?? null };
    }),
});
```

**Step 2: Register in router.ts**
```typescript
import { attendeeEventsRouter } from "./routers/attendeeEvents";
// Add:
attendeeEvents: attendeeEventsRouter,
```

**Step 3: Commit**
```bash
git add src/server/trpc/routers/attendeeEvents.ts src/server/trpc/router.ts
git commit -m "feat: attendeeEvents tRPC router"
```

---

### Task 12: `attendeeAgenda` and `attendeeGuests` routers

**Files:**
- Create: `src/server/trpc/routers/attendeeAgenda.ts`
- Create: `src/server/trpc/routers/attendeeGuests.ts`

**Step 1: Create attendeeAgenda**

```typescript
// src/server/trpc/routers/attendeeAgenda.ts
import { z } from "zod";
import { router, attendeeProcedure } from "../index";
import { eventAgendaItems } from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";

export const attendeeAgendaRouter = router({
  list: attendeeProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(eventAgendaItems)
        .where(eq(eventAgendaItems.eventId, input.eventId))
        .orderBy(asc(eventAgendaItems.sortOrder), asc(eventAgendaItems.startsAt));
    }),
});
```

**Step 2: Create attendeeGuests**

```typescript
// src/server/trpc/routers/attendeeGuests.ts
// Shows other attendees for an event — names only, no contact info
import { z } from "zod";
import { router, attendeeProcedure } from "../index";
import { guests, attendeeProfiles } from "@/server/db/schema";
import { eq, and, ne } from "drizzle-orm";

export const attendeeGuestsRouter = router({
  list: attendeeProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get current attendee's email so we can exclude them from the list
      const [profile] = await ctx.db
        .select({ email: attendeeProfiles.email })
        .from(attendeeProfiles)
        .where(eq(attendeeProfiles.id, ctx.attendeeProfileId))
        .limit(1);

      const rows = await ctx.db
        .select({
          id: guests.id,
          firstName: guests.firstName,
          lastName: guests.lastName,
          // No email, phone, or private data exposed
        })
        .from(guests)
        .where(
          and(
            eq(guests.eventId, input.eventId),
            profile ? ne(guests.email, profile.email) : undefined
          )
        )
        .limit(200);

      return rows;
    }),
});
```

**Step 3: Register both in router.ts**
```typescript
import { attendeeAgendaRouter } from "./routers/attendeeAgenda";
import { attendeeGuestsRouter } from "./routers/attendeeGuests";
// Add:
attendeeAgenda: attendeeAgendaRouter,
attendeeGuests: attendeeGuestsRouter,
```

**Step 4: Commit**
```bash
git add src/server/trpc/routers/attendeeAgenda.ts src/server/trpc/routers/attendeeGuests.ts src/server/trpc/router.ts
git commit -m "feat: attendeeAgenda and attendeeGuests tRPC routers"
```

---

### Task 13: `attendeeMessages` and `attendeeNotifications` routers

**Files:**
- Create: `src/server/trpc/routers/attendeeMessages.ts`
- Create: `src/server/trpc/routers/attendeeNotifications.ts`

**Step 1: Create attendeeMessages**

```typescript
// src/server/trpc/routers/attendeeMessages.ts
import { z } from "zod";
import { router, attendeeProcedure } from "../index";
import { attendeeMessages, attendeeProfiles, events } from "@/server/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const attendeeMessagesRouter = router({
  list: attendeeProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(attendeeMessages)
        .where(
          and(
            eq(attendeeMessages.eventId, input.eventId),
            eq(attendeeMessages.attendeeProfileId, ctx.attendeeProfileId)
          )
        )
        .orderBy(asc(attendeeMessages.createdAt));
    }),

  send: attendeeProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ displayName: attendeeProfiles.displayName, email: attendeeProfiles.email })
        .from(attendeeProfiles)
        .where(eq(attendeeProfiles.id, ctx.attendeeProfileId))
        .limit(1);

      const [event] = await ctx.db
        .select({ companyId: events.companyId })
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);
      if (!event) throw new Error("Event not found");

      const [msg] = await ctx.db
        .insert(attendeeMessages)
        .values({
          eventId: input.eventId,
          companyId: event.companyId,
          attendeeProfileId: ctx.attendeeProfileId,
          senderType: "attendee",
          senderId: ctx.attendeeProfileId,
          senderName: profile?.displayName ?? profile?.email ?? "Attendee",
          message: input.message,
        })
        .returning();
      return msg;
    }),

  markRead: attendeeProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Mark all organizer messages in this thread as read
      await ctx.db
        .update(attendeeMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(attendeeMessages.eventId, input.eventId),
            eq(attendeeMessages.attendeeProfileId, ctx.attendeeProfileId),
            eq(attendeeMessages.senderType, "organizer")
          )
        );
      return { success: true };
    }),
});
```

**Step 2: Create attendeeNotifications**

```typescript
// src/server/trpc/routers/attendeeNotifications.ts
import { z } from "zod";
import { router, attendeeProcedure } from "../index";
import { attendeeNotifications } from "@/server/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

export const attendeeNotificationsRouter = router({
  list: attendeeProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(attendeeNotifications)
      .where(eq(attendeeNotifications.attendeeProfileId, ctx.attendeeProfileId))
      .orderBy(desc(attendeeNotifications.createdAt))
      .limit(50);
  }),

  unreadCount: attendeeProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: attendeeNotifications.id })
      .from(attendeeNotifications)
      .where(
        and(
          eq(attendeeNotifications.attendeeProfileId, ctx.attendeeProfileId),
          isNull(attendeeNotifications.readAt)
        )
      );
    return rows.length;
  }),

  markRead: attendeeProcedure
    .input(z.object({ id: z.string().uuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await ctx.db
          .update(attendeeNotifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(attendeeNotifications.id, input.id),
              eq(attendeeNotifications.attendeeProfileId, ctx.attendeeProfileId)
            )
          );
      } else {
        // Mark all as read
        await ctx.db
          .update(attendeeNotifications)
          .set({ readAt: new Date() })
          .where(eq(attendeeNotifications.attendeeProfileId, ctx.attendeeProfileId));
      }
      return { success: true };
    }),
});
```

**Step 3: Register in router.ts**
```typescript
import { attendeeMessagesRouter } from "./routers/attendeeMessages";
import { attendeeNotificationsRouter } from "./routers/attendeeNotifications";
// Add:
attendeeMessages: attendeeMessagesRouter,
attendeeNotifications: attendeeNotificationsRouter,
```

**Step 4: Commit**
```bash
git add src/server/trpc/routers/attendeeMessages.ts src/server/trpc/routers/attendeeNotifications.ts src/server/trpc/router.ts
git commit -m "feat: attendeeMessages and attendeeNotifications tRPC routers"
```

---

## Phase 3 — Attendee Portal Pages

### Task 14: Install `qrcode.react`

**Step 1: Install package**
```bash
cd "C:\Users\cactu\OneDrive\Desktop\app\Events Hub"
npm install qrcode.react
npm install --save-dev @types/qrcode
```

**Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add qrcode.react dependency"
```

---

### Task 15: Attendee Portal Layout + Navigation

**Files:**
- Create: `src/app/(attendee)/attendee/layout.tsx`

**Step 1: Create the attendee nav layout**

```typescript
// src/app/(attendee)/attendee/layout.tsx
import Link from "next/link";
import { Home, Calendar, User, Bell } from "lucide-react";

export default function AttendeeNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <span className="font-bold text-lg">
            <span className="text-primary">Guest</span>Manager
          </span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background">
        <div className="flex h-16 items-center justify-around">
          <Link href="/attendee/dashboard"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link href="/attendee/events"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Calendar className="h-5 w-5" />
            <span>Events</span>
          </Link>
          <Link href="/attendee/profile"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(attendee)/attendee/layout.tsx
git commit -m "feat: attendee portal layout with bottom nav"
```

---

### Task 16: Attendee Dashboard Page

**Files:**
- Create: `src/app/(attendee)/attendee/dashboard/page.tsx`

**Step 1: Create the dashboard**

```typescript
// src/app/(attendee)/attendee/dashboard/page.tsx
"use client";

import { api } from "@/lib/trpc/client";
import Link from "next/link";
import { Bell, Calendar, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function AttendeeDashboardPage() {
  const { data: profile } = api.attendeeAuth.getProfile.useQuery();
  const { data: events = [] } = api.attendeeEvents.list.useQuery();
  const { data: notifications = [] } = api.attendeeNotifications.list.useQuery();
  const { data: unreadCount = 0 } = api.attendeeNotifications.unreadCount.useQuery();
  const markAllRead = api.attendeeNotifications.markRead.useMutation();

  const upcoming = events.filter(
    (e) => e.startsAt && new Date(e.startsAt) >= new Date()
  );
  const past = events.filter(
    (e) => !e.startsAt || new Date(e.startsAt) < new Date()
  );
  const unreadNotifications = notifications.filter((n) => !n.readAt);

  return (
    <div className="space-y-6 p-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Hi, {profile?.displayName?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground">Here's what's coming up</p>
      </div>

      {/* Notifications */}
      {unreadNotifications.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Updates
              <Badge variant="destructive">{unreadCount}</Badge>
            </CardTitle>
            <Button
              variant="ghost" size="sm"
              onClick={() => markAllRead.mutate({ id: undefined })}>
              Mark all read
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {unreadNotifications.slice(0, 5).map((n) => (
              <Link key={n.id} href={`/attendee/events/${n.eventId}`}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((ev) => (
              <Link key={ev.id} href={`/attendee/events/${ev.id}`}>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    {ev.coverImageUrl && (
                      <img src={ev.coverImageUrl} alt={ev.title}
                        className="mb-3 h-32 w-full rounded-md object-cover" />
                    )}
                    <p className="font-semibold">{ev.title}</p>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {ev.startsAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(ev.startsAt), "EEE, MMM d · h:mm a")}
                        </div>
                      )}
                      {ev.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {typeof ev.venue === "object"
                            ? (ev.venue as Record<string, string>).name ?? ""
                            : String(ev.venue)}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {ev.ticket?.status === "used" ? "Checked In" : "Confirmed"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted-foreground">Past Events</h2>
          <div className="space-y-2">
            {past.slice(0, 3).map((ev) => (
              <Link key={ev.id} href={`/attendee/events/${ev.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{ev.title}</p>
                  {ev.startsAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ev.startsAt), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
            {past.length > 3 && (
              <Link href="/attendee/events">
                <Button variant="ghost" size="sm" className="w-full">
                  View all {past.length} past events →
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No events yet.</p>
          <p className="text-sm">Register for an event to see it here.</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(attendee)/attendee/dashboard/page.tsx
git commit -m "feat: attendee dashboard page"
```

---

### Task 17: Attendee Events List Page

**Files:**
- Create: `src/app/(attendee)/attendee/events/page.tsx`

**Step 1: Create the events list**

```typescript
// src/app/(attendee)/attendee/events/page.tsx
"use client";

import { api } from "@/lib/trpc/client";
import Link from "next/link";
import { Calendar, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AttendeeEventsPage() {
  const { data: events = [], isLoading } = api.attendeeEvents.list.useQuery();

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>;

  const upcoming = events.filter((e) => e.startsAt && new Date(e.startsAt) >= new Date());
  const past = events.filter((e) => !e.startsAt || new Date(e.startsAt) < new Date());

  const EventCard = ({ ev }: { ev: (typeof events)[0] }) => (
    <Link href={`/attendee/events/${ev.id}`}>
      <Card className="cursor-pointer hover:border-primary transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{ev.title}</p>
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                {ev.startsAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(ev.startsAt), "EEE, MMM d, yyyy · h:mm a")}
                  </div>
                )}
              </div>
            </div>
            {ev.ticket?.checkedIn && (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {ev.ticket?.status === "used" ? "Attended" :
               ev.ticket?.status === "valid" ? "Confirmed" : ev.ticket?.status ?? "Registered"}
            </Badge>
            <span className="text-xs text-muted-foreground">{ev.companyName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">My Events</h1>

      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Past
          </h2>
          <div className="space-y-3">
            {past.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No events found.</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(attendee)/attendee/events/page.tsx
git commit -m "feat: attendee events list page"
```

---

### Task 18: Attendee Event Detail Page (4 tabs)

**Files:**
- Create: `src/app/(attendee)/attendee/events/[eventId]/page.tsx`

**Step 1: Install date-fns if not present**
```bash
npm list date-fns || npm install date-fns
```

**Step 2: Create the event detail page**

```typescript
// src/app/(attendee)/attendee/events/[eventId]/page.tsx
"use client";

import { useState } from "react";
import { use } from "react";
import { api } from "@/lib/trpc/client";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Download, Wallet, Clock, MapPin, Send, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AttendeeEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [message, setMessage] = useState("");

  const { data, isLoading } = api.attendeeEvents.get.useQuery({ eventId });
  const { data: agenda = [] } = api.attendeeAgenda.list.useQuery({ eventId });
  const { data: guestList = [] } = api.attendeeGuests.list.useQuery({ eventId });
  const { data: messages = [], refetch: refetchMessages } =
    api.attendeeMessages.list.useQuery({ eventId });

  const sendMsg = api.attendeeMessages.send.useMutation({
    onSuccess: () => { setMessage(""); void refetchMessages(); },
  });

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>;
  if (!data?.event) return <div className="p-4">Event not found.</div>;

  const { event, ticket } = data;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="relative">
        {event.coverImageUrl && (
          <img src={event.coverImageUrl} alt={event.title}
            className="h-40 w-full object-cover" />
        )}
        <div className="absolute top-3 left-3">
          <Link href="/attendee/events">
            <Button size="icon" variant="secondary" className="rounded-full h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4">
        <h1 className="text-xl font-bold">{event.title}</h1>
        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
          {event.startsAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(event.startsAt), "EEEE, MMMM d, yyyy · h:mm a")}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {typeof event.venue === "object"
                ? (event.venue as Record<string, string>).name ?? ""
                : String(event.venue)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ticket" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="ticket" className="flex-1">Ticket</TabsTrigger>
          <TabsTrigger value="agenda" className="flex-1">Agenda</TabsTrigger>
          <TabsTrigger value="guests" className="flex-1">Guests</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1">
            Messages
            {messages.filter((m) => m.senderType === "organizer" && !m.readAt).length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-white">
                {messages.filter((m) => m.senderType === "organizer" && !m.readAt).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TICKET TAB */}
        <TabsContent value="ticket" className="mt-4">
          {ticket ? (
            <div className="flex flex-col items-center space-y-4">
              <Card className="w-full max-w-xs">
                <CardContent className="flex flex-col items-center p-6">
                  <QRCodeSVG value={ticket.barcode} size={200} />
                  <p className="mt-3 text-xs font-mono text-muted-foreground">{ticket.barcode}</p>
                  <p className="mt-1 text-sm font-medium">{event.title}</p>
                  <Badge className="mt-2" variant={ticket.status === "valid" ? "default" : "secondary"}>
                    {ticket.status === "used" ? "✓ Checked In" :
                     ticket.status === "valid" ? "✓ Valid" : ticket.status}
                  </Badge>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                {ticket.walletUrl && (
                  <a href={ticket.walletUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <Wallet className="mr-2 h-4 w-4" /> Wallet
                    </Button>
                  </a>
                )}
                {ticket.pdfUrl && (
                  <a href={ticket.pdfUrl} download>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No ticket found.</p>
          )}
        </TabsContent>

        {/* AGENDA TAB */}
        <TabsContent value="agenda" className="mt-4">
          {agenda.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No agenda yet.</p>
          ) : (
            <div className="space-y-3">
              {agenda.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-xs text-muted-foreground w-16">
                        {item.startsAt ? format(new Date(item.startsAt), "h:mm a") : ""}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.speakerName && (
                          <p className="text-xs text-muted-foreground">{item.speakerName}</p>
                        )}
                        {item.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {item.location}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* GUESTS TAB */}
        <TabsContent value="guests" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {guestList.length} {guestList.length === 1 ? "person" : "people"} attending
          </p>
          <div className="grid grid-cols-4 gap-3">
            {guestList.map((g) => {
              const initial = g.firstName?.[0]?.toUpperCase() ?? "?";
              return (
                <div key={g.id} className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {initial}
                  </div>
                  <p className="text-xs text-center truncate w-full">{g.firstName}</p>
                </div>
              );
            })}
          </div>
          {guestList.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No guests yet.</p>
          )}
        </TabsContent>

        {/* MESSAGES TAB */}
        <TabsContent value="messages" className="mt-4">
          <div className="flex flex-col gap-3 mb-4 max-h-96 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id}
                className={cn("flex", m.senderType === "attendee" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  m.senderType === "attendee"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}>
                  <p>{m.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {format(new Date(m.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Send a message to the organizer
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Message the organizer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  sendMsg.mutate({ eventId, message: message.trim() });
                }
              }}
            />
            <Button size="icon"
              disabled={!message.trim() || sendMsg.isPending}
              onClick={() => sendMsg.mutate({ eventId, message: message.trim() })}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add src/app/(attendee)/attendee/events/[eventId]/page.tsx
git commit -m "feat: attendee event detail page (Ticket, Agenda, Guests, Messages tabs)"
```

---

### Task 19: Attendee Profile Page

**Files:**
- Create: `src/app/(attendee)/attendee/profile/page.tsx`

**Step 1: Create the profile page**

```typescript
// src/app/(attendee)/attendee/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AttendeeProfilePage() {
  const { data: profile, refetch } = api.attendeeAuth.getProfile.useQuery();
  const upsert = api.attendeeAuth.upsertProfile.useMutation({
    onSuccess: () => { void refetch(); toast.success("Profile updated"); },
  });

  const [displayName, setDisplayName] = useState("");
  useEffect(() => { if (profile?.displayName) setDisplayName(profile.displayName); }, [profile]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/attendee/login");
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled className="opacity-60" />
          </div>
          <Button
            onClick={() => upsert.mutate({ displayName })}
            disabled={upsert.isPending}
            className="w-full">
            {upsert.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(attendee)/attendee/profile/page.tsx
git commit -m "feat: attendee profile page"
```

---

## Phase 4 — Organizer Tools

### Task 20: Agenda CRUD router (organizer)

**Files:**
- Create: `src/server/trpc/routers/agenda.ts`

**Step 1: Create the router**

```typescript
// src/server/trpc/routers/agenda.ts
import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { eventAgendaItems } from "@/server/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export const agendaRouter = router({
  list: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(eventAgendaItems)
        .where(
          and(
            eq(eventAgendaItems.eventId, input.eventId),
            eq(eventAgendaItems.companyId, ctx.companyId)
          )
        )
        .orderBy(asc(eventAgendaItems.sortOrder), asc(eventAgendaItems.startsAt));
    }),

  create: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      location: z.string().optional(),
      startsAt: z.string().optional(), // ISO string
      endsAt: z.string().optional(),
      speakerName: z.string().optional(),
      speakerBio: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .insert(eventAgendaItems)
        .values({
          ...input,
          companyId: ctx.companyId,
          startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
          endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        })
        .returning();
      return item;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
      speakerName: z.string().optional(),
      speakerBio: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, startsAt, endsAt, ...rest } = input;
      const [item] = await ctx.db
        .update(eventAgendaItems)
        .set({
          ...rest,
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt ? new Date(endsAt) : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(eventAgendaItems.id, id),
            eq(eventAgendaItems.companyId, ctx.companyId)
          )
        )
        .returning();
      return item;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(eventAgendaItems)
        .where(
          and(
            eq(eventAgendaItems.id, input.id),
            eq(eventAgendaItems.companyId, ctx.companyId)
          )
        );
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.object({
      items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })),
    }))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.items.map((item) =>
          ctx.db
            .update(eventAgendaItems)
            .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
            .where(
              and(
                eq(eventAgendaItems.id, item.id),
                eq(eventAgendaItems.companyId, ctx.companyId)
              )
            )
        )
      );
      return { success: true };
    }),
});
```

**Step 2: Register in router.ts**
```typescript
import { agendaRouter } from "./routers/agenda";
// Add:
agenda: agendaRouter,
```

**Step 3: Commit**
```bash
git add src/server/trpc/routers/agenda.ts src/server/trpc/router.ts
git commit -m "feat: agenda tRPC router (organizer CRUD)"
```

---

### Task 21: Organizer Messages router

**Files:**
- Create: `src/server/trpc/routers/organizerMessages.ts`

**Step 1: Create the router**

```typescript
// src/server/trpc/routers/organizerMessages.ts
import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { attendeeMessages, attendeeNotifications, attendeeProfiles } from "@/server/db/schema";
import { eq, and, asc, desc, isNull, sql } from "drizzle-orm";

export const organizerMessagesRouter = router({
  // List all attendee threads for an event with unread count
  listConversations: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get distinct attendee profiles who have messaged for this event
      const threads = await ctx.db
        .selectDistinct({
          attendeeProfileId: attendeeMessages.attendeeProfileId,
        })
        .from(attendeeMessages)
        .where(
          and(
            eq(attendeeMessages.eventId, input.eventId),
            eq(attendeeMessages.companyId, ctx.companyId)
          )
        );

      if (threads.length === 0) return [];

      const results = await Promise.all(
        threads.map(async (t) => {
          const [profile] = await ctx.db
            .select({ displayName: attendeeProfiles.displayName, email: attendeeProfiles.email })
            .from(attendeeProfiles)
            .where(eq(attendeeProfiles.id, t.attendeeProfileId))
            .limit(1);

          const [lastMsg] = await ctx.db
            .select()
            .from(attendeeMessages)
            .where(
              and(
                eq(attendeeMessages.eventId, input.eventId),
                eq(attendeeMessages.attendeeProfileId, t.attendeeProfileId)
              )
            )
            .orderBy(desc(attendeeMessages.createdAt))
            .limit(1);

          const unread = await ctx.db
            .select({ id: attendeeMessages.id })
            .from(attendeeMessages)
            .where(
              and(
                eq(attendeeMessages.eventId, input.eventId),
                eq(attendeeMessages.attendeeProfileId, t.attendeeProfileId),
                eq(attendeeMessages.senderType, "attendee"),
                isNull(attendeeMessages.readAt)
              )
            );

          return {
            attendeeProfileId: t.attendeeProfileId,
            displayName: profile?.displayName ?? profile?.email ?? "Attendee",
            lastMessage: lastMsg?.message ?? "",
            lastMessageAt: lastMsg?.createdAt,
            unreadCount: unread.length,
          };
        })
      );

      return results.sort(
        (a, b) =>
          new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
      );
    }),

  getThread: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      attendeeProfileId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Mark attendee messages as read
      await ctx.db
        .update(attendeeMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(attendeeMessages.eventId, input.eventId),
            eq(attendeeMessages.attendeeProfileId, input.attendeeProfileId),
            eq(attendeeMessages.senderType, "attendee"),
            isNull(attendeeMessages.readAt)
          )
        );

      return ctx.db
        .select()
        .from(attendeeMessages)
        .where(
          and(
            eq(attendeeMessages.eventId, input.eventId),
            eq(attendeeMessages.attendeeProfileId, input.attendeeProfileId)
          )
        )
        .orderBy(asc(attendeeMessages.createdAt));
    }),

  reply: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      attendeeProfileId: z.string().uuid(),
      message: z.string().min(1).max(2000),
      organizerName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [msg] = await ctx.db
        .insert(attendeeMessages)
        .values({
          eventId: input.eventId,
          companyId: ctx.companyId,
          attendeeProfileId: input.attendeeProfileId,
          senderType: "organizer",
          senderId: ctx.userId,
          senderName: input.organizerName ?? "Organizer",
          message: input.message,
        })
        .returning();

      // Create notification for the attendee
      await ctx.db.insert(attendeeNotifications).values({
        eventId: input.eventId,
        companyId: ctx.companyId,
        attendeeProfileId: input.attendeeProfileId,
        type: "message",
        title: "New message from organizer",
        body: input.message.substring(0, 100),
      });

      return msg;
    }),

  broadcast: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      type: z.enum(["event_updated", "time_changed", "venue_changed", "cancelled"]),
      title: z.string().min(1).max(255),
      body: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get all attendee profiles for this event
      const threads = await ctx.db
        .selectDistinct({ attendeeProfileId: attendeeMessages.attendeeProfileId })
        .from(attendeeMessages)
        .where(
          and(
            eq(attendeeMessages.eventId, input.eventId),
            eq(attendeeMessages.companyId, ctx.companyId)
          )
        );

      if (threads.length === 0) return { sent: 0 };

      await ctx.db.insert(attendeeNotifications).values(
        threads.map((t) => ({
          eventId: input.eventId,
          companyId: ctx.companyId,
          attendeeProfileId: t.attendeeProfileId,
          type: input.type,
          title: input.title,
          body: input.body,
        }))
      );

      return { sent: threads.length };
    }),
});
```

**Step 2: Register in router.ts**
```typescript
import { organizerMessagesRouter } from "./routers/organizerMessages";
// Add:
organizerMessages: organizerMessagesRouter,
```

**Step 3: Commit**
```bash
git add src/server/trpc/routers/organizerMessages.ts src/server/trpc/router.ts
git commit -m "feat: organizerMessages tRPC router (listConversations, reply, broadcast)"
```

---

### Task 22: Agenda tab in organizer event dashboard

**Files:**
- Modify: `src/app/(dashboard)/dashboard/events/[eventId]/page.tsx` (add Agenda tab)
- Create: `src/app/(dashboard)/dashboard/events/[eventId]/agenda/page.tsx`

**Step 1: Create the agenda management page**

```typescript
// src/app/(dashboard)/dashboard/events/[eventId]/agenda/page.tsx
"use client";

import { useState, use } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AgendaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: items = [], refetch } = api.agenda.list.useQuery({ eventId });
  const createMutation = api.agenda.create.useMutation({
    onSuccess: () => { void refetch(); setOpen(false); toast.success("Agenda item added"); },
  });
  const updateMutation = api.agenda.update.useMutation({
    onSuccess: () => { void refetch(); setEditItem(null); toast.success("Agenda item updated"); },
  });
  const deleteMutation = api.agenda.delete.useMutation({
    onSuccess: () => { void refetch(); toast.success("Deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<(typeof items)[0] | null>(null);

  const emptyForm = { title: "", description: "", location: "", startsAt: "", endsAt: "", speakerName: "" };
  const [form, setForm] = useState(emptyForm);

  const handleSave = () => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form });
    } else {
      createMutation.mutate({ eventId, ...form });
    }
    setForm(emptyForm);
  };

  const openEdit = (item: (typeof items)[0]) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      location: item.location ?? "",
      startsAt: item.startsAt ? new Date(item.startsAt).toISOString().slice(0, 16) : "",
      endsAt: item.endsAt ? new Date(item.endsAt).toISOString().slice(0, 16) : "",
      speakerName: item.speakerName ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agenda</h2>
        <Button onClick={() => { setEditItem(null); setForm(emptyForm); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {items.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No agenda items yet. Add the first one!
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-start justify-between p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{item.title}</p>
                {item.speakerName && (
                  <p className="text-sm text-muted-foreground">{item.speakerName}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {item.startsAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.startsAt), "h:mm a")}
                      {item.endsAt && ` – ${format(new Date(item.endsAt), "h:mm a")}`}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon"
                  onClick={() => deleteMutation.mutate({ id: item.id })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Agenda Item" : "Add Agenda Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input type="datetime-local" value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input type="datetime-local" value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Speaker</Label>
              <Input value={form.speakerName}
                onChange={(e) => setForm({ ...form, speakerName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}
              disabled={!form.title || createMutation.isPending || updateMutation.isPending}>
              {editItem ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(dashboard)/dashboard/events/[eventId]/agenda/
git commit -m "feat: agenda management page in organizer dashboard"
```

---

### Task 23: Organizer Messages Inbox

**Files:**
- Create: `src/app/(dashboard)/dashboard/events/[eventId]/messages/page.tsx`

**Step 1: Create the messages inbox**

```typescript
// src/app/(dashboard)/dashboard/events/[eventId]/messages/page.tsx
"use client";

import { useState, use } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function OrganizerMessagesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: conversations = [], refetch: refetchConvos } =
    api.organizerMessages.listConversations.useQuery({ eventId });

  const [selectedAttendee, setSelectedAttendee] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: thread = [], refetch: refetchThread } =
    api.organizerMessages.getThread.useQuery(
      { eventId, attendeeProfileId: selectedAttendee! },
      { enabled: !!selectedAttendee }
    );

  const replyMutation = api.organizerMessages.reply.useMutation({
    onSuccess: () => {
      setReply("");
      void refetchThread();
      void refetchConvos();
    },
  });

  const selectedConvo = conversations.find((c) => c.attendeeProfileId === selectedAttendee);

  return (
    <div className="flex h-[calc(100vh-8rem)] p-6 gap-4">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        {conversations.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="mx-auto h-8 w-8 opacity-30 mb-2" />
            <p className="text-sm">No messages yet</p>
          </div>
        )}
        {conversations.map((convo) => (
          <Card key={convo.attendeeProfileId}
            className={cn(
              "cursor-pointer hover:border-primary transition-colors",
              selectedAttendee === convo.attendeeProfileId && "border-primary"
            )}
            onClick={() => setSelectedAttendee(convo.attendeeProfileId)}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate">{convo.displayName}</p>
                {convo.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">{convo.unreadCount}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{convo.lastMessage}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        {selectedAttendee ? (
          <>
            <div className="border-b p-3 font-medium text-sm">
              {selectedConvo?.displayName ?? "Attendee"}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.map((m) => (
                <div key={m.id}
                  className={cn("flex", m.senderType === "organizer" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                    m.senderType === "organizer"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}>
                    <p>{m.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {format(new Date(m.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3 flex gap-2">
              <Input
                placeholder="Reply to attendee..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reply.trim()) {
                    replyMutation.mutate({
                      eventId, attendeeProfileId: selectedAttendee, message: reply.trim(),
                    });
                  }
                }}
              />
              <Button size="icon" disabled={!reply.trim() || replyMutation.isPending}
                onClick={() => replyMutation.mutate({
                  eventId, attendeeProfileId: selectedAttendee, message: reply.trim(),
                })}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/app/(dashboard)/dashboard/events/[eventId]/messages/
git commit -m "feat: organizer messages inbox page"
```

---

## Phase 5 — Organizer Web Scanner

### Task 24: Install `html5-qrcode`

**Step 1: Install**
```bash
npm install html5-qrcode
```

**Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add html5-qrcode for web scanner"
```

---

### Task 25: Web Scanner Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/events/[eventId]/scan/page.tsx`

**Step 1: Create the scanner page**

```typescript
// src/app/(dashboard)/dashboard/events/[eventId]/scan/page.tsx
"use client";

import { useState, useEffect, useRef, use } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ScanResult = {
  status: "success" | "revalidated" | "invalid";
  result: string;
  attendeeName: string | null;
};

export default function WebScannerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  // Pairing state stored in sessionStorage (not localStorage — clears on tab close)
  const [paired, setPaired] = useState(false);
  const [pairCode, setPairCode] = useState("");
  const [pairPin, setPairPin] = useState("");
  const [pairError, setPairError] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<{ clear: () => void } | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  const pairMutation = api.devices.pair.useMutation({
    onSuccess: (data) => {
      // Store the device JWT in sessionStorage
      sessionStorage.setItem(`scanner_jwt_${eventId}`, JSON.stringify(data));
      setPaired(true);
      setPairingLoading(false);
    },
    onError: (err) => {
      setPairError(err.message);
      setPairingLoading(false);
    },
  });

  const scanMutation = api.scans.processScan.useMutation({
    onSuccess: (result) => {
      setScanResult({
        status: result.status,
        result: result.result,
        attendeeName: result.attendeeName,
      });
      // Auto-clear after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    },
  });

  // Check if already paired on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(`scanner_jwt_${eventId}`);
    if (stored) setPaired(true);
  }, [eventId]);

  const handlePair = () => {
    setPairingLoading(true);
    setPairError("");
    pairMutation.mutate({ eventId, accessCode: pairCode, pin: pairPin });
  };

  const handleManualScan = () => {
    if (!manualBarcode.trim()) return;
    scanMutation.mutate({ eventId, barcode: manualBarcode.trim() });
    setManualBarcode("");
  };

  const startCamera = async () => {
    if (!scannerDivRef.current) return;
    // Dynamic import to avoid SSR issues with html5-qrcode
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    setCameraActive(true);
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanMutation.mutate({ eventId, barcode: decodedText });
      },
      undefined
    );
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      await (scannerRef.current as { stop: () => Promise<void> }).stop();
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const handleUnpair = () => {
    sessionStorage.removeItem(`scanner_jwt_${eventId}`);
    setPaired(false);
    void stopCamera();
  };

  const resultColor = scanResult
    ? scanResult.status === "success"
      ? "bg-green-500"
      : scanResult.status === "revalidated"
      ? "bg-yellow-500"
      : "bg-red-500"
    : "";

  if (!paired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <QrCode className="mx-auto mb-2 h-10 w-10 text-primary" />
            <CardTitle>Pair Scanner</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the Access Code + PIN from the Devices page
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {pairError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {pairError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Access Code</Label>
              <Input value={pairCode} onChange={(e) => setPairCode(e.target.value)}
                placeholder="e.g. sblyifej" />
            </div>
            <div className="space-y-2">
              <Label>PIN</Label>
              <Input value={pairPin} onChange={(e) => setPairPin(e.target.value)}
                placeholder="e.g. 9746" type="text" inputMode="numeric" maxLength={6} />
            </div>
            <Button className="w-full" onClick={handlePair} disabled={pairingLoading}>
              {pairingLoading ? "Pairing..." : "Activate Scanner"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 gap-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Scanner</h1>
          <Button variant="ghost" size="sm" onClick={handleUnpair}>Unpair</Button>
        </div>

        {/* Scan result overlay */}
        {scanResult && (
          <div className={cn("rounded-xl p-4 text-white text-center mb-4", resultColor)}>
            {scanResult.status === "success" && (
              <><CheckCircle2 className="mx-auto h-8 w-8 mb-1" />
              <p className="font-semibold">Checked In</p>
              {scanResult.attendeeName && <p className="text-sm opacity-90">{scanResult.attendeeName}</p>}</>
            )}
            {scanResult.status === "revalidated" && (
              <><AlertCircle className="mx-auto h-8 w-8 mb-1" />
              <p className="font-semibold">Already Checked In</p>
              {scanResult.attendeeName && <p className="text-sm opacity-90">{scanResult.attendeeName}</p>}</>
            )}
            {scanResult.status === "invalid" && (
              <><XCircle className="mx-auto h-8 w-8 mb-1" />
              <p className="font-semibold">Invalid Ticket</p>
              <p className="text-sm opacity-90">{scanResult.result}</p></>
            )}
          </div>
        )}

        {/* Camera */}
        <div id="qr-reader" ref={scannerDivRef} className="w-full rounded-xl overflow-hidden" />

        <div className="flex gap-2 mt-4">
          {!cameraActive ? (
            <Button className="flex-1" onClick={startCamera}>
              <QrCode className="mr-2 h-4 w-4" /> Start Camera
            </Button>
          ) : (
            <Button className="flex-1" variant="outline" onClick={stopCamera}>
              Stop Camera
            </Button>
          )}
        </div>

        {/* Manual entry */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Enter barcode manually..."
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleManualScan(); }}
          />
          <Button onClick={handleManualScan} disabled={!manualBarcode.trim()}>
            Check In
          </Button>
        </div>
      </div>
    </div>
  );
}
```

> **Note:** The `api.devices.pair` and `api.scans.processScan` procedure names must match the actual router procedure names. Check `src/server/trpc/routers/devices.ts` for the exact pair procedure name, and `src/server/trpc/routers/scans.ts` for the scan procedure name, and update the `useMutation` calls to match.

**Step 2: Commit**
```bash
git add src/app/(dashboard)/dashboard/events/[eventId]/scan/
git commit -m "feat: organizer web scanner page with pairing and camera QR"
```

---

## Phase 6 — Wire-up & Navigation

### Task 26: Add portal links to existing pages

**Files:**
- Modify: `src/app/(dashboard)/dashboard/events/[eventId]/devices/page.tsx` — add link to `/scan`
- Modify: `src/app/e/[companySlug]/[eventSlug]/page.tsx` — add "View your ticket" link after registration

**Step 1: Add scan link to devices page**

Find the devices page and add a button/link:
```typescript
<Link href={`/dashboard/events/${eventId}/scan`}>
  <Button variant="outline">
    <QrCode className="mr-2 h-4 w-4" /> Open Web Scanner
  </Button>
</Link>
```

**Step 2: Add "Create account" nudge to public registration success state**

In the event registration page success state, add:
```typescript
<p className="text-sm text-muted-foreground mt-2">
  <Link href="/attendee/signup" className="text-primary hover:underline">
    Create an account
  </Link>{" "}
  to view your ticket and event details anytime.
</p>
```

**Step 3: Commit**
```bash
git add src/app/(dashboard)/dashboard/events/[eventId]/devices/page.tsx
git add src/app/e/
git commit -m "feat: add scanner link to devices page + signup nudge on registration"
```

---

### Task 27: Verify the full flow

**Step 1: Start dev server**
```bash
# Server should already be running at localhost:3000
```

**Step 2: Test attendee signup**
1. Navigate to `http://localhost:3000/attendee/signup`
2. Create account with a test email that has existing tickets in the DB
3. Check: redirected to `/attendee/dashboard` after email confirmation

**Step 3: Test dashboard**
1. Open `/attendee/dashboard`
2. Check: events appear, notifications section visible

**Step 4: Test event detail tabs**
1. Click an event
2. Ticket tab: QR code renders correctly
3. Agenda tab: shows items if any exist
4. Guests tab: shows attendee names
5. Messages tab: can send a message

**Step 5: Test organizer scanner**
1. Open `/dashboard/events/[eventId]/devices` as organizer
2. Generate a device Access Code + PIN
3. Open `/dashboard/events/[eventId]/scan` in a new tab
4. Enter the code + PIN — should activate
5. Click "Start Camera" — camera viewfinder opens
6. Scan a test QR code — result overlay appears

**Step 6: Final commit**
```bash
git add -A
git commit -m "feat: attendee portal complete (auth, dashboard, events, scanner)"
```

---

## Summary of All New Files

```
src/server/db/schema/
  attendee-profiles.ts
  event-agenda-items.ts
  attendee-messages.ts
  attendee-notifications.ts

src/server/trpc/routers/
  attendeeAuth.ts
  attendeeEvents.ts
  attendeeAgenda.ts
  attendeeGuests.ts
  attendeeMessages.ts
  attendeeNotifications.ts
  agenda.ts                    (organizer)
  organizerMessages.ts         (organizer)

src/app/(attendee)/
  layout.tsx
  attendee/layout.tsx
  attendee/login/page.tsx
  attendee/signup/page.tsx
  attendee/dashboard/page.tsx
  attendee/events/page.tsx
  attendee/events/[eventId]/page.tsx
  attendee/profile/page.tsx

src/app/(dashboard)/dashboard/events/[eventId]/
  agenda/page.tsx
  messages/page.tsx
  scan/page.tsx
```
