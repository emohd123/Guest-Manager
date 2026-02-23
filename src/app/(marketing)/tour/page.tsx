import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Ticket,
  CheckCircle,
  Globe,
  BarChart3,
  Palette,
  Smartphone,
  ArrowRight,
  Zap,
  Mail,
  Settings,
} from "lucide-react";

const tourCategories = [
  {
    slug: "events",
    icon: CalendarDays,
    title: "Event Management",
    description:
      "Create and manage single, recurring, multi-day, and conference events with full customization.",
    features: [
      "Multi-format event types",
      "Session scheduling",
      "Venue management",
      "Capacity controls",
    ],
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    slug: "design",
    icon: Palette,
    title: "Ticket Design",
    description:
      "Visual ticket editor with branded PDF generation, QR codes, and Apple Wallet support.",
    features: [
      "Drag-and-drop editor",
      "Template library",
      "QR & barcode generation",
      "PDF & wallet output",
    ],
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    slug: "registration",
    icon: Globe,
    title: "Online Registration",
    description:
      "Public event pages with ticket sales, RSVPs, waitlists, and promo codes.",
    features: [
      "Custom event pages",
      "Stripe payments",
      "RSVP tracking",
      "Waitlist management",
    ],
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    slug: "marketing",
    icon: Mail,
    title: "Marketing & Email",
    description:
      "Email campaigns, automated reminders, and post-event follow-ups.",
    features: [
      "Email templates",
      "Campaign scheduling",
      "Open & click tracking",
      "Automation workflows",
    ],
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    slug: "on-site",
    icon: CheckCircle,
    title: "On-Site Check-In",
    description:
      "Real-time guest check-in with QR scanning, name search, and multi-device sync.",
    features: [
      "Instant name search",
      "Camera-based scanning",
      "Real-time sync",
      "Offline mode",
    ],
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    slug: "operations",
    icon: Settings,
    title: "Operations",
    description:
      "Guest CRM, contact management, lists, tags, and team permissions.",
    features: [
      "Contact database",
      "Tag & list management",
      "Team roles & access",
      "API access",
    ],
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-900/30",
  },
  {
    slug: "integrations",
    icon: Zap,
    title: "Integrations",
    description:
      "Connect with Stripe, Zapier, and more. REST API for custom integrations.",
    features: [
      "Stripe payments",
      "Webhook support",
      "REST API",
      "CSV import/export",
    ],
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    slug: "analytics",
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Real-time dashboards, attendance reports, revenue tracking, and data export.",
    features: [
      "Live dashboards",
      "Attendance reports",
      "Revenue analytics",
      "CSV & PDF export",
    ],
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
];

export default function TourPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Platform Tour
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you need for{" "}
            <span className="text-primary">event success</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Explore our complete suite of tools for event management, guest
            check-in, ticketing, and more. Click any category to dive deeper.
          </p>
        </div>
      </section>

      {/* Category Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tourCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tour/${cat.slug}`}
              className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className={`inline-flex rounded-lg p-3 ${cat.bg}`}>
                <cat.icon className={`h-6 w-6 ${cat.color}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{cat.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {cat.description}
              </p>
              <ul className="mt-4 space-y-1.5">
                {cat.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">See it in action</h2>
          <p className="mt-4 text-lg opacity-90">
            Ready to streamline your events? Start with 50 free check-ins.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
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
