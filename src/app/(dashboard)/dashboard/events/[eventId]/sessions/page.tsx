"use client";

import { use, useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/shared/data-table";
import { CalendarDays, Clock3, Radio, Save, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

function toLocalInput(date?: string | null) {
  if (!date) return "";
  const value = new Date(date);
  const pad = (input: number) => `${input}`.padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default function SessionsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.eventExperience.get.useQuery({ eventId });
  const sessions = data?.sessions ?? [];

  const emptyForm = {
    id: "",
    title: "",
    description: "",
    speaker: "",
    speakerTitle: "",
    speakerCompany: "",
    speakerAvatarUrl: "",
    startsAt: "",
    endsAt: "",
    location: "",
    capacity: "",
    tags: "",
    status: "upcoming" as const,
    liveStreamUrl: "",
    liveStreamLabel: "",
    liveNow: false,
    sortOrder: "0",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!sessions.length || form.id) return;
    setForm(emptyForm);
  }, [sessions, form.id]);

  const upsertSession = trpc.eventExperience.upsertSession.useMutation({
    onSuccess: async () => {
      toast.success("Session saved");
      setForm(emptyForm);
      await utils.eventExperience.get.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteSession = trpc.eventExperience.deleteSession.useMutation({
    onSuccess: async () => {
      toast.success("Session deleted");
      if (form.id) setForm(emptyForm);
      await utils.eventExperience.get.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Session",
        cell: ({ row }: any) => (
          <div>
            <div className="font-semibold">{row.original.title}</div>
            <div className="text-xs text-muted-foreground">{row.original.speaker || "Speaker TBA"}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => <Badge variant="outline">{row.original.liveNow ? "Live" : row.original.status}</Badge>,
      },
      {
        accessorKey: "startsAt",
        header: "Time",
        cell: ({ row }: any) => (
          <div className="text-xs">
            <div>{row.original.startsAt ? new Date(row.original.startsAt).toLocaleString() : "TBD"}</div>
            <div className="text-muted-foreground">{row.original.location || "Location TBD"}</div>
          </div>
        ),
      },
      {
        accessorKey: "metrics",
        header: "Engagement",
        cell: ({ row }: any) => (
          <div className="text-xs">
            <div>Views: {row.original.viewCount ?? 0}</div>
            <div>Saves: {row.original.saveCount ?? 0} • Plans: {row.original.planCount ?? 0}</div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({
                  id: row.original.id,
                  title: row.original.title,
                  description: row.original.description || "",
                  speaker: row.original.speaker || "",
                  speakerTitle: row.original.speakerTitle || "",
                  speakerCompany: row.original.speakerCompany || "",
                  speakerAvatarUrl: row.original.speakerAvatarUrl || "",
                  startsAt: toLocalInput(row.original.startsAt),
                  endsAt: toLocalInput(row.original.endsAt),
                  location: row.original.location || "",
                  capacity: row.original.capacity?.toString?.() ?? "",
                  tags: (row.original.tags ?? []).join(", "),
                  status: row.original.status,
                  liveStreamUrl: row.original.liveStreamUrl || "",
                  liveStreamLabel: row.original.liveStreamLabel || "",
                  liveNow: Boolean(row.original.liveNow),
                  sortOrder: `${row.original.sortOrder ?? 0}`,
                })
              }
            >
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteSession.mutate({ eventId, sessionId: row.original.id })}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteSession, eventId]
  );

  const handleSave = () => {
    upsertSession.mutate({
      eventId,
      session: {
        id: form.id || undefined,
        title: form.title,
        description: form.description,
        speaker: form.speaker,
        speakerTitle: form.speakerTitle,
        speakerCompany: form.speakerCompany,
        speakerAvatarUrl: form.speakerAvatarUrl,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: form.location || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        status: form.status,
        liveStreamUrl: form.liveStreamUrl,
        liveStreamLabel: form.liveStreamLabel,
        liveNow: form.liveNow,
        sortOrder: Number(form.sortOrder || "0"),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Session Studio</CardTitle>
          <CardDescription>Manage the agenda, live stream sessions, and attendee engagement signals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Session Title</Label>
            <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Speaker</Label>
            <Input value={form.speaker} onChange={(e) => setForm((current) => ({ ...current, speaker: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Speaker Title</Label>
            <Input value={form.speakerTitle} onChange={(e) => setForm((current) => ({ ...current, speakerTitle: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Speaker Company</Label>
            <Input value={form.speakerCompany} onChange={(e) => setForm((current) => ({ ...current, speakerCompany: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Start</Label>
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((current) => ({ ...current, startsAt: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>End</Label>
            <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((current) => ({ ...current, endsAt: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input type="number" value={form.capacity} onChange={(e) => setForm((current) => ({ ...current, capacity: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as any }))} placeholder="upcoming, live, completed" />
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm((current) => ({ ...current, sortOrder: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tags</Label>
            <Input value={form.tags} onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))} placeholder="AI, Hospitality, Investor" />
          </div>
          <div className="space-y-2">
            <Label>Session Live Stream URL</Label>
            <Input value={form.liveStreamUrl} onChange={(e) => setForm((current) => ({ ...current, liveStreamUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Live Button Label</Label>
            <Input value={form.liveStreamLabel} onChange={(e) => setForm((current) => ({ ...current, liveStreamLabel: e.target.value }))} placeholder="Watch this session" />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button variant={form.liveNow ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, liveNow: !current.liveNow }))}>
              <Radio className="mr-2 h-4 w-4" /> {form.liveNow ? "Live Now" : "Mark Live"}
            </Button>
            <Button onClick={handleSave} disabled={upsertSession.isPending || !form.title}>
              <Save className="mr-2 h-4 w-4" /> {upsertSession.isPending ? "Saving..." : form.id ? "Update Session" : "Create Session"}
            </Button>
            {form.id ? (
              <Button variant="outline" onClick={() => setForm(emptyForm)}>
                Clear
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5" /> Session Schedule</CardTitle>
          <CardDescription>Track session views, saves, plans, and live engagement from the attendee app.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              No sessions yet. Create the first session above to build the live event agenda.
            </div>
          ) : (
            <DataTable columns={columns as any} data={sessions} searchKey="title" searchPlaceholder="Search sessions..." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Sessions" value={sessions.length} icon={<CalendarDays className="h-4 w-4" />} />
        <MetricCard title="Views" value={sessions.reduce((sum, session) => sum + (session.viewCount ?? 0), 0)} icon={<Users className="h-4 w-4" />} />
        <MetricCard title="Saved" value={sessions.reduce((sum, session) => sum + (session.saveCount ?? 0), 0)} icon={<Save className="h-4 w-4" />} />
        <MetricCard title="Live Opens" value={sessions.reduce((sum, session) => sum + (session.liveOpenCount ?? 0), 0)} icon={<Radio className="h-4 w-4" />} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className="text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}
