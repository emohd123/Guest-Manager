import Link from "next/link";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { confirmGuestAttendance, getGuestConfirmationLabel } from "@/server/guests/attendance";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    guestId?: string;
    eventId?: string;
  }>;
};

export default async function ConfirmAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const guestId = params.guestId?.trim();
  const eventId = params.eventId?.trim();

  if (!guestId || !eventId) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">Invalid Link</p>
          <h1 className="mt-4 text-4xl font-black italic uppercase tracking-tight">Attendance confirmation link is incomplete.</h1>
        </div>
      </main>
    );
  }

  let eventName = "Your event";
  let attendeeName = "Guest";
  let confirmationLabel = "Confirmed";
  let errorMessage: string | null = null;

  try {
    const supabase = createSupabaseAdminClient();
    const confirmedGuest = await confirmGuestAttendance(supabase, { guestId, eventId });

    attendeeName =
      `${confirmedGuest.first_name ?? ""} ${confirmedGuest.last_name ?? ""}`.trim() || "Guest";
    confirmationLabel = getGuestConfirmationLabel(confirmedGuest.rsvp_status);

    const { data: event, error } = await supabase
      .from("events")
      .select("title")
      .eq("id", confirmedGuest.event_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    eventName = event?.title || eventName;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to confirm attendance.";
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,95,82,0.16),_transparent_35%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] text-white px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[36px] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className={`text-sm font-black uppercase tracking-[0.3em] ${errorMessage ? "text-red-400" : "text-primary"}`}>
            {errorMessage ? "Confirmation Failed" : "Attendance Updated"}
          </p>
          <h1 className="mt-4 text-4xl font-black italic uppercase tracking-tight">
            {errorMessage ? "We could not confirm this invitation." : "Attendance confirmed."}
          </h1>
          <p className="mt-6 text-lg text-white/70">
            {errorMessage
              ? errorMessage
              : `${attendeeName}, your RSVP for ${eventName} is now marked as ${confirmationLabel.toLowerCase()}.`}
          </p>
          {!errorMessage ? (
            <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Current Confirmation</p>
              <p className="mt-3 text-3xl font-black italic uppercase text-emerald-100">{confirmationLabel}</p>
            </div>
          ) : null}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-black uppercase tracking-[0.2em] text-white"
            >
              Back to GuestManager
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
