import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { generateAndSendTicket } from "@/server/actions/generateAndSendTicket";

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
  status: "valid" | "voided" | "expired" | "used" | null;
  attendee_name: string | null;
  attendee_email: string | null;
  checked_in: boolean | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type TicketTypeRow = {
  id: string;
  name: string;
};

type OrderRow = {
  id: string;
  order_number: string;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string | null;
  settings: unknown;
  visitor_code: string | null;
};

function mapTicket(
  row: TicketRow,
  ticketTypeName?: string | null,
  orderNumber?: string | null
) {
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
    ticketTypeName: ticketTypeName ?? null,
    orderNumber: orderNumber ?? null,
  };
}

export const ticketsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        status: z.enum(["valid", "voided", "expired", "used"]).optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("tickets")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .eq("event_id", input.eventId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.search) {
        query = query.or(`attendee_name.ilike.%${input.search}%,attendee_email.ilike.%${input.search}%,barcode.ilike.%${input.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const ticketRows = (data ?? []) as TicketRow[];
      const ticketTypeIds = [...new Set(ticketRows.map((ticket) => ticket.ticket_type_id).filter(Boolean))];
      const orderIds = [...new Set(ticketRows.map((ticket) => ticket.order_id).filter(Boolean))] as string[];

      let ticketTypeMap = new Map<string, string>();
      if (ticketTypeIds.length > 0) {
        const { data: ticketTypesData, error: ticketTypesError } = await ctx.supabase
          .from("ticket_types")
          .select("id,name")
          .in("id", ticketTypeIds);
        if (ticketTypesError) throw new Error(ticketTypesError.message);
        ticketTypeMap = new Map(((ticketTypesData ?? []) as TicketTypeRow[]).map((row) => [row.id, row.name]));
      }

      let orderMap = new Map<string, string>();
      if (orderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await ctx.supabase
          .from("orders")
          .select("id,order_number")
          .in("id", orderIds);
        if (ordersError) throw new Error(ordersError.message);
        orderMap = new Map(((ordersData ?? []) as OrderRow[]).map((row) => [row.id, row.order_number]));
      }

      return {
        tickets: ticketRows.map((row) => mapTicket(row, ticketTypeMap.get(row.ticket_type_id) ?? null, row.order_id ? orderMap.get(row.order_id) ?? null : null)),
        total: count ?? 0,
      };
    }),

  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string(), eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: ticket, error } = await ctx.supabase
        .from("tickets")
        .select("*")
        .eq("barcode", input.barcode)
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!ticket) return null;

      const { data: ticketType, error: ticketTypeError } = await ctx.supabase
        .from("ticket_types")
        .select("name")
        .eq("id", ticket.ticket_type_id)
        .maybeSingle();

      if (ticketTypeError) throw new Error(ticketTypeError.message);

      return mapTicket(ticket as TicketRow, ticketType?.name ?? null);
    }),

  sendEmail: protectedProcedure
    .input(z.object({ ticketId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: ticket, error: ticketError } = await ctx.supabase
        .from("tickets")
        .select("*")
        .eq("id", input.ticketId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (ticketError) throw new Error(ticketError.message);
      if (!ticket) throw new Error("Ticket not found");
      if (!ticket.attendee_email) throw new Error("Ticket has no attendee email");

      const [{ data: ticketType, error: ticketTypeError }, { data: order, error: orderError }, { data: event, error: eventError }] = await Promise.all([
        ctx.supabase.from("ticket_types").select("name").eq("id", ticket.ticket_type_id).maybeSingle(),
        ticket.order_id
          ? ctx.supabase.from("orders").select("order_number").eq("id", ticket.order_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        ctx.supabase.from("events").select("title,starts_at,settings,visitor_code").eq("id", ticket.event_id).maybeSingle(),
      ]);

      if (ticketTypeError) throw new Error(ticketTypeError.message);
      if (orderError) throw new Error(orderError.message);
      if (eventError) throw new Error(eventError.message);

      const eventData = event as EventRow | null;
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      await generateAndSendTicket({
        ticketId: ticket.id,
        toEmail: ticket.attendee_email,
        attendeeName: ticket.attendee_name ?? "Attendee",
        ticketTypeName: ticketType?.name ?? "General Admission",
        orderNumber: order?.order_number ?? ticket.barcode,
        barcode: ticket.barcode,
        eventName: eventData?.title ?? "Event",
        eventStartsAt: eventData?.starts_at ? new Date(eventData.starts_at) : new Date(),
        appBaseUrl,
        eventSettings: eventData?.settings,
        visitorCode: eventData?.visitor_code ?? undefined,
      });

      return { success: true };
    }),
});
