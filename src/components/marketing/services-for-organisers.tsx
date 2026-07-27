import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  FileCheck2,
  Globe2,
  Headphones,
  MapPin,
  Megaphone,
  Music4,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { FallingSparkles } from "@/components/visual/falling-sparkles";
import { Reveal } from "@/components/visual/reactbits";

const valueProps = [
  { icon: Ticket, title: "Sell more tickets", body: "A fast, mobile-first checkout in BHD with Benefit, Visa, Mastercard, Apple Pay & Google Pay." },
  { icon: TrendingUp, title: "Fill venues faster", body: "Early-bird pricing, promo codes, waitlists, and QR tickets that convert on every device." },
  { icon: ScanLine, title: "Simplify event ops", body: "Guest lists, imports, QR scanning, and live check-in from our companion app — online or offline." },
  { icon: Megaphone, title: "Amplify your reach", body: "A discovery marketplace, Arabic + English pages, and email campaigns to your audience." },
  { icon: BarChart3, title: "Know your numbers", body: "Live dashboards for attendance, revenue, pace, and scans across every event you run." },
];

const img = (id: string, w = 640, h = 420) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;

const industries = [
  { icon: Music4, title: "Entertainment events", body: "Concerts, festivals, and live shows with reserved or general admission.", img: img("1470229722913-7c0e2dbbafd3") },
  { icon: MapPin, title: "Attractions & tours", body: "Museums, experiences, and recurring daily entry ticketing.", img: img("1513889961551-628c1e5e2ee9") },
  { icon: Trophy, title: "Sports events", body: "Stadiums, marathons, and tournaments with fast gate scanning.", img: img("1461896836934-ffe607ba8211") },
  { icon: Briefcase, title: "Business & education", body: "Conferences, seminars, and multi-day agendas with session check-in.", img: img("1540575467063-178a50c2df87") },
  { icon: Building2, title: "Venue ticketing", body: "Theatres and venues with repeat shows and seat mapping.", img: img("1503095396549-807759245b35") },
  { icon: Users, title: "Organisers & providers", body: "Agencies and providers running events for their own clients.", img: img("1522071820081-009f0129c71c") },
];

const stats = [
  { value: "BHD", label: "Local payments & settlement" },
  { value: "AR + EN", label: "Fully bilingual experience" },
  { value: "QR", label: "Instant tickets & fast scans" },
  { value: "24/7", label: "Support before & on event day" },
  { value: "1 app", label: "Ticketing, check-in & ops" },
];

const services = [
  { icon: Headphones, title: "Support", body: "A dedicated ticketing team from setup to the final scan.", img: img("1556761175-b413da4baf72", 240, 240) },
  { icon: Building2, title: "Venues", body: "Help choosing and securing the right venue for your event.", img: img("1519167758481-83f550bb49b3", 240, 240) },
  { icon: FileCheck2, title: "Permits", body: "Guidance and support with local event permit applications.", img: img("1450101499163-c8848c66ca85", 240, 240) },
  { icon: Sparkles, title: "Consultation", body: "Tailored advice on pricing, capacity, and audience growth.", img: img("1600880292203-757bb62b4baf", 240, 240) },
  { icon: Users, title: "Staffing", body: "Trained door staff, scanners, and on-site coordinators.", img: img("1521737604893-d14cc237f11d", 240, 240) },
  { icon: Wrench, title: "Equipment", body: "Scanners, printers, and check-in hardware for the door.", img: img("1526374965328-7f61d4dc18c5", 240, 240) },
];

