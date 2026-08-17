import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../index";
import { nanoid } from "nanoid";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { handleEventPublished } from "@/server/services/discover-push";
import { applyEventOwnership, isFullDashboardAccess } from "@/server/auth/event-access";
import { recordAudit } from "@/server/audit";

type EventRow = {
  id: string;
  company_id: string;
  created_by: string | null;
  venue_id: string | null;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  event_type: "single" | "recurring" | "multi_day" | "session" | "conference";
  status: "draft" | "published" | "cancelled" | "completed";
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  registration_enabled: boolean | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  max_capacity: number | null;
  settings: unknown;
  custom_fields: unknown;
  metadata: unknown;
  visitor_code: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// Keep event reads independent of optional verification columns and stale
// PostgREST schema caches. The event workflow only needs these stable fields.
const EVENT_SELECT = [
  "id", "company_id", "created_by", "venue_id", "category_id", "title", "slug",
  "description", "short_description", "cover_image_url", "event_type", "status",
  "starts_at", "ends_at", "timezone", "registration_enabled", "registration_opens_at",
  "registration_closes_at", "max_capacity", "settings", "custom_fields", "metadata",
  "visitor_code", "created_at", "updated_at", "deleted_at",
].join(",");

function mapEvent(row: EventRow, companySlug?: string | null) {
  return {
    id: row.id,
    companyId: row.company_id,
    createdBy: row.created_by,
    venueId: row.venue_id,
    categoryId: row.category_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    coverImageUrl: row.cover_image_url,
    eventType: row.event_type,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    registrationEnabled: row.registration_enabled ?? false,
    registrationOpensAt: row.registration_opens_at,
    registrationClosesAt: row.registration_closes_at,
    maxCapacity: row.max_capacity,
    settings: row.settings,
    customFields: row.custom_fields,
    metadata: row.metadata,
    visitorCode: row.visitor_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    companySlug: companySlug ?? null,
  };
}

function buildSlug(title: string) {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${nanoid(6)}`;
}

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
      let query = ctx.supabase
        .from("events")
        .select(EVENT_SELECT, { count: "exact" })
        .eq("company_id", ctx.companyId)
        .is("deleted_at", null)
        .order("starts_at", { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 20) - 1);
      query = applyEventOwnership(query, ctx);

      if (input?.status) {
        query = query.eq("status", input.status);
      }

      if (input?.search) {
        query = query.ilike("title", `%${input.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        events: ((data ?? []) as EventRow[]).map((row) => mapEvent(row)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      let eventQuery = ctx.supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();
      eventQuery = applyEventOwnership(eventQuery, ctx);
      const { data: event, error } = await eventQuery;

      if (error) throw new Error(error.message);
      if (!event) {
        throw new Error("Event not found");
      }

      const { data: company, error: companyError } = await ctx.supabase
        .from("companies")
        .select("slug")
        .eq("id", event.company_id)
        .maybeSingle();

      if (companyError) throw new Error(companyError.message);

      return mapEvent(event as EventRow, company?.slug ?? null);
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
      const { data, error } = await ctx.supabase
        .from("events")
        .insert({
          company_id: ctx.companyId,
          created_by: ctx.userId,
          title: input.title,
          slug: buildSlug(input.title),
          description: input.description ?? null,
          short_description: input.shortDescription ?? null,
          event_type: input.eventType,
          starts_at: input.startsAt,
          ends_at: input.endsAt ?? null,
          timezone: input.timezone ?? null,
          venue_id: input.venueId ?? null,
          category_id: input.categoryId ?? null,
          max_capacity: input.maxCapacity ?? null,
          registration_enabled: input.registrationEnabled,
        })
        .select(EVENT_SELECT)
        .single();

      if (error) throw new Error(error.message);
      void recordAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "event.created", entityType: "event", entityId: data.id, eventId: data.id, metadata: { title: input.title } });
      return mapEvent(data as EventRow);
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
        coverImageUrl: z.string().url().optional(),
        visitorCode: z.string().trim().regex(/^[A-Za-z0-9-]{4,10}$/).optional(),
        settings: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Capture the previous status so publishing (draft -> published) can
      // trigger a one-time "new event" push to Discover app users.
      let previousStatus: string | null = null;
      if (input.status === "published") {
        let beforeQuery = ctx.supabase
          .from("events")
          .select("status")
          .eq("id", input.id)
          .eq("company_id", ctx.companyId)
          .maybeSingle();
        beforeQuery = applyEventOwnership(beforeQuery, ctx);
        const { data: before } = await beforeQuery;
        previousStatus = (before as { status?: string } | null)?.status ?? null;
      }

      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) payload.title = input.title;
      if (input.description !== undefined) payload.description = input.description;
      if (input.shortDescription !== undefined) payload.short_description = input.shortDescription;
      if (input.eventType !== undefined) payload.event_type = input.eventType;
      if (input.status !== undefined) payload.status = input.status;
      if (input.startsAt !== undefined) payload.starts_at = input.startsAt;
      if (input.endsAt !== undefined) payload.ends_at = input.endsAt;
      if (input.timezone !== undefined) payload.timezone = input.timezone;
      if (input.venueId !== undefined) payload.venue_id = input.venueId;
      if (input.categoryId !== undefined) payload.category_id = input.categoryId;
      if (input.maxCapacity !== undefined) payload.max_capacity = input.maxCapacity;
      if (input.registrationEnabled !== undefined) payload.registration_enabled = input.registrationEnabled;
      if (input.coverImageUrl !== undefined) payload.cover_image_url = input.coverImageUrl;
      if (input.visitorCode !== undefined) payload.visitor_code = input.visitorCode.toUpperCase();
      if (input.settings !== undefined) payload.settings = input.settings;

      let updateQuery = ctx.supabase
        .from("events")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select(EVENT_SELECT)
        .single();
      updateQuery = applyEventOwnership(updateQuery, ctx);
      const { data, error } = await updateQuery;

      if (error) throw new Error(error.message);

      const updated = data as EventRow;
      void recordAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "event.updated", entityType: "event", entityId: updated.id, eventId: updated.id, metadata: { fields: Object.keys(input).filter((key) => key !== "id") } });
      if (input.status === "published" && previousStatus !== "published") {
        // Fire-and-forget: never delay or fail the mutation over a push.
        void handleEventPublished({
          id: updated.id,
          title: updated.title,
          categoryId: updated.category_id,
          description: updated.short_description ?? updated.description,
        });
      }

      return mapEvent(updated);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      let deleteQuery = ctx.supabase
        .from("events")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);
      deleteQuery = applyEventOwnership(deleteQuery, ctx);
      const { error } = await deleteQuery;

      if (error) throw new Error(error.message);
      void recordAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "event.deleted", entityType: "event", entityId: input.id, eventId: input.id });
      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      let originalQuery = ctx.supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();
      originalQuery = applyEventOwnership(originalQuery, ctx);
      const { data: original, error: originalError } = await originalQuery;

      if (originalError) throw new Error(originalError.message);
      if (!original) throw new Error("Event not found");

      const duplicateTitle = `${original.title} (Copy)`;
      const { data, error } = await ctx.supabase
        .from("events")
        .insert({
          company_id: ctx.companyId,
          created_by: ctx.userId,
          venue_id: original.venue_id,
          category_id: original.category_id,
          title: duplicateTitle,
          slug: buildSlug(`${duplicateTitle}-copy`),
          description: original.description,
          short_description: original.short_description,
          cover_image_url: original.cover_image_url,
          event_type: original.event_type,
          status: "draft",
          starts_at: original.starts_at,
          ends_at: original.ends_at,
          timezone: original.timezone,
          registration_enabled: original.registration_enabled,
          registration_opens_at: original.registration_opens_at,
          registration_closes_at: original.registration_closes_at,
          max_capacity: original.max_capacity,
          settings: original.settings,
          custom_fields: original.custom_fields,
          metadata: original.metadata,
        })
        .select(EVENT_SELECT)
        .single();

      if (error) throw new Error(error.message);
      void recordAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "event.duplicated", entityType: "event", entityId: data.id, eventId: data.id, metadata: { sourceEventId: input.id } });
      return mapEvent(data as EventRow);
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      let archiveQuery = ctx.supabase
        .from("events")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select(EVENT_SELECT)
        .single();
      archiveQuery = applyEventOwnership(archiveQuery, ctx);
      const { data, error } = await archiveQuery;

      if (error) throw new Error(error.message);
      return mapEvent(data as EventRow);
    }),

  getBySlug: publicProcedure
    .input(z.object({ companySlug: z.string(), eventSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const supabase = createSupabaseAdminClient();
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id,slug")
        .eq("slug", input.companySlug)
        .maybeSingle();

      if (companyError) throw new Error(companyError.message);
      if (!company) return null;

      let query = supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("company_id", company.id)
        .eq("slug", input.eventSlug)
        .is("deleted_at", null);

      if (ctx.companyId !== company.id) {
        query = query.eq("status", "published");
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;

      const settings =
        data.settings && typeof data.settings === "object"
          ? (data.settings as Record<string, any>)
          : {};
      const publicPageEnabled = settings.publicPage?.enabled;

      if (ctx.companyId !== company.id && publicPageEnabled === false) {
        return null;
      }

      return mapEvent(data as EventRow, company.slug);
    }),

  relatedByCompany: publicProcedure
    .input(z.object({ companySlug: z.string(), excludeEventId: z.string().uuid(), limit: z.number().min(1).max(8).default(3) }))
    .query(async ({ input }) => {
      const supabase = createSupabaseAdminClient();
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id,slug")
        .eq("slug", input.companySlug)
        .maybeSingle();
      if (companyError) throw new Error(companyError.message);
      if (!company) return [];

      const { data, error } = await supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("company_id", company.id)
        .eq("status", "published")
        .neq("id", input.excludeEventId)
        .is("deleted_at", null)
        .order("starts_at", { ascending: true })
        .limit(input.limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapEvent(row as EventRow, company.slug));
    }),

  relatedByCategory: publicProcedure
    .input(z.object({ categoryId: z.string().uuid(), excludeEventId: z.string().uuid(), limit: z.number().min(1).max(8).default(3) }))
    .query(async ({ input }) => {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("category_id", input.categoryId)
        .eq("status", "published")
        .neq("id", input.excludeEventId)
        .is("deleted_at", null)
        .order("starts_at", { ascending: true })
        .limit(input.limit);
      if (error) throw new Error(error.message);
      const companyIds = [...new Set((data ?? []).map((row) => row.company_id))];
      const { data: companies, error: companiesError } = companyIds.length
        ? await supabase.from("companies").select("id,slug").in("id", companyIds)
        : { data: [], error: null };
      if (companiesError) throw new Error(companiesError.message);
      const slugs = new Map((companies ?? []).map((company) => [company.id, company.slug]));
      return (data ?? []).map((row) => mapEvent(row as EventRow, slugs.get(row.company_id) ?? null));
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    if (!isFullDashboardAccess(ctx)) {
      const { data: ownedEvents, error: ownedEventsError } = await ctx.supabase
        .from("events")
        .select("id")
        .eq("company_id", ctx.companyId)
        .eq("created_by", ctx.userId)
        .is("deleted_at", null);
      if (ownedEventsError) throw new Error(ownedEventsError.message);
      const eventIds = (ownedEvents ?? []).map((event) => event.id);
      if (!eventIds.length) return { total: 0, totalGuests: 0, totalCheckIns: 0 };
      const [{ count: guestsCount, error: guestsError }, { count: checkInsCount, error: checkInsError }] = await Promise.all([
        ctx.supabase.from("guests").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId).in("event_id", eventIds),
        ctx.supabase.from("guests").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId).in("event_id", eventIds).eq("status", "checked_in"),
      ]);
      if (guestsError) throw new Error(guestsError.message);
      if (checkInsError) throw new Error(checkInsError.message);
      return { total: eventIds.length, totalGuests: guestsCount ?? 0, totalCheckIns: checkInsCount ?? 0 };
    }
    const [{ count: eventsCount, error: eventsError }, { count: guestsCount, error: guestsError }, { count: checkInsCount, error: checkInsError }] = await Promise.all([
      ctx.supabase.from("events").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId).is("deleted_at", null),
      ctx.supabase.from("guests").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId),
      ctx.supabase.from("guests").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId).eq("status", "checked_in"),
    ]);

    if (eventsError) throw new Error(eventsError.message);
    if (guestsError) throw new Error(guestsError.message);
    if (checkInsError) throw new Error(checkInsError.message);

    return {
      total: eventsCount ?? 0,
      totalGuests: guestsCount ?? 0,
      totalCheckIns: checkInsCount ?? 0,
    };
  }),
});
