import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BrandLogo } from "../ui/brand-logo";
import { FallingSparkles } from "../ui/FallingSparkles";
import { Dock } from "../ui/Dock";
import { BorderGlow } from "../ui/BorderGlow";
import { SpotlightCard } from "../ui/SpotlightCard";
import type { DiscoverEvent } from "../types";
import type {
  VisitorChatThread,
  VisitorEvent,
  VisitorHomeData,
  VisitorMeeting,
  VisitorNetworkingProfile,
  VisitorNetworkingRecommendation,
  VisitorNetworkingRequest,
  VisitorNotification,
  VisitorSession,
  VisitorSessionItem,
  VisitorTicket,
} from "../types";
import type { VisitorMessage } from "../api/mobileClient";
import { fetchDiscoverEvents, updateVisitorSessionState as updateVisitorSessionStateRequest } from "../api/mobileClient";
import { getApiBaseUrl } from "../config";

const DISCOVER_GRADIENTS: [string, string][] = [
  ["#0f172a", "#3730a3"],
  ["#0f172a", "#be185d"],
  ["#164e63", "#0ea5e9"],
  ["#3b0764", "#a21caf"],
  ["#1e1b4b", "#7c3aed"],
];

type VisitorTab = "home" | "discover" | "agenda" | "networking" | "inbox" | "ticket";

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
  confirmAttendance: (token: string, eventId: string) => Promise<void>;
  fetchHome: (token: string, eventId?: string) => Promise<VisitorHomeData>;
  fetchSessions: (
    token: string,
    eventId: string
  ) => Promise<{ sessions: VisitorSessionItem[]; settings: Record<string, unknown> }>;
  fetchNetworking: (
    token: string,
    eventId: string
  ) => Promise<{
    viewerGuestId: string;
    profile: VisitorNetworkingProfile;
    recommendations: VisitorNetworkingRecommendation[];
    directory: VisitorNetworkingRecommendation[];
    featuredSponsors: import("../types").VisitorSponsorProfile[];
    requests: VisitorNetworkingRequest[];
    meetings: VisitorMeeting[];
    taxonomy: { interests: string[]; goals: string[]; industries: string[] };
    introText?: string;
    privacyDescription?: string;
    directoryEmptyState?: string;
  }>;
  fetchChat: (token: string, eventId: string) => Promise<{ viewerGuestId: string; threads: VisitorChatThread[] }>;
  sendChatMessage: (
    token: string,
    payload: { eventId: string; body: string; threadId?: string; targetGuestId?: string }
  ) => Promise<{ threadId: string }>;
  updateProfile: (
    token: string,
    payload: {
      eventId: string;
      optedIn?: boolean;
      visible?: boolean;
      headline?: string;
      company?: string;
      role?: string;
      bio?: string;
      profileImageUrl?: string;
      interests?: string[];
      goals?: string[];
      industries?: string[];
      availability?: string;
      contactSharing?: { email?: boolean; phone?: boolean };
    }
  ) => Promise<{ profile: VisitorNetworkingProfile }>;
  sendNetworkingRequest: (
    token: string,
    payload: { eventId: string; targetGuestId: string; message?: string }
  ) => Promise<{ request: VisitorNetworkingRequest }>;
  respondToNetworkingRequest: (
    token: string,
    requestId: string,
    payload: {
      eventId: string;
      status: "accepted" | "declined";
      scheduledFor?: string;
      location?: string;
      notes?: string;
    }
  ) => Promise<{ success: boolean }>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "TBA";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtFullDate(iso?: string | null) {
  if (!iso) return "TBA";
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
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.76}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={20} color={active ? "#FFFFFF" : "#8D98C5"} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {badge && badge > 0 ? (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.secondaryButton} onPress={onAction}>
          <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const NATIVE_DRIVER = Platform.OS !== "web";

/** Staggered mount entrance: fade + rise + subtle scale. `delay` in ms. */
function AnimatedEntrance({
  delay = 0,
  from = 16,
  style,
  children,
}: {
  delay?: number;
  from?: number;
  style?: any;
  children: React.ReactNode;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      delay,
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, progress]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Softly breathing dot used for the LIVE indicator. */
function PulseDot({ color = "#F43F5E", size = 9 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

/** Slowly pulsing radial glow that gives the hero a living feel. */
function AnimatedGlow({ style }: { style?: any }) {
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(glow, { toValue: 0, duration: 2600, useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);
  return (
    <Animated.View
      style={[
        style,
        {
          pointerEvents: "none",
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }),
          transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
        },
      ]}
    />
  );
}

function InfoChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.infoChip, accent && styles.infoChipAccent]}>
      <Text style={[styles.infoChipLabel, accent && styles.infoChipLabelAccent]}>{label}</Text>
      <Text style={[styles.infoChipValue, accent && styles.infoChipValueAccent]}>{value}</Text>
    </View>
  );
}

function formatDiscoverPrice(event: DiscoverEvent) {
  if (!event.hasTickets) return "Open";
  if (event.minPrice === null || event.minPrice <= 0) return "Free";
  try {
    return new Intl.NumberFormat("en-BH", {
      style: "currency",
      currency: event.currency || "BHD",
      minimumFractionDigits: (event.currency || "BHD").toUpperCase() === "BHD" ? 3 : 2,
      maximumFractionDigits: (event.currency || "BHD").toUpperCase() === "BHD" ? 3 : 2,
    }).format(event.minPrice / 100);
  } catch {
    return `${event.currency} ${event.minPrice}`;
  }
}

/** Resolve a discover event path to an absolute URL and open it reliably.
 *  On web we force a new tab so the SPA isn't replaced; on native we defer to Linking. */
function openDiscoverUrl(path?: string | null) {
  if (!path) return;
  const url = path.startsWith("http") ? path : `${getApiBaseUrl().replace(/\/$/, "")}${path}`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  Linking.openURL(url).catch(() => {});
}

function discoverDayLabel(iso: string) {
  try {
    return new Date(iso)
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" })
      .toUpperCase();
  } catch {
    return "";
  }
}

