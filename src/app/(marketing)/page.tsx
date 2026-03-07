import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Ticket,
  CheckCircle,
  ArrowRight,
  QrCode,
  Smartphone,
  BarChart3,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-mesh border-b border-border px-4 py-32 relative overflow-hidden">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Trusted by 4,000+ event organizers worldwide
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            Event Check-In, Ticketing &{" "}
            <span className="text-primary text-glow drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">Guest Management</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The all-in-one platform for guest check-in, ticket scanning, CRM,
            and online ticketing. Manage events of any size with real-time sync
            across unlimited devices.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button asChild size="lg" className="gap-2 shadow-[0_4px_20px_0_rgba(99,102,241,0.5)] hover:shadow-[0_6px_25px_0_rgba(99,102,241,0.7)] transition-all duration-300">
              <Link href="/signup">
                Sign Up Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            First 50 check-ins free. No credit card required.
          </p>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-center text-4xl font-bold text-glow dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          Three powerful products, one platform
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xl text-muted-foreground">
          Everything you need to manage events from planning to day-of execution.
        </p>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <ProductCard
            href="/event-check-in-app"
            icon={CheckCircle}
            title="Event Check-In App"
            description="Real-time guest check-in across unlimited devices. Instant name search, QR scanning, and offline mode."
            features={[
              "Instant name search",
              "Multi-device real-time sync",
              "Offline check-in mode",
              "QR/barcode scanning",
            ]}
          />
          <ProductCard
            href="/ticket-studio"
            icon={Ticket}
            title="Ticket Studio"
            description="Design branded tickets, generate unique barcodes, and distribute via email. Scan at the door with any device."
            features={[
              "Visual ticket designer",
              "PDF & Apple Wallet",
              "Email distribution",
              "Duplicate detection",
            ]}
          />
          <ProductCard
            href="/registration-ticketing"
            icon={Globe}
            title="Registration & Ticketing"
            description="Create public event pages, sell tickets online, and manage RSVPs with secure payment processing."
            features={[
              "Online event pages",
              "Stripe payments",
              "RSVP management",
              "Waitlist support",
            ]}
          />
        </div>
      </section>

      {/* Feature Tour */}
      <section className="border-t border-border bg-black/5 dark:bg-black/40 px-4 py-32 relative z-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h2 className="text-center text-4xl font-bold text-glow dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            Built for events of any size
          </h2>
          <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: CalendarDays,
                title: "Event Management",
                description:
                  "Single, recurring, multi-day, and conference events with full customization.",
              },
              {
                icon: Users,
                title: "Guest CRM",
                description:
                  "Centralized contact database with attendance history, tags, and segmentation.",
              },
              {
                icon: QrCode,
                title: "Barcode Scanning",
                description:
                  "QR, PDF417, and Code128 support. Turn any phone into a ticket scanner.",
              },
              {
                icon: Smartphone,
                title: "Works Everywhere",
                description:
                  "No app to install. Works on any phone, tablet, or laptop with a browser.",
              },
              {
                icon: BarChart3,
                title: "Reports & Analytics",
                description:
                  "Real-time attendance dashboards, check-in timelines, and revenue reports.",
              },
              {
                icon: Globe,
                title: "Online Registration",
                description:
                  "Public event pages with ticket sales, RSVPs, and waitlist management.",
              },
              {
                icon: Ticket,
                title: "Ticket Design",
                description:
                  "Visual editor for branded PDF tickets with unique barcodes per attendee.",
              },
              {
                icon: CheckCircle,
                title: "Walk-Up Registration",
                description:
                  "Add unexpected guests on the spot during check-in with instant list updates.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="glass-panel glass-panel-hover p-6 rounded-2xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-32 relative z-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "10M+", label: "Guests Managed" },
              { value: "1.5M+", label: "Tickets Scanned" },
              { value: "4,000+", label: "Active Clients" },
              { value: "25,000+", label: "Events Hosted" },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel p-8 rounded-2xl">
                <p className="text-5xl font-bold text-primary text-glow drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">{stat.value}</p>
                <p className="mt-4 text-sm text-foreground/80 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-mesh border-t border-border px-4 py-40 relative overflow-hidden">
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <h2 className="text-5xl font-bold text-glow dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Ready to get started?</h2>
          <p className="mt-6 text-xl text-muted-foreground">
            Try GuestManager free. The first 50 check-ins are on us.
          </p>
          <div className="mt-12 flex justify-center gap-4">
            <Button asChild size="lg" className="gap-2 shadow-[0_4px_20px_0_rgba(99,102,241,0.5)] hover:shadow-[0_6px_25px_0_rgba(99,102,241,0.7)] transition-all duration-300 transform hover:-translate-y-1">
              <Link href="/signup">
                Sign Up Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/20 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5 transition-all duration-300 dark:text-white"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({
  href,
  icon: Icon,
  title,
  description,
  features,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="glass-panel glass-panel-hover group p-8 rounded-2xl flex flex-col h-full">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-primary/20 group-hover:scale-110 transition-transform duration-500">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground mb-8 flex-grow leading-relaxed">{description}</p>
      <ul className="space-y-4 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-foreground/80">
            <CheckCircle className="h-4 w-4 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-all duration-300 group-hover:translate-x-1"
      >
        Learn more <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
