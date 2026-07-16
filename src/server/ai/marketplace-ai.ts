import Anthropic from "@anthropic-ai/sdk";
import type { MarketplaceEvent } from "@/types/marketplace";

/**
 * Events Hub AI layer.
 *
 * Two tiers:
 *  - With ANTHROPIC_API_KEY set (Vercel env / .env.local): real Claude, grounded
 *    in the live marketplace events passed in.
 *  - Without a key: a deterministic "smart" fallback that parses intent
 *    (category / budget / date) and answers from the same events, so the
 *    feature works end-to-end before a key is configured.
 *
 * Responses always carry `source: "claude" | "smart"` so the UI can label them.
 */

export type AiMode = "concierge" | "event-qa" | "listing-writer" | "translate" | "digest";

export type AiChatTurn = { role: "user" | "assistant"; text: string };

export type AiRequestBody = {
  mode: AiMode;
  message?: string;
  history?: AiChatTurn[];
  locale?: "en" | "ar";
  eventId?: string;
  // listing-writer / translate inputs
  bullets?: string;
  text?: string;
  targetLang?: "en" | "ar";
  // digest input (pre-computed server-side stats)
  stats?: Record<string, unknown>;
};

export type AiResult = {
  reply: string;
  eventIds: string[];
  source: "claude" | "smart";
};

const MODEL = "claude-opus-4-8";

export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

/** Compact grounding snapshot of an event for the model / fallback engine. */
export function compactEvent(event: MarketplaceEvent) {
  return {
    id: event.id,
    title: event.title,
    titleAr: event.titleAr,
    category: event.categorySlug ?? event.category,
    startsAt: event.startsAt,
    venue: event.venueName ?? event.locationText,
    organizer: event.organizerName,
    // Prices are stored as BHD x100.
    minPriceBhd: event.minPrice != null ? event.minPrice / 100 : null,
    hasTickets: event.hasTickets,
    description: (event.shortDescription ?? "").slice(0, 220),
  };
}

// ---------------------------------------------------------------------------
// Claude tier
// ---------------------------------------------------------------------------

const CONCIERGE_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "The concierge answer to show the user, in their language.",
    },
    eventIds: {
      type: "array",
      items: { type: "string" },
      description: "IDs of recommended events from the provided list only. Empty if none apply.",
    },
  },
  required: ["reply", "eventIds"],
  additionalProperties: false,
} as const;

function conciergeSystem(eventsJson: string, locale: "en" | "ar") {
  return [
    "You are the Events Hub concierge for Bahrain — a warm, concise local guide for events, dining, and things to do.",
    "You may ONLY recommend events from the JSON list below. Never invent events, prices, dates, or venues.",
    "Prices are in BHD. Dates are ISO 8601 (Bahrain time, UTC+3).",
    `Default reply language: ${locale === "ar" ? "Arabic" : "English"} — but always mirror the language the user writes in.`,
    "Keep replies short (2-4 sentences). When you recommend events, mention why they fit, and return their IDs in eventIds.",
    "If nothing fits, say so honestly and suggest the closest alternative from the list.",
    "",
    "EVENTS:",
    eventsJson,
  ].join("\n");
}

async function claudeStructured(
  client: Anthropic,
  system: string,
  history: AiChatTurn[],
  message: string
): Promise<AiResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    output_config: { format: { type: "json_schema", schema: CONCIERGE_SCHEMA } },
    messages: [
      ...history.slice(-8).map((turn) => ({
        role: turn.role,
        content: turn.text,
      })),
      { role: "user" as const, content: message },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
  const parsed = JSON.parse(raw) as { reply?: string; eventIds?: string[] };
  return {
    reply: parsed.reply ?? "",
    eventIds: Array.isArray(parsed.eventIds) ? parsed.eventIds : [],
    source: "claude",
  };
}

async function claudeText(client: Anthropic, system: string, message: string): Promise<AiResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: message }],
  });
  const reply = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
  return { reply, eventIds: [], source: "claude" };
}

