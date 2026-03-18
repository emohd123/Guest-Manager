import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

const footerLinks = {
  Products: [
    { name: "Event Check-In App", href: "/event-check-in-app" },
    { name: "Ticket Studio", href: "/ticket-studio" },
    { name: "Registration & Ticketing", href: "/registration-ticketing" },
  ],
  Resources: [
    { name: "Pricing", href: "/pricing" },
    { name: "Contact Sales", href: "/contact" },
    { name: "Support", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy-policy" },
  ],
  Company: [
    { name: "About Events Hub", href: "/" },
    { name: "Event Check-In App", href: "/event-check-in-app" },
    { name: "Registration & Ticketing", href: "/registration-ticketing" },
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
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" aria-label="Events Hub home">
              <BrandWordmark
                className="gap-3"
                markClassName="h-14 w-14"
                textClassName="text-[2.2rem] text-white"
              />
            </Link>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              The all-in-one platform for event check-in, ticketing, and guest
              management.
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
            &copy; {new Date().getFullYear()} Events Hub. All rights reserved.
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
