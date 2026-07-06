import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

const footerLinks = {
  Marketplace: [
    { name: "Browse Events", href: "/events" },
    { name: "My Tickets", href: "/account" },
    { name: "Buyer Login", href: "/account/login" },
  ],
  Services: [
    { name: "Corporate Events", href: "/contact?service=corporate" },
    { name: "Exhibitions", href: "/contact?service=exhibitions" },
    { name: "Ticketing Services", href: "/contact?service=ticketing-services" },
    { name: "Staffing", href: "/contact?service=staffing" },
  ],
  Company: [
    { name: "About Events Hub", href: "/" },
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
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-xl relative z-20">
      <div className="mx-auto max-w-none px-4 py-16 sm:px-8 lg:px-12 2xl:px-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Events Hub home">
              <BrandWordmark
                className="gap-3.5"
                markClassName="h-18 w-18"
                textClassName="text-[2.6rem] text-white"
                showSubtitle={true}
              />
            </Link>
            <p className="mt-6 text-sm text-white/70 leading-relaxed">
              Bahrain event discovery, ticketing, check-in, and managed event operations.
              Built by the Events Hub team for public and corporate experiences.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} Events Hub. All rights reserved. Powered by{" "}
            <a
              href="https://onestoneads.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              OneStone Ads
            </a>.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link
              href="/contact"
              className="text-sm text-white/70 hover:text-white"
            >
              Support
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-white/70 hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-white/70 hover:text-white"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
