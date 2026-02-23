"use client";

import { use, useState } from "react";
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

  const [prevEventId, setPrevEventId] = useState<string | null>(null);

  if (event && event.id !== prevEventId) {
    setPrevEventId(event.id);
    setTitle(event.title);
    setDescription(event.description ?? "");
    setShortDescription(event.shortDescription ?? "");
    setEventType(event.eventType);
    setStartsAt(formatDateTimeLocal(event.startsAt));
    setEndsAt(event.endsAt ? formatDateTimeLocal(event.endsAt) : "");
    setTimezone(event.timezone ?? "America/Los_Angeles");
    setMaxCapacity(event.maxCapacity?.toString() ?? "");
    setRegistrationEnabled(event.registrationEnabled ?? false);
  }

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