/** Compact event box: cover image, date + price pills, then Buy tickets / Details. */
function DiscoverCard({ event, index }: { event: DiscoverEvent; index: number }) {
  const gradient = DISCOVER_GRADIENTS[index % DISCOVER_GRADIENTS.length];
  const host = event.venueName ?? event.locationText ?? event.category ?? event.organizerName ?? event.companyName;
  const day = discoverDayLabel(event.startsAt);
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: NATIVE_DRIVER, tension: 220, friction: 12 }).start();
  const buyPath = event.buyUrl || event.publicUrl;
  return (
    <AnimatedEntrance delay={100 + index * 60} style={styles.discoverCardWrap}>
      <SpotlightCard borderRadius={22} spotlightColor="rgba(139,92,246,0.24)">
      <Animated.View style={[styles.discoverCard, { transform: [{ scale }] }]}>
        <Pressable
          onPress={() => openDiscoverUrl(buyPath)}
          onPressIn={() => springTo(0.98)}
          onPressOut={() => springTo(1)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${event.title}`}
          style={styles.discoverCardMedia}
        >
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {event.coverImageUrl ? (
            <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <LinearGradient
            colors={["rgba(8,16,32,0.05)", "rgba(8,16,32,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.discoverPills}>
            {day ? (
              <View style={styles.discoverPillDark}>
                <Text style={styles.discoverPillDarkText}>{day}</Text>
              </View>
            ) : <View />}
            <View style={styles.discoverPillDark}>
              <Text style={styles.discoverPillDarkText}>{formatDiscoverPrice(event)}</Text>
            </View>
          </View>
          <View style={styles.discoverCardTitleWrap}>
            <Text style={styles.discoverCardTitle} numberOfLines={1}>{event.title}</Text>
            {host ? <Text style={styles.discoverCardHost} numberOfLines={1}>{host}</Text> : null}
          </View>
        </Pressable>
        <View style={styles.discoverCardActions}>
          <Pressable
            style={styles.discoverPrimaryBtn}
            onPress={() => openDiscoverUrl(buyPath)}
            accessibilityRole="button"
          >
            <LinearGradient colors={["#8B5CF6", "#DB2777"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.discoverPrimaryBtnBg}>
              <Text style={styles.discoverPrimaryBtnText}>{event.hasTickets ? "Buy tickets" : "Open"}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={styles.discoverGhostBtn}
            onPress={() => openDiscoverUrl(event.publicUrl)}
            accessibilityRole="button"
          >
            <Text style={styles.discoverGhostBtnText}>Details</Text>
          </Pressable>
        </View>
      </Animated.View>
      </SpotlightCard>
    </AnimatedEntrance>
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
  confirmAttendance,
  fetchHome,
  fetchSessions,
  fetchNetworking,
  fetchChat,
  sendChatMessage,
  updateProfile,
  sendNetworkingRequest,
  respondToNetworkingRequest,
}: Props) {
  const [tab, setTab] = useState<VisitorTab>("home");

  // Hardware back: return to the Home tab first; only exit from Home.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "home") {
        setTab("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab]);

  const [ticket, setTicket] = useState<VisitorTicket | null>(null);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [discover, setDiscover] = useState<DiscoverEvent[]>([]);
  const [home, setHome] = useState<VisitorHomeData | null>(null);
  const [agenda, setAgenda] = useState<VisitorSessionItem[]>([]);
  const [networking, setNetworking] = useState<{
    viewerGuestId: string;
    profile: VisitorNetworkingProfile;
    recommendations: VisitorNetworkingRecommendation[];
    directory: VisitorNetworkingRecommendation[];
    featuredSponsors: import("../types").VisitorSponsorProfile[];
    requests: VisitorNetworkingRequest[];
    meetings: VisitorMeeting[];
    taxonomy: { interests: string[]; goals: string[]; industries: string[] };
    introText?: string;
    privacyDescription?: string;
    directoryEmptyState?: string;
  } | null>(null);
  const [chatThreads, setChatThreads] = useState<VisitorChatThread[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(null);
  const [sendingChat, setSendingChat] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [notifications, setNotifications] = useState<VisitorNotification[]>([]);
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [connectingGuestId, setConnectingGuestId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<VisitorNetworkingProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState<Record<string, string>>({});
  const { width } = useWindowDimensions();
  const compactHome = width < 760;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  const currentEventId = useMemo(
    () => selectedEventId ?? ticket?.event.id ?? home?.event.id ?? events[0]?.eventId ?? null,
    [events, home?.event.id, selectedEventId, ticket?.event.id]
  );

  const viewerGuestId = networking?.viewerGuestId ?? ticket?.guestId ?? null;

  const loadBase = useCallback(async () => {
    const [ticketResult, eventsResult, notificationsResult, messagesResult] = await Promise.allSettled([
      fetchTicket(session.token),
      fetchEvents(session.token),
      fetchNotifications(session.token),
      fetchMessages(session.token),
    ]);
    const nextTicket = ticketResult.status === "fulfilled" ? ticketResult.value : null;
    const nextEvents = eventsResult.status === "fulfilled" ? eventsResult.value : [];
    const activeEventId = selectedEventId ?? nextTicket?.event.id ?? nextEvents[0]?.eventId ?? null;

    setTicket(nextTicket);
    setEvents(nextEvents);

    if (notificationsResult.status === "fulfilled") {
      setNotifications(notificationsResult.value.notifications);
      setUnreadCount(notificationsResult.value.unreadCount);
    }
    if (messagesResult.status === "fulfilled") {
      setMessages(messagesResult.value);
    }

    if (activeEventId) {
      const [homeResult, sessionsResult, networkingResult, chatResult] = await Promise.allSettled([
        fetchHome(session.token, activeEventId),
        fetchSessions(session.token, activeEventId),
        fetchNetworking(session.token, activeEventId),
        fetchChat(session.token, activeEventId),
      ]);

      setHome(homeResult.status === "fulfilled" ? homeResult.value : null);
      setAgenda(sessionsResult.status === "fulfilled" ? sessionsResult.value.sessions : []);
      if (networkingResult.status === "fulfilled") {
        setNetworking(networkingResult.value);
        setProfileDraft(networkingResult.value.profile);
      } else {
        setNetworking(null);
        setProfileDraft(null);
      }
      if (chatResult.status === "fulfilled") {
        setChatThreads(chatResult.value.threads);
        setActiveChatThreadId((current) => current ?? chatResult.value.threads[0]?.id ?? null);
      } else {
        setChatThreads([]);
        setActiveChatThreadId(null);
      }
      if (!selectedEventId) setSelectedEventId(activeEventId);
    } else {
      setHome(null);
      setAgenda([]);
      setNetworking(null);
      setProfileDraft(null);
      setChatThreads([]);
      setActiveChatThreadId(null);
    }
  }, [
    fetchEvents,
    fetchChat,
    fetchHome,
    fetchMessages,
    fetchNetworking,
    fetchNotifications,
    fetchSessions,
    fetchTicket,
    selectedEventId,
    session.token,
  ]);

  useEffect(() => {
    let mounted = true;
    fetchDiscoverEvents()
      .then((result) => {
        if (mounted) setDiscover(result.events ?? []);
      })
      .catch(() => {
        if (mounted) setDiscover([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const useNativeDriver = Platform.OS !== "web";
    async function run() {
      if (mounted) setLoading(true);
      await loadBase();
      if (mounted) {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver }),
          Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver }),
        ]).start();
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [fadeAnim, loadBase, slideAnim]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadBase();
    setRefreshing(false);
  }

  async function handleConfirmAttendance(eventId: string) {
    setConfirmingEventId(eventId);
    try {
      await confirmAttendance(session.token, eventId);
      await loadBase();
    } finally {
      setConfirmingEventId(null);
    }
  }

  async function handleSessionAction(
    sessionId: string,
    action: "save" | "unsave" | "plan" | "unplan" | "view" | "live_open"
  ) {
    if (!currentEventId) return;
    try {
      await updateVisitorSessionStateRequest(session.token, currentEventId, sessionId, action);
      await loadBase();
    } catch (error) {
      Alert.alert("Action failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  async function handleLiveOpen(url?: string | null, sessionId?: string) {
    if (!url) return;
    try {
      if (currentEventId && sessionId) {
        await updateVisitorSessionStateRequest(session.token, currentEventId, sessionId, "live_open");
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Unable to open stream", error instanceof Error ? error.message : "Invalid stream URL.");
    }
  }

  async function openExternal(url?: string | null) {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Unable to open link", error instanceof Error ? error.message : "Invalid URL.");
    }
  }

  async function handleSaveProfile() {
    if (!currentEventId || !profileDraft) return;
    setSavingProfile(true);
    try {
      const result = await updateProfile(session.token, {
        eventId: currentEventId,
        optedIn: profileDraft.optedIn,
        visible: profileDraft.visible,
        headline: profileDraft.headline,
        company: profileDraft.company,
        role: profileDraft.role,
        bio: profileDraft.bio,
        profileImageUrl: profileDraft.profileImageUrl,
        interests: profileDraft.interests,
        goals: profileDraft.goals,
        industries: profileDraft.industries,
        availability: profileDraft.availability,
        contactSharing: profileDraft.contactSharing,
      });
      setProfileDraft(result.profile);
      await loadBase();
    } catch (error) {
      Alert.alert("Profile update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleConnect(targetGuestId: string) {
    if (!currentEventId) return;
    setConnectingGuestId(targetGuestId);
    try {
      await sendNetworkingRequest(session.token, {
        eventId: currentEventId,
        targetGuestId,
        message: requestMessage[targetGuestId]?.trim() || undefined,
      });
      setRequestMessage((current) => ({ ...current, [targetGuestId]: "" }));
      await loadBase();
    } catch (error) {
      Alert.alert("Connection request failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setConnectingGuestId(null);
    }
  }

  async function handleRequestResponse(
    requestId: string,
    status: "accepted" | "declined",
    fallbackTitle?: string
  ) {
    if (!currentEventId) return;
    setActingRequestId(requestId);
    try {
      await respondToNetworkingRequest(session.token, requestId, {
        eventId: currentEventId,
        status,
        notes: status === "accepted" ? `Meeting accepted for ${fallbackTitle ?? "networking match"}` : undefined,
      });
      await loadBase();
    } catch (error) {
      Alert.alert("Request update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setActingRequestId(null);
    }
  }

  function switchEvent(eventId: string) {
    setSelectedEventId(eventId);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6A6F" />
        <Text style={styles.loadingText}>Building your event experience...</Text>
      </View>
    );
  }

  const activeEventName =
    home?.event.title ??
    ticket?.event.name ??
    events.find((event) => event.eventId === currentEventId)?.eventName ??
    "Your Event";
  const liveLabel = home?.settings.liveStream?.label || home?.liveSession?.liveStreamLabel || "Watch Live";
  const filteredDirectory = (networking?.directory ?? []).filter((item: VisitorNetworkingRecommendation) => {
    if (!directoryQuery.trim()) return true;
    const haystack = [item.name, item.company, item.role, item.headline, ...(item.reasons ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(directoryQuery.trim().toLowerCase());
  });
  const activeChatThread = chatThreads.find((thread) => thread.id === activeChatThreadId) ?? null;

  async function handleSendChat(targetGuestId?: string) {
    if (!currentEventId || !chatDraft.trim()) return;
    setSendingChat(true);
    try {
      await sendChatMessage(session.token, {
        eventId: currentEventId,
        body: chatDraft,
        threadId: activeChatThreadId ?? undefined,
        targetGuestId,
      });
      setChatDraft("");
      await loadBase();
    } catch (error) {
      Alert.alert("Message failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSendingChat(false);
    }
  }

  return (
    <View style={styles.screen}>
      <FallingSparkles count={10} speed={0.7} />
      <View style={styles.headerShell}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <BrandLogo size={38} showWordmark />
            <Text style={styles.headerEyebrow}>{activeEventName}</Text>
            <Text style={styles.headerTitle}>{home?.settings.homeHeadline ?? "Live event companion"}</Text>
            <Text style={styles.headerSubtitle}>
              {home?.settings.welcomeMessage ?? "Stay on top of sessions, meetings, and live moments."}
            </Text>
          </View>
          <Pressable onPress={onSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        {events.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSwitcher}>
            {events.map((event) => (
              <Pressable
                key={`${event.eventId}-${event.guestId}`}
                style={[styles.eventPill, event.eventId === currentEventId && styles.eventPillActive]}
                onPress={() => switchEvent(event.eventId)}
              >
                <Text style={[styles.eventPillText, event.eventId === currentEventId && styles.eventPillTextActive]}>
                  {event.eventName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {tab === "home" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            <AnimatedEntrance delay={0} from={22}>
             <BorderGlow borderRadius={28} backgroundColor="#0d1326" colors={["#c084fc", "#f472b6", "#38bdf8"]}>
              <View style={styles.heroInner}>
              <LinearGradient
                colors={["rgba(124,58,237,0.28)", "rgba(37,99,235,0.10)", "rgba(219,39,119,0.20)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <AnimatedGlow style={styles.heroGlow} />
              <AnimatedGlow style={styles.heroGlowTop} />
              <View style={[styles.heroContent, compactHome && styles.heroContentCompact]}>
                <View style={[styles.heroCopy, compactHome && styles.heroCopyCompact]}>
                  <Text style={styles.heroDate}>{fmtFullDate(home?.event.startsAt ?? ticket?.event.startsAt)}</Text>
                  <Text style={styles.heroTitle}>{activeEventName}</Text>
                  <Text style={styles.heroBody}>
                    {home?.event.shortDescription ??
                      home?.event.description ??
                      "Your ticket, agenda, and updates are ready."}
                  </Text>
                  <View style={styles.heroStats}>
                    <InfoChip label="RSVP" value={getConfirmationLabel(ticket?.rsvpStatus)} accent />
                    <InfoChip label="Agenda" value={`${agenda.length} sessions`} />
                    <InfoChip label="Updates" value={`${unreadCount} unread`} />
                  </View>
                  <View style={styles.heroActions}>
                    <TouchableOpacity activeOpacity={0.82} style={styles.primaryButton} onPress={() => setTab("agenda")}>
                      <Text style={styles.primaryButtonText}>View Agenda</Text>
                    </TouchableOpacity>
                    {home?.settings.liveStream?.url ? (
                      <Pressable
                        style={styles.outlineButton}
                        onPress={() => handleLiveOpen(home.settings.liveStream?.url, home.liveSession?.id)}
                      >
                        <Text style={styles.outlineButtonText}>{liveLabel}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                <View style={[styles.heroMedia, compactHome && styles.heroMediaCompact]}>
                  {home?.event.coverImageUrl ? (
                    <Image source={{ uri: home.event.coverImageUrl }} style={styles.heroImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.heroImageFallback}>
                      <Ionicons name="calendar-outline" size={30} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>
              </View>
             </BorderGlow>
            </AnimatedEntrance>

            <View style={styles.metricsRow}>
              <AnimatedEntrance delay={90} style={styles.metricFlex}>
                <SpotlightCard borderRadius={22} spotlightColor="rgba(124,58,237,0.28)">
                <View style={styles.metricCard}>
                  <View style={styles.metricHeadRow}>
                    <Ionicons name="time-outline" size={13} color="#8FA0D8" />
                    <Text style={styles.metricLabel}>NEXT SESSION</Text>
                  </View>
                  <Text style={styles.metricValue} numberOfLines={2}>{home?.nextSession?.title ?? "No upcoming session"}</Text>
                  <Text style={styles.metricMeta}>{fmtDate(home?.nextSession?.startsAt)}</Text>
                </View>
                </SpotlightCard>
              </AnimatedEntrance>
              <AnimatedEntrance delay={160} style={styles.metricFlex}>
                <SpotlightCard borderRadius={22} spotlightColor={home?.liveSession ? "rgba(244,63,94,0.3)" : "rgba(56,189,248,0.24)"}>
                <View style={[styles.metricCard, home?.liveSession ? styles.metricCardLive : null]}>
                  <View style={styles.metricHeadRow}>
                    {home?.liveSession ? (
                      <PulseDot />
                    ) : (
                      <Ionicons name="radio-outline" size={13} color="#8FA0D8" />
                    )}
                    <Text style={[styles.metricLabel, home?.liveSession ? styles.metricLabelLive : null]}>LIVE NOW</Text>
                  </View>
                  <Text style={styles.metricValue} numberOfLines={2}>{home?.liveSession?.title ?? "No live stream"}</Text>
                  <Text style={styles.metricMeta}>{home?.liveSession?.location ?? liveLabel}</Text>
                </View>
                </SpotlightCard>
              </AnimatedEntrance>
            </View>

            {discover.length ? (
              <View style={styles.discoverSection}>
                <View style={styles.discoverHead}>
                  <View style={styles.sectionAccentBar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.discoverEyebrow}>Discover events</Text>
                    <Text style={styles.discoverSub}>More Bahrain events on Events Hub</Text>
                  </View>
                </View>
                <View style={styles.discoverGrid}>
                  {discover.slice(0, 6).map((ev, index) => (
                    <DiscoverCard key={ev.id} event={ev} index={index} />
                  ))}
                </View>
              </View>
            ) : null}

            {home?.announcements?.length ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Announcements</Text>
                {home.announcements.map((announcement) => (
                  <View key={announcement.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineTitle}>{announcement.title}</Text>
                      <Text style={styles.timelineText}>{announcement.body}</Text>
                      <Text style={styles.timelineMeta}>{fmtDate(announcement.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {home?.featuredSponsors?.length ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Featured sponsors</Text>
                {home.featuredSponsors.slice(0, 3).map((sponsor) => (
                  <View key={sponsor.id} style={styles.networkCard}>
                    <View style={styles.networkHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarCircleText}>{sponsor.name.slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <View style={styles.networkHeaderBody}>
                        <Text style={styles.networkName}>{sponsor.name}</Text>
                        <Text style={styles.networkRole}>
                          {[sponsor.role, sponsor.company, sponsor.booth].filter(Boolean).join(" • ") || "Featured partner"}
                        </Text>
                      </View>
                    </View>
                    {sponsor.headline ? <Text style={styles.networkHeadline}>{sponsor.headline}</Text> : null}
                    {sponsor.bio ? <Text style={styles.networkBio}>{sponsor.bio}</Text> : null}
                    {sponsor.ctaUrl ? (
                      <Pressable style={styles.primaryButton} onPress={() => openExternal(sponsor.ctaUrl)}>
                        <Text style={styles.primaryButtonText}>{sponsor.ctaLabel || "Learn More"}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {tab === "discover" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.discoverHead}>
              <View style={styles.sectionAccentBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.discoverEyebrow}>Discover events</Text>
                <Text style={styles.discoverSub}>Browse and buy tickets to Bahrain events</Text>
              </View>
            </View>
            {discover.length === 0 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>No public events yet</Text>
                <Text style={styles.discoverSub}>Published events will appear here automatically.</Text>
              </View>
            ) : (
              <View style={styles.discoverGrid}>
                {discover.map((ev, index) => (
                  <DiscoverCard key={ev.id} event={ev} index={index} />
                ))}
              </View>
            )}
          </ScrollView>
        ) : null}

        {tab === "agenda" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.discoverHead}>
              <View style={styles.sectionAccentBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.discoverEyebrow}>Your agenda</Text>
                <Text style={styles.discoverSub}>Sessions, speakers, and live links</Text>
              </View>
            </View>
            {agenda.length === 0 ? (
              <EmptyState
                title="No sessions published yet"
                body="Once the Events Hub team publishes the agenda, your full schedule and live links will appear here."
              />
            ) : (
              agenda.map((sessionItem, index) => (
                <AnimatedEntrance key={sessionItem.id} delay={index * 70}>
                <View style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View
                      style={[
                        styles.sessionStatus,
                        sessionItem.liveNow || sessionItem.status === "live" ? styles.sessionStatusLive : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionStatusText,
                          sessionItem.liveNow || sessionItem.status === "live"
                            ? styles.sessionStatusTextLive
                            : undefined,
                        ]}
                      >
                        {sessionItem.liveNow || sessionItem.status === "live"
                          ? "LIVE"
                          : sessionItem.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.sessionTime}>{fmtDate(sessionItem.startsAt)}</Text>
                  </View>
                  <Text style={styles.sessionTitle}>{sessionItem.title}</Text>
                  {sessionItem.speaker || sessionItem.speakerTitle || sessionItem.speakerCompany ? (
                    <Text style={styles.sessionSpeaker}>
                      {[sessionItem.speaker, sessionItem.speakerTitle, sessionItem.speakerCompany]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  ) : null}
                  {sessionItem.description ? (
                    <Text style={styles.sessionDescription}>{sessionItem.description}</Text>
                  ) : null}
                  <View style={styles.sessionMetaRow}>
                    {sessionItem.location ? <Text style={styles.sessionMetaChip}>{sessionItem.location}</Text> : null}
                    {sessionItem.tags?.slice(0, 3).map((tag) => (
                      <Text key={tag} style={styles.sessionMetaChip}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.sessionActionRow}>
                    <Pressable
                      style={[styles.ghostButton, sessionItem.isSaved && styles.ghostButtonActive]}
                      onPress={() => handleSessionAction(sessionItem.id, sessionItem.isSaved ? "unsave" : "save")}
                    >
                      <Text style={[styles.ghostButtonText, sessionItem.isSaved && styles.ghostButtonTextActive]}>
                        {sessionItem.isSaved ? "Saved" : "Save"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.ghostButton, sessionItem.isPlanned && styles.ghostButtonActive]}
                      onPress={() => handleSessionAction(sessionItem.id, sessionItem.isPlanned ? "unplan" : "plan")}
                    >
                      <Text style={[styles.ghostButtonText, sessionItem.isPlanned && styles.ghostButtonTextActive]}>
                        {sessionItem.isPlanned ? "Going" : "Plan"}
                      </Text>
                    </Pressable>
                    {sessionItem.liveStreamUrl || (sessionItem.liveNow && home?.settings.liveStream?.url) ? (
                      <Pressable
                        style={styles.primaryButtonSmall}
                        onPress={() =>
                          handleLiveOpen(
                            sessionItem.liveStreamUrl || home?.settings.liveStream?.url,
                            sessionItem.id
                          )
                        }
                      >
                        <Text style={styles.primaryButtonSmallText}>
                          {sessionItem.liveStreamLabel || "Watch Live"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                </AnimatedEntrance>
              ))
            )}
          </ScrollView>
        ) : null}

        {tab === "networking" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            {!currentEventId || !networking || !profileDraft ? (
              <EmptyState
                title="Networking unavailable"
                body="Join an event first to unlock attendee discovery and meeting coordination."
                actionLabel="Join Event"
                onAction={onJoinEvent}
              />
            ) : (
              <>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your networking profile</Text>
                    <Text style={styles.helperText}>
                      {networking.introText ?? "Opt in to appear in attendee discovery."}
                    </Text>
                  </View>
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggleChip, profileDraft.optedIn && styles.toggleChipActive]}
                      onPress={() => setProfileDraft({ ...profileDraft, optedIn: !profileDraft.optedIn })}
                    >
                      <Text style={[styles.toggleChipText, profileDraft.optedIn && styles.toggleChipTextActive]}>
                        Networking {profileDraft.optedIn ? "On" : "Off"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleChip, profileDraft.visible && styles.toggleChipActive]}
                      onPress={() => setProfileDraft({ ...profileDraft, visible: !profileDraft.visible })}
                    >
                      <Text style={[styles.toggleChipText, profileDraft.visible && styles.toggleChipTextActive]}>
                        Visible {profileDraft.visible ? "Yes" : "No"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    placeholder="Headline"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={profileDraft.headline ?? ""}
                    onChangeText={(headline) => setProfileDraft({ ...profileDraft, headline })}
                  />
                  <TextInput
                    placeholder="Company"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={profileDraft.company ?? ""}
                    onChangeText={(company) => setProfileDraft({ ...profileDraft, company })}
                  />
                  <TextInput
                    placeholder="Role"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={profileDraft.role ?? ""}
                    onChangeText={(role) => setProfileDraft({ ...profileDraft, role })}
                  />
                  <TextInput
                    placeholder="Short bio"
                    placeholderTextColor="#7B7D95"
                    style={[styles.input, styles.inputMultiline]}
                    multiline
                    value={profileDraft.bio ?? ""}
                    onChangeText={(bio) => setProfileDraft({ ...profileDraft, bio })}
                  />
                  <TextInput
                    placeholder="Interests (comma separated)"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={profileDraft.interests.join(", ")}
                    onChangeText={(value) =>
                      setProfileDraft({
                        ...profileDraft,
                        interests: value.split(",").map((item) => item.trim()).filter(Boolean),
                      })
                    }
                  />
                  <TextInput
                    placeholder="Goals (comma separated)"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={profileDraft.goals.join(", ")}
                    onChangeText={(value) =>
                      setProfileDraft({
                        ...profileDraft,
                        goals: value.split(",").map((item) => item.trim()).filter(Boolean),
                      })
                    }
                  />
                  <TextInput
                    placeholder="Industries (comma separated)"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={profileDraft.industries.join(", ")}
                    onChangeText={(value) =>
                      setProfileDraft({
                        ...profileDraft,
                        industries: value.split(",").map((item) => item.trim()).filter(Boolean),
                      })
                    }
                  />
                  <Pressable style={styles.primaryButton} onPress={handleSaveProfile} disabled={savingProfile}>
                    <Text style={styles.primaryButtonText}>{savingProfile ? "Saving..." : "Save Profile"}</Text>
                  </Pressable>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Recommended matches</Text>
                  {networking.recommendations.length === 0 ? (
                    <EmptyState
                      title="No matches yet"
                      body="Complete your profile and opt in to unlock smarter B2B recommendations."
                    />
                  ) : (
                    networking.recommendations.map((recommendation) => (
                      <View key={recommendation.guestId} style={styles.networkCard}>
                        <View style={styles.networkHeader}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarCircleText}>{recommendation.name.slice(0, 1).toUpperCase()}</Text>
                          </View>
                          <View style={styles.networkHeaderBody}>
                            <Text style={styles.networkName}>{recommendation.name}</Text>
                            <Text style={styles.networkRole}>
                              {[recommendation.role, recommendation.company].filter(Boolean).join(" • ") || "Attendee"}
                            </Text>
                          </View>
                          <View style={styles.matchScore}>
                            <Text style={styles.matchScoreText}>{recommendation.score}</Text>
                          </View>
                        </View>
                        {recommendation.headline ? <Text style={styles.networkHeadline}>{recommendation.headline}</Text> : null}
                        {recommendation.bio ? <Text style={styles.networkBio}>{recommendation.bio}</Text> : null}
                        <View style={styles.reasonRow}>
                          {recommendation.reasons.slice(0, 3).map((reason) => (
                            <Text key={reason} style={styles.reasonChip}>
                              {reason}
                            </Text>
                          ))}
                        </View>
                        <TextInput
                          placeholder="Add a quick intro note"
                          placeholderTextColor="#7B7D95"
                          style={styles.input}
                          value={requestMessage[recommendation.guestId] ?? ""}
                          onChangeText={(message) =>
                            setRequestMessage((current) => ({ ...current, [recommendation.guestId]: message }))
                          }
                        />
                        <Pressable
                          style={styles.primaryButton}
                          onPress={() => handleConnect(recommendation.guestId)}
                          disabled={connectingGuestId === recommendation.guestId}
                        >
                          <Text style={styles.primaryButtonText}>
                            {connectingGuestId === recommendation.guestId ? "Sending..." : "Connect"}
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Requests and meetings</Text>
                  {networking.requests.length === 0 && networking.meetings.length === 0 ? (
                    <EmptyState
                      title="No networking activity"
                      body="Connection requests and scheduled meetings will appear here."
                    />
                  ) : (
                    <>
                      {networking.requests.map((request) => {
                        const incoming = viewerGuestId ? request.toGuestId === viewerGuestId : true;
                        return (
                          <View key={request.id} style={styles.requestCard}>
                            <Text style={styles.requestTitle}>
                              {incoming ? "Connection request received" : "Connection request sent"}
                            </Text>
                            <Text style={styles.requestMeta}>Status: {request.status}</Text>
                            {request.message ? <Text style={styles.requestMessage}>{request.message}</Text> : null}
                            <Text style={styles.requestMeta}>{fmtDate(request.createdAt)}</Text>
                            {incoming && request.status === "pending" ? (
                              <View style={styles.requestActions}>
                                <Pressable
                                  style={styles.primaryButtonSmall}
                                  disabled={actingRequestId === request.id}
                                  onPress={() => handleRequestResponse(request.id, "accepted", "accepted match")}
                                >
                                  <Text style={styles.primaryButtonSmallText}>
                                    {actingRequestId === request.id ? "Working..." : "Accept"}
                                  </Text>
                                </Pressable>
                                <Pressable
                                  style={styles.ghostButton}
                                  disabled={actingRequestId === request.id}
                                  onPress={() => handleRequestResponse(request.id, "declined")}
                                >
                                  <Text style={styles.ghostButtonText}>Decline</Text>
                                </Pressable>
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                      {networking.meetings.map((meeting) => (
                        <View key={meeting.id} style={styles.requestCard}>
                          <Text style={styles.requestTitle}>Meeting scheduled</Text>
                          <Text style={styles.requestMeta}>Status: {meeting.status}</Text>
                          <Text style={styles.requestMessage}>
                            {[meeting.location, fmtDate(meeting.scheduledFor)].filter(Boolean).join(" • ") ||
                              "Time to be confirmed"}
                          </Text>
                          {meeting.notes ? <Text style={styles.requestMeta}>{meeting.notes}</Text> : null}
                        </View>
                      ))}
                    </>
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Attendee directory</Text>
                  <Text style={styles.helperText}>
                    {networking.privacyDescription ??
                      "Only attendees who explicitly opt in are visible in the event directory."}
                  </Text>
                  <TextInput
                    placeholder="Search people, companies, or roles"
                    placeholderTextColor="#7B7D95"
                    style={styles.input}
                    value={directoryQuery}
                    onChangeText={setDirectoryQuery}
                  />
                  {filteredDirectory.length === 0 ? (
                    <EmptyState
                      title="No visible attendees"
                      body={networking.directoryEmptyState ?? "No attendee profiles match your current search."}
                    />
                  ) : (
                    filteredDirectory.slice(0, 12).map((entry: VisitorNetworkingRecommendation) => (
                      <View key={entry.guestId} style={styles.networkCard}>
                        <View style={styles.networkHeader}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarCircleText}>{entry.name.slice(0, 1).toUpperCase()}</Text>
                          </View>
                          <View style={styles.networkHeaderBody}>
                            <Text style={styles.networkName}>{entry.name}</Text>
                            <Text style={styles.networkRole}>
                              {[entry.role, entry.company].filter(Boolean).join(" • ") || "Attendee"}
                            </Text>
                          </View>
                        </View>
                        {entry.headline ? <Text style={styles.networkHeadline}>{entry.headline}</Text> : null}
                        <Pressable style={styles.primaryButtonSmall} onPress={() => handleConnect(entry.guestId)}>
                          <Text style={styles.primaryButtonSmallText}>Connect</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </ScrollView>
        ) : null}

        {tab === "inbox" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            <AnimatedEntrance delay={0}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Event updates</Text>
                <Pressable onPress={onComposeMessage}>
                  <Text style={styles.sectionLink}>New message</Text>
                </Pressable>
              </View>
              {notifications.length === 0 ? (
                <EmptyState
                  title="No updates yet"
                  body="Event announcements, session reminders, networking alerts, and replies will show here."
                />
              ) : (
                notifications.map((notification) => (
                  <View
                    key={notification.id}
                    style={[styles.notificationCard, !notification.isRead && styles.notificationCardUnread]}
                  >
                    <Text style={styles.notificationType}>
                      {notification.type.replace(/_/g, " ").toUpperCase()}
                    </Text>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationBody}>{notification.message ?? notification.body ?? ""}</Text>
                    <Text style={styles.notificationMeta}>
                      {[notification.eventName, fmtDate(notification.createdAt)].filter(Boolean).join(" • ")}
                    </Text>
                  </View>
                ))
              )}
            </View>
            </AnimatedEntrance>

            <AnimatedEntrance delay={90}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Your messages</Text>
              {messages.length === 0 ? (
                <EmptyState
                  title="No message history"
                  body="Start a conversation with the Events Hub team for access help, guest updates, or VIP requests."
                />
              ) : (
                messages.map((message) => (
                  <View key={message.id} style={styles.messageCard}>
                    <Text style={styles.messageSubject}>{message.subject ?? "Message"}</Text>
                    <Text style={styles.messageBody}>{message.body}</Text>
                    {message.adminReply ? (
                      <View style={styles.replyCard}>
                        <Text style={styles.replyLabel}>Events Hub reply</Text>
                        <Text style={styles.replyBody}>{message.adminReply}</Text>
                      </View>
                    ) : (
                      <Text style={styles.pendingReply}>Awaiting Events Hub reply</Text>
                    )}
                    <Text style={styles.notificationMeta}>
                      {[message.eventName, fmtDate(message.createdAt)].filter(Boolean).join(" • ")}
                    </Text>
                  </View>
                ))
              )}
            </View>
            </AnimatedEntrance>

            <AnimatedEntrance delay={170}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Matched attendee chat</Text>
              {chatThreads.length === 0 ? (
                <EmptyState
                  title="No unlocked attendee chats"
                  body="Attendee chat becomes available after an accepted connection or meeting."
                />
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSwitcher}>
                    {chatThreads.map((thread) => (
                      <Pressable
                        key={thread.id}
                        style={[styles.eventPill, thread.id === activeChatThreadId && styles.eventPillActive]}
                        onPress={() => setActiveChatThreadId(thread.id)}
                      >
                        <Text style={[styles.eventPillText, thread.id === activeChatThreadId && styles.eventPillTextActive]}>
                          {thread.peers.map((peer) => peer.name).join(", ") || "Chat"}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {activeChatThread?.messages.map((message) => (
                    <View key={message.id} style={styles.messageCard}>
                      <Text style={styles.messageSubject}>{message.senderName || "Attendee"}</Text>
                      <Text style={styles.messageBody}>{message.body}</Text>
                      <Text style={styles.notificationMeta}>{fmtDate(message.createdAt)}</Text>
                    </View>
                  ))}
                  <TextInput
                    placeholder="Send a message to your match"
                    placeholderTextColor="#7B7D95"
                    style={[styles.input, styles.inputMultiline]}
                    multiline
                    value={chatDraft}
                    onChangeText={setChatDraft}
                  />
                  <Pressable style={styles.primaryButton} onPress={() => handleSendChat()} disabled={sendingChat}>
                    <Text style={styles.primaryButtonText}>{sendingChat ? "Sending..." : "Send Message"}</Text>
                  </Pressable>
                </>
              )}
            </View>
            </AnimatedEntrance>
          </ScrollView>
        ) : null}

        {tab === "ticket" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            {!ticket ? (
              <EmptyState
                title="No ticket linked"
                body="Once you join an event, your access pass, QR, and event details will show here."
                actionLabel="Join Event"
                onAction={onJoinEvent}
              />
            ) : (
              <View style={styles.ticketCard}>
                <Text style={styles.ticketEyebrow}>{ticket.status.toUpperCase()}</Text>
                <Text style={styles.ticketTitle}>{ticket.event.name}</Text>
                <Text style={styles.ticketDate}>{fmtFullDate(ticket.event.startsAt)}</Text>
                {ticket.event.location ? <Text style={styles.ticketLocation}>{ticket.event.location}</Text> : null}

                <View style={styles.confirmationPanel}>
                  <Text style={styles.confirmationLabel}>Attendance</Text>
                  <Text style={styles.confirmationValue}>{getConfirmationLabel(ticket.rsvpStatus)}</Text>
                  <Pressable
                    disabled={ticket.rsvpStatus === "accepted" || confirmingEventId === ticket.event.id}
                    onPress={() => handleConfirmAttendance(ticket.event.id)}
                    style={[
                      styles.primaryButton,
                      (ticket.rsvpStatus === "accepted" || confirmingEventId === ticket.event.id) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {ticket.rsvpStatus === "accepted"
                        ? "Attendance Confirmed"
                        : confirmingEventId === ticket.event.id
                          ? "Confirming..."
                          : "Confirm Attendance"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.ticketDivider} />
                <View style={styles.ticketMetaGrid}>
                  <InfoChip label="Ticket" value={ticket.ticketType} />
                  <InfoChip label="Barcode" value={ticket.barcode} accent />
                </View>
                {ticket.event.visitorCode ? (
                  <View style={styles.portalCodeCard}>
                    <Text style={styles.portalCodeLabel}>Event access code</Text>
                    <Text style={styles.portalCodeValue}>{ticket.event.visitorCode}</Text>
                    <Text style={styles.portalCodeHelp}>
                      Use this code on another device to join the attendee experience.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        ) : null}
      </Animated.View>

      <View style={styles.tabBarWrap} pointerEvents="box-none">
        <Dock
          items={[
            {
              key: "home",
              label: "Home",
              active: tab === "home",
              icon: <Ionicons name="home-outline" size={22} color="#8D98C5" />,
              activeIcon: <Ionicons name="home" size={22} color="#FFFFFF" />,
              onPress: () => setTab("home"),
            },
            {
              key: "discover",
              label: "Discover",
              active: tab === "discover",
              icon: <Ionicons name="compass-outline" size={22} color="#8D98C5" />,
              activeIcon: <Ionicons name="compass" size={22} color="#FFFFFF" />,
              onPress: () => setTab("discover"),
            },
            {
              key: "agenda",
              label: "Agenda",
              active: tab === "agenda",
              icon: <Ionicons name="calendar-outline" size={22} color="#8D98C5" />,
              activeIcon: <Ionicons name="calendar" size={22} color="#FFFFFF" />,
              onPress: () => setTab("agenda"),
            },
            {
              key: "inbox",
              label: "Inbox",
              active: tab === "inbox",
              badge: unreadCount,
              icon: <Ionicons name="chatbubble-ellipses-outline" size={22} color="#8D98C5" />,
              activeIcon: <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />,
              onPress: () => {
                setTab("inbox");
                markNotificationsRead(session.token).catch(() => undefined);
                setUnreadCount(0);
              },
            },
            {
              key: "ticket",
              label: "Ticket",
              active: tab === "ticket",
              icon: <Ionicons name="ticket-outline" size={22} color="#8D98C5" />,
              activeIcon: <Ionicons name="ticket" size={22} color="#FFFFFF" />,
              onPress: () => setTab("ticket"),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#081020" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#081020",
    gap: 14,
  },
  loadingText: { color: "#96A0C4", fontSize: 14, fontWeight: "600" },
  headerShell: {
    paddingTop: Platform.OS === "ios" ? 58 : 44,
    paddingHorizontal: 28,
    paddingBottom: 26,
    backgroundColor: "rgba(15,22,48,0.74)",
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, width: "100%", maxWidth: 1180, alignSelf: "center" },
  headerLeft: { flex: 1, gap: 8 },
  headerEyebrow: {
    color: "#DB2777",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", marginTop: 2, letterSpacing: -1 },
  headerSubtitle: { color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 21, marginTop: 2, maxWidth: 420 },
  signOutBtn: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signOutText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  eventSwitcher: { gap: 10, paddingTop: 16, width: "100%", maxWidth: 1180, alignSelf: "center" },
  eventPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  eventPillActive: { backgroundColor: "#7C3AED" },
  eventPillText: { color: "#CBD2EE", fontSize: 12, fontWeight: "700" },
  eventPillTextActive: { color: "#FFFFFF" },
  content: { flex: 1 },
  tabContent: { flex: 1 },
  scrollContent: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 128, gap: 16 },
  heroCard: {
    borderRadius: 28,
    minHeight: 270,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
  },
  heroInner: {
    minHeight: 268,
    position: "relative",
  },
  heroGlow: {
    position: "absolute",
    bottom: -140,
    height: 260,
    left: "12%",
    right: "12%",
    backgroundColor: "rgba(219,39,119,0.22)",
    borderRadius: 999,
  },
  heroGlowTop: {
    position: "absolute",
    top: -120,
    height: 220,
    left: "-6%",
    width: 260,
    backgroundColor: "rgba(37,99,235,0.22)",
    borderRadius: 999,
  },
  heroContent: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 22,
    justifyContent: "space-between",
    padding: 24,
  },
  heroContentCompact: {
    flexDirection: "column",
  },
  heroCopy: { flex: 1, gap: 15, maxWidth: 520 },
  heroCopyCompact: {
    maxWidth: undefined,
  },
  heroMedia: {
    alignSelf: "stretch",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    maxWidth: 460,
    minHeight: 220,
    overflow: "hidden",
  },
  heroMediaCompact: {
    maxWidth: undefined,
    minHeight: 160,
  },
  heroImage: { height: "100%", opacity: 0.78, width: "100%" },
  heroImageFallback: {
    alignItems: "center",
    backgroundColor: "rgba(124,58,237,0.24)",
    flex: 1,
    justifyContent: "center",
  },
  heroDate: {
    color: "#C4B5FD",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: -1.2, maxWidth: 500 },
  heroBody: { color: "rgba(255,255,255,0.76)", fontSize: 14, lineHeight: 22, maxWidth: 390 },
  heroStats: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  heroActions: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 2 },
  infoChip: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    minWidth: 92,
  },
  infoChipAccent: { backgroundColor: "#7C3AED" },
  infoChipLabel: {
    color: "#ACB7DC",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  infoChipLabelAccent: { color: "rgba(255,255,255,0.76)" },
  infoChipValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", marginTop: 4 },
  infoChipValueAccent: { color: "#FFFFFF" },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  outlineButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  outlineButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryButton: {
    alignSelf: "center",
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  metricsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metricFlex: { flex: 1, minWidth: 150 },
  metricHeadRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  discoverSection: { gap: 12 },
  discoverHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionAccentBar: { width: 4, height: 34, borderRadius: 999, backgroundColor: "#38BDF8" },
  discoverEyebrow: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  discoverSub: { color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: "700" },
  discoverList: { gap: 12 },
  discoverGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  discoverCardWrap: { flexGrow: 1, flexBasis: "47%", minWidth: 260 },
  discoverCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  discoverCardMedia: { height: 150, justifyContent: "space-between", padding: 12 },
  discoverPills: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  discoverPillDark: {
    backgroundColor: "rgba(8,16,32,0.72)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  discoverPillDarkText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  discoverCardTitleWrap: { gap: 2 },
  discoverCardTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  discoverCardHost: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  discoverCardActions: { flexDirection: "row", gap: 10, padding: 12 },
  discoverPrimaryBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  discoverPrimaryBtnBg: { paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  discoverPrimaryBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  discoverGhostBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  discoverGhostBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  discoverRow: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  discoverThumb: { width: 84, height: 84, borderRadius: 15, overflow: "hidden" },
  discoverThumbScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,16,32,0.28)",
  },
  discoverThumbDatePill: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(8,16,32,0.7)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  discoverThumbDate: {
    color: "#A5F3FC",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  discoverBody: { flex: 1, minWidth: 0, justifyContent: "center" },
  discoverHost: {
    color: "#a78bfa",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  discoverTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", lineHeight: 19, marginTop: 4 },
  discoverMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  discoverPrice: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", fontStyle: "italic" },
  discoverBuy: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  discoverBuyText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  metricCard: {
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 18,
  },
  metricCardLive: {
    backgroundColor: "rgba(244,63,94,0.12)",
    borderColor: "rgba(244,63,94,0.4)",
  },
  metricLabel: { color: "#96A0C4", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  metricLabelLive: { color: "#FDA4AF" },
  metricValue: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 10 },
  metricMeta: { color: "#AEB7D6", fontSize: 12, marginTop: 6 },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 18,
    gap: 14,
  },
  sectionHeader: { gap: 6 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  sectionLink: { color: "#C4B5FD", fontSize: 13, fontWeight: "900" },
  helperText: { color: "#98A3C9", fontSize: 13, lineHeight: 20 },
  timelineItem: { flexDirection: "row", gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#7C3AED", marginTop: 7 },
  timelineBody: { flex: 1 },
  timelineTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  timelineText: { color: "#AEB7D6", fontSize: 13, lineHeight: 20, marginTop: 4 },
  timelineMeta: { color: "#7F8AB2", fontSize: 11, marginTop: 8, fontWeight: "700" },
  smallMetricCard: { flex: 1, minWidth: 90, borderRadius: 18, backgroundColor: "rgba(8,16,32,0.58)", padding: 14 },
  smallMetricValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  smallMetricLabel: { color: "#A1ADD2", fontSize: 11, fontWeight: "700", marginTop: 6 },
  sessionCard: { borderRadius: 24, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 18, gap: 12 },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  sessionStatus: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sessionStatusLive: { backgroundColor: "#DB2777" },
  sessionStatusText: { color: "#D2D9F1", fontSize: 11, fontWeight: "800", letterSpacing: 0.9 },
  sessionStatusTextLive: { color: "#FFFFFF" },
  sessionTime: { color: "#98A3C9", fontSize: 12, fontWeight: "700" },
  sessionTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  sessionSpeaker: { color: "#FFC8B8", fontSize: 13, fontWeight: "700" },
  sessionDescription: { color: "#AEB7D6", fontSize: 13, lineHeight: 20 },
  sessionMetaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  sessionMetaChip: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#D8E0FA",
    fontSize: 12,
    overflow: "hidden",
  },
  sessionActionRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  ghostButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  ghostButtonActive: {
    backgroundColor: "rgba(124,58,237,0.2)",
    borderColor: "rgba(124,58,237,0.56)",
  },
  ghostButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  ghostButtonTextActive: { color: "#C4B5FD" },
  primaryButtonSmall: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#7C3AED",
  },
  primaryButtonSmallText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  toggleRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  toggleChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleChipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  toggleChipText: { color: "#D6DDF6", fontSize: 13, fontWeight: "800" },
  toggleChipTextActive: { color: "#FFFFFF" },
  input: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top" },
  networkCard: { borderRadius: 22, backgroundColor: "rgba(8,16,32,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16, gap: 12 },
  networkHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircleText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  networkHeaderBody: { flex: 1 },
  networkName: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  networkRole: { color: "#9DA7CC", fontSize: 12, marginTop: 4 },
  matchScore: {
    borderRadius: 16,
    backgroundColor: "rgba(124,58,237,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchScoreText: { color: "#C4B5FD", fontSize: 14, fontWeight: "900" },
  networkHeadline: { color: "#C4B5FD", fontSize: 13, fontWeight: "700" },
  networkBio: { color: "#AEB7D6", fontSize: 13, lineHeight: 20 },
  reasonRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  reasonChip: {
    color: "#DCE3FB",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    overflow: "hidden",
  },
  requestCard: { borderRadius: 22, backgroundColor: "rgba(8,16,32,0.58)", padding: 16, gap: 8 },
  requestTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  requestMeta: { color: "#9DA7CC", fontSize: 12, lineHeight: 18 },
  requestMessage: { color: "#DCE3FB", fontSize: 13, lineHeight: 20 },
  requestActions: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 6 },
  notificationCard: { borderRadius: 20, backgroundColor: "rgba(8,16,32,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16, gap: 8 },
  notificationCardUnread: { borderWidth: 1, borderColor: "rgba(124,58,237,0.5)" },
  notificationType: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  notificationTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  notificationBody: { color: "#C7D1F3", fontSize: 13, lineHeight: 20 },
  notificationMeta: { color: "#8190BA", fontSize: 11, fontWeight: "700" },
  messageCard: { borderRadius: 22, backgroundColor: "rgba(8,16,32,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16, gap: 10 },
  messageSubject: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  messageBody: { color: "#C7D1F3", fontSize: 13, lineHeight: 20 },
  replyCard: { borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", padding: 12, gap: 6 },
  replyLabel: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  replyBody: { color: "#FFFFFF", fontSize: 13, lineHeight: 20 },
  pendingReply: { color: "#9DA7CC", fontSize: 12, fontWeight: "700" },
  ticketCard: { borderRadius: 28, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 22, gap: 14 },
  ticketEyebrow: {
    color: "#C4B5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  ticketTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  ticketDate: { color: "#DCE3FB", fontSize: 14, fontWeight: "700" },
  ticketLocation: { color: "#98A3C9", fontSize: 13 },
  confirmationPanel: { borderRadius: 22, backgroundColor: "rgba(8,16,32,0.58)", padding: 16, gap: 10 },
  confirmationLabel: {
    color: "#96A0C4",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  confirmationValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  ticketDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 4 },
  ticketMetaGrid: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  portalCodeCard: { borderRadius: 20, backgroundColor: "rgba(124,58,237,0.2)", padding: 16, gap: 8 },
  portalCodeLabel: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  portalCodeValue: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: 4 },
  portalCodeHelp: { color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 18 },
  disabledButton: { opacity: 0.55 },
  emptyState: { borderRadius: 24, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 24, alignItems: "center", gap: 10 },
  emptyStateTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", textAlign: "center" },
  emptyStateBody: { color: "#AEB7D6", fontSize: 14, lineHeight: 21, textAlign: "center" },
  // Sits above the Android gesture/nav area (app runs edge-to-edge).
  tabBarWrap: { position: "absolute", left: 16, right: 16, bottom: Platform.OS === "android" ? 38 : 22, alignItems: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(10,16,32,0.92)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 10,
  },
  tabBtn: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 8,
    position: "relative",
  },
  tabBtnActive: { borderRadius: 22, backgroundColor: "rgba(124,58,237,0.34)" },
  tabLabel: { color: "#8D98C5", fontSize: 10, fontWeight: "800", marginTop: 2 },
  tabLabelActive: { color: "#FFFFFF" },
  tabBadge: {
    position: "absolute",
    top: 0,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#DB2777",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
