"use client";

import { use, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImagePlus, Paintbrush, ExternalLink, Loader2, Check, Ticket, Mail, CalendarDays } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

export default function DesignSetupPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();

  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });

  // ---------- Branding tab state ----------
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [customCss, setCustomCss] = useState("");

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (settings.ticketDesign) setTicketDesign(settings.ticketDesign);
        if (settings.emailDesigns) setEmailDesigns(settings.emailDesigns);
        if (settings.agenda) setAgendaSettings(settings.agenda);
        setIsInitialized(true);
      }, 0);
    }
  }, [event, isInitialized]);

  // Track previous agenda to detect changes
  const prevAgendaRef = useRef<string>("");

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: async () => {
      toast.success("Design settings saved successfully");
      utils.events.get.invalidate({ id: eventId });
      setIsSaving(false);

      // Fire event change notifications to all attendees
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const agendaStr = JSON.stringify(agendaSettings);
          const agendaChanged = prevAgendaRef.current && prevAgendaRef.current !== agendaStr;
          prevAgendaRef.current = agendaStr;
          await fetch(`/api/dashboard/events/${eventId}/notify-change`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(
              agendaChanged
                ? { type: "agenda_update", title: "Schedule updated", body: "The event agenda has been updated. Check the latest schedule." }
                : { type: "event_update", title: "Event details updated", body: "The event organizer has updated the event details. Tap to view the latest information." }
            ),
          }).catch(() => {}); // non-fatal
        }
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
        ticketDesign,
        emailDesigns,
        agenda: agendaSettings,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companySlug = (event as any)?.companySlug;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Design and Setup</h1>
          <p className="text-muted-foreground">Customize your event branding, ticket layout, and email templates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2 rounded-2xl h-12 font-bold" variant="outline" asChild>
            <Link href={`/e/${companySlug}/${event?.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" /> Preview
            </Link>
          </Button>
          <Button
            className="gap-2 rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="h-auto gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl">
          <TabsTrigger value="branding" className="rounded-xl text-sm font-bold px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow gap-2">
            <ImagePlus className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="ticket" className="rounded-xl text-sm font-bold px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow gap-2">
            <Ticket className="h-4 w-4" /> Ticket Design
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-xl text-sm font-bold px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow gap-2">
            <Mail className="h-4 w-4" /> Email Design
          </TabsTrigger>
          <TabsTrigger value="agenda" className="rounded-xl text-sm font-bold px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow gap-2">
            <CalendarDays className="h-4 w-4" /> Agenda
          </TabsTrigger>
        </TabsList>

        {/* ========================= BRANDING TAB ========================= */}
        <TabsContent value="branding" className="mt-0">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  Event Branding
                </CardTitle>
                <CardDescription className="text-md">Upload logos and banner images for your public event page.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-10">
                <ImageUpload
                  label="Cover Image"
                  description="A beautiful banner image that appears at the top of your landing page."
                  value={coverImageUrl}
                  onChange={setCoverImageUrl}
                  onRemove={() => setCoverImageUrl("")}
                  aspectRatio="video"
                />
                <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                <ImageUpload
                  label="Event Logo"
                  description="A square logo used in the header and email communications."
                  value={logoUrl}
                  onChange={setLogoUrl}
                  onRemove={() => setLogoUrl("")}
                  aspectRatio="square"
                />
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Paintbrush className="h-5 w-5" />
                  </div>
                  Theme Colors
                </CardTitle>
                <CardDescription className="text-md">Select colors that match your brand identity.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Primary Color</Label>
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="h-10 w-10 rounded-xl border border-white/20 shadow-inner" style={{ backgroundColor: primaryColor }} />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 h-8" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Background Color</Label>
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner" style={{ backgroundColor: backgroundColor }} />
                      <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 h-8" />
                    </div>
                  </div>
                </div>
                <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom CSS</Label>
                  <Textarea
                    placeholder="/* Advanced customization only (e.g., .event-header { ... }) */"
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    className="font-mono text-xs min-h-[160px] rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 p-6 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================= TICKET DESIGN TAB ========================= */}
        <TabsContent value="ticket" className="mt-0">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
                Custom Ticket Design
              </CardTitle>
              <CardDescription className="text-md">
                Customize the layout and appearance of PDF tickets sent to attendees.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <TicketDesignEditor
                design={ticketDesign}
                onChange={setTicketDesign}
                eventName={event?.title}
                venue={undefined}
                startDate={event?.startsAt ? new Date(event.startsAt).toISOString() : undefined}
                visitorCode={(event as { visitorCode?: string })?.visitorCode}
                appDownloadUrl={process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ?? "http://localhost:8081"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================= EMAIL DESIGN TAB ========================= */}
        <TabsContent value="email" className="mt-0">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                Email Templates
              </CardTitle>
              <CardDescription className="text-md">
                Customize the emails sent to attendees for different event actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <EmailDesignEditor
                designs={emailDesigns}
                onChange={setEmailDesigns}
                eventName={event?.title}
                ticketDesign={ticketDesign}
                venue={undefined}
                startDate={event?.startsAt ? new Date(event.startsAt).toISOString() : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================= AGENDA TAB ========================= */}
        <TabsContent value="agenda" className="mt-0">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                Event Agenda
              </CardTitle>
              <CardDescription className="text-md">
                Build your event schedule. Toggle the switch to attach the agenda PDF to every ticket email sent to attendees.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <AgendaEditor
                settings={agendaSettings}
                onChange={setAgendaSettings}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
