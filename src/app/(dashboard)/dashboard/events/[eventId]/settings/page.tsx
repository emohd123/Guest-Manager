"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Save,
  Trash2,
  Archive,
  Copy,
  Globe,
  Smartphone,
  Radio,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function formatDateTimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { data: event, isLoading, refetch } = trpc.events.get.useQuery({ id: eventId });
  const { data: experience, refetch: refetchExperience } = trpc.eventExperience.get.useQuery({ eventId });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [eventType, setEventType] = useState<"single" | "recurring" | "multi_day" | "session" | "conference">("single");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [homeHeadline, setHomeHeadline] = useState("");
  const [liveStreamUrl, setLiveStreamUrl] = useState("");
  const [liveStreamLabel, setLiveStreamLabel] = useState("");
  const [liveStreamProvider, setLiveStreamProvider] = useState("embed");
  const [liveStreamIsLive, setLiveStreamIsLive] = useState(false);
  const [networkingIntro, setNetworkingIntro] = useState("");
  const [directoryPrivacyDescription, setDirectoryPrivacyDescription] = useState("");
  const [directoryEmptyStateMessage, setDirectoryEmptyStateMessage] = useState("");
  const [sponsorsIntro, setSponsorsIntro] = useState("");
  const [sponsorsCsv, setSponsorsCsv] = useState("");
  const [announcementsCsv, setAnnouncementsCsv] = useState("");
  const [interestsCsv, setInterestsCsv] = useState("");
  const [goalsCsv, setGoalsCsv] = useState("");
  const [industriesCsv, setIndustriesCsv] = useState("");
  const [networkingEnabled, setNetworkingEnabled] = useState(true);
  const [matchmakingEnabled, setMatchmakingEnabled] = useState(true);
  const [liveStreamEnabled, setLiveStreamEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [sessionTrackingEnabled, setSessionTrackingEnabled] = useState(true);
  const [attendeeChatEnabled, setAttendeeChatEnabled] = useState(true);
  const [directoryEnabled, setDirectoryEnabled] = useState(true);
  const [sponsorHighlightsEnabled, setSponsorHighlightsEnabled] = useState(true);

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDescription(event.description ?? "");
    setShortDescription(event.shortDescription ?? "");
    setEventType(event.eventType);
    setStartsAt(formatDateTimeLocal(event.startsAt));
    setEndsAt(event.endsAt ? formatDateTimeLocal(event.endsAt) : "");
    setTimezone(event.timezone ?? "America/Los_Angeles");
    setMaxCapacity(event.maxCapacity?.toString() ?? "");
    setRegistrationEnabled(event.registrationEnabled ?? false);
  }, [event]);

  useEffect(() => {
    if (!experience) return;
    setWelcomeMessage(experience.settings.welcomeMessage ?? "");
    setHomeHeadline(experience.settings.homeHeadline ?? "");
    setLiveStreamUrl(experience.settings.liveStream.url ?? "");
    setLiveStreamLabel(experience.settings.liveStream.label ?? "");
    setLiveStreamProvider(experience.settings.liveStream.provider ?? "embed");
    setLiveStreamIsLive(Boolean(experience.settings.liveStream.isLive));
    setNetworkingIntro(experience.settings.networking.introText ?? "");
    setDirectoryPrivacyDescription(experience.settings.networking.directory?.privacyDescription ?? "");
    setDirectoryEmptyStateMessage(experience.settings.networking.directory?.emptyStateMessage ?? "");
    setSponsorsIntro(experience.settings.sponsors?.introText ?? "");
    setSponsorsCsv(
      (experience.settings.sponsors?.featuredProfiles ?? [])
        .map((profile) =>
          [
            profile.name,
            profile.company ?? "",
            profile.role ?? "",
            profile.headline ?? "",
            profile.ctaLabel ?? "",
            profile.ctaUrl ?? "",
            profile.booth ?? "",
            profile.kind ?? "sponsor",
          ].join(" | ")
        )
        .join("\n")
    );
    setAnnouncementsCsv(
      (experience.settings.announcements ?? [])
        .map((item) => `${item.title} :: ${item.body}`)
        .join("\n")
    );
    setInterestsCsv((experience.settings.networking.taxonomy.interests ?? []).join(", "));
    setGoalsCsv((experience.settings.networking.taxonomy.goals ?? []).join(", "));
    setIndustriesCsv((experience.settings.networking.taxonomy.industries ?? []).join(", "));
    setNetworkingEnabled(experience.settings.features.networkingEnabled);
    setMatchmakingEnabled(experience.settings.features.matchmakingEnabled);
    setLiveStreamEnabled(experience.settings.features.liveStreamEnabled);
    setPushNotificationsEnabled(experience.settings.features.pushNotificationsEnabled);
    setSessionTrackingEnabled(experience.settings.features.sessionTrackingEnabled);
    setAttendeeChatEnabled(experience.settings.features.attendeeChatEnabled);
    setDirectoryEnabled(experience.settings.features.directoryEnabled);
    setSponsorHighlightsEnabled(experience.settings.features.sponsorHighlightsEnabled);
  }, [experience]);

  const updateEvent = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted");
      router.push("/dashboard/events");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const duplicateEvent = trpc.events.duplicate.useMutation({
    onSuccess: (newEvent) => {
      toast.success("Event duplicated");
      router.push(`/dashboard/events/${newEvent.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const archiveEvent = trpc.events.archive.useMutation({
    onSuccess: () => {
      toast.success("Event archived");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateExperience = trpc.eventExperience.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Attendee app settings updated");
      refetchExperience();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSave = () => {
    updateEvent.mutate({
      id: eventId,
      title,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      eventType,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      timezone,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
      registrationEnabled,
    });
  };

  const handleStatusChange = (newStatus: "draft" | "published" | "cancelled" | "completed") => {
    updateEvent.mutate({ id: eventId, status: newStatus });
  };

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const parseAnnouncements = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [title, ...bodyParts] = line.split("::");
        return {
          id: `announcement-${index + 1}`,
          title: (title ?? "").trim() || `Announcement ${index + 1}`,
          body: bodyParts.join("::").trim(),
          createdAt: new Date().toISOString(),
        };
      });

  const parseSponsors = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, company, role, headline, ctaLabel, ctaUrl, booth, kind] = line
          .split("|")
          .map((item) => item.trim());
        const sponsorKind =
          kind === "exhibitor" || kind === "partner" || kind === "sponsor"
            ? kind
            : "sponsor";
        return {
          id: `sponsor-${index + 1}`,
          name: name || `Sponsor ${index + 1}`,
          company: company || undefined,
          role: role || undefined,
          headline: headline || undefined,
          ctaLabel: ctaLabel || undefined,
          ctaUrl: ctaUrl || undefined,
          booth: booth || undefined,
          kind: sponsorKind as "sponsor" | "exhibitor" | "partner",
        };
      });

  const handleSaveExperience = () => {
    updateExperience.mutate({
      eventId,
      settings: {
        welcomeMessage,
        homeHeadline,
        features: {
          networkingEnabled,
          matchmakingEnabled,
          liveStreamEnabled,
          pushNotificationsEnabled,
          sessionTrackingEnabled,
          attendeeChatEnabled,
          directoryEnabled,
          sponsorHighlightsEnabled,
        },
        liveStream: {
          url: liveStreamUrl,
          label: liveStreamLabel,
          provider: liveStreamProvider,
          isLive: liveStreamIsLive,
        },
        networking: {
          introText: networkingIntro,
          taxonomy: {
            interests: parseCsv(interestsCsv),
            goals: parseCsv(goalsCsv),
            industries: parseCsv(industriesCsv),
          },
          directory: {
            privacyDescription: directoryPrivacyDescription,
            emptyStateMessage: directoryEmptyStateMessage,
          },
        },
        sponsors: {
          introText: sponsorsIntro,
          featuredProfiles: parseSponsors(sponsorsCsv),
        },
        announcements: parseAnnouncements(announcementsCsv),
        push: experience?.settings.push ?? { reminderLeadMinutes: 15 },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event Settings</h1>
        <p className="text-muted-foreground">Manage your event configuration and lifecycle.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Event Status
          </CardTitle>
          <CardDescription>
            Control the visibility and status of your event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["draft", "published", "cancelled", "completed"] as const).map((status) => (
              <Button
                key={status}
                variant={event.status === status ? "default" : "outline"}
                size="sm"
                className="capitalize"
                onClick={() => handleStatusChange(status)}
                disabled={updateEvent.isPending}
              >
                {status}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {event.status === "draft" && "This event is a draft and not visible to the public."}
            {event.status === "published" && "This event is live and visible on your event page."}
            {event.status === "cancelled" && "This event has been cancelled."}
            {event.status === "completed" && "This event has been completed and archived."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Attendee App Experience
          </CardTitle>
          <CardDescription>
            Configure the live attendee app, networking, and embedded stream experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="homeHeadline">Home Headline</Label>
              <Input id="homeHeadline" value={homeHeadline} onChange={(e) => setHomeHeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Input id="welcomeMessage" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="liveStreamUrl">Live Stream URL</Label>
              <Input id="liveStreamUrl" value={liveStreamUrl} onChange={(e) => setLiveStreamUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveStreamLabel">Live Stream Label</Label>
              <Input id="liveStreamLabel" value={liveStreamLabel} onChange={(e) => setLiveStreamLabel(e.target.value)} placeholder="Watch the keynote" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="liveStreamProvider">Live Stream Provider</Label>
              <Select value={liveStreamProvider} onValueChange={setLiveStreamProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="embed">Embedded Link</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4 bg-background/50">
              <Checkbox checked={liveStreamIsLive} onCheckedChange={(checked) => setLiveStreamIsLive(!!checked)} />
              <div>
                <Label className="font-medium flex items-center gap-2"><Radio className="h-4 w-4" /> Stream Live Now</Label>
                <p className="text-xs text-muted-foreground">Highlight the live stream immediately in the app and on the website.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="networkingIntro">Networking Intro Text</Label>
            <Textarea
              id="networkingIntro"
              value={networkingIntro}
              onChange={(e) => setNetworkingIntro(e.target.value)}
              rows={3}
              placeholder="Tell attendees how networking and smart matching work."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="directoryPrivacyDescription">Directory Privacy Copy</Label>
              <Textarea
                id="directoryPrivacyDescription"
                rows={3}
                value={directoryPrivacyDescription}
                onChange={(e) => setDirectoryPrivacyDescription(e.target.value)}
                placeholder="Profiles stay hidden until attendees opt in."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="directoryEmptyStateMessage">Directory Empty State</Label>
              <Textarea
                id="directoryEmptyStateMessage"
                rows={3}
                value={directoryEmptyStateMessage}
                onChange={(e) => setDirectoryEmptyStateMessage(e.target.value)}
                placeholder="No attendee profiles are visible yet."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="interestsCsv">Interest Tags</Label>
              <Textarea id="interestsCsv" rows={4} value={interestsCsv} onChange={(e) => setInterestsCsv(e.target.value)} placeholder="AI, Fintech, Luxury, Hospitality" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalsCsv">Networking Goals</Label>
              <Textarea id="goalsCsv" rows={4} value={goalsCsv} onChange={(e) => setGoalsCsv(e.target.value)} placeholder="Find buyers, Meet investors, Recruit talent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industriesCsv">Industries</Label>
              <Textarea id="industriesCsv" rows={4} value={industriesCsv} onChange={(e) => setIndustriesCsv(e.target.value)} placeholder="Technology, Events, Media" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sponsorsIntro">Sponsors Intro Text</Label>
              <Textarea
                id="sponsorsIntro"
                rows={3}
                value={sponsorsIntro}
                onChange={(e) => setSponsorsIntro(e.target.value)}
                placeholder="Meet the featured brands and exhibitors behind this event."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcementsCsv">Announcements</Label>
              <Textarea
                id="announcementsCsv"
                rows={6}
                value={announcementsCsv}
                onChange={(e) => setAnnouncementsCsv(e.target.value)}
                placeholder="Opening Ceremony :: Doors open at 8:30 AM"
              />
              <p className="text-xs text-muted-foreground">One announcement per line using `Title :: Body`.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsorsCsv">Featured Sponsors / Exhibitors</Label>
            <Textarea
              id="sponsorsCsv"
              rows={6}
              value={sponsorsCsv}
              onChange={(e) => setSponsorsCsv(e.target.value)}
              placeholder="Acme Corp | Acme | Partner | Meet our innovation team | Book Meeting | https://example.com | Booth A12 | sponsor"
            />
            <p className="text-xs text-muted-foreground">
              One profile per line using `Name | Company | Role | Headline | CTA Label | CTA URL | Booth | Kind`.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              { checked: networkingEnabled, setChecked: setNetworkingEnabled, title: "Networking", desc: "Show attendee profiles and discovery in the app." },
              { checked: matchmakingEnabled, setChecked: setMatchmakingEnabled, title: "Smart Matching", desc: "Recommend attendees based on goals and interests." },
              { checked: liveStreamEnabled, setChecked: setLiveStreamEnabled, title: "Live Stream", desc: "Expose live event watching in mobile and public web." },
              { checked: pushNotificationsEnabled, setChecked: setPushNotificationsEnabled, title: "Push Notifications", desc: "Register devices for attendee push delivery." },
              { checked: sessionTrackingEnabled, setChecked: setSessionTrackingEnabled, title: "Session Tracking", desc: "Track views, saves, and planned attendance." },
              { checked: attendeeChatEnabled, setChecked: setAttendeeChatEnabled, title: "Attendee Chat", desc: "Unlock attendee-to-attendee chat after a confirmed match or meeting." },
              { checked: directoryEnabled, setChecked: setDirectoryEnabled, title: "Attendee Directory", desc: "Expose browse and search for opted-in attendee profiles." },
              { checked: sponsorHighlightsEnabled, setChecked: setSponsorHighlightsEnabled, title: "Sponsor Highlights", desc: "Feature sponsor and exhibitor profiles in app and public web." },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-lg border border-border p-4 bg-background/50">
                <Checkbox checked={item.checked} onCheckedChange={(checked) => item.setChecked(!!checked)} />
                <div>
                  <Label className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4" /> {item.title}</Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveExperience} disabled={updateExperience.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {updateExperience.isPending ? "Saving..." : "Save Attendee App Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Event Details
          </CardTitle>
          <CardDescription>
            Update the core information for your event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Event Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-shortDescription">Short Description</Label>
            <Input
              id="edit-shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary shown in listings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Full Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed event description..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-eventType">Event Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Event</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="multi_day">Multi-Day</SelectItem>
                <SelectItem value="session">Session-Based</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-startsAt">Start Date & Time</Label>
              <Input
                id="edit-startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endsAt">End Date & Time</Label>
              <Input
                id="edit-endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-maxCapacity">Maximum Capacity</Label>
            <Input
              id="edit-maxCapacity"
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border p-4 bg-background/50">
            <Checkbox
              id="edit-registrationEnabled"
              checked={registrationEnabled}
              onCheckedChange={(checked) => setRegistrationEnabled(!!checked)}
            />
            <div>
              <Label htmlFor="edit-registrationEnabled" className="font-medium">
                Enable Online Registration
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow guests to register and purchase tickets online.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={updateEvent.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateEvent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Duplicate or archive this event.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => duplicateEvent.mutate({ id: eventId })}
            disabled={duplicateEvent.isPending}
          >
            <Copy className="h-4 w-4" />
            {duplicateEvent.isPending ? "Duplicating..." : "Duplicate Event"}
          </Button>
          {event.status !== "completed" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => archiveEvent.mutate({ id: eventId })}
              disabled={archiveEvent.isPending}
            >
              <Archive className="h-4 w-4" />
              {archiveEvent.isPending ? "Archiving..." : "Archive Event"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this event. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &ldquo;{event.title}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this event and all associated data
                  including guests, check-ins, and tickets. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteEvent.mutate({ id: eventId })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteEvent.isPending ? "Deleting..." : "Delete Event"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
