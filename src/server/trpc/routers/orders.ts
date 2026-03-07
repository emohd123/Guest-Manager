import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { orders, orderItems, ticketTypes, guests, tickets, events } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { sendTicketEmail } from "@/server/actions/email";
import crypto from "crypto";

type OrderRow = {
  id: string;
  company_id: string;
  event_id: string;
  contact_id: string | null;
  order_number: string;
  status: "cart" | "pending" | "completed" | "cancelled" | "refunded" | null;
  email: string | null;
  name: string | null;
  subtotal: number | null;
  tax: number | null;
  service_fee: number | null;
  discount: number | null;
  total: number | null;
  currency: string | null;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  completed_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

function mapOrder(row: OrderRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    contactId: row.contact_id,
    orderNumber: row.order_number,
    status: row.status,
    email: row.email,
    name: row.name,
    subtotal: row.subtotal,
    tax: row.tax,
    serviceFee: row.service_fee,
    discount: row.discount,
    total: row.total,
    currency: row.currency,
    paymentMethod: row.payment_method,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeChargeId: row.stripe_charge_id,
    completedAt: row.completed_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        status: z.enum(["cart", "pending", "completed", "cancelled", "refunded"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.eventId) query = query.eq("event_id", input.eventId);
      if (input.status) query = query.eq("status", input.status);
      if (input.search) {
        query = query.or(
          `order_number.ilike.%${input.search}%,email.ilike.%${input.search}%,name.ilike.%${input.search}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        orders: ((data ?? []) as OrderRow[]).map((row) => mapOrder(row)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: order, error } = await ctx.supabase
        .from("orders")
        .select("*")
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!order) throw new Error("Order not found");

      const { data: itemsData, error: itemsError } = await ctx.supabase
        .from("order_items")
        .select("id,order_id,ticket_type_id,quantity,unit_price,total")
        .eq("order_id", input.id);
      if (itemsError) throw new Error(itemsError.message);

      const ticketTypeIds = [...new Set((itemsData ?? []).map((item) => item.ticket_type_id).filter(Boolean))];
      let ticketTypeMap = new Map<string, string>();
      if (ticketTypeIds.length > 0) {
        const { data: ticketTypesData, error: ticketTypesError } = await ctx.supabase
          .from("ticket_types")
          .select("id,name")
          .in("id", ticketTypeIds);
        if (ticketTypesError) throw new Error(ticketTypesError.message);
        ticketTypeMap = new Map((ticketTypesData ?? []).map((ticketType) => [ticketType.id, ticketType.name]));
      }

      return {
        ...mapOrder(order as OrderRow),
        items: (itemsData ?? []).map((item) => ({
          id: item.id,
          orderId: item.order_id,
          ticketTypeId: item.ticket_type_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total,
          ticketTypeName: ticketTypeMap.get(item.ticket_type_id) ?? null,
        })),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        contactId: z.string().uuid().optional(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        currency: z.string().length(3).default("USD"),
        items: z.array(
          z.object({
            ticketTypeId: z.string().uuid(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      const order = await ctx.db
        .insert(orders)
        .values({
          companyId: ctx.companyId,
          eventId: input.eventId,
          contactId: input.contactId,
          orderNumber: generateOrderNumber(),
          status: "completed",
          email: input.email,
          name: input.name,
          subtotal,
          total: subtotal,
          currency: input.currency,
          completedAt: new Date(),
        })
        .returning();

      if (input.items.length > 0) {
        await ctx.db.insert(orderItems).values(
          input.items.map((item) => ({
            orderId: order[0].id,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          }))
        );

        // Increment quantitySold for each ticket type, create Guests & Tickets
        for (const item of input.items) {
          // Update ticket type quantity
          await ctx.db
            .update(ticketTypes)
            .set({
              quantitySold: sql`${ticketTypes.quantitySold} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(ticketTypes.id, item.ticketTypeId));

          // Fetch event and ticket type info for the email dispatch
          const [eventRow] = await ctx.db
            .select()
            .from(events)
            .where(eq(events.id, input.eventId))
            .limit(1);

          const [ticketRow] = await ctx.db
            .select()
            .from(ticketTypes)
            .where(eq(ticketTypes.id, item.ticketTypeId))
            .limit(1);

          // Generate guests and tickets for the purchased quantity
          for (let i = 0; i < item.quantity; i++) {
            const [guest] = await ctx.db
              .insert(guests)
              .values({
                companyId: ctx.companyId,
                eventId: input.eventId,
                contactId: input.contactId,
                firstName: input.name ? input.name.split(" ")[0] : "Guest",
                lastName: input.name ? input.name.split(" ").slice(1).join(" ") : "",
                email: input.email,
                status: "confirmed",
                guestType: ticketRow?.name,
              })
              .returning();

            const barcode = `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

            await ctx.db.insert(tickets).values({
              companyId: ctx.companyId,
              eventId: input.eventId,
              ticketTypeId: item.ticketTypeId,
              orderId: order[0].id,
              guestId: guest.id,
              contactId: input.contactId,
              barcode: barcode,
              attendeeName: input.name,
              attendeeEmail: input.email,
              status: "valid",
            });

            // Dispatch digital ticket email
            if (input.email && eventRow && ticketRow) {
              const emailResult = await sendTicketEmail({
                toEmail: input.email,
                eventName: eventRow.title,
                attendeeName: input.name || "Guest",
                ticketName: ticketRow.name,
                orderNumber: order[0].orderNumber,
                barcode: barcode,
                eventDate: eventRow.startsAt ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(eventRow.startsAt) : undefined,
              });

              if (!emailResult.success) {
                console.error("[orders.create] Ticket email dispatch failed:", {
                  code: emailResult.code,
                  recipient: input.email,
                  orderId: order[0].id,
                });
              }
            }
          }
        }
      }

      return order[0];
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["cart", "pending", "completed", "cancelled", "refunded"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.status === "completed") {
        payload.completed_at = new Date().toISOString();
      }

      const { data, error } = await ctx.supabase
        .from("orders")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapOrder(data as OrderRow);
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      let ordersQuery = ctx.supabase
        .from("orders")
        .select("id,total", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .eq("status", "completed");

      if (input.eventId) {
        ordersQuery = ordersQuery.eq("event_id", input.eventId);
      }

      const { data: ordersData, error: ordersError, count } = await ordersQuery;
      if (ordersError) throw new Error(ordersError.message);

      const orderIds = (ordersData ?? []).map((order) => order.id);
      let ticketsSold = 0;
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await ctx.supabase
          .from("order_items")
          .select("quantity")
          .in("order_id", orderIds);
        if (itemsError) throw new Error(itemsError.message);
        ticketsSold = (itemsData ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      }

      const revenue = (ordersData ?? []).reduce((sum, order) => sum + (order.total ?? 0), 0);

      return {
        totalOrders: count ?? 0,
        revenue,
        ticketsSold,
      };
    }),
});
