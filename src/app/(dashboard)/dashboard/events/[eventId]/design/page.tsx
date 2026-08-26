"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, ExternalLink, Loader2, Ticket, Mail, CalendarDays, Activity, ShieldCheck, Globe, BadgeDollarSign, ArrowUp, ArrowDown, Trash2, Film, Music2, Pencil, Plus, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";
import Link from "next/link";
import { DesignSettings, type LineupArtist } from "@/types/event";
import { TicketDesignEditor } from "@/components/tickets/TicketDesignEditor";
import type { TicketDesignSettings } from "@/components/tickets/TicketPreview";
import { EmailDesignEditor } from "@/components/emails/EmailDesignEditor";
import type { EmailDesignState } from "@/components/emails/EmailDesignEditor";
import { AgendaEditor } from "@/components/agenda/AgendaEditor";
import type { AgendaSettings } from "@/components/agenda/AgendaEditor";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
  const [showInApp, setShowInApp] = useState(true);
  const [isPaidEvent, setIsPaidEvent] = useState(false);
  const [heroLabel, setHeroLabel] = useState("Event Page");
  const [pageHeadline, setPageHeadline] = useState("");
  const [pageSubheadline, setPageSubheadline] = useState("");
  const [venueName, setVenueName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [pageCtaLabel, setPageCtaLabel] = useState("");
  const [highlightsCsv, setHighlightsCsv] = useState("");
  const [termsCsv, setTermsCsv] = useState("");
  const [galleryUrls, setGalleryUrls] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const [showAgenda, setShowAgenda] = useState(true);
  const [artistLibrary, setArtistLibrary] = useState<LineupArtist[]>([]);
  const [lineupArtists, setLineupArtists] = useState<LineupArtist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistPhotoUploading, setArtistPhotoUploading] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistRole, setNewArtistRole] = useState("");
  const [newArtistBio, setNewArtistBio] = useState("");
  const [newArtistImageUrl, setNewArtistImageUrl] = useState("");
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);

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
        setShowInApp(settings.publicPage?.showInApp !== false);
        setIsPaidEvent(Boolean(settings.publicPage?.isPaidEvent));
        setHeroLabel(settings.publicPage?.heroLabel || "Event Page");
        setPageHeadline(settings.publicPage?.headline || "");
        setPageSubheadline(settings.publicPage?.subheadline || "");
        setVenueName(settings.publicPage?.venueName || "");
        setLocationText(settings.publicPage?.locationText || "");
        setMapUrl((settings.publicPage as any)?.mapUrl || "");
        setPageCtaLabel(settings.publicPage?.ctaLabel || "");
        setHighlightsCsv((settings.publicPage?.highlights ?? []).join("\n"));
        setTermsCsv(((settings.publicPage as any)?.terms ?? []).join("\n"));
        setGalleryUrls((settings.publicPage?.galleryImages ?? []).join("\n"));
        setVideoUrl(settings.publicPage?.videoUrl || "");
        setShowAgenda(settings.publicPage?.showAgenda !== false);
        setLineupArtists(Array.isArray(settings.publicPage?.lineup) ? settings.publicPage.lineup : []);
        if (settings.ticketDesign) setTicketDesign(settings.ticketDesign);
        if (settings.emailDesigns) setEmailDesigns(settings.emailDesigns);
        if (settings.agenda) setAgendaSettings(settings.agenda);
        setIsInitialized(true);
      }, 0);
    }
  }, [event, isInitialized]);

  useEffect(() => {
    if (!event?.companyId) return;
    let active = true;
    setArtistsLoading(true);
    void supabase
      .from("artists")
      .select("id, name, role, image_url, bio")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error(`Could not load artist library: ${error.message}`);
        } else {
          setArtistLibrary((data ?? []).map((artist) => ({
            id: artist.id,
            name: artist.name,
            role: artist.role,
            imageUrl: artist.image_url,
            bio: artist.bio,
          })));
        }
        setArtistsLoading(false);
      });
    return () => { active = false; };
  }, [event?.companyId, supabase]);

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

  const buildSettings = (lineup: LineupArtist[]) => {
    const currentSettings = event?.settings && typeof event.settings === "object"
      ? event.settings as Record<string, unknown>
      : {};
    const currentPublicPage = currentSettings.publicPage && typeof currentSettings.publicPage === "object"
      ? currentSettings.publicPage as Record<string, unknown>
      : {};

    return {
      ...currentSettings,
      logoUrl,
      primaryColor,
      backgroundColor,
      customCss,
      publicPage: {
        ...currentPublicPage,
        enabled: publicPageEnabled,
        showInApp,
        isPaidEvent,
        heroLabel,
        headline: pageHeadline,
        subheadline: pageSubheadline,
        venueName,
        locationText,
        mapUrl: mapUrl.trim(),
        ctaLabel: pageCtaLabel,
        highlights: highlightsCsv.split("\n").map((line) => line.trim()).filter(Boolean),
        terms: termsCsv.split("\n").map((line) => line.trim()).filter(Boolean),
        galleryImages: galleryUrls.split("\n").map((line) => line.trim()).filter(Boolean),
        videoUrl: videoUrl.trim(),
        showAgenda,
        lineup,
      },
      ticketDesign,
      emailDesigns,
      agenda: agendaSettings,
    };
  };

  const persistLineup = (nextLineup: LineupArtist[]) => {
    setLineupArtists(nextLineup);
    updateMutation.mutate({
      id: eventId,
      settings: buildSettings(nextLineup),
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate({
      id: eventId,
      coverImageUrl: coverImageUrl || undefined,
      settings: buildSettings(lineupArtists),
    });
  };

  const uploadVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const path = `event-videos/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error } = await supabase.storage.from("events").upload(path, file, { contentType: file.type, cacheControl: "3600" });
      if (error) throw error;
      setVideoUrl(supabase.storage.from("events").getPublicUrl(path).data.publicUrl);
      toast.success("Video uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Video upload failed");
    } finally { setUploadingVideo(false); }
  };

  const uploadArtistPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file for the artist");
      return;
    }
    setArtistPhotoUploading(true);
    try {
      const path = `artists/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error } = await supabase.storage.from("events").upload(path, file, { contentType: file.type, cacheControl: "3600" });
      if (error) throw error;
      setNewArtistImageUrl(supabase.storage.from("events").getPublicUrl(path).data.publicUrl);
      toast.success("Artist photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Artist photo upload failed");
    } finally {
      setArtistPhotoUploading(false);
    }
  };

  const createArtist = async () => {
    const name = newArtistName.trim();
    if (!name || !event?.companyId) {
      toast.error("Enter an artist name first");
      return;
    }
    const artistPayload = {
      name,
      role: newArtistRole.trim() || null,
      bio: newArtistBio.trim() || null,
      image_url: newArtistImageUrl || null,
    };
    const query = editingArtistId
      ? supabase.from("artists").update(artistPayload).eq("id", editingArtistId)
      : supabase.from("artists").insert({ company_id: event.companyId, ...artistPayload });
    const { data, error } = await query.select("id, name, role, image_url, bio").single();
    if (error) {
      toast.error(error.code === "23505" ? "This artist is already in your library" : error.message);
      return;
    }
    const artist: LineupArtist = { id: data.id, name: data.name, role: data.role, imageUrl: data.image_url, bio: data.bio };
    setArtistLibrary((current) => (editingArtistId
      ? current.map((item) => item.id === artist.id ? artist : item)
      : [...current, artist]
    ).sort((a, b) => a.name.localeCompare(b.name)));
    const nextLineup = lineupArtists.some((item) => item.id === artist.id)
      ? lineupArtists.map((item) => item.id === artist.id ? artist : item)
      : [...lineupArtists, artist];
    persistLineup(nextLineup);
    setNewArtistName("");
    setNewArtistRole("");
    setNewArtistBio("");
    setNewArtistImageUrl("");
    setEditingArtistId(null);
    toast.success(editingArtistId ? "Artist updated across the shared library" : "Artist saved to the shared library and added to this lineup");
  };

  const editArtist = (artist: LineupArtist) => {
    setEditingArtistId(artist.id);
    setNewArtistName(artist.name);
    setNewArtistRole(artist.role || "");
    setNewArtistBio(artist.bio || "");
    setNewArtistImageUrl(artist.imageUrl || "");
  };

  const cancelArtistEdit = () => {
    setEditingArtistId(null);
    setNewArtistName("");
    setNewArtistRole("");
    setNewArtistBio("");
    setNewArtistImageUrl("");
  };

  const uploadGalleryMedia = async (files: File[]) => {
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
        const path = `event-media/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error } = await supabase.storage.from("events").upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
        if (error) throw error;
        uploaded.push(supabase.storage.from("events").getPublicUrl(path).data.publicUrl);
      }
      if (uploaded.length) {
        setGalleryUrls((current) => [...current.split("\n"), ...uploaded].filter(Boolean).join("\n"));
        const firstVideo = files.find((file) => file.type.startsWith("video/"));
        if (firstVideo && !videoUrl) {
          const videoIndex = files.indexOf(firstVideo);
          setVideoUrl(uploaded[videoIndex] ?? "");
        }
        toast.success(`${uploaded.length} media file${uploaded.length === 1 ? "" : "s"} uploaded`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Media upload failed");
    } finally {
      setUploadingGallery(false);
    }
  };

  const galleryMediaItems = galleryUrls
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);

  const updateGalleryItems = (items: string[]) => {
    setGalleryUrls(items.join("\n"));
  };

  const moveGalleryItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= galleryMediaItems.length) return;
    const next = [...galleryMediaItems];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateGalleryItems(next);
  };

  const removeGalleryItem = (index: number) => {
    updateGalleryItems(galleryMediaItems.filter((_, itemIndex) => itemIndex !== index));
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const companySlug = (event as any)?.companySlug;
  const canOpenPublicPreview =
    !!companySlug &&
    event?.status === "published" &&
    publicPageEnabled;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none">Design Studio</h1>
          <p className="text-muted-foreground dark:text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
             Branding, event page, tickets, email, and agenda
          </p>
        </motion.div>
        
          <div className="flex flex-wrap gap-3">
          {canOpenPublicPreview ? (
            <Button variant="outline" className="theme-ghost-surface h-14 px-8 rounded-2xl font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3" asChild>
              <Link href={`/e/${companySlug}/${event?.slug}`} target="_blank">
                <ExternalLink className="h-5 w-5" /> Live Preview
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled className="theme-ghost-surface h-14 px-8 rounded-2xl font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3">
              <ExternalLink className="h-5 w-5" /> {event?.status !== "published" ? "Publish For Preview" : "Preview Disabled"}
            </Button>
          )}
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
        <TabsList className="h-auto gap-4 rounded-[32px] border border-border bg-card/90 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          {[
            { value: "branding", label: "Branding + Event Page", icon: ImagePlus },
            { value: "ticket", label: "Tickets", icon: Ticket },
            { value: "email", label: "Email", icon: Mail },
            { value: "agenda", label: "Agenda", icon: CalendarDays }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="group rounded-2xl px-8 py-4 font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3"
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
                <div className="theme-panel p-10 md:p-12 space-y-10">
                 <div className="space-y-2">
                    <p className="theme-eyebrow">Visual Identity</p>
                    <h2 className="theme-section-title">Event Images</h2>
                 </div>
                 
                 <div className="space-y-12">
                    <ImageUpload
                      label="EVENT COVER IMAGE"
                      description="Primary hero image for the event page."
                      value={coverImageUrl}
                      onChange={setCoverImageUrl}
                      onRemove={() => setCoverImageUrl("")}
                      aspectRatio="video"
                      className="rounded-[32px]"
                    />
                    <Separator className="bg-border dark:bg-white/5" />
                    <ImageUpload
                      label="EVENT LOGO"
                      description="Logo used across guest-facing pages and email."
                      value={logoUrl}
                      onChange={setLogoUrl}
                      onRemove={() => setLogoUrl("")}
                      aspectRatio="square"
                      className="max-w-[220px] rounded-[32px]"
                    />
                 </div>
                </div>

                <div className="theme-panel p-10 md:p-12 space-y-8">
                  <div className="space-y-2">
                    <p className="theme-eyebrow">Public Event Page</p>
                    <h2 className="theme-section-title">Landing Page Content</h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">PUBLIC PAGE</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 w-full rounded-2xl border-border dark:border-white/10 font-black uppercase tracking-widest text-[10px]",
                          publicPageEnabled ? "bg-primary/20 text-foreground dark:text-white" : "bg-card text-muted-foreground dark:bg-white/5 dark:text-white/60"
                        )}
                        onClick={() => setPublicPageEnabled((value) => !value)}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        {publicPageEnabled ? "Public Page On" : "Public Page Off"}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">APP DISCOVERY</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 w-full rounded-2xl border-border dark:border-white/10 font-black uppercase tracking-widest text-[10px]",
                          showInApp ? "bg-primary/20 text-foreground dark:text-white" : "bg-card text-muted-foreground dark:bg-white/5 dark:text-white/60"
                        )}
                        onClick={() => setShowInApp((value) => !value)}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        {showInApp ? "Show In App" : "Hide From App"}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">EVENT ACCESS</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 w-full rounded-2xl border-border dark:border-white/10 font-black uppercase tracking-widest text-[10px]",
                          isPaidEvent ? "bg-primary/20 text-foreground dark:text-white" : "bg-card text-muted-foreground dark:bg-white/5 dark:text-white/60"
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
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">HERO LABEL</Label>
                      <Input value={heroLabel} onChange={(e) => setHeroLabel(e.target.value)} className="theme-input" placeholder="Event Page" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">CTA LABEL</Label>
                      <Input value={pageCtaLabel} onChange={(e) => setPageCtaLabel(e.target.value)} className="theme-input" placeholder={isPaidEvent ? "Proceed to Checkout" : "Reserve Free Spot"} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">PAGE HEADLINE</Label>
                    <Input value={pageHeadline} onChange={(e) => setPageHeadline(e.target.value)} className="theme-input" placeholder={event?.title || "Event headline"} />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">SUBHEADLINE</Label>
                    <Textarea value={pageSubheadline} onChange={(e) => setPageSubheadline(e.target.value)} className="theme-textarea min-h-[120px]" placeholder="Short intro that explains what the event is about." />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">VENUE NAME</Label>
                      <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="theme-input" placeholder="Bahrain World Trade Center" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">LOCATION TEXT</Label>
                      <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} className="theme-input" placeholder="Manama, Bahrain" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">HIGHLIGHTS</Label>
                    <Textarea value={highlightsCsv} onChange={(e) => setHighlightsCsv(e.target.value)} className="theme-textarea min-h-[160px]" placeholder={"One highlight per line\nKeynote speakers\nPremium networking\nLive sessions"} />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">TERMS &amp; CONDITIONS</Label>
                    <Textarea value={termsCsv} onChange={(e) => setTermsCsv(e.target.value)} className="theme-textarea min-h-[140px]" placeholder="One term per line" />
                    <p className="text-xs text-muted-foreground">These terms appear in the public event page before checkout.</p>
                  </div>

                  <div className="space-y-5 rounded-[28px] border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-300/20 dark:bg-violet-300/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-700 dark:text-violet-200">Shared artist library</p>
                        <h3 className="mt-1 flex items-center gap-2 text-lg font-black text-foreground dark:text-white"><Music2 className="h-5 w-5 text-violet-600" />Lineup artists</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Add artists once, then select them for any event in any company.</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700 shadow-sm dark:bg-violet-300/10 dark:text-violet-200">{lineupArtists.length} selected</span>
                    </div>

                    {lineupArtists.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {lineupArtists.map((artist, index) => (
                          <div key={artist.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-violet-200/80 bg-white p-3 dark:border-violet-300/15 dark:bg-slate-950/40">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-violet-100 dark:bg-violet-300/10">
                              {artist.imageUrl ? <img src={artist.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-violet-700 dark:text-violet-200"><UserRound className="h-5 w-5" /></div>}
                            </div>
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-foreground dark:text-white">{artist.name}</p><p className="truncate text-xs text-muted-foreground">{artist.role || "Lineup artist"}</p></div>
                            <div className="flex shrink-0 gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Edit ${artist.name}`} onClick={() => editArtist(artist)}><Pencil className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Move ${artist.name} earlier`} disabled={index === 0} onClick={() => { const next = [...lineupArtists]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; persistLineup(next); }}><ArrowUp className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" aria-label={`Remove ${artist.name} from lineup`} onClick={() => persistLineup(lineupArtists.filter((item) => item.id !== artist.id))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <div className="rounded-2xl border border-dashed border-violet-300/70 bg-white/70 p-4 text-sm text-muted-foreground dark:bg-slate-950/20">No artists selected for this event yet. Choose from your saved library or create a new artist below.</div>}

                    <div className="space-y-3 border-t border-violet-200/80 pt-4 dark:border-violet-300/15">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Choose from saved artists</p>
                      {artistsLoading ? <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading artist library…</div> : artistLibrary.length ? <div className="grid gap-2 sm:grid-cols-2">{artistLibrary.map((artist) => {
                        const selected = lineupArtists.some((item) => item.id === artist.id);
                        return <button key={artist.id} type="button" onClick={() => persistLineup(selected ? lineupArtists.filter((item) => item.id !== artist.id) : [...lineupArtists, artist])} className={cn("flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition", selected ? "border-violet-500 bg-violet-100/70 dark:border-violet-300 dark:bg-violet-300/10" : "border-border bg-white hover:border-violet-300 dark:border-white/10 dark:bg-slate-950/30")}>
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-muted"><>{artist.imageUrl ? <img src={artist.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><UserRound className="h-4 w-4" /></div>}</></div>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-foreground dark:text-white">{artist.name}</span><span className="block truncate text-xs text-muted-foreground">{artist.role || "Artist"}</span></span>
                          <span className={cn("text-xs font-black", selected ? "text-violet-700 dark:text-violet-200" : "text-muted-foreground")}>{selected ? "Added" : "Add"}</span>
                        </button>;
                      })}</div> : <p className="text-sm text-muted-foreground">The shared artist library is empty.</p>}
                    </div>

                    <div className="space-y-4 border-t border-violet-200/80 pt-4 dark:border-violet-300/15">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">{editingArtistId ? "Edit shared artist" : "Add a new artist"}</p>
                        {editingArtistId ? <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={cancelArtistEdit}>Cancel edit</Button> : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} className="theme-input" placeholder="Artist name *" />
                        <Input value={newArtistRole} onChange={(e) => setNewArtistRole(e.target.value)} className="theme-input" placeholder="Role, e.g. Headliner" />
                      </div>
                      <Textarea value={newArtistBio} onChange={(e) => setNewArtistBio(e.target.value)} className="theme-textarea min-h-[80px]" placeholder="Short artist bio (optional)" />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className={cn("inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 text-xs font-black text-violet-700 transition hover:bg-violet-50 dark:border-violet-300/30 dark:bg-slate-950/30 dark:text-violet-200", artistPhotoUploading && "pointer-events-none opacity-60")}>
                          {artistPhotoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{newArtistImageUrl ? "Photo uploaded" : "Upload artist photo"}
                          <Input type="file" accept="image/*" className="hidden" disabled={artistPhotoUploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadArtistPhoto(file); e.currentTarget.value = ""; }} />
                        </label>
                        {newArtistImageUrl ? <img src={newArtistImageUrl} alt="Artist preview" className="h-11 w-11 rounded-xl object-cover" /> : null}
                        <Button type="button" onClick={() => { void createArtist(); }} className="h-11 rounded-xl bg-violet-600 px-4 font-black text-white hover:bg-violet-700">{editingArtistId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingArtistId ? "Save artist changes" : "Save artist & add to lineup"}</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-cyan-200/60 bg-cyan-50/50 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/5">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">GOOGLE MAP LOCATION</Label>
                    <Input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} className="theme-input" placeholder="Paste a Google Maps pin/share link" />
                    <p className="text-xs text-muted-foreground">In Google Maps, drop a pin, choose Share, copy the link, and paste it here. This exact location is used for the public map and directions buttons.</p>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venueName, locationText].filter(Boolean).join(", "))}`, "_blank", "noopener,noreferrer")}>Choose location in Google Maps</Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">EVENT PHOTOS &amp; VIDEOS</Label>
                    <label className={cn("flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300/70 bg-cyan-50/40 p-6 text-center transition hover:bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/5", uploadingGallery && "pointer-events-none opacity-60")}>
                      <ImagePlus className="mb-2 h-8 w-8 text-cyan-600" />
                      <span className="font-black text-foreground">{uploadingGallery ? "Uploading media…" : "Choose multiple photos and videos"}</span>
                      <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, MP4, WebM, or MOV. Select as many as you need.</span>
                      <Input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" disabled={uploadingGallery} onChange={(e) => { void uploadGalleryMedia(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }} />
                    </label>
                    {galleryMediaItems.length ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Uploaded event media">
                        {galleryMediaItems.map((url, index) => {
                          const isVideo = /\.(mp4|webm|mov)(?:$|[?#])/i.test(url);
                          return (
                            <div key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-white/5">
                              <div className="relative aspect-[4/3] bg-muted/40 dark:bg-black/20">
                                {isVideo ? (
                                  <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                ) : (
                                  <img src={url} alt={`Event media ${index + 1}`} className="h-full w-full object-cover" />
                                )}
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                                  {isVideo ? <Film className="h-3 w-3" /> : <ImagePlus className="h-3 w-3" />}
                                  {isVideo ? "Video" : "Photo"}
                                </span>
                                <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{index + 1}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 p-2">
                                <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground" title={url}>{url}</p>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-lg" aria-label={`Move media ${index + 1} up`} disabled={index === 0} onClick={() => moveGalleryItem(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-lg" aria-label={`Move media ${index + 1} down`} disabled={index === galleryMediaItems.length - 1} onClick={() => moveGalleryItem(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" aria-label={`Remove media ${index + 1}`} onClick={() => removeGalleryItem(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <Textarea value={galleryUrls} onChange={(e) => setGalleryUrls(e.target.value)} className="theme-textarea min-h-[120px]" placeholder={"One photo or video URL per line\nhttps://..."} />
                    <p className="text-xs text-muted-foreground">All listed media is saved with the event and appears in the public hero slider. Use the arrows to change the order or the trash button to remove an item. Existing URLs remain supported.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">EVENT VIDEO URL</Label>
                    <Input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={uploadingVideo} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadVideo(file); }} className="theme-input" />
                    {uploadingVideo ? <p className="text-xs text-muted-foreground">Uploading video…</p> : null}
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="theme-input" placeholder="https://.../event-video.mp4" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: "Show Agenda", value: showAgenda, setValue: setShowAgenda },
                    ].map((item) => (
                      <Button
                        key={item.label}
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-14 rounded-2xl border-border dark:border-white/10 font-black uppercase tracking-widest text-[10px]",
                          item.value ? "bg-primary/20 text-foreground dark:text-white" : "bg-card text-muted-foreground dark:bg-white/5 dark:text-white/60"
                        )}
                        onClick={() => item.setValue((current: boolean) => !current)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="theme-panel p-10 md:p-12 space-y-10">
                 <div className="space-y-2">
                    <p className="theme-eyebrow">Theme Colors</p>
                    <h2 className="theme-section-title">Appearance</h2>
                 </div>

                 <div className="space-y-10">
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">PRIMARY COLOR</Label>
                        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 p-3 dark:border-white/5 dark:bg-white/3">
                          <div className="h-12 w-12 rounded-xl border border-border shadow-2xl dark:border-white/10" style={{ backgroundColor: primaryColor }} />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 border-none bg-transparent font-black text-[11px] uppercase tracking-widest text-foreground dark:text-white italic focus-visible:ring-0" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">BACKGROUND COLOR</Label>
                        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 p-3 dark:border-white/5 dark:bg-white/3">
                          <div className="h-12 w-12 rounded-xl border border-border shadow-2xl dark:border-white/10" style={{ backgroundColor: backgroundColor }} />
                          <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-10 border-none bg-transparent font-black text-[11px] uppercase tracking-widest text-foreground dark:text-white italic focus-visible:ring-0" />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-border dark:bg-white/5" />
                    
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 italic">CUSTOM CSS</Label>
                      <Textarea
                        placeholder="/* Optional advanced styling */"
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        className="min-h-[220px] resize-none rounded-[32px] border-border bg-card/70 p-8 font-mono text-[10px] text-foreground selection:bg-primary/20 focus:ring-primary dark:border-white/5 dark:bg-white/3 dark:text-white/60"
                      />
                    </div>
                    
                    <Separator className="bg-border dark:bg-white/5" />

                    <div className="space-y-5 text-sm text-foreground dark:text-white/70">
                      <div className="rounded-[28px] border border-border bg-card/70 p-6 dark:border-white/10 dark:bg-white/5">
                        <p className="mb-3 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-white/40">Visibility</p>
                        <p>{publicPageEnabled ? "This event page can be visited publicly when the event is published." : "The public event page is hidden from visitors."}</p>
                      </div>
                      <div className="rounded-[28px] border border-border bg-card/70 p-6 dark:border-white/10 dark:bg-white/5">
                        <p className="mb-3 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-white/40">Checkout Mode</p>
                        <p>{isPaidEvent ? "Visitors will see paid ticket language and checkout messaging." : "Visitors will see free registration language and a reserve-spot CTA."}</p>
                      </div>
                      <div className="rounded-[28px] border border-border bg-card/70 p-6 dark:border-white/10 dark:bg-white/5">
                        <p className="mb-3 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-white/40">Public URL</p>
                        <p className="break-all text-foreground dark:text-white">{companySlug ? `/e/${companySlug}/${event?.slug}` : "Save to generate preview"}</p>
                        {!canOpenPublicPreview ? (
                          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-white/50">
                            {event?.status !== "published" ? "Publish the event to enable the public preview." : "Turn the public page on to enable preview."}
                          </p>
                        ) : null}
                      </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent key="ticket" value="ticket" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel p-10 md:p-12">
              <div className="mb-12">
                <p className="theme-eyebrow mb-2">Ticket Layout</p>
                <h2 className="text-3xl font-black text-foreground dark:text-white italic uppercase tracking-tighter">PDF Ticket Design</h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground dark:text-white/50">The uploaded ticket image fills the upper half of every customer PDF. Ticket details and the scannable QR code are placed below it automatically.</p>
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
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel p-10 md:p-12">
               <div className="mb-12">
                  <p className="theme-eyebrow mb-2">Email Templates</p>
                  <h2 className="text-3xl font-black text-foreground dark:text-white italic uppercase tracking-tighter">Guest Emails</h2>
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
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel p-10 md:p-12">
               <div className="mb-12">
                  <p className="theme-eyebrow mb-2">Agenda</p>
                  <h2 className="text-3xl font-black text-foreground dark:text-white italic uppercase tracking-tighter">Event Agenda</h2>
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
