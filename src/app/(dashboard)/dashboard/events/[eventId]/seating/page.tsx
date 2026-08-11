"use client";

import { use } from "react";
import { SeatsIoDashboard } from "@/components/seating/SeatsIoDashboard";

export default function SeatingPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  return <SeatsIoDashboard eventId={eventId} />;
}