// ---------------------------------------------------------------------------
// Smart fallback tier (no API key required)
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  concerts: ["concert", "music", "gig", "band", "dj", "festival", "حفلة", "موسيقى", "مهرجان"],
  comedy: ["comedy", "standup", "stand-up", "laugh", "كوميديا", "ضحك"],
  theatre: ["theatre", "theater", "play", "drama", "مسرح"],
  sports: ["sport", "match", "race", "run", "football", "رياضة", "مباراة"],
  nightlife: ["night", "club", "party", "سهرة", "حفل"],
  dining: ["dining", "dinner", "food", "brunch", "restaurant", "عشاء", "طعام", "مطعم", "برانش"],
  family: ["family", "kids", "children", "عائلة", "أطفال", "اطفال"],
  exhibitions: ["exhibition", "expo", "art", "gallery", "معرض", "فن"],
  workshops: ["workshop", "class", "course", "ورشة", "دورة"],
  attractions: ["attraction", "park", "fun", "ملاهي", "ترفيه"],
};

function parseBudgetBhd(message: string): number | null {
  const match = message.match(/(?:under|below|less than|max|budget|أقل من|تحت)\s*(?:bhd\s*)?(\d+(?:\.\d+)?)/i);
  if (match) return Number(match[1]);
  const bare = message.match(/(\d+(?:\.\d+)?)\s*(?:bhd|bd|دينار)/i);
  return bare ? Number(bare[1]) : null;
}

function parseDateWindow(message: string): { from: Date; to: Date } | null {
  const now = new Date();
  const lower = message.toLowerCase();
  const endOfDay = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59, 999); return e; };

  if (/(tonight|today|اليوم|الليلة)/.test(lower)) {
    return { from: now, to: endOfDay(now) };
  }
  if (/(tomorrow|غدا|بكرة|باچر)/.test(lower)) {
    const t = new Date(now); t.setDate(now.getDate() + 1); t.setHours(0, 0, 0, 0);
    return { from: t, to: endOfDay(t) };
  }
  if (/(weekend|نهاية الأسبوع|الويكند)/.test(lower)) {
    const day = now.getDay();
    const friday = new Date(now);
    friday.setDate(now.getDate() + ((5 - day + 7) % 7));
    friday.setHours(0, 0, 0, 0);
    const saturday = new Date(friday); saturday.setDate(friday.getDate() + 1);
    return { from: friday < now ? now : friday, to: endOfDay(saturday) };
  }
  if (/(this week|هذا الأسبوع)/.test(lower)) {
    const to = new Date(now); to.setDate(now.getDate() + 7);
    return { from: now, to };
  }
  return null;
}

function isArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}

export function smartConcierge(
  message: string,
  events: ReturnType<typeof compactEvent>[],
  locale: "en" | "ar"
): AiResult {
  const lower = message.toLowerCase();
  const ar = locale === "ar" || isArabic(message);

  const wantedCategories = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, words]) => words.some((word) => lower.includes(word)))
    .map(([slug]) => slug);
  const budget = parseBudgetBhd(lower);
  const window = parseDateWindow(message);

  let matches = events.filter((event) => {
    if (wantedCategories.length) {
      const slugMatch = wantedCategories.includes(String(event.category ?? ""));
      // Events without a category (or with a different slug) can still match by
      // their own text — "music festival" should find "Summer Beats Festival".
      const haystack = `${event.title} ${event.titleAr ?? ""} ${event.description}`.toLowerCase();
      const textMatch = wantedCategories.some((slug) =>
        CATEGORY_KEYWORDS[slug].some((word) => haystack.includes(word))
      );
      if (!slugMatch && !textMatch) return false;
    }
    if (budget != null && event.minPriceBhd != null && event.minPriceBhd > budget) return false;
    if (window) {
      const starts = new Date(event.startsAt);
      if (starts < window.from || starts > window.to) return false;
    }
    return true;
  });

  // No filters parsed at all → treat as "what's on": next 3 upcoming.
  const parsedAnything = wantedCategories.length > 0 || budget != null || window != null;
  if (!parsedAnything) {
    matches = events;
  }

  matches = matches
    .slice()
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3);

  if (matches.length === 0) {
    return {
      reply: ar
        ? "ما لقيت فعالية تطابق طلبك حالياً — جرّب توسّع البحث (فئة أو ميزانية أو تاريخ مختلف) وبساعدك."
        : "I couldn't find an event matching that right now — try widening the category, budget, or date and I'll take another look.",
      eventIds: [],
      source: "smart",
    };
  }

  const names = matches.map((event) => (ar && event.titleAr ? event.titleAr : event.title));
  const listText = names.length > 1 ? `${names.slice(0, -1).join("، ")} ${ar ? "و" : "and "}${names.at(-1)}` : names[0];
  const qualifiers: string[] = [];
  if (wantedCategories.length) qualifiers.push(ar ? "حسب الفئة المطلوبة" : "matching that category");
  if (budget != null) qualifiers.push(ar ? `ضمن ميزانية ${budget} دينار` : `within BHD ${budget}`);
  if (window) qualifiers.push(ar ? "بالتوقيت المطلوب" : "in that time window");

  const reply = ar
    ? `أنصحك بـ ${listText}${qualifiers.length ? " (" + qualifiers.join("، ") + ")" : ""}. التفاصيل والحجز بالبطاقات تحت 👇`
    : `I'd go for ${listText}${qualifiers.length ? " (" + qualifiers.join(", ") + ")" : ""}. Details and booking are on the cards below 👇`;

  return { reply, eventIds: matches.map((event) => event.id), source: "smart" };
}

