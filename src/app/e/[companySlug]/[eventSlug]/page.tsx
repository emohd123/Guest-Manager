"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Smartphone,
  Share2, 
  ShieldCheck, 
  ArrowLeft,
  Info,
  ChevronRight,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketWidget } from "@/components/public/TicketWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { DesignSettings } from "@/types/event";
import { toast } from "sonner";

function getPublicPageSettings(settings: DesignSettings, hasPaidTickets: boolean) {
  const publicPage = settings.publicPage ?? {};
  return {
    enabled: publicPage.enabled !== false,
    isPaidEvent: publicPage.isPaidEvent ?? hasPaidTickets,
    heroLabel: publicPage.heroLabel || "Event Page",
    headline: publicPage.headline || "",
    subheadline: publicPage.subheadline || "",
    venueName: publicPage.venueName || "",
    locationText: publicPage.locationText || "",
    ctaLabel: publicPage.ctaLabel || "",
    highlights: publicPage.highlights ?? [],
    showAgenda: publicPage.showAgenda !== false,
    showSponsors: publicPage.showSponsors !== false,
    showAppDownload: publicPage.showAppDownload !== false,
  };
}

export default function PublicEventPage({ 
  params 
}: { 
  params: Promise<{ companySlug: string; eventSlug: string }> 
}) {
  const { companySlug, eventSlug } = use(params);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery({ 
    companySlug, 
    eventSlug 
  });

  const { data: ticketTypes, isLoading: ticketsLoading } = trpc.ticketTypes.listPublic.useQuery(
    { eventId: event?.id as string },
    { enabled: !!event?.id }
  );
  const { data: experience } = trpc.eventExperience.publicSummary.useQuery(
    { eventId: event?.id as string },
    { enabled: !!event?.id }
  );

  if (eventLoading) {
    return <LandingPageSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400">
          <Info className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Event not found</h1>
          <p className="text-muted-foreground max-sm mx-auto">This event may have been moved, deleted, or is not yet published.</p>
        </div>
        <Button asChild className="rounded-2xl h-12 px-8 font-bold">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const settings = (event.settings as DesignSettings) || {};
  const hasPaidTickets = (ticketTypes ?? []).some((ticket) => (ticket.price ?? 0) > 0);
  const publicPage = getPublicPageSettings(settings, hasPaidTickets);
  const primaryColor = settings.primaryColor || "#2563EB";
  const backgroundColor = settings.backgroundColor || "#FFFFFF";
  const logoUrl = settings.logoUrl || "";

  if (!publicPage.enabled) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-8">
        <div className="max-w-xl space-y-4 text-center">
          <h1 className="text-3xl font-black tracking-tight">This event page is not public yet</h1>
          <p className="text-muted-foreground">
            The organizer has not published the public event landing page.
          </p>
          <Button asChild className="rounded-2xl h-12 px-8 font-bold">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckout = async (selection: Record<string, number>) => {
    if (!attendeeName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!attendeeEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    const cartItems = Object.entries(selection)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => {
        const ticketType = (ticketTypes ?? []).find((t) => t.id === ticketTypeId);
        if (!ticketType) return null;
        return {
          ticketTypeId,
          name: ticketType.name,
          price: ticketType.price ?? 0,
          currency: ticketType.currency ?? "USD",
          quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (cartItems.length === 0) {
      toast.error("Please select at least one ticket.");
      return;
    }

    try {
      setCheckoutLoading(true);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySlug,
          eventSlug,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim(),
          cartItems,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Checkout failed");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      if (result.success) {
        toast.success("Registration complete. Your tickets are being sent by email.");
        return;
      }

      throw new Error("Unexpected checkout response");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500" 
      style={{ 
        backgroundColor,
      }}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Event Details */}
          <div className="lg:col-span-7 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Events
                </Link>
                
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded-lg" />
                )}
              </div>
              
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.9] text-zinc-950 dark:text-white" style={{ color: primaryColor === "#FFFFFF" ? undefined : primaryColor }}>
                {publicPage.headline || event.title}
              </h1>
              {publicPage.subheadline ? (
                <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {publicPage.subheadline}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Date</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(event.startsAt), "MMMM d, yyyy")}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Time</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(event.startsAt), "h:mm a")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <Ticket className="h-5 w-5" style={{ color: primaryColor }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Access</span>
                    <span className="text-sm font-bold leading-none">
                      {publicPage.isPaidEvent ? "Paid Event" : "Free Event"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-zinc-200 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
              {event.coverImageUrl ? (
                <img 
                  src={event.coverImageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-zinc-300 dark:text-zinc-800">
                    <div className="h-20 w-20 rounded-full border-4 border-current border-dashed" />
                    <span className="font-black italic tracking-tighter text-2xl uppercase">GuestManager</span>
                  </div>
                </div>
              )}
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest shadow-xl">
                  {publicPage.heroLabel}
                </span>
                <span className="px-4 py-2 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest shadow-xl">
                  {publicPage.isPaidEvent ? "Paid" : "Free"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-1px bg-zinc-100 dark:bg-zinc-800 grow" />
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">About this event</h2>
                <div className="h-1px bg-zinc-100 dark:bg-zinc-800 grow" />
              </div>
              
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p className="text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {event.description || "Join us for an unforgettable experience. No description provided by the organizer, but expect excellence."}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-8">
                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {publicPage.venueName || publicPage.locationText || "Virtual Event or Venue TBD"}
                    </p>
                  </div>
                  <Button variant="link" className="px-0 font-bold text-xs h-auto uppercase tracking-wider hvr-underline-from-left">
                    Show on map <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">Spread the word</h4>
                    <p className="text-sm text-muted-foreground">
                      {publicPage.isPaidEvent
                        ? "Share the event page with guests ready to purchase access."
                        : "Invite friends and colleagues to reserve a free spot."}
                    </p>
                  </div>
                  <Button variant="link" className="px-0 font-bold text-xs h-auto uppercase tracking-wider hvr-underline-from-left">
                    Copy link <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {publicPage.highlights.length ? (
                <div className="grid gap-4 pt-6 sm:grid-cols-3">
                  {publicPage.highlights.slice(0, 6).map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5"
                    >
                      <p className="text-sm font-bold leading-relaxed">{highlight}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {experience?.settings.features?.liveStreamEnabled !== false && experience?.settings.liveStream?.url ? (
                <div className="rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Live Stream</h3>
                      <p className="text-sm text-muted-foreground">Join the live experience directly from the app or website.</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl h-12 px-6 font-bold">
                    <a href={experience.settings.liveStream.url} target="_blank" rel="noreferrer">
                      {experience.settings.liveStream.label || "Watch Live"}
                    </a>
                  </Button>
                </div>
              ) : null}

              {publicPage.showAgenda && experience?.sessions?.length ? (
                <div className="space-y-6 pt-10">
                  <div className="flex items-center gap-3">
                    <div className="h-1px bg-zinc-100 dark:bg-zinc-800 grow" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">Agenda</h2>
                    <div className="h-1px bg-zinc-100 dark:bg-zinc-800 grow" />
                  </div>
                  <div className="grid gap-4">
                    {experience.sessions.slice(0, 6).map((session) => (
                      <div key={session.id} className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black tracking-tight">{session.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {session.startsAt ? format(new Date(session.startsAt), "MMM d, h:mm a") : "Time TBD"}
                              {session.location ? ` • ${session.location}` : ""}
                            </p>
                          </div>
                          {session.liveNow ? (
                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-500">
                              Live
                            </span>
                          ) : null}
                        </div>
                        {session.description ? <p className="mt-3 text-sm text-muted-foreground">{session.description}</p> : null}
                        {session.speaker ? <p className="mt-3 text-xs font-bold uppercase tracking-widest text-zinc-400">{session.speaker}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {publicPage.showSponsors &&
              experience?.settings.features?.sponsorHighlightsEnabled !== false &&
              experience?.settings.sponsors?.featuredProfiles?.length ? (
                <div className="space-y-6 pt-10">
                  <div className="flex items-center gap-3">
                    <div className="h-1px bg-zinc-100 dark:bg-zinc-800 grow" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">
                      Featured Sponsors
                    </h2>
                    <div className="h-1px bg-zinc-100 dark:bg-zinc-800 grow" />
                  </div>
                  <div className="grid gap-4">
                    {experience.settings.sponsors.featuredProfiles.slice(0, 4).map((profile) => (
                      <div key={profile.id} className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black tracking-tight">{profile.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {[profile.role, profile.company, profile.booth].filter(Boolean).join(" • ") || "Featured partner"}
                            </p>
                          </div>
                          {profile.kind ? (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
                              {profile.kind}
                            </span>
                          ) : null}
                        </div>
                        {profile.headline ? <p className="mt-3 text-sm text-muted-foreground">{profile.headline}</p> : null}
                        {profile.ctaUrl ? (
                          <Button asChild variant="outline" className="mt-4 rounded-2xl h-11 px-5 font-bold">
                            <a href={profile.ctaUrl} target="_blank" rel="noreferrer">
                              {profile.ctaLabel || "Learn More"}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {publicPage.showAppDownload ? (
              <div className="rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Get the attendee app</h3>
                    <p className="text-sm text-muted-foreground">
                      Access live streams, agenda saves, networking, and event updates from your phone.
                    </p>
                  </div>
                </div>
                <Button asChild className="rounded-2xl h-12 px-6 font-bold">
                  <a href="/event-check-in-app">Open App Details</a>
                </Button>
              </div>
              ) : null}
            </div>
          </div>

          {/* Right Column: Tickets */}
          <div className="lg:col-span-5 sticky top-12 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 shadow-3xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="relative space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {publicPage.isPaidEvent ? "Tickets Available" : "Free Registration"}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">
                    {publicPage.isPaidEvent ? "Registration" : "Reserve your place"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {publicPage.isPaidEvent
                      ? "Select your tickets and proceed to complete your registration below."
                      : "Choose your free ticket and submit your details to reserve your place."}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Input
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                  />
                  <Input
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    placeholder="Email address"
                    autoComplete="email"
                  />
                </div>

                {ticketsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                  </div>
                ) : (
                  <TicketWidget 
                    ticketTypes={ticketTypes || []} 
                    onCheckout={handleCheckout}
                    isLoading={checkoutLoading}
                    checkoutLabel={publicPage.ctaLabel || (publicPage.isPaidEvent ? "Proceed to Checkout" : "Reserve Free Spot")}
                    amountLabel={publicPage.isPaidEvent ? "Total Amount" : "Selected Tickets"}
                    freeEvent={!publicPage.isPaidEvent}
                  />
                )}

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payments</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Ticket className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Digital Delivery</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground font-medium px-8">
              Registration is subject to terms of service. Digital tickets will be sent immediately upon successful payment confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-16 w-3/4 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-40 rounded-2xl" />
            <Skeleton className="h-12 w-40 rounded-2xl" />
          </div>
          <Skeleton className="aspect-video w-full rounded-[2.5rem]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
