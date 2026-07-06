// Seed a rich set of public Bahrain events (with cover images) so the
// marketplace homepage rails fill out. Idempotent. Run: node scripts/seed-marketplace.mjs
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const DEMO = "70340214-e6f9-4aef-b0d6-f26648d54aa9"; // demo company id

async function upsert(table, onConflict, body) {
  const r = await fetch(`${URL_BASE}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
}

const img = (slug) => `https://picsum.photos/seed/eh-${slug}/900/560`;
// BHD price helper: dinars -> stored hundredths (formatMoney divides by 100)
const bhd = (d) => Math.round(d * 100);

// id prefix e3aaaaaa-... so reruns are stable
const eid = (n) => `e3000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const tid = (n) => `e3a00000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;

const EVENTS = [
  { n: 1, title: "Bait Maskoon Live", cat: "concerts", catLabel: "Concerts", price: 10, date: "2026-07-03T20:00:00Z", venue: "Beyon Al Dana Amphitheatre", desc: "An unforgettable night of live Arabic music under the stars." },
  { n: 2, title: "André Rieu in Bahrain", cat: "concerts", catLabel: "Concerts", price: 20, date: "2026-07-18T20:00:00Z", venue: "Exhibition World Bahrain", desc: "The maestro returns with the Johann Strauss Orchestra." },
  { n: 3, title: "Manama Comedy Night", cat: "comedy", catLabel: "Comedy", price: 8, date: "2026-07-10T21:00:00Z", venue: "The Sphinx Theatre", desc: "The region's best stand-up comedians on one stage." },
  { n: 4, title: "The Lion King — The Musical", cat: "theatre", catLabel: "Theatre", price: 15, date: "2026-08-14T19:00:00Z", venue: "Bahrain National Theatre", desc: "The award-winning musical, live in Manama." },
  { n: 5, title: "F1 Fan Zone Manama", cat: "sports", catLabel: "Sports", price: 3, date: "2026-09-04T16:00:00Z", venue: "Bahrain International Circuit", desc: "Live racing screens, simulators, and family activities." },
  { n: 6, title: "Family Fun Festival", cat: "family", catLabel: "Family", price: 5, date: "2026-07-25T11:00:00Z", venue: "Marassi Galleria", desc: "Rides, shows, and games for the whole family." },
  { n: 7, title: "Rooftop DJ Sessions", cat: "nightlife", catLabel: "Nightlife", price: 12, date: "2026-07-17T22:00:00Z", venue: "Villa Mamas Rooftop", desc: "Sunset to sunrise with international DJs." },
  { n: 8, title: "Taste of Bahrain Food Fest", cat: "dining", catLabel: "Dining", price: 4, date: "2026-08-01T18:00:00Z", venue: "Block 338, Adliya", desc: "A weekend celebrating Bahrain's best food and chefs." },
  { n: 9, title: "Lost Paradise Water Park", cat: "attractions", catLabel: "Attractions", price: 10, date: "2026-07-15T10:00:00Z", venue: "Salmabad", desc: "Slides, wave pools, and lazy rivers — open all summer." },
  { n: 10, title: "Gravity Indoor Skydiving", cat: "attractions", catLabel: "Attractions", price: 17, date: "2026-07-20T10:00:00Z", venue: "The Avenues Bahrain", desc: "Experience the thrill of freefall — no plane required." },
  { n: 11, title: "Manama Modern Art Exhibition", cat: "exhibitions", catLabel: "Exhibitions", price: 2, date: "2026-08-08T17:00:00Z", venue: "Bahrain National Museum", desc: "Contemporary works from Gulf and international artists." },
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

try {
  console.log(`Seeding ${EVENTS.length} marketplace events...`);
  const endOffsetMs = 3 * 60 * 60 * 1000; // +3h end time

  for (const e of EVENTS) {
    const slug = slugify(e.title);
    const ends = new Date(new Date(e.date).getTime() + endOffsetMs).toISOString();
    await upsert("events", "id", {
      id: eid(e.n),
      company_id: DEMO,
      title: e.title,
      slug,
      short_description: e.desc,
      description: e.desc,
      cover_image_url: img(slug),
      event_type: "single",
      status: "published",
      starts_at: e.date,
      ends_at: ends,
      timezone: "Asia/Bahrain",
      registration_enabled: true,
      max_capacity: 2000,
      settings: {
        publicPage: { enabled: true, showInMarketplace: true, categorySlug: e.cat, category: e.catLabel, venueName: e.venue, locationText: "Bahrain" },
      },
    });
    await upsert("ticket_types", "id", {
      id: tid(e.n),
      company_id: DEMO,
      event_id: eid(e.n),
      name: "General Admission",
      description: "Standard entry ticket.",
      price: bhd(e.price),
      currency: "BHD",
      quantity_total: 1000,
      quantity_sold: 120 + e.n * 17,
      barcode_type: "qr",
      status: "active",
      sort_order: 0,
    });
    console.log(`  + ${e.title} (${e.catLabel}, ${e.price} BHD)`);
  }

  const r = await fetch(`${URL_BASE}/rest/v1/events?company_id=eq.${DEMO}&status=eq.published&select=id`, {
    headers: { ...H, Prefer: "count=exact" },
  });
  console.log(`Done. Published events for company: ${r.headers.get("content-range")}`);
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
}
