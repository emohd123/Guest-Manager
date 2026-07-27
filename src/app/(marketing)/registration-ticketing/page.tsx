import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Sparkles,
} from "lucide-react";

const features = [
  { icon: Layout, title: "Beautiful Event Pages", color: "purple", description: "Create stunning public event pages with your branding, cover images, and full event details." },
  { icon: Ticket, title: "Ticket Sales", color: "blue", description: "Sell multiple ticket types with different prices, quantities, and sale windows." },
  { icon: CreditCard, title: "Secure Payments", color: "pink", description: "Process payments securely with Stripe. Support credit cards, Apple Pay, and Google Pay." },
  { icon: UserPlus, title: "RSVP & Registration", color: "purple", description: "Accept RSVPs for free events. Collect attendee information with custom registration forms." },
  { icon: ShieldCheck, title: "Private Invitations", color: "blue", description: "Send unique invitation links for exclusive events. Control who can register with private tokens." },
  { icon: Clock, title: "Waitlist Management", color: "pink", description: "Automatically manage waitlists when events sell out. Notify attendees when spots open up." },
  { icon: BarChart3, title: "Sales Analytics", color: "purple", description: "Track registrations, revenue, and conversion rates in real-time with detailed dashboards." },
  { icon: Globe, title: "Custom Domain", color: "blue", description: "Host your event pages on your own domain for a fully branded experience." },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
};

export default function RegistrationTicketingPage() {
  return (
    <div className="bg-[#080911] text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(219,39,119,0.10),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-pink-400 animate-pulse" />
            Online Registration & Ticketing
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl lg:text-7xl uppercase leading-none">
            Sell Tickets &{" "}
            <span className="block bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              Manage Registrations
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 leading-relaxed font-medium">
            Create beautiful event pages, sell tickets, and accept RSVPs. From
            small gatherings to large conferences, handle it all in one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] hover:shadow-[0_6px_30px_0_rgba(124,77,255,0.55)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-white border-0 font-bold rounded-full px-8"
            >
              <Link href="/signup">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold px-8"
            >
              <Link href="/contact">Request Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Event Page Preview */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <div className="h-40 bg-[linear-gradient(135deg,rgba(37,99,235,0.3),rgba(124,58,237,0.3),rgba(219,39,119,0.2))]" />
          <div className="bg-[#0c0e17] p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black px-2.5 py-1 uppercase tracking-wider">
                  Upcoming Event
                </span>
                <h3 className="mt-3 text-2xl font-bold text-white">Annual Tech Conference 2026</h3>
                <p className="mt-1 text-white/50 text-sm">March 15, 2026 · Convention Center, Bahrain</p>
              </div>
              <Button className="bg-[linear-gradient(135deg,#7c3aed,#db2777)] text-white border-0 font-bold rounded-full shrink-0">
                Register Now
              </Button>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: "General Admission", price: "BHD 15", available: "142 remaining" },
                { label: "VIP Access", price: "BHD 49", available: "28 remaining" },
                { label: "Workshop Pass", price: "BHD 79", available: "12 remaining" },
              ].map((ticket) => (
                <div key={ticket.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white text-sm">{ticket.label}</p>
                  <p className="text-2xl font-black text-purple-400 mt-1">{ticket.price}</p>
                  <p className="text-xs text-white/40 mt-1">{ticket.available}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Everything for{" "}
              <span className="text-pink-400">Online Event Management</span>
            </h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">
              From ticket sales to attendee registration, manage it all from one platform.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 hover:border-white/10 hover:-translate-y-1 hover:bg-white/5 transition-all duration-300"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${colorMap[feature.color]}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-bold text-white">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Flow */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-4xl font-black uppercase tracking-tighter text-white">
          Seamless <span className="text-blue-400">Checkout Experience</span>
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "1", title: "Choose Tickets", desc: "Attendees select ticket types and quantities from your event page.", color: "blue" },
            { step: "2", title: "Register & Pay", desc: "Secure checkout with Stripe. Custom registration fields collect the info you need.", color: "purple" },
            { step: "3", title: "Receive Tickets", desc: "Instant email confirmation with PDF tickets and calendar invite.", color: "pink" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border text-xl font-black ${colorMap[item.color]}`}>
                {item.step}
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why iTicket */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-4xl font-black uppercase tracking-tighter text-white">
            Why Choose <span className="text-purple-400">iTicket?</span>
          </h2>
          <div className="space-y-3">
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
              <div key={point} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/5 transition-all duration-200">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </div>
                <span className="text-white/80 font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(124,77,255,0.08),transparent_80%)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Start Selling{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,#7c3aed,#db2777)] bg-clip-text text-transparent">
              Tickets Today
            </span>
          </h2>
          <p className="mt-4 text-white/60 text-lg">Create your first event page in minutes. Free to start.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-white border-0 font-bold rounded-full px-8"
            >
              <Link href="/signup">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold px-8"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
