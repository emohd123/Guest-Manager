import Link from "next/link";
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
    { name: "Cookie Policy", href: "/privacy-policy#cookies" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="relative z-20 border-t border-slate-200 bg-white text-slate-900 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-none px-4 py-16 sm:px-8 lg:px-12 2xl:px-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div dir="ltr" className="lg:col-span-2">
            <Link href="/" aria-label="iTicket home">
              <BrandWordmark
                className="gap-3.5"
                markClassName="h-16 w-16 sm:h-18 sm:w-18"
                textClassName="text-[2.1rem] text-slate-950 dark:text-white sm:text-[2.6rem]"
              />
            </Link>
            <a
              href="https://onestoneads.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 transition-colors hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300"
            >
              A OneStone Platform
            </a>
            <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Bahrain event discovery, ticketing, check-in, and managed event operations.
              Built by the iTicket team for public and corporate experiences.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200 pt-8 dark:border-slate-800 md:flex-row">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            &copy; {new Date().getFullYear()} iTicket. All rights reserved. Powered by{" "}
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
              href="/contact"
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              Support
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
