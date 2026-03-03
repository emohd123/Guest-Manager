import React, { useEffect, useMemo, useState } from "react";
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
import {
  bootstrap,
  createWalkup,
  fetchGuests,
  fetchSummary,
  fetchVisitorEvents,
  fetchVisitorGuestList,
  fetchVisitorNotifications,
  fetchVisitorTicket,
  joinEventByCode,
  pairByCodePin,
  pairByQrToken,
  pairByStaffToken,
  scanTicket,
  sendHeartbeat,
  visitorLogin,
  visitorRegister,
} from "./src/api/mobileClient";
import { RoleChoiceScreen } from "./src/screens/RoleChoiceScreen";
import { StaffChoiceScreen } from "./src/screens/StaffChoiceScreen";
import { PairCodePinScreen } from "./src/screens/PairCodePinScreen";
import { PairQrScreen } from "./src/screens/PairQrScreen";
import { PairStaffScreen } from "./src/screens/PairStaffScreen";
import { VisitorLoginScreen } from "./src/screens/VisitorLoginScreen";
import { VisitorSignupScreen } from "./src/screens/VisitorSignupScreen";
import { VisitorDashboardScreen } from "./src/screens/VisitorDashboardScreen";
import { JoinEventScreen } from "./src/screens/JoinEventScreen";
import { EventHomeScreen } from "./src/screens/EventHomeScreen";
import { GuestsScreen } from "./src/screens/GuestsScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { WalkupScreen } from "./src/screens/WalkupScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { getCachedGuests, initGuestCache, upsertGuests } from "./src/storage/guestCache";
import { enqueueMutation, initOfflineQueue, listQueuedMutations } from "./src/storage/offlineQueue";
import { clearSession, loadSession, saveSession } from "./src/storage/session";
import { replayQueue } from "./src/sync/replay";
import type {
  MobileGuest,
  PairingSession,
  QueueItem,
  SummaryMetrics,
  VisitorSession,
  VisitorTicket,
  VisitorEvent,
  VisitorNotification,
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
  | "visitor_join";

type Tab = "home" | "guests" | "scan" | "walkup" | "activity";

// ── Storage keys ─────────────────────────────────────────────────────────────
const INSTALLATION_ID_KEY = "guest_manager_mobile_v2_installation_id";
const VISITOR_SESSION_KEY = "guest_manager_visitor_session";

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

  const queueCount = useMemo(() => listQueuedMutations().length, [syncing, lastSyncAt, guests.length]);

  // ── Boot: restore either session ──────────────────────────────────────────
  useEffect(() => {
    initOfflineQueue();
    initGuestCache();
    Promise.all([loadSession(), loadVisitorSession()])
      .then(([staffSaved, visitorSaved]) => {
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
  async function loadVisitorNotifications(token: string): Promise<VisitorNotification[]> {
    const res = await fetchVisitorNotifications(token);
    return res.notifications;
  }
  async function loadVisitorGuests(token: string) {
    const res = await fetchVisitorGuestList(token);
    return res.guests;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4338ca" />
      </SafeAreaView>
    );
  }

  // ── Visitor is logged in ──────────────────────────────────────────────────
  if (visitorSession) {
    // Visitor is joining via code — show join screen over dashboard
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
          fetchTicket={loadVisitorTicket}
          fetchEvents={loadVisitorEvents}
          fetchNotifications={loadVisitorNotifications}
          fetchGuestList={loadVisitorGuests}
        />
      </SafeAreaView>
    );
  }

  // ── Staff is paired ───────────────────────────────────────────────────────
  if (session) {
    return (
      <SafeAreaView style={styles.full}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Guest Manager V2</Text>
          <Text style={styles.headerMeta}>Device: {session.deviceName}</Text>
          <Pressable onPress={staffSignOut}>
            <Text style={styles.signOut}>Unpair</Text>
          </Pressable>
        </View>
        <View style={styles.main}>
          {tab === "home" && <EventHomeScreen summary={summary} refreshing={refreshing} onRefresh={refreshDashboardData} />}
          {tab === "guests" && (
            <GuestsScreen guests={guests} onQuickCheckIn={handleQuickCheckIn} onQuickCheckOut={handleQuickCheckOut} busyGuestId={busyGuestId} />
          )}
          {tab === "scan" && <ScanScreen onSubmitBarcode={manualScan} />}
          {tab === "walkup" && <WalkupScreen onSubmit={submitWalkup} />}
          {tab === "activity" && (
            <ActivityScreen queueCount={queueCount} lastSyncAt={lastSyncAt} onSyncNow={syncNow} onHeartbeat={() => sendHeartbeat(session, { appVersion: "0.1.0" }).then(() => setLastSyncAt(new Date().toISOString()))} syncing={syncing} />
          )}
        </View>
        <View style={styles.tabBar}>
          {(["home", "guests", "scan", "walkup", "activity"] as Tab[]).map((t) => (
            <TabButton key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Not authenticated — show auth flow ────────────────────────────────────
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
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#ffffff" },
  headerTitle: { fontWeight: "700", color: "#0f172a", fontSize: 16 },
  headerMeta: { color: "#64748b", fontSize: 12 },
  signOut: { marginTop: 4, color: "#dc2626", fontWeight: "600", fontSize: 12 },
  main: { flex: 1 },
  tabBar: { flexDirection: "row", borderTopWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#ffffff" },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabButtonActive: { backgroundColor: "#e0e7ff" },
  tabText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#312e81" },
});
