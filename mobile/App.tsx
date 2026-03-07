import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  bootstrap,
  confirmVisitorAttendance,
  createWalkup,
  fetchGuests,
  fetchVisitorHome,
  fetchVisitorNetworking,
  fetchSummary,
  fetchVisitorEvents,
  fetchVisitorChat,
  fetchVisitorMessages,
  fetchVisitorNotifications,
  fetchVisitorSessions,
  fetchVisitorTicket,
  joinEventByCode,
  markNotificationsRead,
  pairByCodePin,
  pairByQrToken,
  pairByStaffToken,
  registerPushToken,
  respondToNetworkingRequest as respondVisitorNetworkingRequest,
  scanTicket,
  sendNetworkingRequest,
  sendVisitorChatMessage,
  sendHeartbeat,
  updateVisitorProfile,
  visitorLogin,
  visitorRegister,
} from "./src/api/mobileClient";
import { RoleChoiceScreen } from "./src/screens/RoleChoiceScreen";
import { StaffChoiceScreen } from "./src/screens/StaffChoiceScreen";
import { PairCodePinScreen } from "./src/screens/PairCodePinScreen";
import { PairQrScreen } from "./src/screens/PairQrScreen";
import { PairStaffScreen } from "./src/screens/PairStaffScreen";
import { PremiumIntroScreen } from "./src/screens/PremiumIntroScreen";
import { VisitorLoginScreen } from "./src/screens/VisitorLoginScreen";
import { VisitorSignupScreen } from "./src/screens/VisitorSignupScreen";
import { VisitorDashboardScreen } from "./src/screens/VisitorDashboardScreen";
import { JoinEventScreen } from "./src/screens/JoinEventScreen";
import { ComposeMessageScreen } from "./src/screens/ComposeMessageScreen";
import { EventHomeScreen } from "./src/screens/EventHomeScreen";
import { GuestsScreen } from "./src/screens/GuestsScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { WalkupScreen } from "./src/screens/WalkupScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { getCachedGuests, initGuestCache, upsertGuests } from "./src/storage/guestCache";
import { enqueueMutation, initOfflineQueue, listQueuedMutations } from "./src/storage/offlineQueue";
import { clearSession, loadSession, saveSession } from "./src/storage/session";
import { replayQueue } from "./src/sync/replay";
import { FadeSlideIn } from "./src/ui/motion";
import { PremiumBackdrop, PremiumCard, PremiumPill } from "./src/ui/primitives";
import { palette, radii, spacing } from "./src/ui/theme";
import { getExpoProjectId } from "./src/config";
import type {
  MobileGuest,
  PairingSession,
  QueueItem,
  SummaryMetrics,
  VisitorSession,
  VisitorTicket,
  VisitorEvent,
} from "./src/types";

// ── Auth flow state ──────────────────────────────────────────────────────────
type AuthStep =
  | "role_choice"
  | "staff_choice"
  | "code_pin"
  | "qr"
  | "staff"
  | "visitor_login"
  | "visitor_signup"
  | "visitor_join"
  | "visitor_compose";

type Tab = "home" | "guests" | "scan" | "walkup" | "activity";

// ── Storage keys ─────────────────────────────────────────────────────────────
const INSTALLATION_ID_KEY = "guest_manager_mobile_v2_installation_id";
const VISITOR_SESSION_KEY = "guest_manager_visitor_session";
const INTRO_COMPLETE_KEY = "guest_manager_mobile_v2_intro_complete";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function createId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getInstallationId() {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const created = createId();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, created);
  return created;
}

