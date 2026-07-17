import type { DiscoverEvent } from "../types";
import type { AppLang } from "./eventExtras";

// Lightweight EN/AR strings for the public Discover experience. The API
// already ships *_Ar fields for event content; this covers the chrome.

const STRINGS = {
  discoverTitle: { en: "Discover events", ar: "اكتشف الفعاليات" },
  allEventsTitle: { en: "All events", ar: "كل الفعاليات" },
  savedEventsTitle: { en: "Saved events", ar: "الفعاليات المحفوظة" },
  searchPlaceholder: { en: "Search events, venues, artists…", ar: "ابحث عن فعاليات وأماكن وفنانين…" },
  kicker: { en: "Bahrain · Tonight", ar: "البحرين · الليلة" },
  featured: { en: "Featured", ar: "مميز" },
  happeningSoon: { en: "Happening soon", ar: "تبدأ قريباً" },
  forYou: { en: "For you", ar: "مختارة لك" },
  moreEvents: { en: "More events", ar: "المزيد من الفعاليات" },
  allEvents: { en: "All events", ar: "كل الفعاليات" },
  savedCount: { en: "Saved", ar: "المحفوظة" },
  seeAll: { en: "See all", ar: "عرض الكل" },
  back: { en: "Back", ar: "رجوع" },
  buyTicket: { en: "Buy Ticket", ar: "اشترِ تذكرة" },
  buyTickets: { en: "Buy tickets", ar: "اشترِ التذاكر" },
  openEvent: { en: "Open", ar: "افتح" },
  details: { en: "Details", ar: "التفاصيل" },
  tickets: { en: "Tickets", ar: "التذاكر" },
  noTickets: { en: "No tickets are available for this event yet.", ar: "لا توجد تذاكر متاحة لهذه الفعالية بعد." },
  total: { en: "Total", ar: "المجموع" },
  ticketOne: { en: "ticket", ar: "تذكرة" },
  ticketMany: { en: "tickets", ar: "تذاكر" },
  checkout: { en: "Checkout", ar: "الدفع" },
  reserveTickets: { en: "Reserve tickets", ar: "احجز التذاكر" },
  fullName: { en: "Full name", ar: "الاسم الكامل" },
  emailAddress: { en: "Email address", ar: "البريد الإلكتروني" },
  remindMe: { en: "Remind me", ar: "ذكّرني" },
  reminding: { en: "Reminding", ar: "التذكير مفعّل" },
  calendar: { en: "Calendar", ar: "التقويم" },
  share: { en: "Share", ar: "مشاركة" },
  save: { en: "Save", ar: "حفظ" },
  savedLabel: { en: "Saved", ar: "محفوظ" },
  directions: { en: "Directions", ar: "الاتجاهات" },
  loading: { en: "Loading public events…", ar: "جارٍ تحميل الفعاليات…" },
  noEventsTitle: { en: "No events found", ar: "لا توجد فعاليات" },
  noEventsBody: {
    en: "Try another category or search — new public events appear here automatically.",
    ar: "جرّب فئة أو بحثاً آخر — تظهر الفعاليات الجديدة هنا تلقائياً.",
  },
  noSavedTitle: { en: "No saved events yet", ar: "لا توجد فعاليات محفوظة" },
  noSavedBody: {
    en: "Tap the heart on any event to keep it here for quick access.",
    ar: "اضغط على القلب في أي فعالية لحفظها هنا.",
  },
  thatsEverything: { en: "That's everything for now", ar: "هذا كل شيء حالياً" },
  newEventOne: { en: "1 new event since your last visit", ar: "فعالية جديدة منذ زيارتك الأخيرة" },
  newEventMany: { en: "new events since your last visit", ar: "فعاليات جديدة منذ زيارتك الأخيرة" },
  tabDiscover: { en: "Discover", ar: "استكشف" },
  tabTickets: { en: "Tickets", ar: "التذاكر" },
  tabSaved: { en: "Saved", ar: "المحفوظة" },
  tabAccount: { en: "Account", ar: "الحساب" },
  reminderPickerTitle: { en: "Remind me before the event", ar: "ذكّرني قبل الفعالية" },
  reminderPickerBody: { en: "When should we notify you?", ar: "متى تريد أن نذكّرك؟" },
  tapToCycle: { en: "Tap card to shuffle", ar: "اضغط للتبديل" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: AppLang, key: StringKey): string {
  return STRINGS[key][lang];
}

const CATEGORY_AR: Record<string, string> = {
  All: "الكل",
  Concerts: "حفلات",
  Dining: "مطاعم",
  Family: "عائلة",
  Comedy: "كوميديا",
  Attractions: "معالم",
};

export function categoryLabel(lang: AppLang, category: string): string {
  return lang === "ar" ? (CATEGORY_AR[category] ?? category) : category;
}

// Event content helpers — prefer the Arabic fields when present.
export function eventTitle(event: DiscoverEvent, lang: AppLang): string {
  return lang === "ar" && event.titleAr ? event.titleAr : event.title;
}

export function eventDescription(event: DiscoverEvent, lang: AppLang): string | null {
  return lang === "ar" && event.shortDescriptionAr ? event.shortDescriptionAr : event.shortDescription;
}

export function eventVenue(event: DiscoverEvent, lang: AppLang): string | null {
  if (lang === "ar") {
    return (
      event.venueNameAr ?? event.locationTextAr ?? event.venueName ?? event.locationText ??
      event.organizerNameAr ?? event.organizerName ?? event.companyName
    );
  }
  return event.venueName ?? event.locationText ?? event.organizerName ?? event.companyName;
}

export function eventHost(event: DiscoverEvent, lang: AppLang): string {
  if (lang === "ar") return event.organizerNameAr ?? event.organizerName ?? event.companyName;
  return event.organizerName ?? event.companyName;
}
