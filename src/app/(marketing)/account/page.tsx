"use client";

import { usePublicCopy } from "@/lib/use-public-copy";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import QRCode from "qrcode";
import { Bell, CalendarDays, Download, Heart, LayoutDashboard, LogOut, MessageSquare, QrCode, ReceiptText, Ticket, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/marketplace";
import { createTicketQrPayload, isTicketExpired } from "@/lib/ticket-qr";

type AccountSummary = {
  profile: { email: string; name: string };
  orders: Array<Record<string, any>>;
  tickets: Array<Record<string, any>>;
  notifications: Array<Record<string, any>>;
  messages: Array<Record<string, any>>;
  unreadCount: number;
  adminAccess: null | {
    role: string;
    companyId: string;
    customerCompanyId: string | null;
    readOnly: boolean;
    company: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }> | null;
  };
};

export default function AccountPage() {
  const tr = usePublicCopy();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem("events-hub-favorites") ?? "[]") as string[]);
    fetch("/api/account/summary")
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Sign in to view your account.");
        }
        return response.json();
      })
      .then((data: AccountSummary) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load account."))
      .finally(() => setLoading(false));
  }, []);

  const upcomingTickets = useMemo(
    () =>
      (summary?.tickets ?? []).filter((ticket) => {
        const startsAt = ticket.events?.starts_at;
        return startsAt ? new Date(startsAt) >= new Date() : true;
      }),
    [summary?.tickets]
  );

  async function signOut() {
    await createClient().auth.signOut();
    window.location.assign(tr.href("/"));
  }

  if (loading) {
    return <AccountShell title={tr("Loading your tickets...")} />;
  }

  if (error) {
    return (
      <AccountShell title={tr("Your tickets and orders")}>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">{error}</p>
        <Button asChild className="mt-8 rounded-full bg-white px-8 font-black text-black hover:bg-white/90">
          <Link href={tr.href("/account/login")}>{tr("Sign in or create buyer account")}</Link>
        </Button>
      </AccountShell>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-28 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              {summary?.adminAccess ? tr("Admin and buyer account") : tr("Buyer account")}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              {summary?.profile.name}
            </h1>
            <p className="mt-3 text-slate-600">{summary?.profile.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {summary?.adminAccess ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-cyan-200 px-6 font-black text-black hover:bg-cyan-100">
                  <Link href={tr.href("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {summary.adminAccess.readOnly ? tr("Open company dashboard") : tr("Open admin dashboard")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-cyan-300 bg-white px-4 text-slate-900 hover:bg-cyan-50"
                  title={tr("Scan tickets for your assigned events")}
                >
                  <Link href={tr.href("/checkin/scanner")} aria-label={tr("Open event ticket scanner")}>
                    <QrCode className="h-5 w-5 text-cyan-700" />
                    <span className="sr-only">{tr("Open event ticket scanner")}</span>
                  </Link>
                </Button>
              </div>
            ) : null}
            <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
              <Link href={tr.href("/events")}>{tr("Browse events")}</Link>
            </Button>
            <Button onClick={signOut} variant="outline" className="rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
              <LogOut className="mr-2 h-4 w-4" />
               {tr("Sign out")} </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Stat icon={Ticket} label={tr("Tickets")} value={summary?.tickets.length ?? 0} />
          <Stat icon={ReceiptText} label={tr("Orders")} value={summary?.orders.length ?? 0} />
          <Stat icon={Bell} label={tr("Unread updates")} value={summary?.unreadCount ?? 0} />
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-5">
          <AccountTool href={tr.href("/account/tickets")} icon={Ticket} title={tr("Tickets")} body={tr("Open QR tickets linked to your email.")} />
          <AccountTool href={tr.href("/account/orders")} icon={ReceiptText} title={tr("Orders")} body={tr("Review registration and checkout history.")} />
          <AccountTool href={tr.href("/account/favorites")} icon={Heart} title={tr("Favorites")} body={tr("Saved events from this browser.")} />
          <AccountTool href={tr.href("/account/notifications")} icon={Bell} title={tr("Updates")} body={tr("Event updates and ticket notices.")} />
          <AccountTool href={tr.href("/account/messages")} icon={MessageSquare} title={tr("Messages")} body={tr("Support conversations with iTicket.")} />
        </section>

        {summary?.adminAccess ? (
          <section className="mt-10 rounded-[1.5rem] border border-cyan-200/25 bg-cyan-200/[0.08] p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
                  {summary.adminAccess.readOnly ? tr("Company access") : tr("Internal access")}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {summary.adminAccess.readOnly ? tr("Your company dashboard is enabled") : tr("iTicket admin dashboard is enabled")}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {summary.adminAccess.readOnly
                    ? tr("View the events assigned to your company. Editing and management actions are disabled.")
                    : tr("Manage company-created events, tickets, guests, orders, scans, reports, and messages.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-cyan-200 px-7 font-black text-black hover:bg-cyan-100">
                  <Link href={tr.href("/dashboard")}>{summary.adminAccess.readOnly ? tr("Open company dashboard") : tr("Open dashboard")}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-cyan-300 bg-white text-slate-900 hover:bg-cyan-50" title={tr("Scan tickets for your assigned events")}>
                  <Link href={tr.href("/checkin/scanner")} aria-label={tr("Open event ticket scanner")}>
                    <QrCode className="mr-2 h-4 w-4 text-cyan-700" />
                     {tr("Scan tickets")} </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-black">{tr("Profile")}</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
               {tr("Buyer profiles are linked by email. Use the same email at checkout and your tickets and orders will appear here automatically.")} </p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-black text-slate-900">{summary?.profile.name}</p>
              <p>{summary?.profile.email}</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-pink-300" />
              <h2 className="text-2xl font-black">{tr("Saved favorites")}</h2>
            </div>
            {favorites.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {favorites.slice(0, 12).map((id) => (
                  <span key={id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                    {id.slice(0, 8)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                 {tr("Save events from the marketplace and they will appear here on this device.")} </p>
            )}
            <Button asChild variant="outline" className="mt-5 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
              <Link href={tr.href("/events")}>{tr("Browse events")}</Link>
            </Button>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">{tr("Upcoming tickets")}</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {upcomingTickets.length > 0 ? (
              upcomingTickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
            ) : (
              <EmptyPanel icon={Ticket} title={tr("No upcoming tickets")} body={tr("Buy or register for an event and tickets linked to this email will appear here.")} />
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">{tr("Order history")}</h2>
          <div className="mt-5 space-y-3">
            {(summary?.orders ?? []).length > 0 ? (
              summary?.orders.map((order) => <OrderRow key={order.id} order={order} />)
            ) : (
              <EmptyPanel icon={ReceiptText} title={tr("No orders yet")} body={tr("Completed registrations and paid checkout orders will show here.")} />
            )}
          </div>
        </section>

        <section id="notifications" className="mt-12 scroll-mt-24 grid gap-4 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">{tr("Notifications")}</h2>
            <div className="mt-5 space-y-3">
              {(summary?.notifications ?? []).length > 0 ? (
                summary?.notifications.map((notification) => (
                  <NotificationRow key={notification.id} notification={notification} />
                ))
              ) : (
                <EmptyPanel
                  icon={Bell}
                  title={tr("No notifications yet")}
                  body={tr("Event reminders, schedule changes, and ticket updates linked to your email will appear here.")}
                />
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black">{tr("Messages")}</h2>
            <div className="mt-5 space-y-3">
              {(summary?.messages ?? []).length > 0 ? (
                summary?.messages.map((message) => <MessageRow key={message.id} message={message} />)
              ) : (
                <EmptyPanel
                  icon={MessageSquare}
                  title={tr("No messages yet")}
                  body={tr("Messages with the iTicket team linked to your attendee email will appear here.")}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountShell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-28 text-center text-slate-900">
      <div>
        <Ticket className="mx-auto h-12 w-12 text-blue-600" />
        <h1 className="mt-5 text-4xl font-black">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <Icon className="h-5 w-5 text-blue-600" />
      <p className="mt-5 text-3xl font-black">{value}</p>
      <p className="text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function AccountTool({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 transition hover:border-cyan-200/35 hover:bg-white">
      <Icon className="h-5 w-5 text-blue-600" />
      <p className="mt-4 font-black">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{body}</p>
    </Link>
  );
}

export function TicketRow({ ticket }: { ticket: Record<string, any> }) {
  const tr = usePublicCopy();
  const event = ticket.events;
  const ticketType = ticket.ticket_types;
  const url = event?.companies?.slug && event?.slug ? `/e/${event.companies.slug}/${event.slug}` : "/events";
  const publicPage = event?.settings?.publicPage ?? {};
  const eventImage = event?.cover_image_url || publicPage.coverImage || publicPage.heroImage || "";
  const venueName = publicPage.venueName || publicPage.locationText || "Venue TBA";
  const location = publicPage.locationText || "Bahrain";
  const metadata = ticket.metadata ?? {};
  const ticketLabel = typeof metadata.ticketTypeName === "string" && metadata.ticketTypeName.trim()
    ? metadata.ticketTypeName.trim()
    : ticketType?.name ?? "General Admission";
  const isPaidEvent = event?.settings?.publicPage?.isPaidEvent !== false;
  const ticketPrice = isPaidEvent ? (metadata.seat?.price ?? metadata.price ?? ticketType?.price ?? 0) : 0;
  const ticketCurrency = metadata.currency ?? ticketType?.currency ?? "BHD";
  const checkedIn = ticket.checked_in || ticket.status === "checked_in";
  const used = checkedIn || ticket.status === "used";
  const expiresAt = event?.ends_at || event?.starts_at || null;
  const expired = isTicketExpired(expiresAt);
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {eventImage ? (
              <img
                src={eventImage}
                alt=""
                className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-1 ring-white/15"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl font-black text-cyan-200">
                {(event?.title ?? "E").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className={`text-xs font-black uppercase tracking-[0.24em] ${used || expired ? "text-amber-300" : "text-emerald-300"}`}>{used ? tr("Used ticket") : expired ? tr("Expired ticket") : tr("Available ticket")}</p>
              <h3 className="mt-2 truncate text-xl font-black">{event?.title ?? tr("Event")}</h3>
              <p className="mt-1 truncate text-sm text-slate-300">{venueName}</p>
              <p className="mt-1 truncate text-xs text-slate-400">{location}</p>
            </div>
          </div>
          {used || expired ? (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black text-amber-200">
              {used ? tr("Used") : tr("Expired")}
            </span>
          ) : (
            <a
              href={`/api/tickets/${ticket.id}/pdf`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{tr("Download PDF")}</span>
            </a>
          )}
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">{ticketLabel}</p>
          {event?.starts_at ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(event.starts_at), "EEE, MMM d - h:mm a")}
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500">{tr("Ticket type")}</p><p className="font-black">{ticketLabel}</p></div>
            <div><p className="text-slate-500">{tr("Status")}</p><p className="font-black">{expired ? tr("Expired") : used ? tr("Used") : tr("Available")}</p></div>
            <div><p className="text-slate-500">{tr("Price")}</p><p className="font-black">{formatMoney(Number(ticketPrice), ticketCurrency)}</p></div>
            <div><p className="text-slate-500">{tr("Ticket number")}</p><p className="truncate font-mono text-xs font-black">{ticket.barcode}</p></div>
            {expiresAt ? <div><p className="text-slate-500">{tr("Valid until")}</p><p className="font-black">{format(new Date(expiresAt), "MMM d, yyyy - h:mm a")}</p></div> : null}
          </div>
        </div>
        </div>
        <TicketQr value={createTicketQrPayload(ticket.barcode, expiresAt)} disabled={used || expired} label={used ? tr("Used") : tr("Expired")} />
      </div>
      <div className="border-t border-slate-200 px-5 py-4">
      <Button asChild className="w-full rounded-full bg-slate-950 font-black text-white hover:bg-slate-800">
        <Link href={url}>{tr("Open event")}</Link>
      </Button>
      </div>
    </div>
  );
}

function TicketQr({ value, disabled = false, label = "Used" }: { value: string; disabled?: boolean; label?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: 180, margin: 1, errorCorrectionLevel: "M" }).then(setSrc).catch(() => setSrc(""));
  }, [value]);

  return (
    <div className="relative h-36 w-36 overflow-hidden rounded-xl bg-white p-2">
      {src ? (
        <img
          src={src}
          alt={disabled ? `${label} ticket QR code` : "Ticket QR code"}
          className={disabled ? "h-full w-full blur-[6px] opacity-30" : "h-full w-full"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100">
          <QrCode className="h-12 w-12 text-slate-700" />
        </div>
      )}
      {disabled ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-center text-lg font-black text-white">
          {label}
        </div>
      ) : null}
    </div>
  );
}

function OrderRow({ order }: { order: Record<string, any> }) {
  const tr = usePublicCopy();
  return (
    <div className="flex flex-col justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-black">{order.order_number}</p>
        <p className="text-sm text-slate-600">{order.events?.title ?? tr("Event")} · {order.status}</p>
      </div>
      <p className="font-black">{formatMoney(order.total ?? 0, order.currency ?? "BHD")}</p>
    </div>
  );
}

function NotificationRow({ notification }: { notification: Record<string, any> }) {
  const tr = usePublicCopy();
  const event = notification.events;
  const eventUrl = event?.companies?.slug && event?.slug ? `/e/${event.companies.slug}/${event.slug}` : "/events";

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            {notification.is_read ? tr("Update") : tr("New update")}
          </p>
          <h3 className="mt-2 font-black">{notification.title ?? tr("Event update")}</h3>
          {notification.body ? <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p> : null}
        </div>
        <Bell className={notification.is_read ? "h-5 w-5 text-slate-500" : "h-5 w-5 text-blue-600"} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{[event?.title, formatOptionalDate(notification.created_at)].filter(Boolean).join(" - ")}</span>
        <Link href={eventUrl} className="font-black text-blue-600">
           {tr("Open event")} </Link>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: Record<string, any> }) {
  const tr = usePublicCopy();
  const event = message.events;
  const eventUrl = event?.companies?.slug && event?.slug ? `/e/${event.companies.slug}/${event.slug}` : "/events";

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
        {message.admin_reply ? tr("iTicket replied") : tr("Awaiting iTicket reply")}
      </p>
      <h3 className="mt-2 font-black">{message.subject ?? tr("Message")}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
      {message.admin_reply ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{tr("Reply")}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message.admin_reply}</p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{[event?.title, formatOptionalDate(message.created_at)].filter(Boolean).join(" - ")}</span>
        <Link href={eventUrl} className="font-black text-blue-600">
           {tr("Open event")} </Link>
      </div>
    </div>
  );
}

function formatOptionalDate(value: string | null | undefined) {
  return value ? format(new Date(value), "MMM d, yyyy") : "";
}

function EmptyPanel({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-500" />
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
