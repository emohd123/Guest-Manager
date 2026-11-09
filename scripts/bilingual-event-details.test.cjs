const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(file, imports) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, console, Date, Object, Error }, { filename: file });
  return exports;
}

const details = loadTs("src/lib/event-details.ts", { zod: require("zod") });
const valid = {
  title: "Bahrain Summer Festival", titleAr: "مهرجان صيف البحرين",
  shortDescription: "A summer celebration in Bahrain.", shortDescriptionAr: "احتفال صيفي في البحرين.",
  description: "Join us for music, food and family activities.", descriptionAr: "انضم إلينا للموسيقى والطعام والأنشطة العائلية.",
};
const procedure = {
  input: (schema) => ({ mutation: (handler) => ({ schema, handler }), query: (handler) => ({ schema, handler }) }),
  query: (handler) => ({ handler }), mutation: (handler) => ({ handler }),
};
const { eventsRouter } = loadTs("src/server/trpc/routers/events.ts", {
  zod: require("zod"),
  "../index": { router: (value) => value, protectedProcedure: procedure, publicProcedure: procedure },
  nanoid: { nanoid: () => "testid" },
  "@/server/supabase/admin": { createSupabaseAdminClient: () => { throw new Error("Unexpected admin client"); } },
  "@/server/services/discover-push": { handleEventPublished: async () => {} },
  "next/server": { after: () => {} },
  "@/server/auth/event-access": { applyEventOwnership: (query) => query, isFullDashboardAccess: () => true },
  "@/server/audit": { recordAudit: async () => {} },
  "@/lib/event-details": details,
});

test("All six bilingual fields are mandatory, including whitespace-only values", () => {
  assert.equal(details.bilingualEventDetailsSchema.safeParse(valid).success, true);
  for (const key of Object.keys(valid)) {
    for (const value of [undefined, "", "   "]) {
      const parsed = details.bilingualEventDetailsSchema.safeParse({ ...valid, [key]: value });
      assert.equal(parsed.success, false, `${key}: ${JSON.stringify(value)}`);
      assert.equal(parsed.error.issues.some((issue) => issue.path[0] === key), true);
    }
  }
});

test("Arabic fields require Arabic letters and English fields require English letters", () => {
  for (const key of ["titleAr", "shortDescriptionAr", "descriptionAr"]) {
    assert.equal(details.bilingualEventDetailsSchema.safeParse({ ...valid, [key]: "English only 123" }).success, false);
    assert.equal(details.bilingualEventDetailsSchema.safeParse({ ...valid, [key]: "١٢٣٤" }).success, false);
  }
  assert.equal(details.bilingualEventDetailsSchema.safeParse({ ...valid, title: "عنوان عربي فقط" }).success, false);
  assert.equal(details.bilingualEventDetailsSchema.safeParse({ ...valid, titleAr: "حفل DJ X" }).success, true);
});

test("Input is trimmed before persistence", () => {
  assert.equal(details.bilingualEventDetailsSchema.parse({ ...valid, titleAr: `  ${valid.titleAr}  ` }).titleAr, valid.titleAr);
});

test("The actual creation endpoint rejects legacy English-only requests", () => {
  const { titleAr, shortDescriptionAr, descriptionAr, ...englishOnly } = valid;
  assert.equal(eventsRouter.create.schema.safeParse({ ...englishOnly, startsAt: "2027-01-01T10:00:00.000Z" }).success, false);
  assert.equal(eventsRouter.create.schema.safeParse({ ...valid, startsAt: "2027-01-01T10:00:00.000Z", eventType: "conference" }).success, true);
});

test("Creation saves English columns and both translations in the same insert", async () => {
  const inserted = [];
  const ctx = { userId: "test-user", companyId: "test-company", supabase: { from: () => ({ insert: (payload) => {
    inserted.push(payload);
    return { select: () => ({ single: async () => ({ data: { id: "test-event", ...payload }, error: null }) }) };
  } }) } };
  const input = eventsRouter.create.schema.parse({ ...valid, startsAt: "2027-01-01T10:00:00.000Z" });
  const result = await eventsRouter.create.handler({ ctx, input });
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].title, valid.title);
  assert.equal(inserted[0].description, valid.description);
  assert.equal(inserted[0].settings.localized.title.ar, valid.titleAr);
  assert.equal(inserted[0].settings.localized.description.en, valid.description);
  assert.equal(result.settings.localized.shortDescription.ar, valid.shortDescriptionAr);
});

