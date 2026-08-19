export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";

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

  // Provision/link a customer contact before checking dashboard access. This
  // makes the account button work on the very first visit, not only after the
  // customer has already opened the dashboard.
  try {
    await ensureAppUserForAuthUser(supabase, user);
  } catch {
    // Buyer accounts remain usable even when optional dashboard provisioning
    // cannot run in a partially configured local environment.
  }
  const { data: adminProfile, error: adminProfileError } = await admin
    .from("users")
    .select("id,role,company_id,dashboard_access,customer_company_id,companies(id,name,slug)")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfileError) {
    return NextResponse.json({ error: adminProfileError.message }, { status: 500 });
  }

  // A customer contact may be a buyer before their first dashboard session.
  // Resolve the company link directly by verified email so the buyer account
  // can still offer the read-only company dashboard immediately.
  let linkedCustomerCompany: { id: string; owner_company_id: string } | null = null;
  if (!adminProfile?.customer_company_id) {
    const { data: customerCompany } = await admin
      .from("customer_companies")
      .select("id,owner_company_id")
      .ilike("email", email)
      .is("deleted_at", null)
      .maybeSingle();
    linkedCustomerCompany = customerCompany ?? null;
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
      .select("id,barcode,status,attendee_name,attendee_email,checked_in,metadata,created_at,events(id,title,slug,starts_at,ends_at,cover_image_url,settings,companies(slug,name)),ticket_types(name,currency,price)")
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
    adminAccess:
      (adminProfile?.company_id &&
        (adminProfile.dashboard_access === "limited" ||
          adminProfile.dashboard_access === "full" ||
          adminProfile.role === "owner" ||
          adminProfile.role === "admin")) ||
      Boolean(linkedCustomerCompany)
        ? {
            role: adminProfile?.role ?? "staff",
            companyId: adminProfile?.company_id ?? linkedCustomerCompany?.owner_company_id,
            customerCompanyId: adminProfile?.customer_company_id ?? linkedCustomerCompany?.id ?? null,
            readOnly: !adminProfile?.dashboard_access || adminProfile.dashboard_access === "limited" || Boolean(adminProfile?.customer_company_id ?? linkedCustomerCompany),
            company: adminProfile?.companies ?? null,
          }
        : null,
    orders: orders ?? [],
    tickets: tickets ?? [],
    notifications,
    messages: messages ?? [],
    unreadCount: (notifications ?? []).filter((notification: any) => !notification.is_read).length,
  });
}
