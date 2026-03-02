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
  pairByCodePin,
  pairByQrToken,
  pairByStaffToken,
  scanTicket,
  sendHeartbeat,
} from "./src/api/mobileClient";
import { AuthChoiceScreen } from "./src/screens/AuthChoiceScreen";
import { PairCodePinScreen } from "./src/screens/PairCodePinScreen";
import { PairQrScreen } from "./src/screens/PairQrScreen";
import { PairStaffScreen } from "./src/screens/PairStaffScreen";
import { EventHomeScreen } from "./src/screens/EventHomeScreen";
import { GuestsScreen } from "./src/screens/GuestsScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { WalkupScreen } from "./src/screens/WalkupScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { getCachedGuests, initGuestCache, upsertGuests } from "./src/storage/guestCache";
import { enqueueMutation, initOfflineQueue, listQueuedMutations } from "./src/storage/offlineQueue";
import { clearSession, loadSession, saveSession } from "./src/storage/session";
import { replayQueue } from "./src/sync/replay";
import type { MobileGuest, PairingSession, QueueItem, SummaryMetrics } from "./src/types";

type AuthStep = "choice" | "code_pin" | "qr" | "staff";
type Tab = "home" | "guests" | "scan" | "walkup" | "activity";

const INSTALLATION_ID_KEY = "guest_manager_mobile_v2_installation_id";

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

