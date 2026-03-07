import { NextRequest, NextResponse } from "next/server";
import { checkinV2Config } from "@/server/services/checkin";

export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      error: message,
      code: code ?? "bad_request",
    },
    { status }
  );
}

export function ensureMobileV2Enabled() {
  if (!checkinV2Config.enabled) {
    throw new Error("CHECKIN_APP_V2_DISABLED");
  }
}

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [ip] = forwarded.split(",");
    return ip.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

