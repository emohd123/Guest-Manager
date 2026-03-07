import { z } from "zod";
import { router, protectedProcedure } from "../index";

type ScanRow = {
  id: string;
  company_id: string;
  event_id: string;
  ticket_id: string | null;
  device_id: string | null;
  scan_type: "check_in" | "checkout" | "invalid";
  method: "scan" | "search" | "manual" | "walkup";
  barcode: string | null;
  result: string | null;
  notes: string | null;
  device_info: Record<string, unknown> | null;
  scanned_at: string;
};

type TicketRow = {
  id: string;
  guest_id: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
};

type GuestRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  guest_type: string | null;
};

type DeviceRow = {
  id: string;
  name: string;
};

async function loadScans(
  ctx: { supabase: { from: (table: string) => any }; companyId: string },
  input: {
    eventId?: string;
    search?: string;
    action?: "check_in" | "checkout" | "invalid";
    limit: number;
    offset: number;
  }
) {
  let query = ctx.supabase
    .from("scans")
    .select("*", { count: "exact" })
    .eq("company_id", ctx.companyId)
    .order("scanned_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.eventId) {
    query = query.eq("event_id", input.eventId);
  }

  if (input.action) {
    query = query.eq("scan_type", input.action);
  }

  if (input.search) {
    query = query.ilike("barcode", `%${input.search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const scanRows = (data ?? []) as ScanRow[];
  const ticketIds = [...new Set(scanRows.map((row) => row.ticket_id).filter(Boolean))] as string[];
  const deviceIds = [...new Set(scanRows.map((row) => row.device_id).filter(Boolean))] as string[];

  let ticketMap = new Map<string, TicketRow>();
  if (ticketIds.length > 0) {
    const { data: ticketsData, error: ticketsError } = await ctx.supabase
      .from("tickets")
      .select("id,guest_id,attendee_name,attendee_email")
      .in("id", ticketIds);
    if (ticketsError) throw new Error(ticketsError.message);
    ticketMap = new Map(((ticketsData ?? []) as TicketRow[]).map((row) => [row.id, row]));
  }

  const guestIds = [...new Set([...ticketMap.values()].map((row) => row.guest_id).filter(Boolean))] as string[];
  let guestMap = new Map<string, GuestRow>();
  if (guestIds.length > 0) {
    const { data: guestsData, error: guestsError } = await ctx.supabase
      .from("guests")
      .select("id,first_name,last_name,guest_type")
      .in("id", guestIds);
    if (guestsError) throw new Error(guestsError.message);
    guestMap = new Map(((guestsData ?? []) as GuestRow[]).map((row) => [row.id, row]));
  }

  let deviceMap = new Map<string, DeviceRow>();
  if (deviceIds.length > 0) {
    const { data: devicesData, error: devicesError } = await ctx.supabase
      .from("devices")
      .select("id,name")
      .in("id", deviceIds);
    if (devicesError) throw new Error(devicesError.message);
    deviceMap = new Map(((devicesData ?? []) as DeviceRow[]).map((row) => [row.id, row]));
  }

  let rows = scanRows.map((row) => {
    const ticket = row.ticket_id ? ticketMap.get(row.ticket_id) ?? null : null;
    const guest = ticket?.guest_id ? guestMap.get(ticket.guest_id) ?? null : null;
    const device = row.device_id ? deviceMap.get(row.device_id) ?? null : null;
    const deviceName = device?.name ?? (typeof row.device_info?.deviceName === "string" ? row.device_info.deviceName : null);

    return {
      id: row.id,
      eventId: row.event_id,
      ticketId: row.ticket_id,
      deviceId: row.device_id,
      scanType: row.scan_type,
      method: row.method,
      barcode: row.barcode,
      result: row.result,
      notes: row.notes,
      deviceInfo: row.device_info,
      deviceName,
      scannedAt: row.scanned_at,
      attendeeName: ticket?.attendee_name ?? null,
      attendeeEmail: ticket?.attendee_email ?? null,
      guestFirstName: guest?.first_name ?? null,
      guestLastName: guest?.last_name ?? null,
      guestType: guest?.guest_type ?? null,
    };
  });

  if (input.search) {
    const search = input.search.toLowerCase();
    rows = rows.filter((row) => {
      const haystack = `${row.barcode ?? ""} ${row.attendeeName ?? ""} ${row.attendeeEmail ?? ""} ${row.guestFirstName ?? ""} ${row.guestLastName ?? ""}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  return {
    scans: rows,
    total: input.search ? rows.length : count ?? rows.length,
  };
}

export const scansRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return loadScans(ctx, {
        eventId: input.eventId,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  arrivals: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        action: z.enum(["check_in", "checkout", "invalid"]).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return loadScans(ctx, {
        eventId: input.eventId,
        search: input.search,
        action: input.action,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        ticketId: z.string().uuid().optional(),
        deviceId: z.string().optional(),
        barcode: z.string().optional(),
        scanType: z.enum(["check_in", "checkout", "invalid"]).default("check_in"),
        method: z.enum(["scan", "search", "manual", "walkup"]).default("scan"),
        result: z.string().optional(),
        notes: z.string().optional(),
        deviceInfo: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("scans")
        .insert({
          company_id: ctx.companyId,
          event_id: input.eventId,
          ticket_id: input.ticketId ?? null,
          device_id: input.deviceId ?? null,
          barcode: input.barcode ?? null,
          scan_type: input.scanType,
          method: input.method,
          result: input.result ?? null,
          notes: input.notes ?? null,
          device_info: input.deviceInfo ?? {},
          scanned_by: ctx.userId,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});
