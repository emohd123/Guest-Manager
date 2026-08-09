export type LocaleCode = "en" | "ar";

export const marketplaceLocales = {
  en: {
    dir: "ltr",
    label: "English",
    city: "Cairo",
  },
  ar: {
    dir: "rtl",
    label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    city: "\u0627\u0644\u0628\u062d\u0631\u064a\u0646",
  },
} as const;

export const eventCategories = [
  { slug: "concerts", label: "Concerts", labelAr: "\u062d\u0641\u0644\u0627\u062a \u0645\u0648\u0633\u064a\u0642\u064a\u0629", kind: "public" },
  { slug: "comedy", label: "Comedy", labelAr: "\u0643\u0648\u0645\u064a\u062f\u064a\u0627", kind: "public" },
  { slug: "theatre", label: "Theatre", labelAr: "\u0645\u0633\u0631\u062d", kind: "public" },
  { slug: "sports", label: "Sports", labelAr: "\u0631\u064a\u0627\u0636\u0629", kind: "public" },
  { slug: "nightlife", label: "Nightlife", labelAr: "\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0644\u064a\u0644\u064a\u0629", kind: "public" },
  { slug: "dining", label: "Dining", labelAr: "\u0645\u0637\u0627\u0639\u0645 \u0648\u062a\u062c\u0627\u0631\u0628", kind: "public" },
  { slug: "family", label: "Family", labelAr: "\u0639\u0627\u0626\u0644\u064a", kind: "public" },
  { slug: "exhibitions", label: "Exhibitions", labelAr: "\u0645\u0639\u0627\u0631\u0636", kind: "hybrid" },
  { slug: "workshops", label: "Workshops", labelAr: "\u0648\u0631\u0634 \u0639\u0645\u0644", kind: "public" },
  { slug: "attractions", label: "Attractions", labelAr: "\u0648\u062c\u0647\u0627\u062a \u0648\u062a\u062c\u0627\u0631\u0628", kind: "public" },
  { slug: "conferences", label: "Conferences", labelAr: "\u0645\u0624\u062a\u0645\u0631\u0627\u062a", kind: "service" },
  { slug: "corporate", label: "Corporate Events", labelAr: "\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0634\u0631\u0643\u0627\u062a", kind: "service" },
  { slug: "launches", label: "Launches", labelAr: "\u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a", kind: "service" },
  { slug: "private-events", label: "Private Events", labelAr: "\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u062e\u0627\u0635\u0629", kind: "service" },
  { slug: "staffing", label: "Staffing", labelAr: "\u0637\u0627\u0642\u0645 \u0648\u062a\u0646\u0638\u064a\u0645", kind: "service" },
  { slug: "ticketing-services", label: "Ticketing Services", labelAr: "\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u062a\u0630\u0627\u0643\u0631", kind: "service" },
] as const;

export function normalizeLocale(value: string | null | undefined): LocaleCode {
  return value === "ar" ? "ar" : "en";
}

export function formatMoney(
  amountInHundredths: number | null | undefined,
  currency = "EGP",
  locale: LocaleCode | string = "en"
) {
  if (amountInHundredths == null) return locale === "ar" ? "\u0642\u0631\u064a\u0628\u0627" : "Soon";
  if (amountInHundredths <= 0) return locale === "ar" ? "\u0645\u062c\u0627\u0646\u064a" : "Free";

  const normalizedCurrency = currency || "EGP";
  const formatterLocale = locale === "ar" ? "ar-BH" : "en-BH";
  const threeDecimalCurrencies = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);
  const fractionDigits = threeDecimalCurrencies.has(normalizedCurrency.toUpperCase()) ? 3 : 2;

  try {
    return new Intl.NumberFormat(formatterLocale, {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amountInHundredths / 100);
  } catch {
    return `${normalizedCurrency} ${(amountInHundredths / 100).toFixed(fractionDigits)}`;
  }
}

export function toStripeUnitAmount(amountInHundredths: number, currency = "EGP") {
  const normalizedCurrency = currency.toUpperCase();
  const threeDecimalCurrencies = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);
  const zeroDecimalCurrencies = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
  ]);

  if (zeroDecimalCurrencies.has(normalizedCurrency)) {
    return Math.round(amountInHundredths / 100);
  }

  if (threeDecimalCurrencies.has(normalizedCurrency)) {
    return Math.round(amountInHundredths * 10);
  }

  return Math.round(amountInHundredths);
}

export function fromStripeUnitAmount(stripeAmount: number, currency = "EGP") {
  const normalizedCurrency = currency.toUpperCase();
  const threeDecimalCurrencies = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);
  const zeroDecimalCurrencies = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
  ]);

  if (zeroDecimalCurrencies.has(normalizedCurrency)) {
    return Math.round(stripeAmount * 100);
  }

  if (threeDecimalCurrencies.has(normalizedCurrency)) {
    return Math.round(stripeAmount / 10);
  }

  return Math.round(stripeAmount);
}

export function getLocalizedText(
  source: unknown,
  locale: LocaleCode,
  fallback = ""
) {
  if (!source || typeof source !== "object") return fallback;
  const data = source as Record<string, unknown>;
  const localized = data[locale];
  if (typeof localized === "string" && localized.trim()) return localized;
  const english = data.en;
  if (typeof english === "string" && english.trim()) return english;
  return fallback;
}