export function smartEventQa(
  message: string,
  event: ReturnType<typeof compactEvent>,
  locale: "en" | "ar"
): AiResult {
  const ar = locale === "ar" || isArabic(message);
  const lower = message.toLowerCase();
  const starts = new Date(event.startsAt);
  const when = starts.toLocaleString(ar ? "ar-BH" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
  });

  const parts: string[] = [];
  if (/(when|time|date|متى|وقت|الساعة)/.test(lower)) {
    parts.push(ar ? `يبدأ ${when}.` : `It starts ${when}.`);
  }
  if (/(where|venue|location|وين|أين|مكان|موقع)/.test(lower)) {
    parts.push(
      event.venue
        ? ar ? `المكان: ${event.venue}.` : `It's at ${event.venue}.`
        : ar ? "الموقع بينشر قريباً من المنظم." : "The venue will be announced by the organiser."
    );
  }
  if (/(price|cost|ticket|how much|كم|سعر|تذكرة|تذاكر)/.test(lower)) {
    parts.push(
      event.minPriceBhd != null
        ? ar ? `التذاكر تبدأ من ${event.minPriceBhd.toFixed(3)} دينار.` : `Tickets start from BHD ${event.minPriceBhd.toFixed(3)}.`
        : ar ? "الدخول مجاني أو بالتسجيل." : "Entry is free or registration-based."
    );
  }
  if (parts.length === 0) {
    parts.push(
      ar
        ? `${event.titleAr ?? event.title}: ${event.description || "فعالية من " + event.organizer}. يبدأ ${when}${event.venue ? " في " + event.venue : ""}.`
        : `${event.title}: ${event.description || "an event by " + event.organizer}. Starts ${when}${event.venue ? " at " + event.venue : ""}.`
    );
  }
  return { reply: parts.join(" "), eventIds: [event.id], source: "smart" };
}

function smartListingWriter(bullets: string): AiResult {
  const lines = bullets.split(/\n|[;•]/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0] ?? "Your event";
  const title = first.length > 60 ? first.slice(0, 57) + "…" : first;
  const description = [
    `${first}.`,
    ...lines.slice(1).map((line) => (line.endsWith(".") ? line : line + ".")),
    "Book your spot on Events Hub — limited availability.",
  ].join(" ");
  const reply = JSON.stringify(
    {
      title,
      shortDescription: description.slice(0, 180),
      description,
      titleAr: "",
      shortDescriptionAr: "",
      note: "Template draft (add ANTHROPIC_API_KEY for full AI writing + Arabic).",
    },
    null,
    2
  );
  return { reply, eventIds: [], source: "smart" };
}

