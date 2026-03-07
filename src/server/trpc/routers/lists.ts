import { z } from "zod";
import { router, protectedProcedure } from "../index";

type ListRow = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

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

type ListContactRow = {
  list_id: string;
  contact_id: string;
};

function mapList(row: ListRow, contactCount = 0) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    contactCount,
  };
}

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
      let query = ctx.supabase
        .from("lists")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.search) {
        query = query.ilike("name", `%${input.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as ListRow[];
      const listIds = rows.map((row) => row.id);
      let contactCountMap = new Map<string, number>();

      if (listIds.length > 0) {
        const { data: listContactsData, error: listContactsError } = await ctx.supabase
          .from("list_contacts")
          .select("list_id,contact_id")
          .in("list_id", listIds);
        if (listContactsError) throw new Error(listContactsError.message);
        for (const row of (listContactsData ?? []) as ListContactRow[]) {
          contactCountMap.set(row.list_id, (contactCountMap.get(row.list_id) ?? 0) + 1);
        }
      }

      return {
        lists: rows.map((row) => mapList(row, contactCountMap.get(row.id) ?? 0)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("lists")
        .select("*")
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("List not found");
      return mapList(data as ListRow);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("lists")
        .insert({
          company_id: ctx.companyId,
          name: input.name,
          description: input.description ?? null,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapList(data as ListRow);
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
      const payload: Record<string, unknown> = {};
      if (input.name !== undefined) payload.name = input.name;
      if (input.description !== undefined) payload.description = input.description;
      if (Object.keys(payload).length === 0) {
        throw new Error("No fields to update");
      }

      const { data, error } = await ctx.supabase
        .from("lists")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapList(data as ListRow);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("lists")
        .delete()
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);
      if (error) throw new Error(error.message);
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
      const [{ data: list, error: listError }, { data: contact, error: contactError }] = await Promise.all([
        ctx.supabase.from("lists").select("id").eq("id", input.listId).eq("company_id", ctx.companyId).maybeSingle(),
        ctx.supabase.from("contacts").select("id").eq("id", input.contactId).eq("company_id", ctx.companyId).is("deleted_at", null).maybeSingle(),
      ]);
      if (listError) throw new Error(listError.message);
      if (contactError) throw new Error(contactError.message);
      if (!list) throw new Error("List not found");
      if (!contact) throw new Error("Contact not found");

      const { error } = await ctx.supabase
        .from("list_contacts")
        .upsert({ list_id: input.listId, contact_id: input.contactId }, { onConflict: "list_id,contact_id" });
      if (error) throw new Error(error.message);

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
      const { data: list, error: listError } = await ctx.supabase
        .from("lists")
        .select("id")
        .eq("id", input.listId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();
      if (listError) throw new Error(listError.message);
      if (!list) throw new Error("List not found");

      const { error } = await ctx.supabase
        .from("list_contacts")
        .delete()
        .eq("list_id", input.listId)
        .eq("contact_id", input.contactId);
      if (error) throw new Error(error.message);

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
      const { data: list, error: listError } = await ctx.supabase
        .from("lists")
        .select("id")
        .eq("id", input.listId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();
      if (listError) throw new Error(listError.message);
      if (!list) throw new Error("List not found");

      const { data: links, error: linksError } = await ctx.supabase
        .from("list_contacts")
        .select("list_id,contact_id")
        .eq("list_id", input.listId)
        .range(input.offset, input.offset + input.limit - 1);
      if (linksError) throw new Error(linksError.message);

      const { count, error: countError } = await ctx.supabase
        .from("list_contacts")
        .select("contact_id", { count: "exact", head: true })
        .eq("list_id", input.listId);
      if (countError) throw new Error(countError.message);

      const contactIds = ((links ?? []) as ListContactRow[]).map((row) => row.contact_id);
      if (contactIds.length === 0) {
        return { contacts: [], total: count ?? 0 };
      }

      const { data: contactsData, error: contactsError } = await ctx.supabase
        .from("contacts")
        .select("*")
        .in("id", contactIds)
        .eq("company_id", ctx.companyId)
        .is("deleted_at", null);
      if (contactsError) throw new Error(contactsError.message);

      const contactMap = new Map(((contactsData ?? []) as ContactRow[]).map((row) => [row.id, mapContact(row)]));
      return {
        contacts: contactIds.map((id) => contactMap.get(id)).filter(Boolean),
        total: count ?? 0,
      };
    }),
});
