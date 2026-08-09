export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Sign in to view your tickets." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const email = user.email.toLowerCase();
  const { data: adminProfile, error: adminProfileError } = await admin
    .from("users")
    .select("id,role,company_id,companies(id,name,slug)")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfileError) {
    return NextResponse.json({ error: adminProfileError.message }, { status: 500 });
  }

  const [
    { data: orders, error: ordersError },
    { data: tickets, error: ticketsError },
    { data: messages, error: messagesError },
  ] = await Promise.all([
    admin
      .from("orders")
      .select("id,order_number,status,email,name,total,currency,completed_at,created_at,events(id,title,slug,starts_at,ends_at,cover_image_url,settings,companies(slug,name))")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("tickets")
      .select("id,barcode,status,attendee_name,attendee_email,checked_in,created_at,events(id,title,slug,starts_at,ends_at,cover_image_url,settings,companies(slug,name)),ticket_types(name,currency,price)")
      .ilike("attendee_email", email)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("visitor_messages")
      .select("id,event_id,subject,body,admin_reply,replied_at,created_at,events(id,title,slug,companies(slug,name))")
      .ilike("guest_email", email)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const attendedEventIds = Array.from(
    new Set(
      [...(orders ?? []), ...(tickets ?? [])]
        .map((record: any) => {
          const eventRecord = Array.isArray(record.events) ? record.events[0] : record.events;
          return eventRecord?.id;
        })
        .filter(Boolean)
    )
  );

  let notifications: any[] = [];
  let notificationsError = null;
  if (attendedEventIds.length > 0) {
    const response = await admin
      .from("visitor_notifications")
      .select("id,event_id,recipient_email,title,body,type,is_read,created_at,events(id,title,slug,companies(slug,name))")
      .in("event_id", attendedEventIds)
      .or(`recipient_email.eq.${email},recipient_email.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = response.data ?? [];
    notificationsError = response.error;
  } else {
    const response = await admin
      .from("visitor_notifications")
      .select("id,event_id,recipient_email,title,body,type,is_read,created_at,events(id,title,slug,companies(slug,name))")
      .eq("recipient_email", email)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = response.data ?? [];
    notificationsError = response.error;
  }

  const error = ordersError ?? ticketsError ?? notificationsError ?? messagesError;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: {
      email: user.email,
      name: user.user_metadata?.name ?? user.email.split("@")[0],
    },
    adminAccess: adminProfile?.company_id
      ? {
          role: adminProfile.role,
          companyId: adminProfile.company_id,
          company: adminProfile.companies,
        }
      : null,
    orders: orders ?? [],
    tickets: tickets ?? [],
    notifications,
    messages: messages ?? [],
    unreadCount: (notifications ?? []).filter((notification: any) => !notification.is_read).length,
  });
}
