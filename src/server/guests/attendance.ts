type SupabaseClientLike = {
  from: (table: string) => any;
};

type GuestAttendanceRow = {
  id: string;
  event_id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  rsvp_status: string | null;
  rsvp_at: string | null;
};

export function getGuestConfirmationLabel(rsvpStatus: string | null | undefined) {
  switch (rsvpStatus) {
    case "accepted":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "maybe":
      return "Maybe";
    default:
      return "Not Yet Confirmed";
  }
}

export async function confirmGuestAttendance(
  supabase: SupabaseClientLike,
  input: {
    guestId: string;
    eventId?: string;
    email?: string;
  }
) {
  let query = supabase
    .from("guests")
    .select("id,event_id,company_id,first_name,last_name,email,status,rsvp_status,rsvp_at")
    .eq("id", input.guestId);

  if (input.eventId) {
    query = query.eq("event_id", input.eventId);
  }

  if (input.email) {
    query = query.eq("email", input.email);
  }

  const { data: guest, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!guest) {
    throw new Error("Guest invitation not found.");
  }

  const currentGuest = guest as GuestAttendanceRow;
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    rsvp_status: "accepted",
    rsvp_at: currentGuest.rsvp_at ?? now,
    updated_at: now,
  };

  if (currentGuest.status === "invited" || currentGuest.status === "waitlisted") {
    payload.status = "confirmed";
  }

  const { data: updatedGuest, error: updateError } = await supabase
    .from("guests")
    .update(payload)
    .eq("id", currentGuest.id)
    .eq("event_id", currentGuest.event_id)
    .select("id,event_id,company_id,first_name,last_name,email,status,rsvp_status,rsvp_at")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return updatedGuest as GuestAttendanceRow;
}
