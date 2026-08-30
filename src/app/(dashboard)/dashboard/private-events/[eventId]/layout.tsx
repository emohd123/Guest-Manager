"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, KeyRound, LayoutDashboard, Palette, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

const sections = (eventId: string) => [
  { label: "Overview", href: `/dashboard/private-events/${eventId}`, icon: LayoutDashboard },
  { label: "Access & details", href: `/dashboard/private-events/${eventId}/settings`, icon: KeyRound },
  { label: "Portal & speakers", href: `/dashboard/private-events/${eventId}/design`, icon: Palette },
  { label: "Programme", href: `/dashboard/private-events/${eventId}/sessions`, icon: CalendarDays },
  { label: "Attendees", href: `/dashboard/private-events/${eventId}/guests`, icon: Users },
];

export default function PrivateConferenceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });

  useEffect(() => {
    if (event && event.eventType !== "conference") router.replace(`/dashboard/events/${eventId}`);
  }, [event, eventId, router]);

  if (isLoading) return <div className="h-40 animate-pulse rounded-3xl border bg-card" />;
  if (!event || event.eventType !== "conference") return null;

  return (
    <div className="space-y-6 pb-12">
      <nav aria-label="Private conference management" className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-card p-2">
        <div className="flex min-w-max gap-1">
          {sections(eventId).map((section) => {
            const active = pathname === section.href;
            return <Link key={section.href} href={section.href} className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition", active ? "bg-cyan-500 text-slate-950" : "text-muted-foreground hover:bg-cyan-500/10 hover:text-foreground")} aria-current={active ? "page" : undefined}><section.icon className="h-4 w-4" />{section.label}</Link>;
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
