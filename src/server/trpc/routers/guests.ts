import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { sendTicketEmail } from "@/server/actions/email";
import { format } from "date-fns";
import crypto from "crypto";

type GuestStatus = "invited" | "confirmed" | "declined" | "waitlisted" | "checked_in" | "no_show";
type TicketStatus = "valid" | "voided" | "expired" | "used";

type GuestRow = {
  id: string;
  event_id: string;
  contact_id: string | null;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: GuestStatus;
  party_size: number | null;
  party_leader_id: string | null;
  table_number: string | null;
  seat_number: string | null;
  notes: string | null;
  tags: string[] | null;
  guest_type: string | null;
  custom_data: unknown;
  rsvp_status: string | null;
  rsvp_at: string | null;
  source: string | null;
  sort_order: number | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  attendance_state: string;
  created_at: string;
  updated_at: string;
};

type TicketRow = {
  id: string;
  company_id: string;
  event_id: string;
  ticket_type_id: string;
  order_id: string | null;
  guest_id: string | null;
  contact_id: string | null;
  barcode: string;
  barcode_type: string | null;
  barcode_url: string | null;
  pdf_url: string | null;
  wallet_url: string | null;
  status: TicketStatus | null;
  attendee_name: string | null;
  attendee_email: string | null;
  checked_in: boolean | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string | null;
  settings: Record<string, unknown> | null;
};

type TicketTypeRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
};

