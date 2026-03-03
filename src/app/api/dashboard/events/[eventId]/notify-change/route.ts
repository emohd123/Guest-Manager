export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { users, events as eventsTable } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { createEventNotifications, type NotificationType } from "@/server/actions/createEventNotifications";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

/**
 * POST /api/dashboard/events/[eventId]/notify-change
 * Called after saving event/agenda changes so attendees receive an in-app notification.
 * Body: { type: "event_update" | "agenda_update", title: string, body: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Use cookie-based auth (dashboard uses SSR session cookies)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // Get companyId for this user
    const [dbUser] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser?.companyId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { eventId } = await params;

    // Verify the event belongs to this company
    const [event] = await db
      .select({ id: eventsTable.id })
      .from(eventsTable)
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.companyId, dbUser.companyId)))
      .limit(1);

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const { type, title, body } = (await request.json()) as {
      type?: NotificationType;
      title?: string;
      body?: string;
    };

    if (!type || !title || !body) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    await createEventNotifications({ eventId, title, body, type });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Failed",
    }, { status: 500 });
  }
}