// ── Visitor session helpers ──────────────────────────────────────────────────
async function saveVisitorSession(vs: VisitorSession) {
  await AsyncStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(vs));
}
async function loadVisitorSession(): Promise<VisitorSession | null> {
  const raw = await AsyncStorage.getItem(VISITOR_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as VisitorSession; } catch { return null; }
}
async function clearVisitorSession() {
  await AsyncStorage.removeItem(VISITOR_SESSION_KEY);
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [booting, setBooting] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>("role_choice");

  // Staff session
  const [session, setSession] = useState<PairingSession | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [guests, setGuests] = useState<MobileGuest[]>([]);
  const [guestsUpdatedAt, setGuestsUpdatedAt] = useState<string | undefined>(undefined);
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Visitor session
  const [visitorSession, setVisitorSession] = useState<VisitorSession | null>(null);

  const queueCount = listQueuedMutations().length;

  // ── Boot: restore either session ──────────────────────────────────────────
  useEffect(() => {
    initOfflineQueue();
    initGuestCache();
    Promise.all([
      loadSession(),
      loadVisitorSession(),
      AsyncStorage.getItem(INTRO_COMPLETE_KEY),
    ])
      .then(([staffSaved, visitorSaved, introSeen]) => {
        setIntroComplete(introSeen === "1");
        if (staffSaved) {
          setSession(staffSaved);
          setGuests(getCachedGuests(staffSaved.eventId));
        } else if (visitorSaved) {
          setVisitorSession(visitorSaved);
        }
      })
      .finally(() => setBooting(false));
  }, []);

  // ── Staff heartbeat + queue replay ────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    refreshDashboardData();
    const heartbeatTimer = setInterval(() => {
      sendHeartbeat(session, { battery: 100, appVersion: "0.1.0" }).catch(() => undefined);
    }, 60_000);
    const replayTimer = setInterval(() => {
      replayQueue(session).then(() => setLastSyncAt(new Date().toISOString())).catch(() => undefined);
    }, 15_000);
    return () => { clearInterval(heartbeatTimer); clearInterval(replayTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // ── Device info helper ────────────────────────────────────────────────────
  async function buildDeviceInfo(nameHint?: string) {
    const installationId = await getInstallationId();
    return {
      name: nameHint ?? `Door ${Platform.OS.toUpperCase()}`,
      installationId,
      platform: Platform.OS,
      model: undefined,
      osVersion: String(Platform.Version),
      appVersion: "0.1.0",
    };
  }

  async function storePairedSession(data: {
    token: string;
    device: { id: string; eventId: string; companyId: string; name: string };
  }) {
    const nextSession: PairingSession = {
      token: data.token,
      eventId: data.device.eventId,
      companyId: data.device.companyId,
      deviceId: data.device.id,
      deviceName: data.device.name,
    };
    await saveSession(nextSession);
    setSession(nextSession);
    setAuthStep("role_choice");
  }

  // ── Staff dashboard data helpers ──────────────────────────────────────────
  async function refreshDashboardData() {
    if (!session) return;
    setRefreshing(true);
    try {
      const [bootData, summaryData, guestData] = await Promise.all([
        bootstrap(session),
        fetchSummary(session),
        fetchGuests(session, guestsUpdatedAt),
      ]);
      setSummary(summaryData ?? bootData.summary);
      if (guestData.guests.length > 0) {
        upsertGuests(session.eventId, guestData.guests);
        setGuests(getCachedGuests(session.eventId));
      } else {
        setGuests(getCachedGuests(session.eventId));
      }
      setGuestsUpdatedAt(guestData.nextSyncAt);
      setLastSyncAt(new Date().toISOString());
    } catch {
      setGuests(getCachedGuests(session.eventId));
    } finally {
      setRefreshing(false);
    }
  }

  async function enqueueScanFallback(payload: Record<string, unknown>) {
    if (!session) return;
    const item: QueueItem = {
      id: createId(),
      endpoint: `/api/mobile/v1/events/${session.eventId}/scan`,
      method: "POST",
      payload,
      eventId: session.eventId,
      createdAt: new Date().toISOString(),
    };
    enqueueMutation(item);
  }

  async function handleQuickCheckIn(guest: MobileGuest) {
    if (!session || !guest.ticket?.barcode) throw new Error("Guest has no scannable ticket");
    setBusyGuestId(guest.id);
    const payload = { barcode: guest.ticket.barcode, action: "check_in" as const, method: "manual" as const, clientMutationId: createId() };
    try {
      await scanTicket(session, payload);
      await refreshDashboardData();
    } catch {
      await enqueueScanFallback(payload);
      setGuests((prev) => prev.map((row) => row.id === guest.id ? { ...row, attendanceState: "checked_in", status: "checked_in" } : row));
    } finally { setBusyGuestId(null); }
  }

  async function handleQuickCheckOut(guest: MobileGuest) {
    if (!session || !guest.ticket?.barcode) throw new Error("Guest has no scannable ticket");
    setBusyGuestId(guest.id);
    const payload = { barcode: guest.ticket.barcode, action: "checkout" as const, method: "manual" as const, clientMutationId: createId() };
    try {
      await scanTicket(session, payload);
      await refreshDashboardData();
    } catch {
      await enqueueScanFallback(payload);
      setGuests((prev) => prev.map((row) => row.id === guest.id ? { ...row, attendanceState: "checked_out", status: "confirmed" } : row));
    } finally { setBusyGuestId(null); }
  }

  async function manualScan(barcode: string) {
    if (!session) throw new Error("Missing session");
    const payload = { barcode, action: "check_in" as const, method: "scan" as const, clientMutationId: createId() };
    try {
      const result = await scanTicket(session, payload);
      await refreshDashboardData();
      return `${result.result.toUpperCase()}: ${result.status}`;
    } catch {
      await enqueueScanFallback(payload);
      return "Queued offline for sync";
    }
  }

  async function submitWalkup(payload: { firstName: string; lastName?: string; email?: string; phone?: string; checkInNow: boolean }) {
    if (!session) return;
    const request = { ...payload, clientMutationId: createId() };
    try {
      await createWalkup(session, request);
      await refreshDashboardData();
    } catch {
      const item: QueueItem = {
        id: createId(),
        endpoint: `/api/mobile/v1/events/${session.eventId}/walkups`,
        method: "POST",
        payload: request as Record<string, unknown>,
        eventId: session.eventId,
        createdAt: new Date().toISOString(),
      };
      enqueueMutation(item);
    }
  }

  async function syncNow() {
    if (!session) return;
    setSyncing(true);
    try {
      await replayQueue(session);
      await refreshDashboardData();
      setLastSyncAt(new Date().toISOString());
    } finally { setSyncing(false); }
  }

  async function staffSignOut() {
    await clearSession();
    setSession(null);
    setSummary(null);
    setGuests([]);
    setTab("home");
    setAuthStep("role_choice");
  }

  // ── Visitor auth handlers ─────────────────────────────────────────────────
  async function handleVisitorLogin(email: string, password: string) {
    const data = await visitorLogin(email, password);
    const vs: VisitorSession = { token: data.token, userId: data.userId, email: data.email, name: data.name };
    await saveVisitorSession(vs);
    setVisitorSession(vs);
  }

  async function handleVisitorRegister(data: { firstName: string; lastName: string; email: string; password: string }) {
    const result = await visitorRegister(data);
    const vs: VisitorSession = { token: result.token, userId: result.userId, email: result.email, name: result.name };
    await saveVisitorSession(vs);
    setVisitorSession(vs);
  }

  async function handleJoinEvent(code: string): Promise<string> {
    if (!visitorSession) throw new Error("Not logged in");
    const result = await joinEventByCode(visitorSession.token, code);
    // Refresh ticket/events in dashboard after joining
    return result.message;
  }

  async function visitorSignOut() {
    await clearVisitorSession();
    setVisitorSession(null);
    setAuthStep("role_choice");
  }


  // ── Visitor API wrappers ──────────────────────────────────────────────────
  async function loadVisitorTicket(token: string): Promise<VisitorTicket | null> {
    const res = await fetchVisitorTicket(token);
    return res.ticket;
  }
  async function loadVisitorEvents(token: string): Promise<VisitorEvent[]> {
    const res = await fetchVisitorEvents(token);
    return res.events;
  }
  async function loadVisitorNotifications(token: string) {
    const res = await fetchVisitorNotifications(token);
    return { notifications: res.notifications, unreadCount: res.unreadCount };
  }
  async function loadVisitorMessages(token: string) {
    const res = await fetchVisitorMessages(token);
    return res.messages;
  }
  async function handleMarkNotificationsRead(token: string) {
    await markNotificationsRead(token).catch(() => {});
  }
  async function handleVisitorAttendanceConfirm(token: string, eventId: string) {
    await confirmVisitorAttendance(token, eventId);
  }

  useEffect(() => {
    if (!visitorSession) return;

    let active = true;
    const authToken = visitorSession.token;
    async function registerForPush() {
      try {
        const ticket = await fetchVisitorTicket(authToken);
        const eventId = ticket.ticket?.event.id;
        if (!eventId || !Device.isDevice) return;

        const permissions = await Notifications.getPermissionsAsync();
        let finalStatus = permissions.status;
        if (finalStatus !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }
        if (finalStatus !== "granted") return;

        const projectId = getExpoProjectId();
        if (!projectId) return;

        const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!active || !tokenResult.data) return;

        await registerPushToken(authToken, {
          eventId,
          token: tokenResult.data,
          platform: Platform.OS,
        });
      } catch {
        // Keep app usable even if push registration fails.
      }
    }

    registerForPush();
    return () => {
      active = false;
    };
  }, [visitorSession]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <PremiumBackdrop>
          <View style={styles.bootShell}>
            <PremiumCard tone="glass" style={styles.bootCard}>
              <PremiumPill label="Launching" tone="live" />
              <Text style={styles.bootTitle}>Guest Manager Mobile</Text>
              <Text style={styles.bootBody}>
                Preparing attendee and operations experiences.
              </Text>
              <ActivityIndicator size="large" color={palette.accent} />
            </PremiumCard>
          </View>
        </PremiumBackdrop>
      </SafeAreaView>
    );
  }

  // ── Visitor is logged in ──────────────────────────────────────────────────
  if (visitorSession) {
    // Compose message screen
    if (authStep === "visitor_compose") {
      return (
        <SafeAreaView style={styles.full}>
          <ComposeMessageScreen
            token={visitorSession.token}
            onBack={() => setAuthStep("role_choice")}
            onSent={() => setAuthStep("role_choice")}
          />
        </SafeAreaView>
      );
    }
    // Join event screen
    if (authStep === "visitor_join") {
      return (
        <SafeAreaView style={styles.full}>
          <JoinEventScreen
            onBack={() => setAuthStep("role_choice")}
            onSubmit={handleJoinEvent}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.full}>
        <VisitorDashboardScreen
          session={visitorSession}
          onSignOut={visitorSignOut}
          onJoinEvent={() => setAuthStep("visitor_join")}
          onComposeMessage={() => setAuthStep("visitor_compose")}
          fetchTicket={loadVisitorTicket}
          fetchEvents={loadVisitorEvents}
          fetchNotifications={loadVisitorNotifications}
          fetchMessages={loadVisitorMessages}
          markNotificationsRead={handleMarkNotificationsRead}
          confirmAttendance={handleVisitorAttendanceConfirm}
          fetchHome={fetchVisitorHome}
          fetchSessions={fetchVisitorSessions}
          fetchNetworking={fetchVisitorNetworking}
          fetchChat={fetchVisitorChat}
          sendChatMessage={sendVisitorChatMessage}
          updateProfile={updateVisitorProfile}
          sendNetworkingRequest={sendNetworkingRequest}
          respondToNetworkingRequest={respondVisitorNetworkingRequest}
        />
      </SafeAreaView>
    );
  }

  // ── Staff is paired ───────────────────────────────────────────────────────
  if (session) {
    return (
      <SafeAreaView style={styles.full}>
        <PremiumBackdrop>
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>Operations Mode</Text>
            <Text style={styles.headerTitle}>Live check-in control</Text>
            <Text style={styles.headerMeta}>Device: {session.deviceName}</Text>
            <View style={styles.headerStats}>
              <PremiumPill label={`${queueCount} queued`} />
              <PremiumPill label={syncing ? "Syncing" : "Ready"} tone="live" />
            </View>
            <Pressable onPress={staffSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Unpair</Text>
            </Pressable>
          </View>
          <View style={styles.main}>
            <PremiumCard style={styles.whiteCard}>
              <FadeSlideIn key={tab} style={styles.screenStage} duration={320} distance={18}>
                {tab === "home" && <EventHomeScreen summary={summary} refreshing={refreshing} onRefresh={refreshDashboardData} />}
                {tab === "guests" && (
                  <GuestsScreen guests={guests} onQuickCheckIn={handleQuickCheckIn} onQuickCheckOut={handleQuickCheckOut} busyGuestId={busyGuestId} />
                )}
                {tab === "scan" && <ScanScreen onSubmitBarcode={manualScan} />}
                {tab === "walkup" && <WalkupScreen onSubmit={submitWalkup} />}
                {tab === "activity" && (
                  <ActivityScreen queueCount={queueCount} lastSyncAt={lastSyncAt} onSyncNow={syncNow} onHeartbeat={() => sendHeartbeat(session, { appVersion: "0.1.0" }).then(() => setLastSyncAt(new Date().toISOString()))} syncing={syncing} />
                )}
              </FadeSlideIn>
            </PremiumCard>
          </View>
          <View pointerEvents="box-none" style={styles.floatingTabBarContainer}>
            <View style={styles.floatingTabBar}>
              {(["home", "guests", "scan", "walkup", "activity"] as Tab[]).map((t) => (
                <TabButton key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onPress={() => setTab(t)} />
              ))}
            </View>
          </View>
        </PremiumBackdrop>
      </SafeAreaView>
    );
  }

  // ── Not authenticated — show auth flow ────────────────────────────────────
  if (!introComplete) {
    return (
      <SafeAreaView style={styles.full}>
        <PremiumIntroScreen
          onSkip={async () => {
            await AsyncStorage.setItem(INTRO_COMPLETE_KEY, "1");
            setIntroComplete(true);
          }}
          onFinish={async () => {
            await AsyncStorage.setItem(INTRO_COMPLETE_KEY, "1");
            setIntroComplete(true);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.full}>
      {authStep === "role_choice" && (
        <RoleChoiceScreen
          onSelectStaff={() => setAuthStep("staff_choice")}
          onSelectVisitor={() => setAuthStep("visitor_login")}
        />
      )}

      {/* Staff pairing */}
      {authStep === "staff_choice" && (
        <StaffChoiceScreen
          onBack={() => setAuthStep("role_choice")}
          onSelectCodePin={() => setAuthStep("code_pin")}
          onSelectQr={() => setAuthStep("qr")}
          onSelectStaff={() => setAuthStep("staff")}
        />
      )}
      {authStep === "code_pin" && (
        <PairCodePinScreen
          onBack={() => setAuthStep("staff_choice")}
          onSubmit={async ({ accessCode, pin }) => {
            const paired = await pairByCodePin(accessCode, pin, await buildDeviceInfo());
            await storePairedSession(paired);
          }}
        />
      )}
      {authStep === "qr" && (
        <PairQrScreen
          onBack={() => setAuthStep("staff_choice")}
          onSubmit={async (token) => {
            const paired = await pairByQrToken(token, await buildDeviceInfo());
            await storePairedSession(paired);
          }}
        />
      )}
      {authStep === "staff" && (
        <PairStaffScreen
          onBack={() => setAuthStep("staff_choice")}
          onSubmit={async ({ staffToken, eventId }) => {
            const paired = await pairByStaffToken(staffToken, eventId, await buildDeviceInfo());
            await storePairedSession(paired);
          }}
        />
      )}

      {/* Visitor auth */}
      {authStep === "visitor_login" && (
        <VisitorLoginScreen
          onBack={() => setAuthStep("role_choice")}
          onGoSignup={() => setAuthStep("visitor_signup")}
          onSubmit={handleVisitorLogin}
        />
      )}
      {authStep === "visitor_signup" && (
        <VisitorSignupScreen
          onBack={() => setAuthStep("visitor_login")}
          onGoLogin={() => setAuthStep("visitor_login")}
          onSubmit={handleVisitorRegister}
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const meta = {
    Home: { badge: "H", label: "Home" },
    Guests: { badge: "G", label: "Guests" },
    Scan: { badge: "S", label: "Scan" },
    Walkup: { badge: "W", label: "Walk-up" },
    Activity: { badge: "A", label: "Activity" },
  }[label] ?? { badge: label.charAt(0), label };

  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
        <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{meta.badge}</Text>
      </View>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{meta.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: "#1A1C30" }, // Deep Navy
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1A1C30" },
  bootShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  bootCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: spacing.md,
  },
  bootTitle: {
    fontWeight: "900",
    color: palette.textInverse,
    fontSize: 28,
    letterSpacing: -0.8,
  },
  bootBody: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  header: { 
    paddingHorizontal: 24, 
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerEyebrow: { color: "#FF8B96", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  headerTitle: { fontWeight: "900", color: "#FFFFFF", fontSize: 26, marginBottom: 6, letterSpacing: -0.7 },
  headerMeta: { color: "rgba(255,255,255,0.64)", fontSize: 13 },
  headerStats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  signOutBtn: { 
    position: "absolute", right: 24, top: 24,
    paddingHorizontal: 14, paddingVertical: 8, 
    backgroundColor: "rgba(255,91,106,0.12)",
    borderRadius: 12,
  },
  signOutText: { color: "#FF5B6A", fontWeight: "800", fontSize: 13 },
  
  main: { flex: 1, backgroundColor: "#1A1C30" },
  whiteCard: {
    flex: 1,
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
    overflow: "hidden",
    padding: 0,
  },
  screenStage: {
    flex: 1,
  },

  // Floating Tab Bar
  floatingTabBarContainer: {
    position: "absolute",
    bottom: 26,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  floatingTabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(16,25,47,0.96)",
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: "100%",
    maxWidth: 760,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  tabButton: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    minHeight: 68,
    paddingVertical: 10,
    borderRadius: 24,
  },
  tabButtonActive: { backgroundColor: "#13182C" },
  tabBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 6,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,91,106,0.18)",
  },
  tabBadgeText: { color: "#94A0BC", fontSize: 12, fontWeight: "900" },
  tabBadgeTextActive: { color: "#FF8B96" },
  tabText: { color: "#C3CCDD", fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },
  tabTextActive: { color: "#FFFFFF" },
});


