import Link from "next/link";
import { CalendarDays, MapPin, Ticket, Video } from "lucide-react";

const previews = {
  "summer-sessions": {
    category: "Live experiences",
    title: "Summer Sessions: Live at the Harbour",
    date: "Sunday, August 2 · 7:00 PM",
    venue: "Bahrain Harbour",
    location: "Manama, Bahrain",
    price: "BHD 0.120",
    description: "An outdoor evening of live music, food, and sunset views. Enjoy a curated line-up of local performers and a relaxed waterfront atmosphere.",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=85",
    lineup: [{ name: "Harbour Sessions Collective", role: "Live headliner" }, { name: "Bahrain Sunset DJs", role: "Guest set" }],
  },
  "family-carnival": {
    category: "Live experiences",
    title: "Family Carnival Weekend",
    date: "Tuesday, August 4 · 4:00 PM",
    venue: "Bahrain International Exhibition Centre",
    location: "Sakhir, Bahrain",
    price: "BHD 0.050",
    description: "Games, creative workshops, and entertainment for all ages. Plan an easy family day with activities, food, and live entertainment.",
    image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&w=1800&q=85",
    lineup: [{ name: "Family Carnival Crew", role: "Main attraction" }, { name: "Creative Workshop Hosts", role: "Live activities" }],
  },
  "comedy-night": {
    category: "Live experiences",
    title: "Friday Comedy Night",
    date: "Friday, August 7 · 8:00 PM",
    venue: "Theatre Hall",
    location: "Manama, Bahrain",
    price: "BHD 0.080",
    description: "A lively late-night stand-up show with local talent. Come early, enjoy the atmosphere, and settle in for an evening of comedy.",
    image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1800&q=85",
    lineup: [{ name: "Friday Comedy Collective", role: "Headline set" }, { name: "Special guest comics", role: "Supporting lineup" }],
  },
} as const;

export default async function PreviewEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = previews[slug as keyof typeof previews];

  if (!event) {
    return <div className="min-h-screen bg-white px-6 pt-32 text-center text-slate-900">Event not found.</div>;
  }

  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.location}`)}`;
  const relatedEvents = Object.entries(previews)
    .filter(([candidateSlug, candidate]) => candidateSlug !== slug && candidate.category === event.category)
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-white px-4 pb-28 pt-24 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black text-cyan-300 hover:text-cyan-200">← Back to events</Link>
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
          <img src={event.image} alt="" className="h-[300px] w-full object-cover sm:h-[440px]" />
          <div className="p-6 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Featured event</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{event.title}</h1>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" />{event.date}</span>
              <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-cyan-300"><MapPin className="h-4 w-4 text-cyan-300" />{event.venue}</a>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="space-y-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <section>
              <h2 className="text-2xl font-black">About this event</h2>
              <p className="mt-4 max-w-3xl leading-8 text-slate-600">{event.description}</p>
            </section>
            <section className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Ticket className="h-5 w-5 text-cyan-700" />Terms &amp; Conditions</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                <li>• QR tickets are valid once for the stated event and date.</li>
                <li>• Entry is subject to venue and organiser safety rules.</li>
                <li>• Unauthorised resale or copying of tickets is not permitted.</li>
                <li>• Schedule, artist, and activity changes may occur where necessary.</li>
                <li>• Refund and transfer requests follow the organiser policy and applicable law.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-black">Event gallery</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <img src={event.image} alt="" className="aspect-video w-full rounded-2xl object-cover" />
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/20 text-center text-sm font-bold text-slate-400"><Video className="mr-2 h-5 w-5" />Media added by the organizer appears here.</div>
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-black">Lineup</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {event.lineup.map((artist, index) => (
                  <div key={artist.name} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <img src={event.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                    <div className="min-w-0 flex-1"><span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-800">{index === 0 ? "Headliner" : "Guest"}</span><p className="mt-2 truncate font-black text-slate-950">{artist.name}</p><p className="text-sm text-slate-500">{artist.role}</p></div>
                    <span className="text-xl text-slate-400">›</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="hidden">
              <h2 className="text-2xl font-black">Location</h2>
              <a href={mapHref} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-cyan-300 hover:bg-white/10"><MapPin className="h-5 w-5" />{event.venue} · Open in Google Maps</a>
            </section>
            <section>
              <h2 className="text-2xl font-black">Location</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-stretch transition hover:bg-slate-50">
                  <div className="flex w-24 shrink-0 flex-col items-center justify-center border-r border-slate-200 bg-white px-3 text-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white"><MapPin className="h-4 w-4" /></span>
                    <span className="mt-2 text-xs font-black">Venue</span>
                    <span className="text-[10px] font-medium text-slate-500">location</span>
                  </div>
                  <div className="min-w-0 flex-1 bg-slate-50 px-5 py-4">
                    <p className="font-black text-slate-950">{event.venue}</p>
                    <p className="mt-1 text-sm text-slate-600">{event.location}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-black text-slate-900">View directions <span aria-hidden="true">›</span></span>
                  </div>
                </a>
                <iframe title={`${event.venue} map`} src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.venue} ${event.location}`)}&output=embed`} className="h-60 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </section>
            {relatedEvents.length ? <section>
              <h2 className="text-2xl font-black">You might also like</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {relatedEvents.map(([relatedSlug, related]) => (
                  <Link key={relatedSlug} href={`/preview/${relatedSlug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg">
                    <img src={related.image} alt="" className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">{related.category}</p><h3 className="mt-1 line-clamp-2 font-black text-slate-950">{related.title}</h3><p className="mt-2 text-sm font-semibold text-slate-600">{related.price} · {related.date}</p></div>
                  </Link>
                ))}
              </div>
            </section> : null}
          </article>

          <aside id="tickets" className="h-fit rounded-[2rem] border border-cyan-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Tickets</p>
            <p className="mt-3 text-3xl font-black">{event.price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Select your tickets and complete checkout securely with iTicket.</p>
            <Link href="/account/login" className="mt-6 flex h-13 items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-4 font-black text-white transition hover:bg-cyan-700"><Ticket className="h-4 w-4" />Buy tickets</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
