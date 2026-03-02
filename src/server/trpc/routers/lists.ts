import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { lists, listContacts, contacts } from "@/server/db/schema";
import { eq, and, desc, ilike, sql } from "drizzle-orm";

export const listsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(lists.companyId, ctx.companyId)];
      if (input.search) filters.push(ilike(lists.name, `%${input.search}%`));

      const results = await ctx.db
        .select({
          id: lists.id,
          name: lists.name,
          description: lists.description,
          createdAt: lists.createdAt,
          contactCount: sql<number>`(
            SELECT count(*) 
            FROM ${listContacts} 
            WHERE ${listContacts.listId} = ${lists.id}
          )`.as("contactCount"),
        })
        .from(lists)
        .where(and(...filters))
        .orderBy(desc(lists.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(lists)
        .where(and(...filters));

      return {
        lists: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(lists)
        .where(and(eq(lists.id, input.id), eq(lists.companyId, ctx.companyId)))
        .limit(1);

      if (!result[0]) throw new Error("List not found");
      return result[0];
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [list] = await ctx.db
        .insert(lists)
        .values({
          companyId: ctx.companyId,
          name: input.name,
          description: input.description,
        })
        .returning();
      return list;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      const [list] = await ctx.db
        .update(lists)
        .set(updateData)
        .where(and(eq(lists.id, id), eq(lists.companyId, ctx.companyId)))
        .returning();
      return list;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(lists)
        .where(and(eq(lists.id, input.id), eq(lists.companyId, ctx.companyId)));
      return { success: true };
    }),

  addContact: protectedProcedure
    .input(
      z.object({
        listId: z.string().uuid(),
        contactId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate the list belongs to this company
      const list = await ctx.db
        .select()
        .from(lists)
        .where(and(eq(lists.id, input.listId), eq(lists.companyId, ctx.companyId)))
        .limit(1);
      if (!list[0]) throw new Error("List not found");

      // Validate the contact also belongs to this company
      const contact = await ctx.db
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, input.contactId), eq(contacts.companyId, ctx.companyId)))
        .limit(1);
      if (!contact[0]) throw new Error("Contact not found");

      await ctx.db
        .insert(listContacts)
        .values({ listId: input.listId, contactId: input.contactId })
        .onConflictDoNothing();

      return { success: true };
    }),

  removeContact: protectedProcedure
    .input(
      z.object({
        listId: z.string().uuid(),
        contactId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate the list belongs to this company before deleting
      const list = await ctx.db
        .select({ id: lists.id })
        .from(lists)
        .where(and(eq(lists.id, input.listId), eq(lists.companyId, ctx.companyId)))
        .limit(1);
      if (!list[0]) throw new Error("List not found");

      await ctx.db
        .delete(listContacts)
        .where(
          and(
            eq(listContacts.listId, input.listId),
            eq(listContacts.contactId, input.contactId)
          )
        );
      return { success: true };
    }),

  getContacts: protectedProcedure
    .input(
      z.object({
        listId: z.string().uuid(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Validate list belongs to company
      const list = await ctx.db
        .select()
        .from(lists)
        .where(and(eq(lists.id, input.listId), eq(lists.companyId, ctx.companyId)))
        .limit(1);
      if (!list[0]) throw new Error("List not found");

      const results = await ctx.db
        .select()
        .from(listContacts)
        .where(eq(listContacts.listId, input.listId))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(listContacts)
        .where(eq(listContacts.listId, input.listId));

      return {
        contacts: results,
        total: Number(countResult[0].count),
      };
    }),
});
