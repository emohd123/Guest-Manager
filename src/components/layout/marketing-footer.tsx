"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

const footerLinks = {
  Marketplace: [
    { name: "Browse Events", href: "/" },
    { name: "My Tickets", href: "/account" },
    { name: "Buyer Login", href: "/account/login" },
    { name: "Our Services", href: "/events" },
  ],
  Services: [
    { name: "Corporate Events", href: "/contact?service=corporate" },
    { name: "Exhibitions", href: "/contact?service=exhibitions" },
    { name: "Ticketing Services", href: "/contact?service=ticketing-services" },
    { name: "Staffing", href: "/contact?service=staffing" },
  ],
  Company: [
    { name: "About iTicket", href: "/" },
    { name: "OneStone Network", href: "https://onestoneads.com/" },
    { name: "Contact Us", href: "/contact" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Cookie Policy", href: "/privacy-policy#cookies" },
  ],
};

export function MarketingFooter() {
  const ar = useSearchParams().get("locale") === "ar";
  const translations: Record<string, string> = {
    Marketplace: "الفعاليات والتذاكر", Services: "الخدمات", Company: "الشركة", Legal: "المعلومات القانونية",
    "Browse Events": "تصفح الفعاليات", "My Tickets": "تذاكري", "Buyer Login": "تسجيل دخول العملاء", "Our Services": "خدماتنا",
    "Corporate Events": "فعاليات الشركات", Exhibitions: "المعارض", "Ticketing Services": "خدمات التذاكر", Staffing: "توفير طواقم العمل",
    "About iTicket": "عن iTicket", "OneStone Network": "شبكة ون ستون", "Contact Us": "تواصل معنا",
    "Privacy Policy": "سياسة الخصوصية", "Terms of Service": "الشروط والأحكام", "Refund Policy": "سياسة الاسترداد", "Cookie Policy": "سياسة ملفات تعريف الارتباط",
  };
  const href = (path: string) => {
    if (!path.startsWith("/")) return path;
    const url = new URL(path, "https://www.iticket.info");
    url.searchParams.set("locale", ar ? "ar" : "en");
    return `${url.pathname}${url.search}${url.hash}`;
  };
  return (
    <footer className="relative z-20 border-t border-slate-200 bg-white text-slate-900 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-none px-4 py-16 sm:px-8 lg:px-12 2xl:px-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div dir="ltr" className="lg:col-span-2">
            <Link href={href("/")} aria-label={ar ? "الرئيسية" : "iTicket home"}>
              <BrandWordmark
                className="gap-3.5"
                markClassName="h-16 w-16 sm:h-18 sm:w-18"
                textClassName="text-[2.1rem] text-slate-950 dark:text-white sm:text-[2.6rem]"
              />
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {ar ? "اكتشف فعاليات البحرين واحجز التذاكر واستفد من خدمات تسجيل الدخول وإدارة الفعاليات. يقدمها فريق iTicket للفعاليات العامة وفعاليات الشركات." : "Bahrain event discovery, ticketing, check-in, and managed event operations. Built by the iTicket team for public and corporate experiences."}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">{ar ? translations[category] : category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={href(link.href)}
                      className="text-sm text-slate-600 transition-colors hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
                    >
                      {ar ? translations[link.name] : link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200 pt-8 dark:border-slate-800 md:flex-row">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            &copy; {new Date().getFullYear()} iTicket. {ar ? "جميع الحقوق محفوظة. بدعم من" : "All rights reserved. Powered by"}{" "}
            <a
              href="https://onestoneads.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300"
            >
              OneStone Ads
            </a>.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link
              href={href("/contact")}
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              {ar ? "الدعم" : "Support"}
            </Link>
            <Link
              href={href("/privacy-policy")}
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              {ar ? "الخصوصية" : "Privacy"}
            </Link>
            <Link
              href={href("/terms-of-service")}
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              {ar ? "الشروط" : "Terms"}
            </Link>
            <Link
              href={href("/refund-policy")}
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              {ar ? "الاسترداد" : "Refunds"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

