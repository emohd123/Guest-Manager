import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import type {
  VisitorSession,
  VisitorTicket,
  VisitorEvent,
  VisitorNotification,
  AgendaItem,
} from "../types";

type VisitorTab = "ticket" | "agenda" | "events" | "guests" | "notifications";

interface Props {
  session: VisitorSession;
  onSignOut: () => void;
  fetchTicket: (token: string) => Promise<VisitorTicket | null>;
  fetchEvents: (token: string) => Promise<VisitorEvent[]>;
  fetchNotifications: (token: string) => Promise<VisitorNotification[]>;
  fetchGuestList: (token: string) => Promise<Array<{ id: string; firstName: string; lastName: string | null }>>;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

// ── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({
  label, icon, active, badge, onPress,
}: {
  label: string; icon: string; active: boolean; badge?: number; onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {badge && badge > 0 ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text></View>
      ) : null}
    </Pressable>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function Empty({ icon, title, msg }: { icon: string; title: string; msg: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMsg}>{msg}</Text>
    </View>
  );
}

// ── Ticket Tab ───────────────────────────────────────────────────────────────
function TicketPanel({ ticket, refreshing, onRefresh }: {
  ticket: VisitorTicket | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (!ticket) {
    return <Empty icon="🎫" title="No ticket found" msg="No ticket is linked to your account. Contact the event organizer." />;
  }
  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.ticketCard}>
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketBadgeText}>{ticket.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.ticketEvent}>{ticket.event.name}</Text>
        <Text style={styles.ticketDate}>{fmtDate(ticket.event.startsAt)}</Text>
        {ticket.event.location ? <Text style={styles.ticketLocation}>📍 {ticket.event.location}</Text> : null}
        <View style={styles.divider} />
        <Text style={styles.ticketTypeLabel}>Ticket Type</Text>
        <Text style={styles.ticketType}>{ticket.ticketType}</Text>
        <View style={styles.divider} />
        <View style={styles.barcodeBox}>
          <Text style={styles.barcodeLabel}>BARCODE</Text>
          <Text style={styles.barcode}>{ticket.barcode}</Text>
          <Text style={styles.barcodeHint}>Show this to door staff for check-in</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Agenda Tab ───────────────────────────────────────────────────────────────
