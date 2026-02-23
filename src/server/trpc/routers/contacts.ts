import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { contacts } from "@/server/db/schema";
import { eq, and, desc, ilike, sql, or, isNull } from "drizzle-orm";

export const contactsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          contactType: z.string().optional(),
          tag: z.string().optional(),
          limit: z.number().min(1).max(500).default(100),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(contacts.companyId, ctx.companyId),
        isNull(contacts.deletedAt),
      ];

      if (input?.search) {
        filters.push(
          or(
            ilike(contacts.firstName, `%${input.search}%`),
            ilike(contacts.lastName, `%${input.search}%`),
            ilike(contacts.email, `%${input.search}%`),
            ilike(contacts.companyName, `%${input.search}%`)
          )!
        );
      }

      if (input?.contactType) {
        filters.push(eq(contacts.contactType, input.contactType));
      }

      if (input?.tag) {
        filters.push(sql`${input.tag} = ANY(${contacts.tags})`);
      }

      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;

      const results = await ctx.db
        .select()
        .from(contacts)
        .where(and(...filters))
        .orderBy(desc(contacts.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(and(...filters));

      return {
        contacts: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.companyId, ctx.companyId),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (!contact[0]) throw new Error("Contact not found");
      return contact[0];
    }),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(255),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        companyName: z.string().max(255).optional(),
        title: z.string().max(255).optional(),
        contactType: z.string().max(100).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(contacts)
        .values({
          companyId: ctx.companyId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone,
          companyName: input.companyName,
          title: input.title,
          contactType: input.contactType,
          notes: input.notes,
          tags: input.tags,
          source: input.source ?? "manual",
        })
        .returning();

      return result[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1).max(255).optional(),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        companyName: z.string().max(255).optional(),
        title: z.string().max(255).optional(),
        contactType: z.string().max(100).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined) updateData[key] = val;
      });

      const result = await ctx.db
        .update(contacts)
        .set(updateData)
        .where(
          and(eq(contacts.id, id), eq(contacts.companyId, ctx.companyId))
        )
        .returning();

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db
        .update(contacts)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.companyId, ctx.companyId)
          )
        );
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      for (const id of input.ids) {
        await ctx.db
          .update(contacts)
          .set({ deletedAt: new Date() })
          .where(
            and(eq(contacts.id, id), eq(contacts.companyId, ctx.companyId))
          );
      }
      return { deleted: input.ids.length };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(
        and(
          eq(contacts.companyId, ctx.companyId),
          isNull(contacts.deletedAt)
        )
      );

    return {
      total: Number(total[0].count),
    };
  }),
});