function mapTicket(row: TicketRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    ticketTypeId: row.ticket_type_id,
    orderId: row.order_id,
    guestId: row.guest_id,
    contactId: row.contact_id,
    barcode: row.barcode,
    barcodeType: row.barcode_type,
    barcodeUrl: row.barcode_url,
    pdfUrl: row.pdf_url,
    walletUrl: row.wallet_url,
    status: row.status,
    attendeeName: row.attendee_name,
    attendeeEmail: row.attendee_email,
    checkedIn: row.checked_in ?? false,
    checkedInAt: row.checked_in_at,
    checkedInBy: row.checked_in_by,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGuest(row: GuestRow, ticket?: TicketRow | null) {
  return {
    id: row.id,
    eventId: row.event_id,
    contactId: row.contact_id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    partySize: row.party_size,
    partyLeaderId: row.party_leader_id,
    tableNumber: row.table_number,
    seatNumber: row.seat_number,
    notes: row.notes,
    tags: row.tags,
    guestType: row.guest_type,
    customData: row.custom_data,
    rsvpStatus: row.rsvp_status,
    rsvpAt: row.rsvp_at,
    source: row.source,
    sortOrder: row.sort_order,
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
    attendanceState: row.attendance_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ticket: ticket ? mapTicket(ticket) : null,
  };
}

async function insertScan(ctx: { supabase: { from: (table: string) => any }; companyId: string; userId: string }, payload: {
  eventId: string;
  ticketId?: string | null;
  barcode?: string | null;
  scanType: "check_in" | "checkout" | "invalid";
  method: "scan" | "search" | "manual" | "walkup";
  result?: string | null;
  notes?: string | null;
  deviceInfo?: Record<string, string>;
}) {
  const deviceId = payload.deviceInfo?.deviceId;
  const deviceName = payload.deviceInfo?.deviceName;
  const deviceInfo = deviceId || deviceName ? payload.deviceInfo : undefined;

  const { error } = await ctx.supabase.from("scans").insert({
    company_id: ctx.companyId,
    event_id: payload.eventId,
    ticket_id: payload.ticketId ?? null,
    barcode: payload.barcode ?? null,
    scan_type: payload.scanType,
    method: payload.method,
    result: payload.result ?? (payload.scanType === "invalid" ? "invalid" : "success"),
    notes: payload.notes ?? null,
    device_info: deviceInfo ?? {},
    scanned_by: ctx.userId,
  });

  if (error) {
    console.error("[guests.insertScan]", error.message);
  }
}

export const guestsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        status: z.enum(["invited", "confirmed", "declined", "waitlisted", "checked_in", "no_show"]).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("guests")
        .select("*", { count: "exact" })
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.search) {
        const search = input.search.trim();
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const guestRows = (data ?? []) as GuestRow[];
      const guestIds = guestRows.map((guest) => guest.id);
      let ticketMap = new Map<string, TicketRow>();

      if (guestIds.length > 0) {
        const { data: ticketsData, error: ticketsError } = await ctx.supabase
          .from("tickets")
          .select("*")
          .eq("event_id", input.eventId)
          .in("guest_id", guestIds);

        if (ticketsError) throw new Error(ticketsError.message);
        ticketMap = new Map(((ticketsData ?? []) as TicketRow[]).filter((ticket) => ticket.guest_id).map((ticket) => [ticket.guest_id as string, ticket]));
      }

      return {
        guests: guestRows.map((guest) => mapGuest(guest, ticketMap.get(guest.id) ?? null)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("guests")
        .select("*")
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Guest not found");
      return mapGuest(data as GuestRow);
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        firstName: z.string().min(1).max(255),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        guestType: z.string().max(100).optional(),
        tableNumber: z.string().max(50).optional(),
        seatNumber: z.string().max(50).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("guests")
        .insert({
          event_id: input.eventId,
          company_id: ctx.companyId,
          first_name: input.firstName,
          last_name: input.lastName ?? null,
          email: input.email || null,
          phone: input.phone ?? null,
          guest_type: input.guestType ?? null,
          table_number: input.tableNumber ?? null,
          seat_number: input.seatNumber ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? null,
          source: "manual",
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapGuest(data as GuestRow);
    }),

  bulkCreate: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        guests: z.array(
          z.object({
            firstName: z.string().min(1),
            lastName: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            guestType: z.string().optional(),
            tableNumber: z.string().optional(),
            seatNumber: z.string().optional(),
            notes: z.string().optional(),
            tags: z.array(z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from("guests").insert(
        input.guests.map((guest) => ({
          event_id: input.eventId,
          company_id: ctx.companyId,
          first_name: guest.firstName,
          last_name: guest.lastName ?? null,
          email: guest.email || null,
          phone: guest.phone ?? null,
          guest_type: guest.guestType ?? null,
          table_number: guest.tableNumber ?? null,
          seat_number: guest.seatNumber ?? null,
          notes: guest.notes ?? null,
          tags: guest.tags ?? null,
          source: "import",
        }))
      );

      if (error) throw new Error(error.message);
      return { imported: input.guests.length };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1).max(255).optional(),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        status: z.enum(["invited", "confirmed", "declined", "waitlisted", "checked_in", "no_show"]).optional(),
        guestType: z.string().max(100).optional(),
        tableNumber: z.string().max(50).optional(),
        seatNumber: z.string().max(50).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.firstName !== undefined) payload.first_name = input.firstName;
      if (input.lastName !== undefined) payload.last_name = input.lastName;
      if (input.email !== undefined) payload.email = input.email || null;
      if (input.phone !== undefined) payload.phone = input.phone;
      if (input.status !== undefined) payload.status = input.status;
      if (input.guestType !== undefined) payload.guest_type = input.guestType;
      if (input.tableNumber !== undefined) payload.table_number = input.tableNumber;
      if (input.seatNumber !== undefined) payload.seat_number = input.seatNumber;
      if (input.notes !== undefined) payload.notes = input.notes;
      if (input.tags !== undefined) payload.tags = input.tags;

      const { data, error } = await ctx.supabase
        .from("guests")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapGuest(data as GuestRow);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("guests")
        .delete()
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("guests")
        .delete()
        .eq("company_id", ctx.companyId)
        .in("id", input.ids);

      if (error) throw new Error(error.message);
      return { deleted: input.ids.length };
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
        status: z.enum(["invited", "confirmed", "declined", "waitlisted", "checked_in", "no_show"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.status === "checked_in") {
        payload.checked_in_at = new Date().toISOString();
        payload.attendance_state = "checked_in";
      } else if (input.status === "confirmed") {
        payload.checked_in_at = null;
      }

      const { data, error } = await ctx.supabase
        .from("guests")
        .update(payload)
        .eq("company_id", ctx.companyId)
        .in("id", input.ids)
        .select("id");

      if (error) throw new Error(error.message);
      return { updated: data?.length ?? 0 };
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("guests")
        .select("status")
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId);

      if (error) throw new Error(error.message);

      const counts = {
        total: data?.length ?? 0,
        invited: 0,
        confirmed: 0,
        declined: 0,
        waitlisted: 0,
        checked_in: 0,
        no_show: 0,
      };

      for (const row of data ?? []) {
        if (row.status in counts) {
          counts[row.status as keyof typeof counts] += 1;
        }
      }

      return {
        ...counts,
        checkedIn: counts.checked_in,
      };
    }),

  checkIn: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        eventId: z.string().uuid(),
        barcode: z.string().optional(),
        deviceInfo: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: guestData, error: guestError } = await ctx.supabase
        .from("guests")
        .select("*")
        .eq("id", input.guestId)
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (guestError) throw new Error(guestError.message);
      if (!guestData) throw new Error("Guest not found for this event");

      if (guestData.status === "checked_in") {
        return { guest: mapGuest(guestData as GuestRow), alreadyCheckedIn: true };
      }

      const now = new Date().toISOString();
      const { data: updatedGuest, error: updateGuestError } = await ctx.supabase
        .from("guests")
        .update({
          status: "checked_in",
          checked_in_at: now,
          checked_out_at: null,
          attendance_state: "checked_in",
          updated_at: now,
        })
        .eq("id", input.guestId)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (updateGuestError) throw new Error(updateGuestError.message);

      const { data: linkedTicket, error: ticketError } = await ctx.supabase
        .from("tickets")
        .select("*")
        .eq("guest_id", input.guestId)
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ticketError) throw new Error(ticketError.message);

      if (linkedTicket) {
        const { error: ticketUpdateError } = await ctx.supabase
          .from("tickets")
          .update({
            checked_in: true,
            checked_in_at: now,
            updated_at: now,
          })
          .eq("id", linkedTicket.id)
          .eq("company_id", ctx.companyId);

        if (ticketUpdateError) throw new Error(ticketUpdateError.message);
      }

      await insertScan(ctx as { supabase: { from: (table: string) => any }; companyId: string; userId: string }, {
        eventId: input.eventId,
        ticketId: linkedTicket?.id ?? null,
        barcode: input.barcode ?? linkedTicket?.barcode ?? null,
        scanType: "check_in",
        method: input.barcode ? "scan" : "manual",
        deviceInfo: input.deviceInfo,
      });

      return {
        guest: mapGuest(updatedGuest as GuestRow, linkedTicket as TicketRow | null),
        alreadyCheckedIn: false,
      };
    }),

  undoCheckIn: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        eventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const { data: updatedGuest, error: guestError } = await ctx.supabase
        .from("guests")
        .update({
          status: "confirmed",
          checked_out_at: now,
          attendance_state: "checked_out",
          updated_at: now,
        })
        .eq("id", input.guestId)
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .select("*")
        .maybeSingle();

      if (guestError) throw new Error(guestError.message);
      if (!updatedGuest) throw new Error("Guest not found");

      const { data: linkedTicket, error: ticketError } = await ctx.supabase
        .from("tickets")
        .select("*")
        .eq("guest_id", input.guestId)
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ticketError) throw new Error(ticketError.message);

      if (linkedTicket) {
        const { error: ticketUpdateError } = await ctx.supabase
          .from("tickets")
          .update({
            checked_in: false,
            updated_at: now,
          })
          .eq("id", linkedTicket.id)
          .eq("company_id", ctx.companyId);

        if (ticketUpdateError) throw new Error(ticketUpdateError.message);
      }

      await insertScan(ctx as { supabase: { from: (table: string) => any }; companyId: string; userId: string }, {
        eventId: input.eventId,
        ticketId: linkedTicket?.id ?? null,
        barcode: linkedTicket?.barcode ?? null,
        scanType: "checkout",
        method: "manual",
      });

      return { guest: mapGuest(updatedGuest as GuestRow, linkedTicket as TicketRow | null) };
    }),

  sendTicketEmail: protectedProcedure
    .input(z.object({ guestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: guestData, error: guestError } = await ctx.supabase
        .from("guests")
        .select("*")
        .eq("id", input.guestId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (guestError) throw new Error(guestError.message);
      if (!guestData) throw new Error("Guest not found");
      if (!guestData.email) throw new Error("Guest does not have an email address.");

      const { data: eventData, error: eventError } = await ctx.supabase
        .from("events")
        .select("id,title,starts_at,settings")
        .eq("id", guestData.event_id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (eventError) throw new Error(eventError.message);
      if (!eventData) throw new Error("Event not found");

      const { data: existingTicketRows, error: existingTicketError } = await ctx.supabase
        .from("tickets")
        .select("*")
        .eq("guest_id", input.guestId)
        .eq("event_id", guestData.event_id)
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingTicketError) throw new Error(existingTicketError.message);

      let ticketData = (existingTicketRows?.[0] as TicketRow | undefined) ?? null;
      let ticketTypeData: TicketTypeRow | null = null;

      if (ticketData?.ticket_type_id) {
        const { data: ticketType, error: ticketTypeError } = await ctx.supabase
          .from("ticket_types")
          .select("id,name,description,price,currency,status,created_at")
          .eq("id", ticketData.ticket_type_id)
          .maybeSingle();
        if (ticketTypeError) throw new Error(ticketTypeError.message);
        ticketTypeData = (ticketType as TicketTypeRow | null) ?? null;
      }

      if (!ticketData) {
        const { data: activeTicketTypes, error: activeTicketTypesError } = await ctx.supabase
          .from("ticket_types")
          .select("id,name,description,price,currency,status,created_at")
          .eq("event_id", guestData.event_id)
          .eq("company_id", ctx.companyId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);
        if (activeTicketTypesError) throw new Error(activeTicketTypesError.message);

        ticketTypeData = (activeTicketTypes?.[0] as TicketTypeRow | undefined) ?? null;

        if (!ticketTypeData) {
          const { data: anyTicketTypes, error: anyTicketTypesError } = await ctx.supabase
            .from("ticket_types")
            .select("id,name,description,price,currency,status,created_at")
            .eq("event_id", guestData.event_id)
            .eq("company_id", ctx.companyId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (anyTicketTypesError) throw new Error(anyTicketTypesError.message);
          ticketTypeData = (anyTicketTypes?.[0] as TicketTypeRow | undefined) ?? null;
        }

        if (!ticketTypeData) {
          const { data: createdTicketType, error: createTicketTypeError } = await ctx.supabase
            .from("ticket_types")
            .insert({
              event_id: guestData.event_id,
              company_id: ctx.companyId,
              name: "General Admission",
              description: "Auto-created for guest ticket delivery",
              price: 0,
              currency: "USD",
              status: "active",
            })
            .select("id,name,description,price,currency,status,created_at")
            .single();

          if (createTicketTypeError) throw new Error(createTicketTypeError.message);
          ticketTypeData = createdTicketType as TicketTypeRow;
        }

        const barcode = `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
        const attendeeName = `${guestData.first_name ?? ""} ${guestData.last_name ?? ""}`.trim() || "Guest";

        const { data: createdTicket, error: createTicketError } = await ctx.supabase
          .from("tickets")
          .insert({
            company_id: ctx.companyId,
            event_id: guestData.event_id,
            ticket_type_id: ticketTypeData.id,
            guest_id: guestData.id,
            barcode,
            attendee_name: attendeeName,
            attendee_email: guestData.email,
            status: "valid",
          })
          .select("*")
          .single();

        if (createTicketError) throw new Error(createTicketError.message);
        ticketData = createdTicket as TicketRow;
      }

      if (!ticketData) {
        throw new Error("Failed to create or find ticket for guest.");
      }

      const settings = (eventData.settings as Record<string, unknown> | null) ?? {};
      const emailDesign = settings.emailDesign as Parameters<typeof sendTicketEmail>[0]["emailDesign"];
      const ticketDesign = settings.ticketDesign as Parameters<typeof sendTicketEmail>[0]["ticketDesign"];

      const eventDate = eventData.starts_at ? format(new Date(eventData.starts_at), "MMM d, yyyy") : undefined;
      const eventTime = eventData.starts_at ? format(new Date(eventData.starts_at), "h:mm a") : undefined;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const ticketUrl = `${baseUrl}/api/tickets/${ticketData.id}/pdf`;
      const confirmAttendanceUrl = `${baseUrl}/rsvp/confirm?guestId=${guestData.id}&eventId=${guestData.event_id}`;

      const result = await sendTicketEmail({
        toEmail: guestData.email,
        eventName: eventData.title || "Event",
        attendeeName: `${guestData.first_name ?? ""} ${guestData.last_name ?? ""}`.trim(),
        ticketName: ticketTypeData?.name || "General Admission",
        orderNumber: ticketData.barcode,
        barcode: ticketData.barcode,
        eventDate,
        eventTime,
        eventLocation: undefined,
        ticketUrl,
        confirmAttendanceUrl,
        emailDesign,
        ticketDesign,
      });

      if (!result.success) {
        if (result.code === "EMAIL_NOT_CONFIGURED") {
          throw new Error("Email service is not configured. Add RESEND_API_KEY to .env.local and restart the app.");
        }
        const detail = result.error instanceof Error ? result.error.message : String(result.error);
        console.error("[sendTicketEmail] Resend error:", result.error);
        throw new Error(`Failed to send email: ${detail}`);
      }

      return result;
    }),
});
