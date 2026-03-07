import { z } from "zod";
import { router, protectedProcedure } from "../index";

type GuestRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  table_number: string | null;
  rsvp_status: string | null;
  rsvp_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  attendance_state: string;
};

type TicketRow = {
  id: string;
  ticket_type_id: string;
  guest_id: string | null;
  barcode: string;
  attendee_name: string | null;
  attendee_email: string | null;
  checked_in: boolean | null;
};

type TicketTypeRow = {
  id: string;
  name: string;
};

type ScanRow = {
  id: string;
  ticket_id: string | null;
  device_id: string | null;
  scan_type: "check_in" | "checkout" | "invalid";
  barcode: string | null;
  result: string | null;
  scanned_at: string;
  device_info: Record<string, unknown> | null;
};

type DeviceRow = {
  id: string;
  name: string;
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function confirmationLabel(status: string | null) {
  switch (status) {
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

async function loadReportData(ctx: { supabase: { from: (table: string) => any }; companyId: string }, eventId: string) {
  const [{ data: guestsData, error: guestsError }, { data: ticketsData, error: ticketsError }, { data: ticketTypesData, error: ticketTypesError }, { data: scansData, error: scansError }] = await Promise.all([
    ctx.supabase.from("guests").select("id,first_name,last_name,email,status,table_number,rsvp_status,rsvp_at,checked_in_at,checked_out_at,attendance_state").eq("company_id", ctx.companyId).eq("event_id", eventId),
    ctx.supabase.from("tickets").select("id,ticket_type_id,guest_id,barcode,attendee_name,attendee_email,checked_in").eq("company_id", ctx.companyId).eq("event_id", eventId),
    ctx.supabase.from("ticket_types").select("id,name").eq("company_id", ctx.companyId).eq("event_id", eventId),
    ctx.supabase.from("scans").select("id,ticket_id,device_id,scan_type,barcode,result,scanned_at,device_info").eq("company_id", ctx.companyId).eq("event_id", eventId).order("scanned_at", { ascending: true }),
  ]);

  if (guestsError) throw new Error(guestsError.message);
  if (ticketsError) throw new Error(ticketsError.message);
  if (ticketTypesError) throw new Error(ticketTypesError.message);
  if (scansError) throw new Error(scansError.message);

  return {
    guests: (guestsData ?? []) as GuestRow[],
    tickets: (ticketsData ?? []) as TicketRow[],
    ticketTypes: (ticketTypesData ?? []) as TicketTypeRow[],
    scans: (scansData ?? []) as ScanRow[],
  };
}

export const reportsRouter = router({
  attendeeRoster: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { guests } = await loadReportData(ctx, input.eventId);

      return guests.map((guest) => ({
        id: guest.id,
        guestName: `${guest.first_name ?? ""} ${guest.last_name ?? ""}`.trim() || "Guest",
        currentState: guest.status.replace(/_/g, " "),
        allocation: guest.table_number ? `Table ${guest.table_number}` : "General Admission",
        confirmation: confirmationLabel(guest.rsvp_status),
        confirmationAt: guest.rsvp_at,
      }));
    }),

  checkInSummary: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { guests, tickets, ticketTypes, scans } = await loadReportData(ctx, input.eventId);

      const totalGuests = guests.length;
      const checkedIn = guests.filter((guest) => guest.status === "checked_in").length;
      const noShow = guests.filter((guest) => guest.status === "no_show").length;
      const guestMap = new Map(guests.map((guest) => [guest.id, guest]));

      const checkinsByTicketType = ticketTypes.map((ticketType) => {
        const relatedTickets = tickets.filter((ticket) => ticket.ticket_type_id === ticketType.id);
        const total = relatedTickets.length;
        const checkedInCount = relatedTickets.filter((ticket) => {
          const guest = ticket.guest_id ? guestMap.get(ticket.guest_id) : null;
          return ticket.checked_in || guest?.status === "checked_in";
        }).length;
        const checkedOutCount = relatedTickets.filter((ticket) => {
          const guest = ticket.guest_id ? guestMap.get(ticket.guest_id) : null;
          return guest?.attendance_state === "checked_out";
        }).length;
        const noShowCount = relatedTickets.filter((ticket) => {
          const guest = ticket.guest_id ? guestMap.get(ticket.guest_id) : null;
          return guest?.status === "no_show";
        }).length;

        return {
          id: ticketType.id,
          name: ticketType.name,
          checkedIn: checkedInCount,
          checkedOut: checkedOutCount,
          noShow: noShowCount,
          total,
          arrivedPct: total > 0 ? Math.round((checkedInCount / total) * 100) : 0,
        };
      });

      const arrivalsBuckets = new Map<string, { success: number; failure: number }>();
      for (const scan of scans) {
        const hour = new Date(scan.scanned_at);
        hour.setMinutes(0, 0, 0);
        const key = hour.toISOString();
        const bucket = arrivalsBuckets.get(key) ?? { success: 0, failure: 0 };
        if (scan.scan_type === "invalid" || scan.result === "invalid") {
          bucket.failure += 1;
        } else {
          bucket.success += 1;
        }
        arrivalsBuckets.set(key, bucket);
      }

      const arrivalsTimeSeries = [...arrivalsBuckets.entries()].map(([hour, counts]) => ({
        hour,
        success: counts.success,
        failure: counts.failure,
      }));

      return {
        totalGuests,
        checkedIn,
        noShow,
        checkinsByTicketType,
        arrivalsTimeSeries,
      };
    }),

  exportCheckinsCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { guests } = await loadReportData(ctx, input.eventId);
      const rows = guests
        .filter((guest) => guest.status === "checked_in")
        .map((guest) => [guest.first_name, guest.last_name, guest.email, guest.status, guest.checked_in_at]);

      return {
        filename: `checkins-${input.eventId}.csv`,
        contentType: "text/csv",
        csv: toCsv(["First Name", "Last Name", "Email", "Status", "Checked In At"], rows),
      };
    }),

  exportNoShowsCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { guests } = await loadReportData(ctx, input.eventId);
      const rows = guests
        .filter((guest) => guest.status === "no_show")
        .map((guest) => [guest.first_name, guest.last_name, guest.email, guest.status]);

      return {
        filename: `no-shows-${input.eventId}.csv`,
        contentType: "text/csv",
        csv: toCsv(["First Name", "Last Name", "Email", "Status"], rows),
      };
    }),

  exportArrivalsCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { scans, tickets } = await loadReportData(ctx, input.eventId);
      const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));
      const deviceIds = [...new Set(scans.map((scan) => scan.device_id).filter(Boolean))] as string[];
      let deviceMap = new Map<string, DeviceRow>();

      if (deviceIds.length > 0) {
        const { data: devicesData, error: devicesError } = await ctx.supabase
          .from("devices")
          .select("id,name")
          .in("id", deviceIds);
        if (devicesError) throw new Error(devicesError.message);
        deviceMap = new Map(((devicesData ?? []) as DeviceRow[]).map((device) => [device.id, device]));
      }

      const rows = scans.map((scan) => {
        const ticket = scan.ticket_id ? ticketMap.get(scan.ticket_id) ?? null : null;
        const deviceName = scan.device_id ? deviceMap.get(scan.device_id)?.name ?? null : null;
        const fallbackDeviceName = typeof scan.device_info?.deviceName === "string" ? scan.device_info.deviceName : null;

        return [
          scan.scanned_at,
          scan.scan_type,
          scan.result,
          scan.barcode ?? ticket?.barcode ?? "",
          ticket?.attendee_name ?? "",
          ticket?.attendee_email ?? "",
          deviceName ?? fallbackDeviceName ?? "",
        ];
      });

      return {
        filename: `arrivals-${input.eventId}.csv`,
        contentType: "text/csv",
        csv: toCsv(["Scanned At", "Action", "Result", "Barcode", "Attendee", "Email", "Device"], rows),
      };
    }),

  exportAttendeeRosterCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { guests } = await loadReportData(ctx, input.eventId);
      const rows = guests.map((guest) => [
        `${guest.first_name ?? ""} ${guest.last_name ?? ""}`.trim() || "Guest",
        guest.status.replace(/_/g, " "),
        guest.table_number ? `Table ${guest.table_number}` : "General Admission",
        confirmationLabel(guest.rsvp_status),
      ]);

      return {
        filename: `attendee-roster-${input.eventId}.csv`,
        contentType: "text/csv",
        csv: toCsv(["Guest Name", "Current State", "Allocation", "Confirmation"], rows),
      };
    }),
});