function AgendaPanel({ items, agendaTitle, refreshing, onRefresh }: {
  items: AgendaItem[];
  agendaTitle: string | null | undefined;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (items.length === 0) {
    return <Empty icon="📋" title="No agenda published" msg="The organizer hasn&apos;t published a schedule yet." />;
  }
  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.agendaTitle}>{agendaTitle ?? "Event Schedule"}</Text>
      {items.map((item, i) => (
        <View key={item.id ?? i} style={styles.agendaItem}>
          <View style={styles.agendaTime}>
            <Text style={styles.agendaTimeText}>{item.time || "—"}</Text>
          </View>
          <View style={styles.agendaBody}>
            <Text style={styles.agendaItemTitle}>{item.title}</Text>
            {item.speaker ? <Text style={styles.agendaMeta}>👤 {item.speaker}</Text> : null}
            {item.location ? <Text style={styles.agendaMeta}>📍 {item.location}</Text> : null}
            {item.description ? <Text style={styles.agendaDesc}>{item.description}</Text> : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Events Tab ───────────────────────────────────────────────────────────────
function EventsPanel({ events, refreshing, onRefresh }: {
  events: VisitorEvent[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (events.length === 0) {
    return <Empty icon="📅" title="No events yet" msg="Events you are registered for will appear here." />;
  }
  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {events.map((ev) => (
        <View key={ev.eventId} style={styles.eventRow}>
          <View style={styles.eventDot} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>{ev.eventName}</Text>
            <Text style={styles.eventMeta}>{fmtDate(ev.startsAt)}</Text>
            <View style={styles.statusPillRow}>
              <View style={[styles.statusPill, ev.attendanceState === "checked_in" && styles.pillGreen]}>
                <Text style={styles.statusPillText}>
                  {ev.attendanceState === "checked_in" ? "✓ Checked in" : ev.ticketStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Guests Tab ───────────────────────────────────────────────────────────────
function GuestsPanel({ guests, refreshing, onRefresh }: {
  guests: Array<{ id: string; firstName: string; lastName: string | null }>;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (guests.length === 0) {
    return <Empty icon="👥" title="Guest list not available" msg="The organizer has not made the guest list visible yet." />;
  }
  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.sectionLabel}>{guests.length} GUESTS ATTENDING</Text>
      {guests.map((g) => (
        <View key={g.id} style={styles.guestRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(g.firstName?.[0] ?? "?").toUpperCase()}</Text>
          </View>
          <Text style={styles.guestName}>{g.firstName} {g.lastName ?? ""}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────
function NotifsPanel({ notifications, refreshing, onRefresh }: {
  notifications: VisitorNotification[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (notifications.length === 0) {
    return <Empty icon="🔔" title="All clear!" msg="No announcements or updates for your events." />;
  }
  const typeIcon: Record<string, string> = { info: "ℹ️", warning: "⚠️", update: "🔄" };
  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {notifications.map((n) => (
        <View key={n.id} style={[styles.notifCard, n.type === "warning" && styles.notifWarning]}>
          <Text style={styles.notifIcon}>{typeIcon[n.type] ?? "📢"}</Text>
          <View style={styles.notifBody}>
            <Text style={styles.notifTitle}>{n.title}</Text>
            <Text style={styles.notifMsg}>{n.message}</Text>
            <Text style={styles.notifTime}>{fmtDate(n.createdAt)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function VisitorDashboardScreen({
  session,
  onSignOut,
  fetchTicket,
  fetchEvents,
  fetchNotifications,
  fetchGuestList,
}: Props) {
  const [tab, setTab] = useState<VisitorTab>("ticket");
  const [ticket, setTicket] = useState<VisitorTicket | null>(null);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [notifications, setNotifications] = useState<VisitorNotification[]>([]);
  const [guestList, setGuestList] = useState<Array<{ id: string; firstName: string; lastName: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadNotifs = notifications.filter((n) => n.type === "warning" || n.type === "update").length;

  const loadAll = useCallback(async () => {
    const [t, ev, notifs, g] = await Promise.allSettled([
      fetchTicket(session.token),
      fetchEvents(session.token),
      fetchNotifications(session.token),
      fetchGuestList(session.token),
    ]);
    if (t.status === "fulfilled") setTicket(t.value);
    if (ev.status === "fulfilled") setEvents(ev.value);
    if (notifs.status === "fulfilled") setNotifications(notifs.value);
    if (g.status === "fulfilled") setGuestList(g.value);
  }, [session.token, fetchTicket, fetchEvents, fetchNotifications, fetchGuestList]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadAll().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338ca" />
        <Text style={styles.loadingText}>Loading your portal…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Hello, {session.name.split(" ")[0]} 👋</Text>
          <Text style={styles.headerEmail}>{session.email}</Text>
        </View>
        <Pressable onPress={onSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {tab === "ticket" && (
          <TicketPanel ticket={ticket} refreshing={refreshing} onRefresh={handleRefresh} />
        )}
        {tab === "agenda" && (
          <AgendaPanel
            items={ticket?.agenda ?? []}
            agendaTitle={ticket?.agendaTitle}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
        {tab === "events" && (
          <EventsPanel events={events} refreshing={refreshing} onRefresh={handleRefresh} />
        )}
        {tab === "guests" && (
          <GuestsPanel guests={guestList} refreshing={refreshing} onRefresh={handleRefresh} />
        )}
        {tab === "notifications" && (
          <NotifsPanel notifications={notifications} refreshing={refreshing} onRefresh={handleRefresh} />
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabBtn icon="🎫" label="Ticket"   active={tab === "ticket"}        onPress={() => setTab("ticket")} />
        <TabBtn icon="📋" label="Agenda"   active={tab === "agenda"}        onPress={() => setTab("agenda")} />
        <TabBtn icon="📅" label="Events"   active={tab === "events"}        onPress={() => setTab("events")} />
        <TabBtn icon="👥" label="Guests"   active={tab === "guests"}        onPress={() => setTab("guests")} />
        <TabBtn icon="🔔" label="Updates"  active={tab === "notifications"} badge={unreadNotifs} onPress={() => setTab("notifications")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#64748b", fontSize: 14 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: "#ffffff", borderBottomWidth: 1, borderColor: "#e2e8f0",
  },
  headerGreeting: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  headerEmail: { fontSize: 12, color: "#64748b", marginTop: 1 },
  signOutBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
  },
  signOutText: { color: "#dc2626", fontSize: 12, fontWeight: "700" },
  content: { flex: 1 },
  tabContent: { flex: 1, padding: 16 },
  tabBar: { flexDirection: "row", borderTopWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#ffffff" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10, position: "relative" },
  tabBtnActive: { borderTopWidth: 2, borderTopColor: "#4338ca" },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  tabLabelActive: { color: "#4338ca" },
  badge: {
    position: "absolute", top: 6, right: "10%",
    backgroundColor: "#dc2626", borderRadius: 9, minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  emptyMsg: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20 },
  // Ticket
  ticketCard: {
    backgroundColor: "#ffffff", borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: "#e2e8f0", gap: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  ticketBadge: { alignSelf: "flex-start", backgroundColor: "#d1fae5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  ticketBadgeText: { color: "#065f46", fontSize: 11, fontWeight: "800" },
  ticketEvent: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  ticketDate: { fontSize: 13, color: "#64748b" },
  ticketLocation: { fontSize: 13, color: "#64748b" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 4 },
  ticketTypeLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" },
  ticketType: { fontSize: 15, fontWeight: "700", color: "#334155" },
  barcodeBox: {
    backgroundColor: "#f8fafc", borderRadius: 14, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", gap: 6,
  },
  barcodeLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" },
  barcode: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: 3 },
  barcodeHint: { fontSize: 11, color: "#94a3b8", textAlign: "center" },
  // Agenda
  agendaTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 16 },
  agendaItem: { flexDirection: "row", gap: 14, marginBottom: 14 },
  agendaTime: { width: 56, backgroundColor: "#eef2ff", borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 8 },
  agendaTimeText: { fontSize: 12, fontWeight: "800", color: "#4338ca" },
  agendaBody: { flex: 1 },
  agendaItemTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  agendaMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  agendaDesc: { fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 17 },
  // Events
  eventRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0",
  },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4338ca", marginTop: 5 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  eventMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  statusPillRow: { marginTop: 6 },
  statusPill: { alignSelf: "flex-start", backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillGreen: { backgroundColor: "#d1fae5" },
  statusPillText: { fontSize: 11, fontWeight: "700", color: "#334155" },
  // Guests
  sectionLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "700", marginBottom: 12 },
  guestRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: "#f1f5f9" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#4338ca" },
  guestName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  // Notifications
  notifCard: {
    flexDirection: "row", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "flex-start",
  },
  notifWarning: { borderColor: "#fef08a", backgroundColor: "#fffbeb" },
  notifIcon: { fontSize: 22 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  notifMsg: { fontSize: 13, color: "#334155", marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#94a3b8", marginTop: 6 },
});
