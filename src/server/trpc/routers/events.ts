import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../index";
import { events, guests } from "@/server/db/schema";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const eventsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(events.companyId, ctx.companyId),
        sql`${events.deletedAt} IS NULL`,
      ];

      if (input?.status) {
        filters.push(eq(events.status, input.status));
      }

      if (input?.search) {
        filters.push(ilike(events.title, `%${input.search}%`));
      }

      const results = await ctx.db
        .select()
        .from(events)
        .where(and(...filters))
        .orderBy(desc(events.startsAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(and(...filters));

      return {
        events: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db
        .select()
        .from(events)
        .where(
          and(
            eq(events.id, input.id),
            eq(events.companyId, ctx.companyId)
          )
        )
        .limit(1);

      if (!event[0]) {
        throw new Error("Event not found");
      }

      return event[0];
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        eventType: z.enum(["single", "recurring", "multi_day", "session", "conference"]).default("single"),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime().optional(),
        timezone: z.string().optional(),
        venueId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        maxCapacity: z.number().int().positive().optional(),
        registrationEnabled: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6)}`;

      const result = await ctx.db
        .insert(events)
        .values({
          companyId: ctx.companyId,
          title: input.title,
          slug,
          description: input.description,
          shortDescription: input.shortDescription,
          eventType: input.eventType,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          timezone: input.timezone,
          venueId: input.venueId,
          categoryId: input.categoryId,
          maxCapacity: input.maxCapacity,
          registrationEnabled: input.registrationEnabled,
        })
        .returning();

      return result[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        eventType: z.enum(["single", "recurring", "multi_day", "session", "conference"]).optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
        timezone: z.string().optional(),
        venueId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        maxCapacity: z.number().int().positive().optional(),
        registrationEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
      if (data.eventType !== undefined) updateData.eventType = data.eventType;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
      if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.venueId !== undefined) updateData.venueId = data.venueId;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;
      if (data.registrationEnabled !== undefined) updateData.registrationEnabled = data.registrationEnabled;

      const result = await ctx.db
        .update(events)
        .set(updateData)
        .where(
          and(
            eq(events.id, id),
            eq(events.companyId, ctx.companyId)
          )
        )
        .returning();

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db
        .update(events)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(events.id, input.id),
            eq(events.companyId, ctx.companyId)
          )
        );

      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db
        .select()
        .from(events)
        .where(
          and(
            eq(events.id, input.id),
            eq(events.companyId, ctx.companyId)
          )
        )
        .limit(1);

      if (!original[0]) {
        throw new Error("Event not found");
      }

      const event = original[0];
      const slug = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-copy-${nanoid(6)}`;

      const result = await ctx.db
        .insert(events)
        .values({
          companyId: ctx.companyId,
          title: `${event.title} (Copy)`,
          slug,
          description: event.description,
          shortDescription: event.shortDescription,
          eventType: event.eventType,
          status: "draft",
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          timezone: event.timezone,
          venueId: event.venueId,
          categoryId: event.categoryId,
          maxCapacity: event.maxCapacity,
          registrationEnabled: event.registrationEnabled,
          settings: event.settings,
          customFields: event.customFields,
        })
        .returning();

      return result[0];
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(events)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(events.id, input.id),
            eq(events.companyId, ctx.companyId)
          )
        )
        .returning();

      return result[0];
    }),

  
  getBySlug: publicProcedure
    .input(z.object({ companySlug: z.string(), eventSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Import companies inline to avoid circular deps
      const { companies } = await import('@/server/db/schema');
      const company = await ctx.db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, input.companySlug))
        .limit(1);
      if (!company[0]) return null;

      const event = await ctx.db
        .select()
        .from(events)
        .where(
          and(
            eq(events.companyId, company[0].id),
            eq(events.slug, input.eventSlug),
            eq(events.status, 'published')
          )
        )
        .limit(1);

      return event[0] ?? null;
    }),
  stats: protectedProcedure.query(async ({ ctx }) => {
    const eventsCount = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.companyId, ctx.companyId));

    const guestsCount = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(eq(guests.companyId, ctx.companyId));

    const checkInsCount = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(
        and(
          eq(guests.companyId, ctx.companyId),
          eq(guests.status, "checked_in")
        )
      );

    return {
      total: Number(eventsCount[0]?.count ?? 0),
      totalGuests: Number(guestsCount[0]?.count ?? 0),
      totalCheckIns: Number(checkInsCount[0]?.count ?? 0),
    };
  }),
});