function smartDigest(stats: Record<string, unknown>, locale: "en" | "ar"): AiResult {
  const ar = locale === "ar";
  const s = stats as {
    totalOrders?: number; totalRevenueBhd?: number; totalGuests?: number;
    checkIns?: number; topEvent?: string; upcomingEvents?: number;
  };
  const reply = ar
    ? `هذا الأسبوع: ${s.totalOrders ?? 0} طلب بإيراد ${(s.totalRevenueBhd ?? 0).toFixed(3)} دينار، ${s.totalGuests ?? 0} ضيف مسجل و${s.checkIns ?? 0} تسجيل دخول.${s.topEvent ? ` الأكثر مبيعاً: ${s.topEvent}.` : ""} عندك ${s.upcomingEvents ?? 0} فعالية قادمة.`
    : `This week: ${s.totalOrders ?? 0} orders totalling BHD ${(s.totalRevenueBhd ?? 0).toFixed(3)}, ${s.totalGuests ?? 0} registered guests and ${s.checkIns ?? 0} check-ins.${s.topEvent ? ` Top seller: ${s.topEvent}.` : ""} You have ${s.upcomingEvents ?? 0} upcoming events.`;
  return { reply, eventIds: [], source: "smart" };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function runAi(
  body: AiRequestBody,
  events: MarketplaceEvent[]
): Promise<AiResult> {
  const locale = body.locale === "ar" ? "ar" : "en";
  const compact = events.map(compactEvent);
  const client = getAnthropic();

  switch (body.mode) {
    case "concierge": {
      const message = (body.message ?? "").trim();
      if (!message) return { reply: "", eventIds: [], source: "smart" };
      if (client) {
        try {
          return await claudeStructured(
            client,
            conciergeSystem(JSON.stringify(compact), locale),
            body.history ?? [],
            message
          );
        } catch {
          // fall through to smart tier on any API failure
        }
      }
      return smartConcierge(message, compact, locale);
    }

    case "event-qa": {
      const message = (body.message ?? "").trim();
      const event = compact.find((item) => item.id === body.eventId);
      if (!event) return { reply: locale === "ar" ? "الفعالية غير متوفرة." : "That event isn't available.", eventIds: [], source: "smart" };
      if (client) {
        try {
          return await claudeStructured(
            client,
            conciergeSystem(JSON.stringify([event]), locale) +
              "\nThe user is asking about this specific event. Answer only from its data.",
            body.history ?? [],
            message
          );
        } catch { /* fall through */ }
      }
      return smartEventQa(message, event, locale);
    }

    case "listing-writer": {
      const bullets = (body.bullets ?? body.message ?? "").trim();
      if (!bullets) return { reply: "", eventIds: [], source: "smart" };
      if (client) {
        try {
          return await claudeText(
            client,
            "You write event listings for Events Hub Bahrain. From the organiser's bullet points, produce STRICT JSON with keys: title, shortDescription (<=180 chars), description (2-3 paragraphs, warm, factual), titleAr, shortDescriptionAr, descriptionAr (natural Arabic, not literal). No markdown, JSON only.",
            bullets
          );
        } catch { /* fall through */ }
      }
      return smartListingWriter(bullets);
    }

    case "translate": {
      const text = (body.text ?? body.message ?? "").trim();
      if (!text) return { reply: "", eventIds: [], source: "smart" };
      const target = body.targetLang === "en" ? "English" : "Arabic";
      if (client) {
        try {
          return await claudeText(
            client,
            `Translate event marketing copy to natural, fluent ${target} for a Bahrain audience. Keep names, prices and times unchanged. Return only the translation.`,
            text
          );
        } catch { /* fall through */ }
      }
      return {
        reply: locale === "ar"
          ? "الترجمة الذكية تتطلب تفعيل مفتاح ANTHROPIC_API_KEY."
          : "AI translation needs ANTHROPIC_API_KEY configured. (Text kept unchanged.)\n\n" + text,
        eventIds: [],
        source: "smart",
      };
    }

    case "digest": {
      const stats = body.stats ?? {};
      if (client) {
        try {
          return await claudeText(
            client,
            `You are a business analyst for an event organiser in Bahrain. Write a short (3-4 sentence) plain-language weekly summary from the JSON stats, in ${locale === "ar" ? "Arabic" : "English"}. Mention totals, the standout number, and one actionable suggestion. No markdown headers.`,
            JSON.stringify(stats)
          );
        } catch { /* fall through */ }
      }
      return smartDigest(stats, locale);
    }
  }
}
