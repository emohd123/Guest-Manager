import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { dashboardAdminProcedure, router } from "../index";

const companyInput = z.object({
  legalName: z.string().trim().min(1).max(255),
  displayName: z.string().trim().max(255).nullable().optional(),
  email: z.string().trim().email(),
  mobile: z.string().trim().max(40).nullable().optional(),
  vatNumber: z.string().trim().max(80).nullable().optional(),
  website: z.string().trim().max(1000).nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(),
  address: z.record(z.string(), z.string()).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

const mapCompany = (row: Record<string, any>) => ({
  id: row.id, ownerCompanyId: row.owner_company_id, legalName: row.legal_name,
  displayName: row.display_name, email: row.email, mobile: row.mobile,
  vatNumber: row.vat_number, website: row.website, country: row.country,
  address: row.address, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at,
});

export const customerCompaniesRouter = router({
  list: dashboardAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("customer_companies").select("*").eq("owner_company_id", ctx.companyId).is("deleted_at", null).order("legal_name", { ascending: true });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return (data ?? []).map(mapCompany);
  }),
  create: dashboardAdminProcedure.input(companyInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("customer_companies").insert({
      owner_company_id: ctx.companyId, legal_name: input.legalName, display_name: input.displayName ?? null,
      email: input.email, mobile: input.mobile ?? null, vat_number: input.vatNumber ?? null,
      website: input.website ?? null, country: input.country ?? null, address: input.address ?? null, notes: input.notes ?? null,
    }).select("*").single();
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return mapCompany(data);
  }),
  update: dashboardAdminProcedure.input(z.object({ id: z.string().uuid() }).merge(companyInput.partial())).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (rest.legalName !== undefined) payload.legal_name = rest.legalName;
    if (rest.displayName !== undefined) payload.display_name = rest.displayName;
    if (rest.email !== undefined) payload.email = rest.email;
    if (rest.mobile !== undefined) payload.mobile = rest.mobile;
    if (rest.vatNumber !== undefined) payload.vat_number = rest.vatNumber;
    if (rest.website !== undefined) payload.website = rest.website;
    if (rest.country !== undefined) payload.country = rest.country;
    if (rest.address !== undefined) payload.address = rest.address;
    if (rest.notes !== undefined) payload.notes = rest.notes;
    const { data, error } = await ctx.supabase.from("customer_companies").update(payload).eq("id", id).eq("owner_company_id", ctx.companyId).is("deleted_at", null).select("*").single();
    if (error) throw new TRPCError({ code: "NOT_FOUND", message: error.message });
    return mapCompany(data);
  }),
  remove: dashboardAdminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase.from("customer_companies").update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", input.id).eq("owner_company_id", ctx.companyId).is("deleted_at", null);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return { ok: true };
  }),
});
