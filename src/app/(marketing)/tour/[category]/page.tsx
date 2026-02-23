import { notFound } from "next/navigation";
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
  ScanLine,
  QrCode,
  FileText,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  Database,
  CreditCard,
  Upload,
  Download,
  Search,
  Filter,
  Tag,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

type TourCategory = {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  heroFeatures: string[];
  sections: {
    title: string;
    description: string;
    icon: LucideIcon;
    features: { title: string; description: string }[];
  }[];
};

const tourData: Record<string, TourCategory> = {
  events: {
    title: "Event Management",
    subtitle: "Create and manage events of any size and format",
    description:
      "From intimate dinners to large-scale conferences, manage every aspect of your events with powerful tools designed for organizers.",
    icon: CalendarDays,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    heroFeatures: [
      "Single, recurring, and multi-day events",
      "Session-based conference scheduling",
      "Venue and capacity management",
      "Custom fields and event settings",
    ],
    sections: [
      {
        title: "Event Types",
        description: "Support for every event format",
        icon: CalendarDays,
        features: [
          {
            title: "Single Events",
            description: "One-time events with a specific date, time, and venue.",
          },
          {
            title: "Recurring Events",
            description: "Weekly, monthly, or custom recurring schedules with shared guest lists.",
          },
          {
            title: "Multi-Day Events",
            description: "Festivals and conferences spanning multiple days with separate sessions.",
          },
          {
            title: "Conference Mode",
            description: "Multiple tracks, rooms, and sessions with individual registration.",
          },
        ],
      },
      {
        title: "Venue Management",
        description: "Organize locations and capacity",
        icon: Globe,
        features: [
          {
            title: "Venue Database",
            description: "Save and reuse venue details across events.",
          },
          {
            title: "Capacity Tracking",
            description: "Set maximum capacity and track availability in real-time.",
          },
          {
            title: "Table Assignment",
            description: "Assign guests to specific tables, zones, or sections.",
          },
          {
            title: "Floor Plans",
            description: "Upload venue layouts for visual seating management.",
          },
        ],
      },
      {
        title: "Event Lifecycle",
        description: "From draft to completion",
        icon: Clock,
        features: [
          {
            title: "Draft Mode",
            description: "Build events before publishing to prevent premature access.",
          },
          {
            title: "Duplication",
            description: "Clone past events including guest lists and settings.",
          },
          {
            title: "Archive & Delete",
            description: "Archive completed events or remove cancelled ones cleanly.",
          },
          {
            title: "Event Categories",
            description: "Organize events with color-coded categories and tags.",
          },
        ],
      },
    ],
  },
  design: {
    title: "Ticket Design",
    subtitle: "Create beautiful branded tickets",
    description:
      "Design professional tickets with our visual editor. Generate QR codes, print PDF tickets, and create Apple Wallet passes.",
    icon: Palette,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    heroFeatures: [
      "Visual drag-and-drop ticket editor",
      "Reusable template library",
      "QR Code, PDF417, and Code128 barcodes",
      "PDF and Apple Wallet output",
    ],
    sections: [
      {
        title: "Visual Editor",
        description: "Design tickets with drag-and-drop",
        icon: Palette,
        features: [
          {
            title: "Drag & Drop Elements",
            description: "Place text, images, barcodes, and branding elements freely.",
          },
          {
            title: "Custom Backgrounds",
            description: "Upload images or use gradients for ticket backgrounds.",
          },
          {
            title: "Dynamic Fields",
            description: "Insert attendee name, event date, seat number, and more.",
          },
          {
            title: "Live Preview",
            description: "See how your ticket looks with real attendee data before printing.",
          },
        ],
      },
      {
        title: "Barcode Support",
        description: "Multiple barcode formats",
        icon: QrCode,
        features: [
          {
            title: "QR Codes",
            description: "Fast scanning with any smartphone camera.",
          },
          {
            title: "PDF417",
            description: "High-capacity 2D barcodes for detailed ticket data.",
          },
          {
            title: "Code128",
            description: "Industry-standard 1D barcodes for compatibility.",
          },
          {
            title: "Duplicate Detection",
            description: "Automatic detection of already-scanned tickets at the door.",
          },
        ],
      },
      {
        title: "Output Formats",
        description: "Deliver tickets anywhere",
        icon: FileText,
        features: [
          {
            title: "PDF Tickets",
            description: "High-quality PDF tickets for print or digital delivery.",
          },
          {
            title: "Apple Wallet",
            description: "Add-to-wallet passes for iPhone and Apple Watch.",
          },
          {
            title: "Email Delivery",
            description: "Send tickets as email attachments or embedded links.",
          },
          {
            title: "Bulk Generation",
            description: "Generate hundreds of unique tickets in seconds.",
          },
        ],
      },
    ],
  },
  registration: {
    title: "Online Registration",
    subtitle: "Public event pages with ticket sales",
    description:
      "Create beautiful event pages, sell tickets online, manage RSVPs, and process payments securely through Stripe.",
    icon: Globe,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    heroFeatures: [
      "Custom event landing pages",
      "Secure Stripe payment processing",
      "RSVP and waitlist management",
      "Promo codes and discounts",
    ],
    sections: [
      {
        title: "Event Pages",
        description: "Beautiful public-facing pages",
        icon: Globe,
        features: [
          {
            title: "Custom Branding",
            description: "Upload cover images, logos, and match your brand colors.",
          },
          {
            title: "Event Details",
            description: "Date, time, venue, description, and schedule displayed beautifully.",
          },
          {
            title: "SEO Optimized",
            description: "Meta tags and structured data for search engine visibility.",
          },
          {
            title: "Mobile Responsive",
            description: "Perfect experience on phones, tablets, and desktops.",
          },
        ],
      },
      {
        title: "Ticket Sales",
        description: "Sell tickets online securely",
        icon: CreditCard,
        features: [
          {
            title: "Multiple Ticket Types",
            description: "General admission, VIP, early bird, and custom tiers.",
          },
          {
            title: "Stripe Integration",
            description: "PCI-compliant payment processing with major card support.",
          },
          {
            title: "Promo Codes",
            description: "Percentage or fixed-amount discounts with usage limits.",
          },
          {
            title: "Sale Windows",
            description: "Set ticket availability dates for time-limited sales.",
          },
        ],
      },
      {
        title: "RSVP Management",
        description: "Track responses and waitlists",
        icon: Users,
        features: [
          {
            title: "Invitation Links",
            description: "Unique RSVP links for private events.",
          },
          {
            title: "Response Tracking",
            description: "See who accepted, declined, or hasn't responded yet.",
          },
          {
            title: "Waitlist",
            description: "Automatically manage overflow with waitlist queues.",
          },
          {
            title: "Custom Fields",
            description: "Collect dietary preferences, accessibility needs, and more.",
          },
        ],
      },
    ],
  },
  marketing: {
    title: "Marketing & Email",
    subtitle: "Reach your attendees with targeted communications",
    description:
      "Send beautiful email campaigns, set up automated workflows, and track engagement with open and click analytics.",
    icon: Mail,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    heroFeatures: [
      "Branded email templates",
      "Campaign scheduling and automation",
      "Open and click tracking",
      "Audience segmentation",
    ],
    sections: [
      {
        title: "Email Campaigns",
        description: "Send targeted communications",
        icon: Mail,
        features: [
          {
            title: "Template Editor",
            description: "Rich text editor with merge fields for personalization.",
          },
          {
            title: "Audience Targeting",
            description: "Send to specific lists, tags, or event attendees.",
          },
          {
            title: "Schedule & Send",
            description: "Send immediately or schedule for the perfect time.",
          },
          {
            title: "A/B Testing",
            description: "Test subject lines to maximize open rates.",
          },
        ],
      },
      {
        title: "Automations",
        description: "Set up triggered workflows",
        icon: Zap,
        features: [
          {
            title: "Welcome Emails",
            description: "Automatic confirmation when guests register.",
          },
          {
            title: "Event Reminders",
            description: "Scheduled reminders before the event day.",
          },
          {
            title: "Post-Event Follow-Up",
            description: "Thank you emails and feedback surveys after events.",
          },
          {
            title: "Ticket Delivery",
            description: "Automatic ticket email upon purchase completion.",
          },
        ],
      },
      {
        title: "Analytics",
        description: "Track campaign performance",
        icon: BarChart3,
        features: [
          {
            title: "Open Rates",
            description: "See how many recipients opened your emails.",
          },
          {
            title: "Click Tracking",
            description: "Track which links get the most engagement.",
          },
          {
            title: "Bounce Management",
            description: "Automatic handling of undeliverable addresses.",
          },
          {
            title: "Unsubscribe Management",
            description: "One-click unsubscribe compliance for all campaigns.",
          },
        ],
      },
    ],
  },
  "on-site": {
    title: "On-Site Check-In",
    subtitle: "Fast, reliable guest check-in at the door",
    description:
      "Check in guests in seconds with instant name search, QR scanning, and real-time sync across all your devices. Works offline too.",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    heroFeatures: [
      "Sub-second name search",
      "Camera-based QR and barcode scanning",
      "Real-time multi-device sync",
      "Offline mode with auto-sync",
    ],
    sections: [
      {
        title: "Check-In Interface",
        description: "Optimized for speed at the door",
        icon: Search,
        features: [
          {
            title: "Instant Search",
            description: "Type-ahead filtering finds guests in under 100ms.",
          },
          {
            title: "One-Tap Check-In",
            description: "Tap a guest card to toggle check-in status instantly.",
          },
          {
            title: "Walk-Up Registration",
            description: "Add unexpected guests on the spot during check-in.",
          },
          {
            title: "Party Check-In",
            description: "Check in entire groups at once with party leader tap.",
          },
        ],
      },
      {
        title: "Scanning",
        description: "QR and barcode scanning",
        icon: ScanLine,
        features: [
          {
            title: "Camera Scanning",
            description: "Use any smartphone camera as a ticket scanner.",
          },
          {
            title: "Multi-Format",
            description: "QR Code, PDF417, and Code128 barcode support.",
          },
          {
            title: "Validation Overlay",
            description: "Instant valid/invalid/duplicate feedback with sound.",
          },
          {
            title: "Scan Logging",
            description: "Every scan is logged with timestamp and device info.",
          },
        ],
      },
      {
        title: "Real-Time & Offline",
        description: "Works everywhere, always",
        icon: Wifi,
        features: [
          {
            title: "Multi-Device Sync",
            description: "Check-ins appear on all devices within 1 second.",
          },
          {
            title: "Live Counter",
            description: "Real-time attendance counter updates across all devices.",
          },
          {
            title: "Offline Mode",
            description: "Full check-in capability without internet connection.",
          },
          {
            title: "Auto-Sync",
            description: "Queued check-ins sync automatically when reconnected.",
          },
        ],
      },
    ],
  },
  operations: {
    title: "Operations",
    subtitle: "Guest CRM, team management, and access control",
    description:
      "Centralized contact database with attendance history, team roles, and fine-grained permissions for your organization.",
    icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-900/30",
    heroFeatures: [
      "Centralized contact database",
      "Tags, lists, and segmentation",
      "Team roles and permissions",
      "API key management",
    ],
    sections: [
      {
        title: "Contact CRM",
        description: "Your guest database",
        icon: Database,
        features: [
          {
            title: "Contact Profiles",
            description: "Name, email, phone, company, and custom fields per contact.",
          },
          {
            title: "Attendance History",
            description: "See every event a contact has attended over time.",
          },
          {
            title: "Notes & Activity",
            description: "Add notes and see activity timeline per contact.",
          },
          {
            title: "Deduplication",
            description: "Automatic detection of duplicate contacts on import.",
          },
        ],
      },
      {
        title: "Lists & Tags",
        description: "Organize and segment contacts",
        icon: Tag,
        features: [
          {
            title: "Static Lists",
            description: "Manually curated contact groups for targeted actions.",
          },
          {
            title: "Tag System",
            description: "Apply multiple tags to contacts for flexible filtering.",
          },
          {
            title: "Bulk Actions",
            description: "Tag, export, or message entire lists at once.",
          },
          {
            title: "Smart Filters",
            description: "Combine criteria for dynamic contact views.",
          },
        ],
      },
      {
        title: "Team & Access",
        description: "Manage your organization",
        icon: Shield,
        features: [
          {
            title: "Role-Based Access",
            description: "Admin, Manager, and Staff roles with scoped permissions.",
          },
          {
            title: "Team Invites",
            description: "Invite team members via email with role assignment.",
          },
          {
            title: "Activity Logs",
            description: "Track who did what and when across the platform.",
          },
          {
            title: "API Keys",
            description: "Generate API keys with configurable permissions.",
          },
        ],
      },
    ],
  },
  integrations: {
    title: "Integrations",
    subtitle: "Connect with your favorite tools",
    description:
      "Integrate with Stripe for payments, use webhooks for custom workflows, and access everything through our REST API.",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    heroFeatures: [
      "Stripe payment processing",
      "Webhook event notifications",
      "REST API access",
      "CSV import and export",
    ],
    sections: [
      {
        title: "Payment Processing",
        description: "Secure ticket sales",
        icon: CreditCard,
        features: [
          {
            title: "Stripe Integration",
            description: "PCI-compliant payment processing for ticket sales.",
          },
          {
            title: "Apple Pay & Google Pay",
            description: "Mobile wallet support through Stripe.",
          },
          {
            title: "Refund Management",
            description: "Process full or partial refunds directly from orders.",
          },
          {
            title: "Revenue Reports",
            description: "Track sales, fees, and net revenue per event.",
          },
        ],
      },
      {
        title: "Developer Tools",
        description: "Build custom integrations",
        icon: Settings,
        features: [
          {
            title: "REST API",
            description: "Full CRUD access to events, guests, and check-ins.",
          },
          {
            title: "Webhooks",
            description: "Real-time event notifications to your endpoints.",
          },
          {
            title: "API Keys",
            description: "Scoped API keys with configurable permissions.",
          },
          {
            title: "Rate Limiting",
            description: "Fair usage with generous rate limits per key.",
          },
        ],
      },
      {
        title: "Data Import/Export",
        description: "Move data in and out easily",
        icon: Upload,
        features: [
          {
            title: "CSV Import",
            description: "Import guest lists with column mapping and preview.",
          },
          {
            title: "Excel Support",
            description: "Direct import from .xlsx spreadsheet files.",
          },
          {
            title: "Data Export",
            description: "Export contacts, orders, and reports as CSV.",
          },
          {
            title: "Copy-Paste",
            description: "Paste directly from Google Sheets or Excel.",
          },
        ],
      },
    ],
  },
  analytics: {
    title: "Reports & Analytics",
    subtitle: "Data-driven event insights",
    description:
      "Real-time dashboards, attendance reports, revenue tracking, and comprehensive data export for every event.",
    icon: BarChart3,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    heroFeatures: [
      "Real-time attendance dashboards",
      "Check-in timeline charts",
      "Revenue and ticket analytics",
      "CSV and PDF export",
    ],
    sections: [
      {
        title: "Attendance Analytics",
        description: "Track who showed up",
        icon: Users,
        features: [
          {
            title: "Live Dashboards",
            description: "Real-time attendance numbers updating as guests arrive.",
          },
          {
            title: "Check-In Timeline",
            description: "See arrival patterns throughout the event.",
          },
          {
            title: "Guest Breakdown",
            description: "Attendance by ticket type, status, and custom segments.",
          },
          {
            title: "No-Show Analysis",
            description: "Identify trends in non-attendance across events.",
          },
        ],
      },
      {
        title: "Revenue Reports",
        description: "Track financial performance",
        icon: CreditCard,
        features: [
          {
            title: "Sales Summary",
            description: "Total revenue, refunds, and net income per event.",
          },
          {
            title: "Ticket Breakdown",
            description: "Revenue and quantity sold per ticket type.",
          },
          {
            title: "Promo Code Usage",
            description: "Track discount redemptions and their revenue impact.",
          },
          {
            title: "Payment Methods",
            description: "Breakdown of payment methods used by attendees.",
          },
        ],
      },
      {
        title: "Data Export",
        description: "Take your data anywhere",
        icon: Download,
        features: [
          {
            title: "CSV Export",
            description: "Download any report as a CSV for spreadsheet analysis.",
          },
          {
            title: "PDF Reports",
            description: "Generate formatted PDF reports for stakeholders.",
          },
          {
            title: "Cross-Event Reports",
            description: "Compare attendance and revenue across multiple events.",
          },
          {
            title: "Scheduled Reports",
            description: "Automatic email delivery of weekly/monthly summaries.",
          },
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(tourData).map((category) => ({ category }));
}

export default async function TourCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = tourData[category];
  if (!data) notFound();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Link
            href="/tour"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Tour
            <span className="mx-1">/</span>
            <span className="text-foreground">{data.title}</span>
          </Link>
          <div className={`mx-auto mt-4 inline-flex rounded-xl p-4 ${data.bg}`}>
            <data.icon className={`h-10 w-10 ${data.color}`} />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            {data.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{data.subtitle}</p>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            {data.description}
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-2">
            {data.heroFeatures.map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-lg bg-card px-4 py-2.5 text-left text-sm shadow-sm"
              >
                <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {data.sections.map((section, i) => (
        <section
          key={section.title}
          className={`px-4 py-16 ${i % 2 === 1 ? "bg-muted/30" : ""}`}
        >
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <section.icon className={`h-6 w-6 ${data.color}`} />
              <h2 className="text-2xl font-bold">{section.title}</h2>
            </div>
            <p className="mt-2 text-muted-foreground">{section.description}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {section.features.map((feat) => (
                <div
                  key={feat.title}
                  className="rounded-xl border bg-card p-6 transition-colors hover:border-primary/20"
                >
                  <h3 className="font-semibold">{feat.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">
            Ready to use {data.title}?
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Get started free with 50 check-ins. No credit card required.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Sign Up Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/tour">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Back to Tour
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
