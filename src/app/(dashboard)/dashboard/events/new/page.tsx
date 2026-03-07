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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, CalendarDays, Activity, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const eventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(255),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  eventType: z.enum(["single", "recurring", "multi_day", "session", "conference"]),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional(),
  timezone: z.string().optional(),
  maxCapacity: z.number().int().positive().optional(),
  registrationEnabled: z.boolean().optional().default(false),
});

type EventFormData = z.input<typeof eventSchema>;

const steps = [
  { title: "Details", description: "Event information" },
  { title: "Schedule", description: "Date and time" },
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
    trigger,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventType: "single",
      registrationEnabled: false,
    },
  });

  const createEvent = trpc.events.create.useMutation({
    onSuccess: (event) => {
      toast.success("Event created");
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

  const nextStep = async () => {
    let fieldsToValidate: (keyof EventFormData)[] = [];
    if (step === 0) fieldsToValidate = ["title", "shortDescription", "description"];
    else if (step === 1) fieldsToValidate = ["eventType", "startsAt", "endsAt", "timezone"];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const inputClasses = "h-14 bg-white/5 border-white/10 rounded-2xl text-sm font-semibold tracking-[0.04em] text-white focus:ring-primary focus:border-primary transition-all placeholder:text-white/35";
  const labelClasses = "text-[10px] font-bold uppercase tracking-[0.25em] text-white/55 mb-3 block";

  return (
    <div className="mx-auto max-w-2xl pb-20 px-2 space-y-12">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all group">
            <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none">Create Event</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Add the basics, schedule, and registration settings
          </p>
        </motion.div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-4">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => i < step && setStep(i)}
            className={cn(
               "flex-1 group transition-all",
               i <= step ? "cursor-pointer" : "cursor-not-allowed opacity-30"
            )}
          >
            <div className={cn(
               "h-1.5 rounded-full transition-all duration-500",
               i < step ? "bg-green-500" : i === step ? "bg-primary" : "bg-white/10"
            )} />
            <div className="mt-4 text-left">
               <p className={cn(
                  "text-[8px] font-black uppercase tracking-[0.4em] transition-colors",
                  i === step ? "text-primary" : "text-white/20"
               )}>PHASE_0{i + 1}</p>
               <p className={cn(
                  "text-[10px] font-black uppercase tracking-tighter transition-colors",
                  i === step ? "text-white" : "text-white/10"
               )}>{s.title}</p>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 rounded-[40px] bg-white/5 border border-white/10 p-10 md:p-12 backdrop-blur-xl shadow-2xl"
          >
             <div className="mb-10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">{steps[step].description}</p>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{steps[step].title}</h2>
             </div>

            {/* Step 1: Details */}
            {step === 0 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label className={labelClasses}>Event Name *</Label>
                  <Input
                    className={inputClasses}
                    placeholder="Summer Gala 2026"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Short Description</Label>
                  <Input
                    className={inputClasses}
                    placeholder="A short summary shown in listings and previews"
                    {...register("shortDescription")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Event Description</Label>
                  <Textarea
                    className={cn(inputClasses, "min-h-[160px] p-6")}
                    placeholder="Add the event overview, purpose, speakers, agenda, or attendee details"
                    {...register("description")}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={nextStep} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex gap-3 shadow-2xl shadow-primary/20">
                    Continue <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label className={labelClasses}>Event Type</Label>
                  <Select
                    value={watch("eventType")}
                    onValueChange={(v) => setValue("eventType", v as EventFormData["eventType"])}
                  >
                    <SelectTrigger className={inputClasses}>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 rounded-2xl overflow-hidden">
                      <SelectItem value="single" className="font-black uppercase text-[10px] tracking-widest py-3">Single event</SelectItem>
                      <SelectItem value="recurring" className="font-black uppercase text-[10px] tracking-widest py-3">Recurring event</SelectItem>
                      <SelectItem value="multi_day" className="font-black uppercase text-[10px] tracking-widest py-3">Multi-day event</SelectItem>
                      <SelectItem value="session" className="font-black uppercase text-[10px] tracking-widest py-3">Session</SelectItem>
                      <SelectItem value="conference" className="font-black uppercase text-[10px] tracking-widest py-3">Conference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Start Date & Time *</Label>
                    <Input
                      className={inputClasses}
                      type="datetime-local"
                      {...register("startsAt")}
                    />
                    {errors.startsAt && (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">
                        {errors.startsAt.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>End Date & Time</Label>
                    <Input
                      className={inputClasses}
                      type="datetime-local"
                      {...register("endsAt")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Timezone</Label>
                  <Select
                    value={watch("timezone") || "America/Los_Angeles"}
                    onValueChange={(v) => setValue("timezone", v)}
                  >
                    <SelectTrigger className={inputClasses}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 rounded-2xl">
                      <SelectItem value="America/New_York" className="font-black uppercase text-[10px] py-3">US Eastern</SelectItem>
                      <SelectItem value="America/Chicago" className="font-black uppercase text-[10px] py-3">US Central</SelectItem>
                      <SelectItem value="America/Denver" className="font-black uppercase text-[10px] py-3">US Mountain</SelectItem>
                      <SelectItem value="America/Los_Angeles" className="font-black uppercase text-[10px] py-3">US Pacific</SelectItem>
                      <SelectItem value="Europe/London" className="font-black uppercase text-[10px] py-3">London</SelectItem>
                      <SelectItem value="Europe/Paris" className="font-black uppercase text-[10px] py-3">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo" className="font-black uppercase text-[10px] py-3">Tokyo</SelectItem>
                      <SelectItem value="UTC" className="font-black uppercase text-[10px] py-3">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={prevStep} className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 text-white font-black uppercase tracking-widest text-[10px] flex gap-3">
                    <ArrowLeft className="h-5 w-5" /> Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex gap-3 shadow-2xl shadow-primary/20">
                    Continue <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label className={labelClasses}>Maximum Capacity</Label>
                  <Input
                    className={inputClasses}
                    type="number"
                    placeholder="Leave blank for unlimited capacity"
                    {...register("maxCapacity", { 
                      setValueAs: (v) => v === "" || Number.isNaN(parseInt(v, 10)) ? undefined : parseInt(v, 10) 
                    })}
                  />
                  {errors.maxCapacity && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">{errors.maxCapacity.message}</p>
                  )}
                </div>
                <div className="flex items-start gap-6 rounded-[32px] bg-white/3 border border-white/5 p-8 group hover:bg-white/5 transition-all">
                   <div className="pt-1">
                      <Checkbox
                        id="registrationEnabled"
                        checked={watch("registrationEnabled")}
                        onCheckedChange={(checked) =>
                          setValue("registrationEnabled", !!checked)
                        }
                        className="h-6 w-6 rounded-lg border-2 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                   </div>
                  <div className="space-y-1">
                    <Label htmlFor="registrationEnabled" className="text-sm font-black text-white italic uppercase tracking-tight leading-none">
                      Enable Registration
                    </Label>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                      Allow attendees to register or purchase access for this event.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between pt-8">
                  <Button type="button" variant="outline" onClick={prevStep} className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 text-white font-black uppercase tracking-widest text-[10px] flex gap-3">
                    <ArrowLeft className="h-5 w-5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEvent.isPending}
                    className="h-14 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex gap-3 shadow-2xl shadow-primary/20 disabled:opacity-20"
                  >
                    {createEvent.isPending ? "Creating..." : "Create Event"}
                    {!createEvent.isPending && <ShieldCheck className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}
