import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function POST(request: NextRequest, {params}: {params: Promise<{eventId:string}>}) {
  try {
    const {eventId}=await params; const body=await request.json() as {seatIds?:string[];holdToken?:string};
    if(!body.seatIds?.length || body.seatIds.length>20) return NextResponse.json({error:"Select between one and twenty seats."},{status:400});
    const token=body.holdToken ?? crypto.randomUUID(); const admin=createSupabaseAdminClient();
    const {data,error}=await admin.rpc("hold_event_seats",{p_event_id:eventId,p_seat_ids:body.seatIds,p_hold_token:token,p_minutes:10});
    if(error) return NextResponse.json({error:error.message.includes("held")||error.message.includes("unavailable")?error.message:"Seats could not be held."},{status:409});
    return NextResponse.json({holdToken:token,expiresAt:data});
  } catch { return NextResponse.json({error:"Seats could not be held."},{status:500}); }
}
