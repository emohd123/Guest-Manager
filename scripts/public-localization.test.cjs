const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(path, imports, globals = {}) {
  const source = fs.readFileSync(path, "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, URL, URLSearchParams, ...globals }, { filename: path });
  return exports;
}

const copy = loadTs("src/lib/public-copy.ts", {});

test("Arabic headings cover event, checkout, account and conference screens", () => {
  for (const heading of ["Important Information", "Event media", "Lineup & schedule", "My tickets", "Confirm your tickets", "Conference overview", "Schedule", "Attendee questions", "Share a resource", "Sign out", "Contact Sales"]) {
    const result = copy.translatePublicText(heading, "ar");
    assert.match(result, /[\u0600-\u06ff]/, heading);
    assert.notEqual(result, heading);
    assert.equal(copy.translatePublicText(heading, "en"), heading);
  }
  assert.ok(Object.keys(copy.publicArabicCopy).length >= 250);
});

test("Untranslated organiser content and brand names are preserved", () => {
  assert.equal(copy.translatePublicText("My organiser's original title", "ar"), "My organiser's original title");
  assert.equal(copy.translatePublicText("iTicket", "ar"), "iTicket");
});

test("Local links retain language, query parameters and anchors", () => {
  const hook = loadTs("src/lib/use-public-copy.ts", {
    react: { useMemo: (factory) => factory() },
    "next/navigation": { useSearchParams: () => new URLSearchParams("locale=ar") },
    "@/lib/public-copy": copy,
  });
  const tr = hook.usePublicCopy();
  assert.equal(tr.href("/search?q=music#results"), "/search?q=music&locale=ar#results");
  assert.equal(tr.href("/account?locale=en"), "/account?locale=ar");
  assert.equal(tr.href("https://example.com"), "https://example.com");
  assert.equal(tr.href("//example.com"), "//example.com");
});

function runSync(query, stored, unavailable = false) {
  const effects = [], replacements = [], document = { documentElement: {} };
  const localStorage = {
    getItem: () => { if (unavailable) throw new Error("Storage unavailable"); return stored; },
    setItem: (_key, value) => { if (unavailable) throw new Error("Storage unavailable"); stored = value; },
  };
  const sync = loadTs("src/components/layout/public-locale-sync.tsx", {
    react: { useEffect: (effect) => effects.push(effect) },
    "next/navigation": {
      usePathname: () => "/account",
      useRouter: () => ({ replace: (url) => replacements.push(url) }),
      useSearchParams: () => new URLSearchParams(query),
    },
  }, { localStorage, document, window: { location: { hash: "#tickets" } } });
  sync.PublicLocaleSync();
  effects.forEach((effect) => effect());
  return { stored, replacements, document };
}

test("Navigation without a locale cannot overwrite saved Arabic", () => {
  const result = runSync("q=test", "ar");
  assert.equal(result.stored, "ar");
  assert.equal(result.document.documentElement.dir, "rtl");
  assert.equal(result.replacements[0], "/account?q=test&locale=ar#tickets");
});

test("Explicit English overrides saved Arabic without redirecting back", () => {
  const result = runSync("locale=en", "ar");
  assert.equal(result.stored, "en");
  assert.equal(result.document.documentElement.lang, "en");
  assert.equal(result.document.documentElement.dir, "ltr");
  assert.equal(result.replacements.length, 0);
});

test("Language switching works when browser storage is blocked", () => {
  const result = runSync("locale=ar", "en", true);
  assert.equal(result.document.documentElement.lang, "ar");
  assert.equal(result.document.documentElement.dir, "rtl");
});

test("All legal-policy headings render in Arabic when Arabic is selected", async () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  for (const slug of ["refund-policy", "terms-of-service", "privacy-policy"]) {
    const page = loadTs(`src/app/(marketing)/${slug}/page.tsx`, {
      "react/jsx-runtime": require("react/jsx-runtime"),
      "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
      "lucide-react": { FileText: () => null, Shield: () => null, Sparkles: () => null },
    });
    const arabic = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ locale: "ar" }) }));
    const english = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ locale: "en" }) }));
    const headings = [...arabic.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g)].map((match) => match[1].replace(/<[^>]+>/g, ""));
    assert.ok(headings.length >= 6, slug);
    for (const heading of headings) assert.match(heading, /[\u0600-\u06ff]/, `${slug}: ${heading}`);
    assert.notEqual(arabic, english);
    assert.match(arabic, /locale=ar/);
  }
});
