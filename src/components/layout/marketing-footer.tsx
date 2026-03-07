import Link from "next/link";

const footerLinks = {
  Products: [
    { name: "Event Check-In App", href: "/event-check-in-app" },
    { name: "Ticket Studio", href: "/ticket-studio" },
    { name: "Registration & Ticketing", href: "/registration-ticketing" },
  ],
  Resources: [
    { name: "Pricing", href: "/pricing" },
    { name: "Contact Sales", href: "/contact" },
    { name: "API Documentation", href: "#" },
    { name: "Help Center", href: "#" },
  ],
  Company: [
    { name: "About Us", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-xl relative z-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white">
              <span className="text-primary text-glow drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Guest</span>Manager
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
            &copy; {new Date().getFullYear()} GuestManager. All rights reserved.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link
              href="#"
              className="text-sm text-white/70 hover:text-white"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-sm text-white/70 hover:text-white"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-sm text-white/70 hover:text-white"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