const testimonials = [
  {
    quote: "iTicket ran our ticketing and door team end to end. Check-in was fast and the live numbers kept us in control all night.",
    name: "Festival Organiser",
    role: "Bahrain Bay",
  },
  {
    quote: "Bilingual pages and BHD checkout made a real difference for our audience. Setup was quick and support was always there.",
    name: "Conference Lead",
    role: "Manama",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">{children}</p>;
}

export function ServicesForOrganisers() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7fb] text-slate-900">
      <div className="pointer-events-none absolute inset-0 z-0">
        <FallingSparkles className="absolute inset-0 h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-none px-4 pt-32 pb-20 sm:px-8 lg:px-12 2xl:px-20">
        {/* HERO */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-blue-700">
              <Sparkles className="h-4 w-4" /> iTicket for Organisers
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[0.98] tracking-[-0.03em] sm:text-6xl">
              Built for Bahrain&apos;s{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-[shine_5s_linear_infinite]">
                experience-makers
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Power your events with Bahrain&apos;s all-in-one ticketing, check-in, and guest-operations
              platform. Maximise your reach, sell seamlessly in BHD, and deliver experiences that move
              every audience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact?service=corporate"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3.5 text-sm font-black text-slate-900 transition hover:opacity-95"
              >
                Book a call <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact?service=ticketing-services"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-7 py-3.5 text-sm font-black text-slate-900 transition hover:bg-slate-200"
              >
                Explore ticketing
              </Link>
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Ticket, label: "Ticketing", img: img("1459749411175-04bf5292ceea", 160, 160) },
                { icon: QrCode, label: "QR tickets", img: img("1512428559087-560fa5ceab42", 160, 160) },
                { icon: ScanLine, label: "Live check-in", img: img("1516450360452-9312f5e86fc7", 160, 160) },
                { icon: BarChart3, label: "Reports", img: img("1551288049-bebda4e38f71", 160, 160) },
                { icon: Megaphone, label: "Campaigns", img: img("1557200134-90327ee9fafa", 160, 160) },
                { icon: ShieldCheck, label: "Secure pay", img: img("1556742502-ec7c0e9f34b1", 160, 160) },
              ].map((f) => (
                <div key={f.label} className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <img src={f.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/45" />
                    <span className="absolute inset-0 flex items-center justify-center text-blue-600">
                      <f.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <span className="text-sm font-black">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUE PROPS */}
        <section className="mt-24">
          <Eyebrow>Why organisers choose us</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Power your events, sell more tickets — all from one platform
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {valueProps.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-200/40 hover:bg-white">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/15 text-blue-600">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-black">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <Reveal>
        <section className="mt-20 rounded-[2rem] border border-slate-200 bg-white px-6 py-10 backdrop-blur">
          <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black italic text-slate-900 sm:text-4xl">{s.value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
        </Reveal>

        {/* INDUSTRIES */}
        <section className="mt-24">
          <Eyebrow>Who we support</Eyebrow>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Industries we power</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((i) => (
              <div key={i.title} className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition hover:border-cyan-200/40">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img src={i.img} alt={i.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-black/40 text-blue-600 backdrop-blur">
                    <i.icon className="h-5 w-5" />
                  </span>
                  <h3 className="absolute inset-x-4 bottom-3 text-lg font-black">{i.title}</h3>
                </div>
                <p className="p-5 text-sm leading-6 text-slate-600">{i.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE ROWS */}
        <section className="mt-24 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 to-transparent p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/15 text-blue-600">
              <Ticket className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-2xl font-black">Custom ticketing at any scale</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Branded event pages, multiple ticket types, promo codes, and QR-coded PDF tickets with real-time inventory control.
            </p>
            <Link href="/contact?service=ticketing-services" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-600">
              Explore ticketing solutions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-400/10 to-transparent p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-400/15 text-fuchsia-300">
              <CalendarCheck className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-2xl font-black">Fast, reliable check-in</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Scan tickets in seconds with our companion app — offline-ready, multi-device, and with live attendance on your dashboard.
            </p>
            <Link href="/contact?service=staffing" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-fuchsia-200 hover:text-fuchsia-100">
              See check-in & staffing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* BUILT-IN SERVICES */}
        <section className="mt-24">
          <Eyebrow>Managed by iTicket</Eyebrow>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Built-in services for successful events</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200/40 hover:bg-white">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <img src={s.img} alt={s.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-emerald-300 backdrop-blur">
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black">{s.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mt-24">
          <Eyebrow>Trusted by organisers</Eyebrow>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Don&apos;t just take our word for it</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-[2rem] border border-slate-200 bg-white p-8">
                <div className="flex gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 text-lg font-semibold leading-relaxed text-slate-800">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-black text-slate-900">{t.name}</span>
                  <span className="text-slate-500"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* REGIONAL */}
        <section className="mt-24 flex flex-col items-start gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/15 text-blue-600">
              <Globe2 className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-black">Rooted in Bahrain, built for the Gulf</h3>
              <p className="mt-1 text-sm text-slate-600">Local expertise, BHD settlement, and Arabic + English from day one.</p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-16 overflow-hidden rounded-[2.5rem] border border-cyan-200/25 bg-gradient-to-br from-fuchsia-500/15 via-cyan-400/10 to-transparent p-10 text-center sm:p-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
            Let&apos;s make your next event a milestone
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
            Ticketing, check-in, staffing, permits, and reporting — our team handles the operations so you can focus on the experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-black transition hover:bg-white/90">
              Book a call <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-8 py-4 text-sm font-black text-slate-900 transition hover:bg-slate-200">
              Browse the marketplace
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
