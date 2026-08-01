import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function GET(_:Request,{params}:{params:Promise<{eventId:string}>}){
  const {eventId}=await params;const db=createSupabaseAdminClient();
  const {data:plan,error}=await db.from("seating_plans").select("*").eq("event_id",eventId).eq("enabled",true).maybeSingle();if(error)return NextResponse.json({error:error.message},{status:500});if(!plan)return NextResponse.json({plan:null});
  const {data:sections}=await db.from("seat_sections").select("*").eq("plan_id",plan.id).order("sort_order");const sectionIds=(sections??[]).map(s=>s.id);
  const {data:rows}=sectionIds.length?await db.from("seat_rows").select("*").in("section_id",sectionIds).order("sort_order"):{data:[]};const rowIds=(rows??[]).map(r=>r.id);
  const {data:seats}=rowIds.length?await db.from("reserved_seats").select("*,seat_holds(status,expires_at)").in("row_id",rowIds).order("label"):{data:[]};const now=Date.now();
  return NextResponse.json({plan:{...plan,sections:(sections??[]).map(s=>({...s,rows:(rows??[]).filter(r=>r.section_id===s.id).map(r=>({...r,seats:(seats??[]).filter((seat:any)=>seat.row_id===r.id).map((seat:any)=>({...seat,unavailable:Boolean(seat.sold_ticket_id)||(seat.seat_holds??[]).some((h:any)=>h.status==='pending'&&new Date(h.expires_at).getTime()>now)}))}))}))}});
}