test("Schema fallback cannot silently drop translations", async () => {
  let attempts = 0;
  const ctx = { userId: "test-user", companyId: "test-company", supabase: { from: () => ({ insert: () => {
    attempts += 1;
    return { select: () => ({ single: async () => ({ data: null, error: { message: "Could not find the 'settings' column in the schema cache" } }) }) };
  } }) } };
  const input = eventsRouter.create.schema.parse({ ...valid, startsAt: "2027-01-01T10:00:00.000Z" });
  await assert.rejects(eventsRouter.create.handler({ ctx, input }), /bilingual event details/);
  assert.equal(attempts, 1);
});

test("Saving translations preserves unrelated design and localisation settings", () => {
  const merged = details.withBilingualEventDetails(valid, { publicPage: { galleryImages: ["keep.jpg"] }, localized: { custom: "keep" }, other: true });
  assert.equal(merged.other, true);
  assert.equal(merged.localized.custom, "keep");
  assert.equal(merged.publicPage.galleryImages[0], "keep.jpg");
  const restored = details.readBilingualEventDetails({ title: valid.title, description: valid.description, shortDescription: valid.shortDescription, settings: merged });
  assert.equal(restored.descriptionAr, valid.descriptionAr);
  assert.equal(restored.shortDescriptionAr, valid.shortDescriptionAr);
});

test("Updates carrying bilingual details reject incomplete Arabic", () => {
  assert.equal(eventsRouter.update.schema.safeParse({ id: "e5000000-0000-4000-8000-000000000001", bilingualDetails: { ...valid, descriptionAr: "" } }).success, false);
});

test("The update endpoint saves both languages without losing existing settings", async () => {
  let saved;
  const q = {
    select: () => q, eq: () => q,
    maybeSingle: async () => ({ data: { settings: { publicPage: { galleryImages: ["keep.jpg"] }, localized: { custom: "keep" } } }, error: null }),
    update: (payload) => { saved = payload; return q; },
    single: async () => ({ data: { id: "test-event", ...saved }, error: null }),
  };
  const input = eventsRouter.update.schema.parse({ id: "e5000000-0000-4000-8000-000000000001", bilingualDetails: valid });
  await eventsRouter.update.handler({ ctx: { companyId: "test-company", userId: "test-user", supabase: { from: () => q } }, input });
  assert.equal(saved.title, valid.title);
  assert.equal(saved.description, valid.description);
  assert.equal(saved.settings.localized.title.ar, valid.titleAr);
  assert.equal(saved.settings.localized.custom, "keep");
  assert.equal(saved.settings.publicPage.galleryImages[0], "keep.jpg");
});

test("An English-only legacy event cannot be duplicated into a new event", async () => {
  let inserted = false;
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { title: valid.title, description: valid.description, short_description: valid.shortDescription, settings: {} }, error: null }), insert: () => { inserted = true; throw new Error("Must not insert"); } };
  await assert.rejects(eventsRouter.duplicate.handler({ ctx: { companyId: "test-company", supabase: { from: () => q } }, input: { id: "test" } }), /before duplicating/);
  assert.equal(inserted, false);
});

test("A complete event duplicates with matching English and Arabic copy names", async () => {
  let saved;
  const original = { title: valid.title, description: valid.description, short_description: valid.shortDescription, settings: details.withBilingualEventDetails(valid) };
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: original, error: null }), insert: (payload) => { saved = payload; return q; }, single: async () => ({ data: { id: "copy", ...saved }, error: null }) };
  await eventsRouter.duplicate.handler({ ctx: { companyId: "test-company", userId: "test-user", supabase: { from: () => q } }, input: { id: "test" } });
  assert.equal(saved.settings.localized.title.en, `${valid.title} (Copy)`);
  assert.equal(saved.settings.localized.title.ar, `${valid.titleAr} (نسخة)`);
  assert.equal(saved.settings.localized.description.ar, valid.descriptionAr);
});

test("The form exposes all six required inputs with separate language directions", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { BilingualEventFields } = loadTs("src/components/dashboard/bilingual-event-fields.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/components/ui/input": { Input: (props) => React.createElement("input", props) },
    "@/components/ui/textarea": { Textarea: (props) => React.createElement("textarea", props) },
    "@/components/ui/label": { Label: (props) => React.createElement("label", props) },
  });
  const html = renderToStaticMarkup(React.createElement(BilingualEventFields, { idPrefix: "test", value: valid, onChange: () => {} }));
  assert.equal((html.match(/required=""/g) ?? []).length, 6);
  assert.match(html, /dir="rtl" lang="ar"/);
  assert.match(html, /dir="ltr" lang="en"/);
  for (const key of Object.keys(valid)) assert.match(html, new RegExp(`id="test-${key}"`));
});
