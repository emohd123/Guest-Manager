import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  AgendaItem,
  VisitorEvent,
  VisitorGuestListItem,
  VisitorNotification,
  VisitorSession,
  VisitorTicket,
} from "../types";
import type { VisitorMessage } from "../api/mobileClient";

type VisitorTab = "ticket" | "agenda" | "events" | "guests" | "notifications";

interface Props {
  session: VisitorSession;
  onSignOut: () => void;
  onJoinEvent: () => void;
  onComposeMessage: () => void;
  fetchTicket: (token: string) => Promise<VisitorTicket | null>;
  fetchEvents: (token: string) => Promise<VisitorEvent[]>;
  fetchNotifications: (token: string) => Promise<{ notifications: VisitorNotification[]; unreadCount: number }>;
  fetchMessages: (token: string) => Promise<VisitorMessage[]>;
  markNotificationsRead: (token: string) => Promise<void>;
  fetchGuestList: (token: string) => Promise<VisitorGuestListItem[]>;
  confirmAttendance: (token: string, eventId: string) => Promise<void>;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getConfirmationLabel(rsvpStatus: string | null | undefined) {
  switch (rsvpStatus) {
    case "accepted":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "maybe":
      return "Maybe";
    default:
      return "Not Yet Confirmed";
  }
}

function TabBtn({
  label,
  icon,
  active,
  badge,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const pulseAnim = React.useRef(new Animated.Value(1));

  useEffect(() => {
    if (badge && badge > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim.current, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim.current, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.current.setValue(1);
    }
  }, [badge]);

  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {badge && badge > 0 ? (
        <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim.current }] }]}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

function Empty({ icon, title, msg }: { icon: string; title: string; msg: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMsg}>{msg}</Text>
    </View>
  );
}

