import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { orders, orderItems, ticketTypes, guests, tickets, events } from "@/server/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { sendTicketEmail } from "@/server/actions/email";
import crypto from "crypto";

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
      const filters = [eq(orders.companyId, ctx.companyId)];

      if (input.eventId) filters.push(eq(orders.eventId, input.eventId));
      if (input.status) filters.push(eq(orders.status, input.status));
      if (input.search) {
        filters.push(
          or(
            ilike(orders.orderNumber, `%${input.search}%`),
            ilike(orders.email, `%${input.search}%`),
            ilike(orders.name, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db
        .select()
        .from(orders)
        .where(and(...filters))
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...filters));

      return {
        orders: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db
        .select()
        .from(orders)
        .where(
          and(eq(orders.id, input.id), eq(orders.companyId, ctx.companyId))
        )
        .limit(1);

      if (!order[0]) throw new Error("Order not found");

      const items = await ctx.db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          ticketTypeId: orderItems.ticketTypeId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          total: orderItems.total,
          ticketTypeName: ticketTypes.name,
        })
        .from(orderItems)
        .leftJoin(ticketTypes, eq(orderItems.ticketTypeId, ticketTypes.id))
        .where(eq(orderItems.orderId, input.id));

      return { ...order[0], items };
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

            const barcode = `TCK-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

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
      const result = await ctx.db
        .update(orders)
        .set({
          status: input.status,
          updatedAt: new Date(),
          completedAt: input.status === "completed" ? new Date() : undefined,
        })
        .where(
          and(eq(orders.id, input.id), eq(orders.companyId, ctx.companyId))
        )
        .returning();

      return result[0];
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(orders.companyId, ctx.companyId),
        eq(orders.status, "completed"),
      ];
      if (input.eventId) filters.push(eq(orders.eventId, input.eventId));

      const result = await ctx.db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        })
        .from(orders)
        .where(and(...filters));

      const itemsResult = await ctx.db
        .select({ ticketsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(...filters));

      return {
        totalOrders: Number(result[0]?.count ?? 0),
        revenue: Number(result[0]?.revenue ?? 0),
        ticketsSold: Number(itemsResult[0]?.ticketsSold ?? 0),
      };
    }),
});
