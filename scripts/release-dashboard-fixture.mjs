import crypto from "node:crypto";
import fs from "node:fs/promises";
import process from "node:process";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

const stateFile = ".release-dashboard-fixture.json";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase admin credentials are required");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function cleanup() {
  try {
    const state = JSON.parse(await fs.readFile(stateFile, "utf8"));
    if (state.userId) {
      await admin.from("users").delete().eq("id", state.userId);
      await admin.auth.admin.deleteUser(state.userId);
    }
    await fs.rm(stateFile, { force: true });
    console.log(JSON.stringify({ ok: true, cleaned: true }));
  } catch (error) {
    if (error?.code === "ENOENT") return console.log(JSON.stringify({ ok: true, cleaned: false }));
    throw error;
  }
}

async function create() {
  await cleanup();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id,name")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (companyError || !company) throw companyError || new Error("No company is available");

  const runId = crypto.randomUUID().slice(0, 8);
  const email = `release-dashboard-${runId}@eventshub.test`;
  const password = `Dashboard-${crypto.randomUUID()}!`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Release Dashboard" },
  });
  if (createError || !created.user) throw createError || new Error("Could not create auth user");

  const { error: profileError } = await admin.from("users").upsert({
    id: created.user.id,
    company_id: company.id,
    email,
    name: "Release Dashboard",
    role: "admin",
    email_verified: true,
    dashboard_access: "full",
    dashboard_permissions: ["*"],
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }

  const state = { userId: created.user.id, email, password, companyId: company.id, companyName: company.name };
  await fs.writeFile(stateFile, JSON.stringify(state), "utf8");
  console.log(JSON.stringify({ ok: true, ...state }));
}

if (process.argv[2] === "cleanup") await cleanup();
else await create();