function TicketPanel({
  ticket,
  refreshing,
  onRefresh,
  onConfirmAttendance,
  confirmingEventId,
}: {
  ticket: VisitorTicket | null;
  refreshing: boolean;
  onRefresh: () => void;
  onConfirmAttendance: (eventId: string) => Promise<void>;
  confirmingEventId: string | null;
}) {
  if (!ticket) {
    return <Empty icon="T" title="No ticket found" msg="No ticket is linked to your account. Contact the event organizer." />;
  }

  const isConfirmed = ticket.rsvpStatus === "accepted";

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.ticketCard}>
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketBadgeText}>{ticket.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.ticketEvent}>{ticket.event.name}</Text>
        <Text style={styles.ticketDate}>{fmtDate(ticket.event.startsAt)}</Text>
        {ticket.event.location ? <Text style={styles.ticketLocation}>Location: {ticket.event.location}</Text> : null}

        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationLabel}>Attendance Confirmation</Text>
          <Text style={styles.confirmationValue}>{getConfirmationLabel(ticket.rsvpStatus)}</Text>
          <Pressable
            disabled={isConfirmed || confirmingEventId === ticket.event.id}
            onPress={() => onConfirmAttendance(ticket.event.id)}
            style={[
              styles.confirmAttendanceBtn,
              (isConfirmed || confirmingEventId === ticket.event.id) && styles.confirmAttendanceBtnDisabled,
            ]}
          >
            <Text style={styles.confirmAttendanceBtnText}>
              {isConfirmed
                ? "Attendance Confirmed"
                : confirmingEventId === ticket.event.id
                  ? "Confirming..."
                  : "Confirm Attendance"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.divider} />
        <Text style={styles.ticketTypeLabel}>Ticket Type</Text>
        <Text style={styles.ticketType}>{ticket.ticketType}</Text>
        <View style={styles.divider} />
        <View style={styles.barcodeBox}>
          <Text style={styles.barcodeLabel}>BARCODE</Text>
          <Text style={styles.barcode}>{ticket.barcode}</Text>
          <Text style={styles.barcodeHint}>Show this to door staff for check-in</Text>
        </View>
        {ticket.event.visitorCode ? (
          <View style={styles.visitorCodeBox}>
            <Text style={styles.visitorCodeLabel}>VISITOR PORTAL CODE</Text>
            <Text style={styles.visitorCodeValue}>{ticket.event.visitorCode}</Text>
            <Text style={styles.visitorCodeHint}>Use this code in the app to follow event updates</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function AgendaPanel({
  items,
  agendaTitle,
  refreshing,
  onRefresh,
}: {
  items: AgendaItem[];
  agendaTitle: string | null | undefined;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (items.length === 0) {
    return <Empty icon="A" title="No agenda published" msg="The organizer has not published a schedule yet." />;
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.agendaTitle}>{agendaTitle ?? "Event Schedule"}</Text>
      {items.map((item, index) => (
        <View key={item.id ?? index} style={styles.agendaItem}>
          <View style={styles.agendaTime}>
            <Text style={styles.agendaTimeText}>{item.time || "-"}</Text>
          </View>
          <View style={styles.agendaBody}>
            <Text style={styles.agendaItemTitle}>{item.title}</Text>
            {item.speaker ? <Text style={styles.agendaMeta}>Speaker: {item.speaker}</Text> : null}
            {item.location ? <Text style={styles.agendaMeta}>Location: {item.location}</Text> : null}
            {item.description ? <Text style={styles.agendaDesc}>{item.description}</Text> : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function EventsPanel({
  events,
  refreshing,
  onRefresh,
  onJoin,
  onConfirmAttendance,
  confirmingEventId,
}: {
  events: VisitorEvent[];
  refreshing: boolean;
  onRefresh: () => void;
  onJoin: () => void;
  onConfirmAttendance: (eventId: string) => Promise<void>;
  confirmingEventId: string | null;
}) {
  if (events.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Empty icon="E" title="No events yet" msg="Events you are registered for will appear here." />
        <Pressable style={styles.joinBtn} onPress={onJoin}>
          <Text style={styles.joinBtnText}>+ Join with Event Code</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Pressable style={styles.joinBtn} onPress={onJoin}>
        <Text style={styles.joinBtnText}>+ Join with Event Code</Text>
      </Pressable>
      {events.map((event) => {
        const isConfirmed = event.rsvpStatus === "accepted";
        return (
          <View key={`${event.eventId}-${event.guestId}`} style={styles.eventRow}>
            <View style={styles.eventDot} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{event.eventName}</Text>
              <Text style={styles.eventMeta}>{fmtDate(event.startsAt)}</Text>
              <View style={styles.statusPillRow}>
                <View style={[styles.statusPill, event.attendanceState === "checked_in" && styles.pillGreen]}>
                  <Text style={styles.statusPillText}>
                    {event.attendanceState === "checked_in" ? "Checked in" : event.ticketStatus}
                  </Text>
                </View>
              </View>
              <View style={styles.eventConfirmationRow}>
                <Text style={styles.eventConfirmationText}>
                  Attendance: {getConfirmationLabel(event.rsvpStatus)}
                </Text>
                <Pressable
                  disabled={isConfirmed || confirmingEventId === event.eventId}
                  onPress={() => onConfirmAttendance(event.eventId)}
                  style={[
                    styles.eventConfirmBtn,
                    (isConfirmed || confirmingEventId === event.eventId) && styles.eventConfirmBtnDisabled,
                  ]}
                >
                  <Text style={styles.eventConfirmBtnText}>
                    {isConfirmed
                      ? "Confirmed"
                      : confirmingEventId === event.eventId
                        ? "Confirming..."
                        : "Confirm Attendance"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function GuestsPanel({
  guests,
  refreshing,
  onRefresh,
}: {
  guests: VisitorGuestListItem[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (guests.length === 0) {
    return <Empty icon="G" title="Guest list not available" msg="The organizer has not made the guest list visible yet." />;
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.sectionLabel}>{guests.length} GUESTS ATTENDING</Text>
      {guests.map((guest) => (
        <View key={guest.id} style={styles.guestRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(guest.firstName?.[0] ?? "?").toUpperCase()}</Text>
          </View>
          <View style={styles.guestMeta}>
            <Text style={styles.guestName}>{guest.firstName} {guest.lastName ?? ""}</Text>
            <Text style={styles.guestConfirmationText}>{getConfirmationLabel(guest.rsvpStatus)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function NotifsPanel({
  notifications,
  messages,
  refreshing,
  onRefresh,
  onCompose,
}: {
  notifications: VisitorNotification[];
  messages: VisitorMessage[];
  refreshing: boolean;
  onRefresh: () => void;
  onCompose: () => void;
}) {
  const typeIcon: Record<string, string> = {
    event_update: "INFO",
    agenda_update: "AGENDA",
    message_reply: "REPLY",
    info: "INFO",
    warning: "WARN",
    update: "UPDATE",
  };

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <TouchableOpacity style={styles.composeBtn} onPress={onCompose}>
        <Text style={styles.composeBtnText}>Message the Organizer</Text>
      </TouchableOpacity>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>N</Text>
          <Text style={styles.emptyTitle}>No updates yet</Text>
          <Text style={styles.emptyMsg}>Event announcements and changes will appear here.</Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <View
            key={notification.id}
            style={[
              styles.notifCard,
              !notification.isRead && styles.notifUnread,
              notification.type === "agenda_update" && styles.notifAgenda,
              notification.type === "message_reply" && styles.notifReply,
            ]}
          >
            <Text style={styles.notifIcon}>{typeIcon[notification.type] ?? "INFO"}</Text>
            <View style={styles.notifBody}>
              {notification.eventName ? <Text style={styles.notifEvent}>{notification.eventName}</Text> : null}
              <Text style={styles.notifTitle}>{notification.title}</Text>
              <Text style={styles.notifMsg}>{notification.message ?? notification.body}</Text>
              <Text style={styles.notifTime}>{fmtDate(notification.createdAt)}</Text>
            </View>
          </View>
        ))
      )}

      {messages.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionLabel}>YOUR SENT MESSAGES</Text>
          {messages.map((message) => (
            <View key={message.id} style={styles.msgCard}>
              <Text style={styles.msgSubject}>{message.subject ?? "Message"}</Text>
              {message.eventName ? <Text style={styles.msgEvent}>{message.eventName}</Text> : null}
              <Text style={styles.msgBody} numberOfLines={2}>{message.body}</Text>
              {message.adminReply ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>Reply from organizer:</Text>
                  <Text style={styles.replyText}>{message.adminReply}</Text>
                </View>
              ) : (
                <Text style={styles.pendingLabel}>Awaiting reply</Text>
              )}
              <Text style={styles.msgTime}>{fmtDate(message.createdAt)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

export function VisitorDashboardScreen({
  session,
  onSignOut,
  onJoinEvent,
  onComposeMessage,
  fetchTicket,
  fetchEvents,
  fetchNotifications,
  fetchMessages,
  markNotificationsRead,
  fetchGuestList,
  confirmAttendance,
}: Props) {
  const [tab, setTab] = useState<VisitorTab>("ticket");
  const [ticket, setTicket] = useState<VisitorTicket | null>(null);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [notifications, setNotifications] = useState<VisitorNotification[]>([]);
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [guestList, setGuestList] = useState<VisitorGuestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [ticketResult, eventsResult, notificationsResult, messagesResult, guestsResult] = await Promise.allSettled([
      fetchTicket(session.token),
      fetchEvents(session.token),
      fetchNotifications(session.token),
      fetchMessages(session.token),
      fetchGuestList(session.token),
    ]);

    if (ticketResult.status === "fulfilled") setTicket(ticketResult.value);
    if (eventsResult.status === "fulfilled") setEvents(eventsResult.value);
    if (notificationsResult.status === "fulfilled") {
      setNotifications(notificationsResult.value.notifications);
      setUnreadCount(notificationsResult.value.unreadCount);
    }
    if (messagesResult.status === "fulfilled") setMessages(messagesResult.value);
    if (guestsResult.status === "fulfilled") setGuestList(guestsResult.value);
  }, [session.token, fetchEvents, fetchGuestList, fetchMessages, fetchNotifications, fetchTicket]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (mounted) setLoading(true);
      await loadAll();
      if (mounted) setLoading(false);
    }

    run();
    return () => {
      mounted = false;
    };
  }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  async function handleConfirmAttendance(eventId: string) {
    setConfirmingEventId(eventId);
    try {
      await confirmAttendance(session.token, eventId);
      await loadAll();
    } finally {
      setConfirmingEventId(null);
    }
  }

  const fadeAnim = React.useRef(new Animated.Value(0));
  const slideAnim = React.useRef(new Animated.Value(20));

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim.current, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim.current, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338ca" />
        <Text style={styles.loadingText}>Loading your portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <View style={styles.headerAreaInner}>
          <View>
            <Text style={styles.headerGreeting}>Hello, {session.name.split(" ")[0]}</Text>
            <Text style={styles.headerEmail}>{session.email}</Text>
          </View>
          <Pressable onPress={onSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim.current, transform: [{ translateY: slideAnim.current }] }]}>
        {tab === "ticket" ? (
          <TicketPanel
            ticket={ticket}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onConfirmAttendance={handleConfirmAttendance}
            confirmingEventId={confirmingEventId}
          />
        ) : null}
        {tab === "agenda" ? (
          <AgendaPanel
            items={ticket?.agenda ?? []}
            agendaTitle={ticket?.agendaTitle}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : null}
        {tab === "events" ? (
          <EventsPanel
            events={events}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onJoin={onJoinEvent}
            onConfirmAttendance={handleConfirmAttendance}
            confirmingEventId={confirmingEventId}
          />
        ) : null}
        {tab === "guests" ? (
          <GuestsPanel guests={guestList} refreshing={refreshing} onRefresh={handleRefresh} />
        ) : null}
        {tab === "notifications" ? (
          <NotifsPanel
            notifications={notifications}
            messages={messages}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onCompose={onComposeMessage}
          />
        ) : null}
      </Animated.View>

      <View style={styles.floatingTabBarContainer}>
        <View style={styles.floatingTabBar}>
          <TabBtn icon="T" label="Ticket" active={tab === "ticket"} onPress={() => setTab("ticket")} />
          <TabBtn icon="A" label="Agenda" active={tab === "agenda"} onPress={() => setTab("agenda")} />
          <TabBtn icon="E" label="Events" active={tab === "events"} onPress={() => setTab("events")} />
          <TabBtn icon="G" label="Guests" active={tab === "guests"} onPress={() => setTab("guests")} />
          <TabBtn
            icon="U"
            label="Updates"
            active={tab === "notifications"}
            badge={unreadCount}
            onPress={() => {
              setTab("notifications");
              markNotificationsRead(session.token).catch(() => undefined);
              setUnreadCount(0);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EFF2F7" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#1A1C30" },
  loadingText: { color: "#8E94A3", fontSize: 14 },
  headerArea: {
    backgroundColor: "#1A1C30",
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 60,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 32,
    shadowColor: "#1A1C30",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  headerAreaInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerGreeting: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  headerEmail: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4, fontWeight: "500" },
  signOutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,91,106,0.15)",
  },
  signOutText: { color: "#FF5B6A", fontSize: 13, fontWeight: "800" },
  content: { flex: 1 },
  tabContent: { flex: 1, padding: 24, paddingBottom: 100 },
  floatingTabBarContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  floatingTabBar: {
    flexDirection: "row",
    backgroundColor: "#1A1C30",
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  tabBtn: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  tabBtnActive: { opacity: 1 },
  tabIcon: { fontSize: 22, opacity: 0.6, color: "#FFFFFF" },
  tabLabel: { fontSize: 10, alignSelf: "center", height: 0, overflow: "hidden", color: "#FFFFFF" },
  tabLabelActive: { height: "auto", color: "#FF5B6A", fontWeight: "800", marginTop: 4 },
  badge: {
    position: "absolute",
    top: -4,
    right: "12%",
    backgroundColor: "#FF5B6A",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#1A1C30",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 },
  emptyIcon: { fontSize: 56, opacity: 0.9, color: "#0f172a" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  emptyMsg: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 22 },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    gap: 12,
    shadowColor: "#1A1C30",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
    marginVertical: 12,
  },
  ticketBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,91,106,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ticketBadgeText: { color: "#FF5B6A", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  ticketEvent: { fontSize: 26, fontWeight: "900", color: "#1A1C30", letterSpacing: -1 },
  ticketDate: { fontSize: 15, color: "#8E94A3", fontWeight: "600" },
  ticketLocation: { fontSize: 14, color: "#8E94A3", fontWeight: "500", marginTop: -4 },
  confirmationCard: {
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#EBEFF5",
    padding: 18,
    gap: 10,
  },
  confirmationLabel: { fontSize: 11, color: "#A0A5B1", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  confirmationValue: { fontSize: 20, fontWeight: "800", color: "#1A1C30" },
  confirmAttendanceBtn: {
    borderRadius: 16,
    backgroundColor: "#1A1C30",
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmAttendanceBtnDisabled: { backgroundColor: "#CBD5E1" },
  confirmAttendanceBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  divider: { height: 1.5, backgroundColor: "#EBEFF5", marginVertical: 12, borderStyle: "dashed" },
  ticketTypeLabel: { fontSize: 12, color: "#A0A5B1", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  ticketType: { fontSize: 18, fontWeight: "800", color: "#1A1C30" },
  barcodeBox: {
    backgroundColor: "#F8F9FB",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEFF5",
    gap: 8,
    marginTop: 8,
  },
  barcodeLabel: { fontSize: 12, color: "#A0A5B1", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  barcode: { fontSize: 24, fontWeight: "900", color: "#1A1C30", letterSpacing: 6 },
  barcodeHint: { fontSize: 12, color: "#8E94A3", textAlign: "center", fontWeight: "500" },
  visitorCodeBox: {
    backgroundColor: "rgba(255,91,106,0.05)",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,91,106,0.2)",
    gap: 6,
    marginTop: 8,
  },
  visitorCodeLabel: { fontSize: 11, color: "#FF5B6A", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  visitorCodeValue: { fontSize: 24, fontWeight: "900", color: "#FF5B6A", letterSpacing: 8 },
  visitorCodeHint: { fontSize: 12, color: "rgba(255,91,106,0.8)", textAlign: "center", fontWeight: "500" },
  joinBtn: {
    backgroundColor: "#FF5B6A",
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  joinBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  agendaTitle: { fontSize: 22, fontWeight: "900", color: "#1A1C30", marginBottom: 20, letterSpacing: -0.5 },
  agendaItem: { flexDirection: "row", gap: 16, marginBottom: 20 },
  agendaTime: { width: 64, backgroundColor: "#FFFFFF", borderRadius: 20, alignItems: "center", justifyContent: "center", padding: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  agendaTimeText: { fontSize: 13, fontWeight: "800", color: "#1A1C30" },
  agendaBody: { flex: 1, paddingVertical: 2 },
  agendaItemTitle: { fontSize: 16, fontWeight: "800", color: "#1A1C30" },
  agendaMeta: { fontSize: 13, color: "#8E94A3", marginTop: 4, fontWeight: "500" },
  agendaDesc: { fontSize: 14, color: "#8E94A3", marginTop: 6, lineHeight: 22 },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1A1C30",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  eventDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#4f46e5", marginTop: 6 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  eventMeta: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
  statusPillRow: { marginTop: 10 },
  statusPill: { alignSelf: "flex-start", backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillGreen: { backgroundColor: "#dcfce7" },
  statusPillText: { fontSize: 12, fontWeight: "800", color: "#166534" },
  eventConfirmationRow: { marginTop: 12, gap: 10 },
  eventConfirmationText: { fontSize: 13, color: "#334155", fontWeight: "700" },
  eventConfirmBtn: {
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: "#1A1C30",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eventConfirmBtnDisabled: { backgroundColor: "#CBD5E1" },
  eventConfirmBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  sectionLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "800", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  guestRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  guestMeta: { flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#4f46e5" },
  guestName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  guestConfirmationText: { marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: "600" },
  composeBtn: {
    backgroundColor: "#eef2ff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    marginBottom: 20,
  },
  composeBtnText: { color: "#4f46e5", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  notifCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 1,
  },
  notifUnread: { borderColor: "#c7d2fe", backgroundColor: "#f5f8ff" },
  notifAgenda: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  notifReply: { borderColor: "#e9d5ff", backgroundColor: "#faf5ff" },
  notifIcon: { fontSize: 13, color: "#334155", width: 50, fontWeight: "800" },
  notifBody: { flex: 1 },
  notifEvent: { fontSize: 11, color: "#6366f1", fontWeight: "800", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  notifTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  notifMsg: { fontSize: 14, color: "#475569", marginTop: 4, lineHeight: 20 },
  notifTime: { fontSize: 12, color: "#94a3b8", marginTop: 8, fontWeight: "500" },
  msgCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 1,
  },
  msgSubject: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  msgEvent: { fontSize: 12, color: "#6366f1", fontWeight: "700", marginTop: 2 },
  msgBody: { fontSize: 14, color: "#64748b", marginTop: 6, lineHeight: 20 },
  replyBox: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  replyLabel: { fontSize: 12, color: "#16a34a", fontWeight: "800", marginBottom: 4 },
  replyText: { fontSize: 14, color: "#15803d", lineHeight: 20 },
  pendingLabel: { fontSize: 12, color: "#94a3b8", marginTop: 8, fontWeight: "600" },
  msgTime: { fontSize: 12, color: "#94a3b8", marginTop: 8, fontWeight: "500" },
});
