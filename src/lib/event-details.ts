import { z } from "zod";

const arabicLetters = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3]/;
const requiredText = (label: string, language: "en" | "ar", max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`)
    .refine((value) => (language === "ar" ? arabicLetters : /[A-Za-z]/).test(value),
      `Please enter ${label} in ${language === "ar" ? "Arabic" : "English"}`);

/** Used by both the dashboard and the server; dates and operational settings are language-independent. */
export const bilingualEventDetailsSchema = z.object({
  title: requiredText("the English event name", "en", 255),
  shortDescription: requiredText("the English short summary", "en", 500),
  description: requiredText("the English full description", "en", 20000),
  titleAr: requiredText("اسم الفعالية بالعربية", "ar", 255),
  shortDescriptionAr: requiredText("الملخص بالعربية", "ar", 500),
  descriptionAr: requiredText("الوصف الكامل بالعربية", "ar", 20000),
});

export type BilingualEventDetails = z.infer<typeof bilingualEventDetailsSchema>;
export type EventDetailKey = keyof BilingualEventDetails;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arabicValue(value: unknown) {
  const ar = record(value).ar;
  return typeof ar === "string" ? ar : "";
}

export function readBilingualEventDetails(event: {
  title: string; description?: string | null; shortDescription?: string | null; settings?: unknown;
}): BilingualEventDetails {
  const localized = record(record(event.settings).localized);
  return {
    title: event.title,
    shortDescription: event.shortDescription ?? "",
    description: event.description ?? "",
    titleAr: arabicValue(localized.title),
    shortDescriptionAr: arabicValue(localized.shortDescription),
    descriptionAr: arabicValue(localized.description),
  };
}

export function withBilingualEventDetails(details: BilingualEventDetails, settings?: unknown) {
  const existing = record(settings);
  return {
    ...existing,
    localized: {
      ...record(existing.localized),
      title: { en: details.title, ar: details.titleAr },
      shortDescription: { en: details.shortDescription, ar: details.shortDescriptionAr },
      description: { en: details.description, ar: details.descriptionAr },
    },
  };
}
