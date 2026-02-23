"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const eventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(255),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  eventType: z.enum(["single", "recurring", "multi_day", "session", "conference"]),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional(),
  timezone: z.string().optional(),
  maxCapacity: z.number().int().positive().optional().or(z.literal("")),
  registrationEnabled: z.boolean().optional().default(false),
});

type EventFormData = z.input<typeof eventSchema>;

const steps = [
  { title: "Details", description: "Basic event information" },
  { title: "Schedule", description: "Date, time, and type" },
  { title: "Settings", description: "Capacity and registration" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventType: "single",
      registrationEnabled: false,
    },
  });

  const createEvent = trpc.events.create.useMutation({
    onSuccess: (event) => {
      toast.success("Event created!");
      router.push(`/dashboard/events/${event.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: EventFormData) => {
    createEvent.mutate({
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      eventType: data.eventType,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
      timezone: data.timezone,
      maxCapacity: typeof data.maxCapacity === "number" ? data.maxCapacity : undefined,
      registrationEnabled: data.registrationEnabled,
    });
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-muted-foreground">
            Set up a new event for check-in and guest management.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex flex-1 flex-col rounded-lg border p-3 text-left transition-colors ${
              i === step
                ? "border-primary bg-primary/5"
                : i < step
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-border"
            }`}
          >
            <span className="text-xs text-muted-foreground">
              Step {i + 1}
            </span>
            <span className="text-sm font-medium">{s.title}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Details */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Event Details
              </CardTitle>
              <CardDescription>
                Give your event a name and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Annual Gala Dinner"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  placeholder="A brief summary (shown in listings)"
                  {...register("shortDescription")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed event description..."
                  rows={5}
                  {...register("description")}
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={nextStep} className="gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Schedule */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Set the date, time, and event type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={watch("eventType")}
                  onValueChange={(v) => setValue("eventType", v as EventFormData["eventType"])}
                >
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
                  <Label htmlFor="startsAt">Start Date & Time *</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    {...register("startsAt")}
                  />
                  {errors.startsAt && (
                    <p className="text-xs text-destructive">
                      {errors.startsAt.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">End Date & Time</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    {...register("endsAt")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={watch("timezone") || "America/Los_Angeles"}
                  onValueChange={(v) => setValue("timezone", v)}
                >
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
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={nextStep} className="gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Settings */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure capacity and registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  {...register("maxCapacity", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited attendees.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Checkbox
                  id="registrationEnabled"
                  checked={watch("registrationEnabled")}
                  onCheckedChange={(checked) =>
                    setValue("registrationEnabled", !!checked)
                  }
                />
                <div>
                  <Label htmlFor="registrationEnabled" className="font-medium">
                    Enable Online Registration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow guests to register and purchase tickets online.
                  </p>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
