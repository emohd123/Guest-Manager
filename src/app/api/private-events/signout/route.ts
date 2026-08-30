import { NextResponse } from "next/server";
import { privateEventAccessCookie } from "@/server/services/private-event-access";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(privateEventAccessCookie.name, "", { ...privateEventAccessCookie.options, maxAge: 0 });
  return response;
}
