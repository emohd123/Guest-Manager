import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { updateVisitorSessionState as updateVisitorSessionStateRequest } from "../api/mobileClient";

type VisitorTab = "home" | "agenda" | "networking" | "inbox" | "ticket";

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
  icon: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {badge && badge > 0 ? (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
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

function InfoChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.infoChip, accent && styles.infoChipAccent]}>
      <Text style={[styles.infoChipLabel, accent && styles.infoChipLabelAccent]}>{label}</Text>
      <Text style={[styles.infoChipValue, accent && styles.infoChipValueAccent]}>{value}</Text>
    </View>
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
  const [ticket, setTicket] = useState<VisitorTicket | null>(null);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
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
    async function run() {
      if (mounted) setLoading(true);
      await loadBase();
      if (mounted) {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
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
      <View style={styles.headerShell}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
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
            <View style={styles.heroCard}>
              {home?.event.coverImageUrl ? (
                <Image source={{ uri: home.event.coverImageUrl }} style={styles.heroImage} resizeMode="cover" />
              ) : null}
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroDate}>{fmtFullDate(home?.event.startsAt ?? ticket?.event.startsAt)}</Text>
                <Text style={styles.heroTitle}>{activeEventName}</Text>
                <Text style={styles.heroBody}>
                  {home?.event.shortDescription ??
                    home?.event.description ??
                    "Your ticket, agenda, and networking are ready."}
                </Text>
                <View style={styles.heroStats}>
                  <InfoChip label="RSVP" value={getConfirmationLabel(ticket?.rsvpStatus)} accent />
                  <InfoChip label="Agenda" value={`${agenda.length} sessions`} />
                  <InfoChip label="Networking" value={`${home?.networking.recommendationCount ?? 0} matches`} />
                </View>
                <View style={styles.heroActions}>
                  <Pressable style={styles.primaryButton} onPress={() => setTab("agenda")}>
                    <Text style={styles.primaryButtonText}>View Agenda</Text>
                  </Pressable>
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
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>NEXT SESSION</Text>
                <Text style={styles.metricValue}>{home?.nextSession?.title ?? "No upcoming session"}</Text>
                <Text style={styles.metricMeta}>{fmtDate(home?.nextSession?.startsAt)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>LIVE NOW</Text>
                <Text style={styles.metricValue}>{home?.liveSession?.title ?? "No live stream"}</Text>
                <Text style={styles.metricMeta}>{home?.liveSession?.location ?? liveLabel}</Text>
              </View>
            </View>

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

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Networking snapshot</Text>
                <Pressable onPress={() => setTab("networking")}>
                  <Text style={styles.sectionLink}>Open</Text>
                </Pressable>
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.smallMetricCard}>
                  <Text style={styles.smallMetricValue}>{home?.networking.recommendationCount ?? 0}</Text>
                  <Text style={styles.smallMetricLabel}>Smart matches</Text>
                </View>
                <View style={styles.smallMetricCard}>
                  <Text style={styles.smallMetricValue}>{home?.networking.pendingRequestCount ?? 0}</Text>
                  <Text style={styles.smallMetricLabel}>Pending requests</Text>
                </View>
                <View style={styles.smallMetricCard}>
                  <Text style={styles.smallMetricValue}>{home?.networking.meetingsCount ?? 0}</Text>
                  <Text style={styles.smallMetricLabel}>Meetings</Text>
                </View>
              </View>
            </View>

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

        {tab === "agenda" ? (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            {agenda.length === 0 ? (
              <EmptyState
                title="No sessions published yet"
                body="Once the organizer publishes the agenda, your full schedule and live links will appear here."
              />
            ) : (
              agenda.map((sessionItem) => (
                <View key={sessionItem.id} style={styles.sessionCard}>
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
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Organizer inbox</Text>
                <Pressable onPress={onComposeMessage}>
                  <Text style={styles.sectionLink}>New message</Text>
                </Pressable>
              </View>
              {notifications.length === 0 ? (
                <EmptyState
                  title="No updates yet"
                  body="Organizer announcements, session reminders, networking alerts, and replies will show here."
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

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Your messages</Text>
              {messages.length === 0 ? (
                <EmptyState
                  title="No message history"
                  body="Start a conversation with the organizer for access help, guest updates, or VIP requests."
                />
              ) : (
                messages.map((message) => (
                  <View key={message.id} style={styles.messageCard}>
                    <Text style={styles.messageSubject}>{message.subject ?? "Message"}</Text>
                    <Text style={styles.messageBody}>{message.body}</Text>
                    {message.adminReply ? (
                      <View style={styles.replyCard}>
                        <Text style={styles.replyLabel}>Organizer reply</Text>
                        <Text style={styles.replyBody}>{message.adminReply}</Text>
                      </View>
                    ) : (
                      <Text style={styles.pendingReply}>Awaiting organizer reply</Text>
                    )}
                    <Text style={styles.notificationMeta}>
                      {[message.eventName, fmtDate(message.createdAt)].filter(Boolean).join(" • ")}
                    </Text>
                  </View>
                ))
              )}
            </View>

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

      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TabBtn icon="H" label="Home" active={tab === "home"} onPress={() => setTab("home")} />
          <TabBtn icon="A" label="Agenda" active={tab === "agenda"} onPress={() => setTab("agenda")} />
          <TabBtn icon="N" label="Network" active={tab === "networking"} onPress={() => setTab("networking")} />
          <TabBtn
            icon="I"
            label="Inbox"
            active={tab === "inbox"}
            badge={unreadCount}
            onPress={() => {
              setTab("inbox");
              markNotificationsRead(session.token).catch(() => undefined);
              setUnreadCount(0);
            }}
          />
          <TabBtn icon="T" label="Ticket" active={tab === "ticket"} onPress={() => setTab("ticket")} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1021" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1021",
    gap: 14,
  },
  loadingText: { color: "#96A0C4", fontSize: 14, fontWeight: "600" },
  headerShell: {
    paddingTop: Platform.OS === "ios" ? 58 : 38,
    paddingHorizontal: 22,
    paddingBottom: 20,
    backgroundColor: "#0F1630",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  headerLeft: { flex: 1 },
  headerEyebrow: {
    color: "#FF8F8B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", marginTop: 8, letterSpacing: -1 },
  headerSubtitle: { color: "#A6B0D2", fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 320 },
  signOutBtn: {
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signOutText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  eventSwitcher: { gap: 10, paddingTop: 16 },
  eventPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  eventPillActive: { backgroundColor: "#FF6A6F" },
  eventPillText: { color: "#CBD2EE", fontSize: 12, fontWeight: "700" },
  eventPillTextActive: { color: "#FFFFFF" },
  content: { flex: 1 },
  tabContent: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120, gap: 16 },
  heroCard: {
    borderRadius: 30,
    minHeight: 280,
    overflow: "hidden",
    backgroundColor: "#171F44",
    position: "relative",
  },
  heroImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.36 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,16,33,0.28)",
  },
  heroContent: { padding: 24, gap: 14 },
  heroDate: {
    color: "#FFD7C6",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", letterSpacing: -1.2, maxWidth: 260 },
  heroBody: { color: "#D9E0F8", fontSize: 14, lineHeight: 22, maxWidth: 300 },
  heroStats: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  heroActions: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 2 },
  infoChip: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    minWidth: 92,
  },
  infoChipAccent: { backgroundColor: "#FF6A6F" },
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
    backgroundColor: "#FF6A6F",
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
  metricCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 24,
    backgroundColor: "#111830",
    padding: 18,
  },
  metricLabel: { color: "#96A0C4", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  metricValue: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 8 },
  metricMeta: { color: "#AEB7D6", fontSize: 12, marginTop: 6 },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: "#111830",
    padding: 18,
    gap: 14,
  },
  sectionHeader: { gap: 6 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  sectionLink: { color: "#FF9F8E", fontSize: 13, fontWeight: "800" },
  helperText: { color: "#98A3C9", fontSize: 13, lineHeight: 20 },
  timelineItem: { flexDirection: "row", gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF6A6F", marginTop: 7 },
  timelineBody: { flex: 1 },
  timelineTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  timelineText: { color: "#AEB7D6", fontSize: 13, lineHeight: 20, marginTop: 4 },
  timelineMeta: { color: "#7F8AB2", fontSize: 11, marginTop: 8, fontWeight: "700" },
  smallMetricCard: { flex: 1, minWidth: 90, borderRadius: 20, backgroundColor: "#0D1430", padding: 14 },
  smallMetricValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  smallMetricLabel: { color: "#A1ADD2", fontSize: 11, fontWeight: "700", marginTop: 6 },
  sessionCard: { borderRadius: 26, backgroundColor: "#111830", padding: 18, gap: 12 },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  sessionStatus: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sessionStatusLive: { backgroundColor: "#FF6A6F" },
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
    backgroundColor: "#0D1430",
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
    backgroundColor: "rgba(255,106,111,0.12)",
    borderColor: "rgba(255,106,111,0.42)",
  },
  ghostButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  ghostButtonTextActive: { color: "#FFAAAB" },
  primaryButtonSmall: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FF6A6F",
  },
  primaryButtonSmallText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  toggleRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  toggleChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#0D1430",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleChipActive: { backgroundColor: "#FF6A6F", borderColor: "#FF6A6F" },
  toggleChipText: { color: "#D6DDF6", fontSize: 13, fontWeight: "800" },
  toggleChipTextActive: { color: "#FFFFFF" },
  input: {
    borderRadius: 16,
    backgroundColor: "#0D1430",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top" },
  networkCard: { borderRadius: 22, backgroundColor: "#0D1430", padding: 16, gap: 12 },
  networkHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FF6A6F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircleText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  networkHeaderBody: { flex: 1 },
  networkName: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  networkRole: { color: "#9DA7CC", fontSize: 12, marginTop: 4 },
  matchScore: {
    borderRadius: 16,
    backgroundColor: "rgba(255,106,111,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchScoreText: { color: "#FFB2B4", fontSize: 14, fontWeight: "900" },
  networkHeadline: { color: "#FFD2C5", fontSize: 13, fontWeight: "700" },
  networkBio: { color: "#AEB7D6", fontSize: 13, lineHeight: 20 },
  reasonRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  reasonChip: {
    color: "#DCE3FB",
    backgroundColor: "#111830",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    overflow: "hidden",
  },
  requestCard: { borderRadius: 22, backgroundColor: "#0D1430", padding: 16, gap: 8 },
  requestTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  requestMeta: { color: "#9DA7CC", fontSize: 12, lineHeight: 18 },
  requestMessage: { color: "#DCE3FB", fontSize: 13, lineHeight: 20 },
  requestActions: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 6 },
  notificationCard: { borderRadius: 20, backgroundColor: "#0D1430", padding: 16, gap: 8 },
  notificationCardUnread: { borderWidth: 1, borderColor: "rgba(255,106,111,0.35)" },
  notificationType: {
    color: "#FFB1AB",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  notificationTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  notificationBody: { color: "#C7D1F3", fontSize: 13, lineHeight: 20 },
  notificationMeta: { color: "#8190BA", fontSize: 11, fontWeight: "700" },
  messageCard: { borderRadius: 22, backgroundColor: "#0D1430", padding: 16, gap: 10 },
  messageSubject: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  messageBody: { color: "#C7D1F3", fontSize: 13, lineHeight: 20 },
  replyCard: { borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", padding: 12, gap: 6 },
  replyLabel: {
    color: "#FFB1AB",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  replyBody: { color: "#FFFFFF", fontSize: 13, lineHeight: 20 },
  pendingReply: { color: "#9DA7CC", fontSize: 12, fontWeight: "700" },
  ticketCard: { borderRadius: 30, backgroundColor: "#111830", padding: 22, gap: 14 },
  ticketEyebrow: {
    color: "#FF9F8E",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  ticketTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  ticketDate: { color: "#DCE3FB", fontSize: 14, fontWeight: "700" },
  ticketLocation: { color: "#98A3C9", fontSize: 13 },
  confirmationPanel: { borderRadius: 22, backgroundColor: "#0D1430", padding: 16, gap: 10 },
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
  portalCodeCard: { borderRadius: 20, backgroundColor: "rgba(255,106,111,0.12)", padding: 16, gap: 8 },
  portalCodeLabel: {
    color: "#FFB1AB",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  portalCodeValue: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: 4 },
  portalCodeHelp: { color: "#FFD9D3", fontSize: 12, lineHeight: 18 },
  disabledButton: { opacity: 0.55 },
  emptyState: { borderRadius: 26, backgroundColor: "#111830", padding: 24, alignItems: "center", gap: 10 },
  emptyStateTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", textAlign: "center" },
  emptyStateBody: { color: "#AEB7D6", fontSize: 14, lineHeight: 21, textAlign: "center" },
  tabBarWrap: { position: "absolute", left: 16, right: 16, bottom: 22, alignItems: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111830",
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    position: "relative",
  },
  tabBtnActive: { borderRadius: 18, backgroundColor: "#1A2347" },
  tabIcon: { color: "#8490B8", fontSize: 12, fontWeight: "900" },
  tabIconActive: { color: "#FFFFFF" },
  tabLabel: { color: "#8490B8", fontSize: 10, fontWeight: "800", marginTop: 4 },
  tabLabelActive: { color: "#FF9F8E" },
  tabBadge: {
    position: "absolute",
    top: 0,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF6A6F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
