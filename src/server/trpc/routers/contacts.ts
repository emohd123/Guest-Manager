import { z } from "zod";
import { router, protectedProcedure } from "../index";

type ContactRow = {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  title: string | null;
  contact_type: string | null;
  notes: string | null;
  tags: string[] | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapContact(row: ContactRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    title: row.title,
    contactType: row.contact_type,
    notes: row.notes,
    tags: row.tags,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

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
      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;

      let query = ctx.supabase
        .from("contacts")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (input?.contactType) {
        query = query.eq("contact_type", input.contactType);
      }

      if (input?.search) {
        const search = input.search.replace(/,/g, " ");
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
        );
      }

      if (input?.tag) {
        query = query.contains("tags", [input.tag]);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        contacts: ((data ?? []) as ContactRow[]).map((row) => mapContact(row)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("contacts")
        .select("*")
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Contact not found");
      return mapContact(data as ContactRow);
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
      const { data, error } = await ctx.supabase
        .from("contacts")
        .insert({
          company_id: ctx.companyId,
          first_name: input.firstName,
          last_name: input.lastName ?? null,
          email: input.email || null,
          phone: input.phone ?? null,
          company_name: input.companyName ?? null,
          title: input.title ?? null,
          contact_type: input.contactType ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? null,
          source: input.source ?? "manual",
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapContact(data as ContactRow);
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
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.firstName !== undefined) payload.first_name = input.firstName;
      if (input.lastName !== undefined) payload.last_name = input.lastName;
      if (input.email !== undefined) payload.email = input.email || null;
      if (input.phone !== undefined) payload.phone = input.phone;
      if (input.companyName !== undefined) payload.company_name = input.companyName;
      if (input.title !== undefined) payload.title = input.title;
      if (input.contactType !== undefined) payload.contact_type = input.contactType;
      if (input.notes !== undefined) payload.notes = input.notes;
      if (input.tags !== undefined) payload.tags = input.tags;

      const { data, error } = await ctx.supabase
        .from("contacts")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapContact(data as ContactRow);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("company_id", ctx.companyId)
        .in("id", input.ids);

      if (error) throw new Error(error.message);
      return { deleted: input.ids.length };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const { count, error } = await ctx.supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.companyId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);

    return {
      total: count ?? 0,
    };
  }),
});
