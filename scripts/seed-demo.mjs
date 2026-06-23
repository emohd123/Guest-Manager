// One-off demo data seed (via Supabase REST + service-role key) so the dashboard
// screenshots look populated. Idempotent. Run: node scripts/seed-demo.mjs
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const DEMO = "70340214-e6f9-4aef-b0d6-f26648d54aa9";
const EVENT = "e1111111-1111-4111-8111-111111111111";
const TT1 = "e2222222-2222-4222-8222-222222222221";
const TT2 = "e2222222-2222-4222-8222-222222222222";

async function upsert(table, onConflict, body) {
  const r = await fetch(`${URL_BASE}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
}
async function del(table, query) {
  const r = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: { ...H, Prefer: "return=minimal" },
  });
  if (!r.ok) throw new Error(`del ${table}: ${r.status} ${await r.text()}`);
}

const firstNames = ["Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas", "Mia", "Aiden"];
const lastNames = ["Carter", "Bennett", "Rivera", "Hughes", "Nguyen", "Patel", "Foster", "Reed", "Brooks", "Ortiz", "Ward", "Khan"];
const orgs = ["northwind", "acme", "lumenlabs", "vertex", "cobalt", "meridian", "brightside", "helix", "onyx", "pinnacle", "quartz", "summit"];

try {
  console.log("company + user…");
  await upsert("companies", "id", { id: DEMO, name: "Demo Events Co", slug: "demo-events-co", timezone: "America/Los_Angeles" });
  await upsert("users", "id", { id: DEMO, company_id: DEMO, email: "demo@eventshub.test", name: "Demo Organizer", role: "owner", email_verified: true });

  console.log("event…");
  await upsert("events", "id", {
    id: EVENT, company_id: DEMO, title: "Aurora Tech Summit 2026", slug: "aurora-tech-summit-2026",
    description: "A full-day conference for product, design and engineering leaders.",
    short_description: "The flagship product & engineering conference.",
    event_type: "conference", status: "published",
    starts_at: "2026-07-15T09:00:00Z", ends_at: "2026-07-15T18:00:00Z",
    timezone: "America/Los_Angeles", registration_enabled: true, max_capacity: 600,
  });

  console.log("ticket types…");
  await upsert("ticket_types", "id", [
    { id: TT1, company_id: DEMO, event_id: EVENT, name: "General Admission", description: "Full-day access to all talks and the expo floor.", price: 4900, currency: "USD", quantity_total: 500, quantity_sold: 312, barcode_type: "qr", wallet_enabled: true, status: "active", sort_order: 0 },
    { id: TT2, company_id: DEMO, event_id: EVENT, name: "VIP Pass", description: "Front-row seating, speaker lounge, and after-party.", price: 14900, currency: "USD", quantity_total: 100, quantity_sold: 88, barcode_type: "qr", wallet_enabled: true, status: "active", sort_order: 1 },
  ]);

  console.log("guests…");
  await del("guests", `event_id=eq.${EVENT}`);
  const guests = firstNames.map((fn, i) => {
    const status = i < 7 ? "checked_in" : i < 10 ? "confirmed" : "invited";
    return {
      event_id: EVENT, company_id: DEMO, first_name: fn, last_name: lastNames[i],
      email: `${fn.toLowerCase()}.${lastNames[i].toLowerCase()}@${orgs[i]}.com`,
      phone: `+1 415 555 0${100 + i}`,
      status,
      attendance_state: status === "checked_in" ? "checked_in" : "not_arrived",
      party_size: (i % 3) + 1, table_number: `T${(i % 8) + 1}`,
      guest_type: i % 5 === 0 ? "VIP" : "General",
      checked_in_at: status === "checked_in" ? `2026-07-15T1${i % 3}:${(10 + i * 3) % 60 < 10 ? "0" : ""}${(10 + i * 3) % 60}:00Z` : null,
    };
  });
  await upsert("guests", "id", guests);

  const r = await fetch(`${URL_BASE}/rest/v1/guests?event_id=eq.${EVENT}&select=id`, { headers: { ...H, Prefer: "count=exact" } });
  console.log(`Done. Guests range: ${r.headers.get("content-range")}`);
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
}
