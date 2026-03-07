"use client";

import { use, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, ExternalLink, Loader2, Ticket, Mail, CalendarDays, Activity, ShieldCheck, Globe, BadgeDollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";
import Link from "next/link";
import { DesignSettings } from "@/types/event";
import { TicketDesignEditor } from "@/components/tickets/TicketDesignEditor";
import type { TicketDesignSettings } from "@/components/tickets/TicketPreview";
import { EmailDesignEditor } from "@/components/emails/EmailDesignEditor";
import type { EmailDesignState } from "@/components/emails/EmailDesignEditor";
import { AgendaEditor } from "@/components/agenda/AgendaEditor";
import type { AgendaSettings } from "@/components/agenda/AgendaEditor";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DesignSetupPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();

  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });

  // ---------- Branding + event page state ----------
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [customCss, setCustomCss] = useState("");
  const [publicPageEnabled, setPublicPageEnabled] = useState(true);
  const [isPaidEvent, setIsPaidEvent] = useState(false);
  const [heroLabel, setHeroLabel] = useState("Event Page");
  const [pageHeadline, setPageHeadline] = useState("");
  const [pageSubheadline, setPageSubheadline] = useState("");
  const [venueName, setVenueName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [pageCtaLabel, setPageCtaLabel] = useState("");
  const [highlightsCsv, setHighlightsCsv] = useState("");
  const [showAgenda, setShowAgenda] = useState(true);
  const [showSponsors, setShowSponsors] = useState(true);
  const [showAppDownload, setShowAppDownload] = useState(true);

  // ---------- Ticket design tab state ----------
  const [ticketDesign, setTicketDesign] = useState<TicketDesignSettings>({
    labelColor: "#dec245",
    textColor: "#000000",
    dateFormat: "datetime",
    visibleFields: {
      eventName: true,
      ticketType: true,
      venue: true,
      startDate: true,
      attendeeName: true,
      barcode: true,
    },
  });

  // ---------- Email design tab state ----------
  const [emailDesigns, setEmailDesigns] = useState<EmailDesignState>({});

  // ---------- Agenda tab state ----------
  const [agendaSettings, setAgendaSettings] = useState<AgendaSettings>({
    items: [],
    attachToEmail: false,
    agendaTitle: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (event && !isInitialized) {
      setTimeout(() => {
        setCoverImageUrl(event.coverImageUrl || "");
        const settings = (event.settings as DesignSettings & {
          ticketDesign?: TicketDesignSettings;
          emailDesigns?: EmailDesignState;
          agenda?: AgendaSettings;
        }) || {};
        setLogoUrl(settings.logoUrl || "");
        setPrimaryColor(settings.primaryColor || "#2563EB");
        setBackgroundColor(settings.backgroundColor || "#FFFFFF");
        setCustomCss(settings.customCss || "");
        setPublicPageEnabled(settings.publicPage?.enabled !== false);
        setIsPaidEvent(Boolean(settings.publicPage?.isPaidEvent));
        setHeroLabel(settings.publicPage?.heroLabel || "Event Page");
        setPageHeadline(settings.publicPage?.headline || "");
        setPageSubheadline(settings.publicPage?.subheadline || "");
        setVenueName(settings.publicPage?.venueName || "");
        setLocationText(settings.publicPage?.locationText || "");
        setPageCtaLabel(settings.publicPage?.ctaLabel || "");
        setHighlightsCsv((settings.publicPage?.highlights ?? []).join("\n"));
        setShowAgenda(settings.publicPage?.showAgenda !== false);
        setShowSponsors(settings.publicPage?.showSponsors !== false);
        setShowAppDownload(settings.publicPage?.showAppDownload !== false);
        if (settings.ticketDesign) setTicketDesign(settings.ticketDesign);
        if (settings.emailDesigns) setEmailDesigns(settings.emailDesigns);
        if (settings.agenda) setAgendaSettings(settings.agenda);
        setIsInitialized(true);
      }, 0);
    }
  }, [event, isInitialized]);

  const prevAgendaRef = useRef<string>("");

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: async () => {
      toast.success("Event design saved");
      utils.events.get.invalidate({ id: eventId });
      setIsSaving(false);

      try {
        const agendaStr = JSON.stringify(agendaSettings);
        const agendaChanged = prevAgendaRef.current && prevAgendaRef.current !== agendaStr;
        prevAgendaRef.current = agendaStr;
        fetch(`/api/dashboard/events/${eventId}/notify-change`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            agendaChanged
              ? { type: "agenda_update", title: "Schedule updated", body: "The event agenda has been updated. Check the latest schedule." }
              : { type: "event_update", title: "Event details updated", body: "The event organizer has updated the event details. Tap to view the latest information." }
          ),
        }).catch(() => {});
      } catch { /* non-fatal */ }
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate({
      id: eventId,
      coverImageUrl: coverImageUrl || undefined,
      settings: {
        logoUrl,
        primaryColor,
        backgroundColor,
        customCss,
        publicPage: {
          enabled: publicPageEnabled,
          isPaidEvent,
          heroLabel,
          headline: pageHeadline,
          subheadline: pageSubheadline,
          venueName,
          locationText,
          ctaLabel: pageCtaLabel,
          highlights: highlightsCsv
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          showAgenda,
          showSponsors,
          showAppDownload,
        },
        ticketDesign,
        emailDesigns,
        agenda: agendaSettings,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const companySlug = (event as any)?.companySlug;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Design Studio</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
             Branding, event page, tickets, email, and agenda
          </p>
        </motion.div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 text-white/60 hover:text-white font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3" asChild>
            <Link href={`/e/${companySlug}/${event?.slug}`} target="_blank">
              <ExternalLink className="h-5 w-5" /> Live Preview
            </Link>
          </Button>
          <Button
            className="h-14 px-10 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black italic uppercase tracking-widest text-[11px] flex gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-20"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            Save Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-12">
        <TabsList className="h-auto gap-4 bg-white/5 p-2 rounded-[32px] border border-white/10 backdrop-blur-xl">
          {[
            { value: "branding", label: "Branding + Event Page", icon: ImagePlus },
            { value: "ticket", label: "Tickets", icon: Ticket },
            { value: "email", label: "Email", icon: Mail },
            { value: "agenda", label: "Agenda", icon: CalendarDays }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="group rounded-2xl px-8 py-4 data-[state=active]:bg-primary data-[state=active]:text-white text-white/20 font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3"
            >
              <tab.icon className="h-4 w-4 transition-transform group-hover:scale-110" /> 
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key="branding" value="branding" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-10">
                <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 space-y-10 shadow-2xl">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">Visual Identity</p>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Event Images</h2>
                 </div>
                 
                 <div className="space-y-12">
                    <ImageUpload
                      label="EVENT COVER IMAGE"
                      description="Primary hero image for the event page."
                      value={coverImageUrl}
                      onChange={setCoverImageUrl}
                      onRemove={() => setCoverImageUrl("")}
                      aspectRatio="video"
                      className="rounded-[32px] border-white/5 bg-white/2"
                    />
                    <Separator className="bg-white/5" />
                    <ImageUpload
                      label="EVENT LOGO"
                      description="Logo used across guest-facing pages and email."
                      value={logoUrl}
                      onChange={setLogoUrl}
                      onRemove={() => setLogoUrl("")}
                      aspectRatio="square"
                      className="max-w-[220px] rounded-[32px] border-white/5 bg-white/2"
                    />
                 </div>
                </div>

                <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 space-y-8 shadow-2xl">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">Public Event Page</p>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Landing Page Content</h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">PUBLIC PAGE</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 w-full rounded-2xl border-white/10 font-black uppercase tracking-widest text-[10px]",
                          publicPageEnabled ? "bg-primary/20 text-white" : "bg-white/5 text-white/60"
                        )}
                        onClick={() => setPublicPageEnabled((value) => !value)}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        {publicPageEnabled ? "Public Page On" : "Public Page Off"}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">EVENT ACCESS</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 w-full rounded-2xl border-white/10 font-black uppercase tracking-widest text-[10px]",
                          isPaidEvent ? "bg-primary/20 text-white" : "bg-white/5 text-white/60"
                        )}
                        onClick={() => setIsPaidEvent((value) => !value)}
                      >
                        <BadgeDollarSign className="mr-2 h-4 w-4" />
                        {isPaidEvent ? "Paid Event" : "Free Event"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">HERO LABEL</Label>
                      <Input value={heroLabel} onChange={(e) => setHeroLabel(e.target.value)} className="rounded-2xl bg-white/5 border-white/10 text-white" placeholder="Event Page" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">CTA LABEL</Label>
                      <Input value={pageCtaLabel} onChange={(e) => setPageCtaLabel(e.target.value)} className="rounded-2xl bg-white/5 border-white/10 text-white" placeholder={isPaidEvent ? "Proceed to Checkout" : "Reserve Free Spot"} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">PAGE HEADLINE</Label>
                    <Input value={pageHeadline} onChange={(e) => setPageHeadline(e.target.value)} className="rounded-2xl bg-white/5 border-white/10 text-white" placeholder={event?.title || "Event headline"} />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">SUBHEADLINE</Label>
                    <Textarea value={pageSubheadline} onChange={(e) => setPageSubheadline(e.target.value)} className="rounded-[24px] bg-white/5 border-white/10 text-white min-h-[120px]" placeholder="Short intro that explains what the event is about." />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">VENUE NAME</Label>
                      <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="rounded-2xl bg-white/5 border-white/10 text-white" placeholder="Bahrain World Trade Center" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">LOCATION TEXT</Label>
                      <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} className="rounded-2xl bg-white/5 border-white/10 text-white" placeholder="Manama, Bahrain" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">HIGHLIGHTS</Label>
                    <Textarea value={highlightsCsv} onChange={(e) => setHighlightsCsv(e.target.value)} className="rounded-[24px] bg-white/5 border-white/10 text-white min-h-[160px]" placeholder={"One highlight per line\nKeynote speakers\nPremium networking\nLive sessions"} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: "Show Agenda", value: showAgenda, setValue: setShowAgenda },
                      { label: "Show Sponsors", value: showSponsors, setValue: setShowSponsors },
                      { label: "Show App Download", value: showAppDownload, setValue: setShowAppDownload },
                    ].map((item) => (
                      <Button
                        key={item.label}
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 rounded-2xl border-white/10 font-black uppercase tracking-widest text-[10px]",
                          item.value ? "bg-primary/20 text-white" : "bg-white/5 text-white/60"
                        )}
                        onClick={() => item.setValue((current: boolean) => !current)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 space-y-10 shadow-2xl">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">Theme Colors</p>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Appearance</h2>
                 </div>

                 <div className="space-y-10">
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">PRIMARY COLOR</Label>
                        <div className="flex items-center gap-4 bg-white/3 p-3 rounded-2xl border border-white/5">
                          <div className="h-12 w-12 rounded-xl border border-white/10 shadow-2xl" style={{ backgroundColor: primaryColor }} />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="border-none bg-transparent font-black text-[11px] uppercase tracking-widest text-white italic focus-visible:ring-0 h-10" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">BACKGROUND COLOR</Label>
                        <div className="flex items-center gap-4 bg-white/3 p-3 rounded-2xl border border-white/5">
                          <div className="h-12 w-12 rounded-xl border border-white/10 shadow-2xl" style={{ backgroundColor: backgroundColor }} />
                          <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="border-none bg-transparent font-black text-[11px] uppercase tracking-widest text-white italic focus-visible:ring-0 h-10" />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-white/5" />
                    
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">CUSTOM CSS</Label>
                      <Textarea
                        placeholder="/* Optional advanced styling */"
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        className="font-mono text-[10px] min-h-[220px] rounded-[32px] bg-white/3 border-white/5 p-8 focus:ring-primary text-white/60 selection:bg-primary/20 resize-none"
                      />
                    </div>
                    
                    <Separator className="bg-white/5" />

                    <div className="space-y-5 text-sm text-white/70">
                      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                        <p className="font-black uppercase tracking-widest text-[10px] text-white/40 mb-3">Visibility</p>
                        <p>{publicPageEnabled ? "This event page can be visited publicly when the event is published." : "The public event page is hidden from visitors."}</p>
                      </div>
                      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                        <p className="font-black uppercase tracking-widest text-[10px] text-white/40 mb-3">Checkout Mode</p>
                        <p>{isPaidEvent ? "Visitors will see paid ticket language and checkout messaging." : "Visitors will see free registration language and a reserve-spot CTA."}</p>
                      </div>
                      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                        <p className="font-black uppercase tracking-widest text-[10px] text-white/40 mb-3">Public URL</p>
                        <p className="break-all text-white">{companySlug ? `/e/${companySlug}/${event?.slug}` : "Save to generate preview"}</p>
                      </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent key="ticket" value="ticket" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 shadow-2xl">
              <div className="mb-12">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-2 leading-none">Ticket Layout</p>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">PDF Ticket Design</h2>
              </div>
              <TicketDesignEditor
                design={ticketDesign}
                onChange={setTicketDesign}
                eventName={event?.title}
                venue={undefined}
                startDate={event?.startsAt ? new Date(event.startsAt).toISOString() : undefined}
                visitorCode={(event as { visitorCode?: string })?.visitorCode}
                appDownloadUrl={process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ?? "http://localhost:8081"}
              />
            </motion.div>
          </TabsContent>

          <TabsContent key="email" value="email" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 shadow-2xl">
               <div className="mb-12">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-2 leading-none">Email Templates</p>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Guest Emails</h2>
               </div>
              <EmailDesignEditor
                designs={emailDesigns}
                onChange={setEmailDesigns}
                eventName={event?.title}
                ticketDesign={ticketDesign}
                venue={undefined}
                startDate={event?.startsAt ? new Date(event.startsAt).toISOString() : undefined}
              />
            </motion.div>
          </TabsContent>

          <TabsContent key="agenda" value="agenda" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 shadow-2xl">
               <div className="mb-12">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-2 leading-none">Agenda</p>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Event Agenda</h2>
               </div>
              <AgendaEditor
                settings={agendaSettings}
                onChange={setAgendaSettings}
              />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