export default function App() {
  const [booting, setBooting] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>("choice");
  const [session, setSession] = useState<PairingSession | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [guests, setGuests] = useState<MobileGuest[]>([]);
  const [guestsUpdatedAt, setGuestsUpdatedAt] = useState<string | undefined>(undefined);
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const queueCount = useMemo(() => listQueuedMutations().length, [syncing, lastSyncAt, guests.length]);

  useEffect(() => {
    initOfflineQueue();
    initGuestCache();
    loadSession()
      .then((saved) => {
        if (saved) {
          setSession(saved);
          setGuests(getCachedGuests(saved.eventId));
        }
      })
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    refreshDashboardData();
    const heartbeatTimer = setInterval(() => {
      sendHeartbeat(session, {
        battery: 100,
        appVersion: "0.1.0",
      }).catch(() => undefined);
    }, 60_000);

    const replayTimer = setInterval(() => {
      replayQueue(session)
        .then(() => setLastSyncAt(new Date().toISOString()))
        .catch(() => undefined);
    }, 15_000);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(replayTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

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
    setAuthStep("choice");
    setPairingError(null);
  }

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
      // Keep cached data for offline usage.
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
    if (!session) return;
    if (!guest.ticket?.barcode) {
      throw new Error("Guest has no scannable ticket");
    }
    setBusyGuestId(guest.id);
    const payload = {
      barcode: guest.ticket.barcode,
      action: "check_in" as const,
      method: "manual" as const,
      clientMutationId: createId(),
    };
    try {
      await scanTicket(session, payload);
      await refreshDashboardData();
    } catch {
      await enqueueScanFallback(payload);
      setGuests((prev) =>
        prev.map((row) =>
          row.id === guest.id ? { ...row, attendanceState: "checked_in", status: "checked_in" } : row
        )
      );
    } finally {
      setBusyGuestId(null);
    }
  }

  async function handleQuickCheckOut(guest: MobileGuest) {
    if (!session) return;
    if (!guest.ticket?.barcode) {
      throw new Error("Guest has no scannable ticket");
    }
    setBusyGuestId(guest.id);
    const payload = {
      barcode: guest.ticket.barcode,
      action: "checkout" as const,
      method: "manual" as const,
      clientMutationId: createId(),
    };
    try {
      await scanTicket(session, payload);
      await refreshDashboardData();
    } catch {
      await enqueueScanFallback(payload);
      setGuests((prev) =>
        prev.map((row) =>
          row.id === guest.id ? { ...row, attendanceState: "checked_out", status: "confirmed" } : row
        )
      );
    } finally {
      setBusyGuestId(null);
    }
  }

  async function manualScan(barcode: string) {
    if (!session) throw new Error("Missing session");
    const payload = {
      barcode,
      action: "check_in" as const,
      method: "scan" as const,
      clientMutationId: createId(),
    };
    try {
      const result = await scanTicket(session, payload);
      await refreshDashboardData();
      return `${result.result.toUpperCase()}: ${result.status}`;
    } catch {
      await enqueueScanFallback(payload);
      return "Queued offline for sync";
    }
  }

  async function submitWalkup(payload: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    checkInNow: boolean;
  }) {
    if (!session) return;
    const request = {
      ...payload,
      clientMutationId: createId(),
    };
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
    } finally {
      setSyncing(false);
    }
  }

  async function sendManualHeartbeat() {
    if (!session) return;
    await sendHeartbeat(session, {
      appVersion: "0.1.0",
      station: "Mobile",
    });
    setLastSyncAt(new Date().toISOString());
  }

  async function signOut() {
    await clearSession();
    setSession(null);
    setSummary(null);
    setGuests([]);
    setTab("home");
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.full}>
        {authStep === "choice" && (
          <AuthChoiceScreen
            onSelectCodePin={() => setAuthStep("code_pin")}
            onSelectQr={() => setAuthStep("qr")}
            onSelectStaff={() => setAuthStep("staff")}
          />
        )}
        {authStep === "code_pin" && (
          <PairCodePinScreen
            onBack={() => setAuthStep("choice")}
            onSubmit={async ({ accessCode, pin }) => {
              const paired = await pairByCodePin(accessCode, pin, await buildDeviceInfo());
              await storePairedSession(paired);
            }}
          />
        )}
        {authStep === "qr" && (
          <PairQrScreen
            onBack={() => setAuthStep("choice")}
            onSubmit={async (token) => {
              const paired = await pairByQrToken(token, await buildDeviceInfo());
              await storePairedSession(paired);
            }}
          />
        )}
        {authStep === "staff" && (
          <PairStaffScreen
            onBack={() => setAuthStep("choice")}
            onSubmit={async ({ staffToken, eventId }) => {
              const paired = await pairByStaffToken(staffToken, eventId, await buildDeviceInfo());
              await storePairedSession(paired);
            }}
          />
        )}
        {pairingError ? <Text style={styles.errorText}>{pairingError}</Text> : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.full}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guest Manager V2</Text>
        <Text style={styles.headerMeta}>Device: {session.deviceName}</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Unpair</Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        {tab === "home" && (
          <EventHomeScreen summary={summary} refreshing={refreshing} onRefresh={refreshDashboardData} />
        )}
        {tab === "guests" && (
          <GuestsScreen
            guests={guests}
            onQuickCheckIn={handleQuickCheckIn}
            onQuickCheckOut={handleQuickCheckOut}
            busyGuestId={busyGuestId}
          />
        )}
        {tab === "scan" && <ScanScreen onSubmitBarcode={manualScan} />}
        {tab === "walkup" && <WalkupScreen onSubmit={submitWalkup} />}
        {tab === "activity" && (
          <ActivityScreen
            queueCount={queueCount}
            lastSyncAt={lastSyncAt}
            onSyncNow={syncNow}
            onHeartbeat={sendManualHeartbeat}
            syncing={syncing}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Home" active={tab === "home"} onPress={() => setTab("home")} />
        <TabButton label="Guests" active={tab === "guests"} onPress={() => setTab("guests")} />
        <TabButton label="Scan" active={tab === "scan"} onPress={() => setTab("scan")} />
        <TabButton label="Walkup" active={tab === "walkup"} onPress={() => setTab("walkup")} />
        <TabButton label="Activity" active={tab === "activity"} onPress={() => setTab("activity")} />
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 16,
  },
  headerMeta: {
    color: "#64748b",
    fontSize: 12,
  },
  signOut: {
    marginTop: 4,
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 12,
  },
  main: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabButtonActive: {
    backgroundColor: "#e0e7ff",
  },
  tabText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#312e81",
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 20,
  },
});
