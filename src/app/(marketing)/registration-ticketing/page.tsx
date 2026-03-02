import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  CreditCard,
  Ticket,
  UserPlus,
  Layout,
  ShieldCheck,
  BarChart3,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Layout,
    title: "Beautiful Event Pages",
    description:
      "Create stunning public event pages with your branding, cover images, and full event details.",
  },
  {
    icon: Ticket,
    title: "Ticket Sales",
    description:
      "Sell multiple ticket types with different prices, quantities, and sale windows.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Process payments securely with Stripe. Support credit cards, Apple Pay, and Google Pay.",
  },
  {
    icon: UserPlus,
    title: "RSVP & Registration",
    description:
      "Accept RSVPs for free events. Collect attendee information with custom registration forms.",
  },
  {
    icon: ShieldCheck,
    title: "Private Invitations",
    description:
      "Send unique invitation links for exclusive events. Control who can register with private tokens.",
  },
  {
    icon: Clock,
    title: "Waitlist Management",
    description:
      "Automatically manage waitlists when events sell out. Notify attendees when spots open up.",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description:
      "Track registrations, revenue, and conversion rates in real-time with detailed dashboards.",
  },
  {
    icon: Globe,
    title: "Custom Domain",
    description:
      "Host your event pages on your own domain for a fully branded experience.",
  },
];

export default function RegistrationTicketingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Online Registration & Ticketing
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Sell tickets and manage registrations online
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Create beautiful event pages, sell tickets, and accept RSVPs. From
            small gatherings to large conferences, handle it all in one place.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Request Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Page Preview */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border shadow-lg">
          <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/5" />
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <Badge>Upcoming Event</Badge>
                <h3 className="mt-3 text-2xl font-bold">
                  Annual Tech Conference 2025
                </h3>
                <p className="mt-1 text-muted-foreground">
                  March 15, 2025 at Convention Center, San Francisco
                </p>
              </div>
              <Button>Register Now</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "General Admission", price: "$49", available: "142 remaining" },
                { label: "VIP Access", price: "$149", available: "28 remaining" },
                { label: "Workshop Pass", price: "$249", available: "12 remaining" },
              ].map((ticket) => (
                <div key={ticket.label} className="rounded-lg border p-4">
                  <p className="font-medium">{ticket.label}</p>
                  <p className="text-2xl font-bold text-primary">
                    {ticket.price}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.available}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">
              Everything for online event management
            </h2>
            <p className="mt-3 text-muted-foreground">
              From ticket sales to attendee registration, manage it all from one
              platform.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <feature.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Flow */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Seamless checkout experience
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Choose Tickets",
              desc: "Attendees select ticket types and quantities from your event page.",
            },
            {
              step: "2",
              title: "Register & Pay",
              desc: "Secure checkout with Stripe. Custom registration fields collect the info you need.",
            },
            {
              step: "3",
              title: "Receive Tickets",
              desc: "Instant email confirmation with PDF tickets and calendar invite.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {item.step}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Why choose GuestManager?
          </h2>
          <div className="space-y-4">
            {[
              "No per-ticket fees on most plans",
              "Integrated check-in system included",
              "Real-time sales and attendance analytics",
              "Custom branded event pages",
              "Unlimited ticket types per event",
              "Promo codes and discount management",
              "Automatic email delivery with tickets",
              "Waitlist and capacity management",
            ].map((point) => (
              <div
                key={point}
                className="flex items-center gap-3 rounded-lg border bg-background p-4"
              >
                <Check className="h-5 w-5 text-green-500" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">Start selling tickets today</h2>
        <p className="mt-3 text-muted-foreground">
          Create your first event page in minutes. Free to start.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
