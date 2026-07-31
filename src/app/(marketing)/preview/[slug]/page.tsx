import Link from "next/link";
import { CalendarDays, MapPin, Ticket, Video } from "lucide-react";

const previews = {
  "summer-sessions": {
    title: "Summer Sessions: Live at the Harbour",
    date: "Sunday, August 2 · 7:00 PM",
    venue: "Bahrain Harbour",
    location: "Manama, Bahrain",
    price: "BHD 0.120",
    description: "An outdoor evening of live music, food, and sunset views. Enjoy a curated line-up of local performers and a relaxed waterfront atmosphere.",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=85",
  },
  "family-carnival": {
    title: "Family Carnival Weekend",
    date: "Tuesday, August 4 · 4:00 PM",
    venue: "Bahrain International Exhibition Centre",
    location: "Sakhir, Bahrain",
    price: "BHD 0.050",
    description: "Games, creative workshops, and entertainment for all ages. Plan an easy family day with activities, food, and live entertainment.",
    image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&w=1800&q=85",
  },
  "comedy-night": {
    title: "Friday Comedy Night",
    date: "Friday, August 7 · 8:00 PM",
    venue: "Theatre Hall",
    location: "Manama, Bahrain",
    price: "BHD 0.080",
    description: "A lively late-night stand-up show with local talent. Come early, enjoy the atmosphere, and settle in for an evening of comedy.",
    image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1800&q=85",
  },
} as const;

export default async function PreviewEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = previews[slug as keyof typeof previews];

  if (!event) {
    return <div className="min-h-screen bg-[#080808] px-6 pt-32 text-center text-white">Event not found.</div>;
  }

  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.location}`)}`;

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-28 pt-24 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black text-cyan-300 hover:text-cyan-200">← Back to events</Link>
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#141722]">
          <img src={event.image} alt="" className="h-[300px] w-full object-cover sm:h-[440px]" />
          <div className="p-6 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Featured event</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{event.title}</h1>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-slate-300">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" />{event.date}</span>
              <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-cyan-300"><MapPin className="h-4 w-4 text-cyan-300" />{event.venue}</a>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="space-y-8 rounded-[2rem] border border-white/10 bg-[#101114] p-6 sm:p-8">
            <section>
              <h2 className="text-2xl font-black">About this event</h2>
              <p className="mt-4 max-w-3xl leading-8 text-slate-300">{event.description}</p>
            </section>
            <section>
              <h2 className="text-2xl font-black">Event gallery</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <img src={event.image} alt="" className="aspect-video w-full rounded-2xl object-cover" />
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/20 text-center text-sm font-bold text-slate-400"><Video className="mr-2 h-5 w-5" />Media added by the organizer appears here.</div>
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-black">Location</h2>
              <a href={mapHref} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-cyan-300 hover:bg-white/10"><MapPin className="h-5 w-5" />{event.venue} · Open in Google Maps</a>
            </section>
          </article>

          <aside id="tickets" className="h-fit rounded-[2rem] border border-cyan-300/30 bg-[#141722] p-6 lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Tickets</p>
            <p className="mt-3 text-3xl font-black">{event.price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">Select your tickets and complete checkout securely with iTicket.</p>
            <Link href="/account/login" className="mt-6 flex h-13 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-200"><Ticket className="h-4 w-4" />Buy tickets</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
