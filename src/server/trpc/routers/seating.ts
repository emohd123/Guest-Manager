import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

const sectionInput = z.object({
  name: z.string().min(1).max(120), price: z.number().int().min(0).nullable(), x: z.number().int().min(0).max(100), y: z.number().int().min(0).max(100),
  rows: z.array(z.object({label: z.string().min(1).max(30), price: z.number().int().min(0).nullable(), seatCount: z.number().int().min(1).max(200), seatPrices: z.record(z.string(), z.number().int().min(0)).optional()})).max(100),
});

async function nestedPlan(supabase: ReturnType<typeof createSupabaseAdminClient>, eventId: string) {
  const {data: plan, error} = await supabase.from("seating_plans").select("*").eq("event_id", eventId).maybeSingle();
  if (error) throw new Error(error.message); if (!plan) return null;
  const {data: sections, error: sectionError} = await supabase.from("seat_sections").select("*").eq("plan_id", plan.id).order("sort_order");
  if (sectionError) throw new Error(sectionError.message);
  const sectionIds = (sections ?? []).map((s) => s.id);
  const {data: rows} = sectionIds.length ? await supabase.from("seat_rows").select("*").in("section_id", sectionIds).order("sort_order") : {data: []};
  const rowIds = (rows ?? []).map((r) => r.id);
  const {data: seats} = rowIds.length ? await supabase.from("reserved_seats").select("*,seat_holds(status,expires_at)").in("row_id", rowIds).order("label") : {data: []};
  const now = Date.now();
  return {...plan, sections: (sections ?? []).map((section) => ({...section, rows: (rows ?? []).filter((row) => row.section_id === section.id).map((row) => ({...row, seats: (seats ?? []).filter((seat: any) => seat.row_id === row.id).map((seat: any) => ({...seat, unavailable: Boolean(seat.sold_ticket_id) || (seat.seat_holds ?? []).some((hold: any) => hold.status === "pending" && new Date(hold.expires_at).getTime() > now)}))}))}))};
}

export const seatingRouter = router({
  publicPlan: publicProcedure.input(z.object({eventId: z.string().uuid()})).query(async ({input}) => nestedPlan(createSupabaseAdminClient(), input.eventId)),
  get: protectedProcedure.input(z.object({eventId: z.string().uuid()})).query(async ({ctx,input}) => {
    const {data: event} = await ctx.supabase.from("events").select("id").eq("id",input.eventId).eq("company_id",ctx.companyId).maybeSingle();
    if (!event) throw new Error("Event not found"); return nestedPlan(createSupabaseAdminClient(), input.eventId);
  }),
  save: protectedProcedure.input(z.object({eventId:z.string().uuid(),floorPlanUrl:z.string().url().nullable(),enabled:z.boolean(),sections:z.array(sectionInput).max(50)})).mutation(async ({ctx,input}) => {
    const {data:event} = await ctx.supabase.from("events").select("id").eq("id",input.eventId).eq("company_id",ctx.companyId).maybeSingle(); if(!event) throw new Error("Event not found");
    const admin=createSupabaseAdminClient();
    const {data:plan,error}=await admin.from("seating_plans").upsert({event_id:input.eventId,floor_plan_url:input.floorPlanUrl,enabled:input.enabled,updated_at:new Date().toISOString()},{onConflict:"event_id"}).select("id").single(); if(error) throw new Error(error.message);
    const {data:existingSections}=await admin.from("seat_sections").select("id").eq("plan_id",plan.id);
    const {data:existingRows}=existingSections?.length?await admin.from("seat_rows").select("id").in("section_id",existingSections.map((item)=>item.id)):{data:[]};
    if(existingRows?.length){const {data:lockedSeats}=await admin.from("reserved_seats").select("id,sold_ticket_id,seat_holds(status,expires_at)").in("row_id",existingRows.map((item)=>item.id));const hasInventory=(lockedSeats??[]).some((seat:any)=>seat.sold_ticket_id||(seat.seat_holds??[]).some((hold:any)=>hold.status==="pending"&&new Date(hold.expires_at).getTime()>Date.now()));if(hasInventory)throw new Error("This plan has sold or temporarily held seats and cannot be rebuilt.");}
    await admin.from("seat_sections").delete().eq("plan_id",plan.id);
    for (let si=0;si<input.sections.length;si++) { const section=input.sections[si]; const {data:s,error:se}=await admin.from("seat_sections").insert({plan_id:plan.id,name:section.name,price:section.price,x:section.x,y:section.y,sort_order:si}).select("id").single(); if(se) throw new Error(se.message);
      for(let ri=0;ri<section.rows.length;ri++){const row=section.rows[ri];const {data:r,error:re}=await admin.from("seat_rows").insert({section_id:s.id,label:row.label,price:row.price,sort_order:ri}).select("id").single();if(re)throw new Error(re.message);await admin.from("reserved_seats").insert(Array.from({length:row.seatCount},(_,i)=>({row_id:r.id,label:String(i+1),price:row.seatPrices?.[String(i+1)]??null})));}
    }
    return nestedPlan(admin,input.eventId);
  }),
});
