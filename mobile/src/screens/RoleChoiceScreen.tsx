import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createPublicOrder, fetchDiscoverEvents } from "../api/mobileClient";
import {
  buildCalendarUrl,
  cancelEventReminder,
  countdownLabel,
  detectNewEvents,
  eventPublicLink,
  getReminders,
  getSavedIds,
  notifyNewEvents,
  scheduleEventReminder,
  toggleSaved,
  type ReminderMap,
} from "../features/eventExtras";
import { AiConciergeSheet } from "../ui/AiConciergeSheet";
import { FadeSlideIn } from "../ui/motion";
import { FallingSparkles } from "../ui/FallingSparkles";
import { PremiumBackdrop } from "../ui/primitives";
import { SpotlightCard } from "../ui/SpotlightCard";
import { palette, radii, shadows, spacing, type } from "../ui/theme";
import type { DiscoverEvent } from "../types";

// Rotating gradient art for event thumbnails (matches the design's card palette).
const THUMB_GRADIENTS: [string, string][] = [
  ["#0f172a", "#3730a3"],
  ["#0f172a", "#be185d"],
  ["#164e63", "#0ea5e9"],
  ["#3b0764", "#a21caf"],
  ["#1e1b4b", "#7c3aed"],
];

export function RoleChoiceScreen({
  onSelectStaff,
  onSelectVisitor,
}: {
  onSelectStaff: () => void;
  onSelectVisitor: () => void;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [events, setEvents] = useState<DiscoverEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventView, setEventView] = useState<"home" | "list" | "saved" | "detail">("home");
  const [selectedEvent, setSelectedEvent] = useState<DiscoverEvent | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [reminders, setReminders] = useState<ReminderMap>({});
  const [newIds, setNewIds] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const CATEGORIES = ["All", "Concerts", "Dining", "Family", "Comedy", "Attractions"];

  useEffect(() => {
    let mounted = true;
    fetchDiscoverEvents()
      .then((result) => {
        if (!mounted) return;
        const list = result.events ?? [];
        setEvents(list);
        // Surface anything published since the last visit.
        detectNewEvents(list).then((fresh) => {
          if (!mounted || fresh.length === 0) return;
          setNewIds(fresh);
          void notifyNewEvents(list.filter((e) => fresh.includes(e.id)));
        });
      })
      .catch(() => {
        if (mounted) setEvents([]);
      })
      .finally(() => {
        if (mounted) setEventsLoading(false);
      });

    getSavedIds().then((ids) => mounted && setSavedIds(ids));
    getReminders().then((map) => mounted && setReminders(map));

    return () => {
      mounted = false;
    };
  }, []);

  async function handleToggleSaved(eventId: string) {
    setSavedIds(await toggleSaved(eventId));
  }

  async function handleToggleReminder(event: DiscoverEvent) {
    if (reminders[event.id]) {
      await cancelEventReminder(event.id);
      setReminders(await getReminders());
      Alert.alert("Reminder removed", `You won't be notified about ${event.title}.`);
      return;
    }
    const result = await scheduleEventReminder(event);
    setReminders(await getReminders());
    Alert.alert(result.ok ? "Reminder set" : "Couldn't set reminder", result.message);
  }

  async function handleShare(event: DiscoverEvent) {
    try {
      await Share.share({ message: `${event.title} · ${formatEventDate(event.startsAt)}\n${eventPublicLink(event)}` });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  function handleAddToCalendar(event: DiscoverEvent) {
    Linking.openURL(buildCalendarUrl(event)).catch(() =>
      Alert.alert("Unable to open calendar", "No calendar app could handle the request.")
    );
  }

  // Hardware back: close overlays / step back through views before exiting.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (aiOpen) {
        setAiOpen(false);
        return true;
      }
      if (eventView !== "home") {
        setEventView("home");
        setSelectedEvent(null);
        return true;
      }
      if (showOptions) {
        setShowOptions(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [aiOpen, eventView, showOptions]);

  function openEvent(event: DiscoverEvent) {
    setSelectedEvent(event);
    setEventView("detail");
  }

  const q = query.trim().toLowerCase();
  const filtered = events.filter((e) => {
    const matchesQuery = !q || e.title.toLowerCase().includes(q);
    const matchesCategory =
      activeCategory === "All" ||
      (e.category ?? "").toLowerCase() === activeCategory.toLowerCase() ||
      (e.categorySlug ?? "").toLowerCase() === activeCategory.toLowerCase();
    return matchesQuery && matchesCategory;
  });
  // Soonest-first so the top of the page is always "what's happening next".
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const featured = eventView === "home" ? (sorted[0] ?? null) : null;
  const soonRail = eventView === "home" ? sorted.slice(1, 3) : [];
  const rest =
    eventView === "home"
      ? sorted.slice(3)
      : eventView === "saved"
        ? sorted.filter((e) => savedIds.includes(e.id))
        : sorted;

  return (
    <PremiumBackdrop>
      <View style={styles.container}>
        <FallingSparkles count={12} speed={0.7} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
          showsVerticalScrollIndicator={false}
        >
          <FadeSlideIn style={[styles.inner, isWide && styles.innerWide]}>
          {eventView === "detail" && selectedEvent ? (
            <EventDetailPanel
              event={selectedEvent}
              onBack={() => setEventView("home")}
              saved={savedIds.includes(selectedEvent.id)}
              onToggleSaved={() => handleToggleSaved(selectedEvent.id)}
              reminderSet={!!reminders[selectedEvent.id]}
              onToggleReminder={() => handleToggleReminder(selectedEvent)}
              onAddToCalendar={() => handleAddToCalendar(selectedEvent)}
              onShare={() => handleShare(selectedEvent)}
            />
          ) : (
            <View style={styles.mkt}>
              <View style={styles.mktHeader}>
                <View style={styles.mktHeaderCopy}>
                  <Text style={styles.mktKicker}>Bahrain · Tonight</Text>
                  <Text style={styles.mktTitle}>
                    {eventView === "list" ? "All events" : eventView === "saved" ? "Saved events" : "Discover events"}
                  </Text>
                </View>
                <View style={styles.mktHeaderRight}>
                  <Pressable
                    onPress={() => setShowOptions((value) => !value)}
                    style={({ pressed }) => [styles.mktGear, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open app options"
                  >
                    <Ionicons name="settings-outline" size={19} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    onPress={onSelectVisitor}
                    style={({ pressed }) => [styles.mktAvatar, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open attendee portal"
                  >
                    <Text style={styles.mktAvatarText}>LA</Text>
                  </Pressable>
                </View>
              </View>

              {showOptions ? (
                <View style={styles.optionsPanel}>
                  <Pressable
                    onPress={onSelectStaff}
                    style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open check-in operations"
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionTitle}>Check-in operations</Text>
                      <Text style={styles.optionBody}>Pair this device for staff scanning, walk-ins, and sync tools.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.62)" />
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.mktSearch}>
                <Ionicons name="search" size={17} color="rgba(255,255,255,0.45)" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search events, venues, artists…"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.mktSearchInput}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mktPills}
              >
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.mktPill, activeCategory === cat && styles.mktPillActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${cat}`}
                  >
                    <Text style={[styles.mktPillText, activeCategory === cat && styles.mktPillTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {eventView === "home" && newIds.length > 0 ? (
                <Pressable
                  style={styles.newBanner}
                  onPress={() => setEventView("list")}
                  accessibilityRole="button"
                  accessibilityLabel="See new events"
                >
                  <Ionicons name="sparkles" size={14} color="#67E8F9" />
                  <Text style={styles.newBannerText}>
                    {newIds.length === 1 ? "1 new event" : `${newIds.length} new events`} since your last visit
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}

              {featured && eventView === "home" ? (
                <FeaturedHero event={featured} onOpen={openEvent} />
              ) : null}

              {eventView === "home" && soonRail.length > 0 ? (
                <>
                  <View style={styles.mktSectionHead}>
                    <Text style={styles.mktSectionEyebrow}>Happening soon</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.soonRail}
                  >
                    {soonRail.map((event, index) => (
                      <SoonCard key={event.id} event={event} index={index} onOpen={openEvent} />
                    ))}
                  </ScrollView>
                </>
              ) : null}

              {eventsLoading ? (
                <View style={styles.eventSkeleton}>
                  <Text style={styles.eventSkeletonText}>Loading public events…</Text>
                </View>
              ) : sorted.length === 0 ? (
                <View style={styles.eventEmpty}>
                  <Ionicons name="calendar-clear-outline" size={22} color="rgba(255,255,255,0.72)" />
                  <Text style={styles.eventEmptyTitle}>No events found</Text>
                  <Text style={styles.eventEmptyBody}>Try another category or search — new public events appear here automatically.</Text>
                </View>
              ) : rest.length > 0 || eventView !== "home" ? (
                <>
                  <View style={styles.mktSectionHead}>
                    <Text style={styles.mktSectionEyebrow}>
                      {eventView === "list"
                        ? `All events · ${sorted.length}`
                        : eventView === "saved"
                          ? `Saved · ${rest.length}`
                          : "More events"}
                    </Text>
                    {eventView === "home" ? (
                      <Pressable onPress={() => setEventView("list")} accessibilityRole="button" accessibilityLabel="See all events">
                        <Text style={styles.mktSeeAll}>See all</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setEventView("home")} accessibilityRole="button" accessibilityLabel="Back to home">
                        <Text style={styles.mktSeeAll}>Back</Text>
                      </Pressable>
                    )}
                  </View>
                  {rest.length === 0 ? (
                    <View style={styles.eventEmpty}>
                      <Ionicons name="heart-outline" size={22} color="rgba(255,255,255,0.72)" />
                      <Text style={styles.eventEmptyTitle}>No saved events yet</Text>
                      <Text style={styles.eventEmptyBody}>Tap the heart on any event to keep it here for quick access.</Text>
                    </View>
                  ) : (
                    <View style={styles.gridWrap}>
                      {rest.map((event, index) => (
                        <GridTile
                          key={event.id}
                          event={event}
                          index={index}
                          isNew={newIds.includes(event.id)}
                          onOpen={openEvent}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Pressable
                  onPress={() => setEventView("list")}
                  style={styles.mktSectionHead}
                  accessibilityRole="button"
                  accessibilityLabel="See all events"
                >
                  <Text style={styles.mktSectionEyebrow}>That's everything for now</Text>
                  <Text style={styles.mktSeeAll}>See all</Text>
                </Pressable>
              )}
            </View>
          )}
        </FadeSlideIn>
        </ScrollView>
        {eventView !== "detail" ? (
          <Pressable
            style={styles.aiFab}
            onPress={() => setAiOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ask AI about events"
          >
            <Ionicons name="sparkles" size={16} color="#67E8F9" />
            <Text style={styles.aiFabText}>Ask AI</Text>
          </Pressable>
        ) : null}
        {eventView !== "detail" ? (
          <BottomTabBar
            view={eventView}
            savedCount={savedIds.length}
            onDiscover={() => setEventView("home")}
            onSaved={() => setEventView("saved")}
            onAccount={onSelectVisitor}
          />
        ) : null}
        <AiConciergeSheet
          visible={aiOpen}
          onClose={() => setAiOpen(false)}
          onOpenEvent={(eventId) => {
            const match = events.find((event) => event.id === eventId);
            if (!match) return false;
            setAiOpen(false);
            openEvent(match);
            return true;
          }}
        />
      </View>
    </PremiumBackdrop>
  );
}

function FeaturedHero({ event, onOpen }: { event: DiscoverEvent; onOpen: (event: DiscoverEvent) => void }) {
  const host = event.organizerName ?? event.companyName;
  const price = formatPrice(event);
  return (
    <View style={styles.featured}>
      <LinearGradient
        colors={["#1e1b4b", "#7c3aed", "#db2777"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <LinearGradient
        colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.1)", "transparent"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featuredBadge}>
        <Text style={styles.featuredBadgeText}>Featured</Text>
      </View>
      <View style={styles.featuredBody}>
        <Text style={styles.featuredDate}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.featuredMeta} numberOfLines={1}>
          {host}{price ? ` · from ${price}` : ""}
        </Text>
        <View style={styles.featuredActions}>
          <Pressable
            onPress={() => onOpen(event)}
            style={({ pressed }) => [styles.featuredBuy, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Buy tickets for ${event.title}`}
          >
            <Text style={styles.featuredBuyText}>{event.hasTickets ? "Buy Ticket" : "Open"}</Text>
          </Pressable>
          <Pressable
            onPress={() => onOpen(event)}
            style={({ pressed }) => [styles.featuredDetails, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Details for ${event.title}`}
          >
            <Text style={styles.featuredDetailsText}>Details</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function shortDay(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  } catch {
    return "";
  }
}

/** Medium horizontal-rail card for the "Happening soon" top section. */
function SoonCard({
  event,
  index,
  onOpen,
}: {
  event: DiscoverEvent;
  index: number;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <Pressable
      onPress={() => onOpen(event)}
      style={({ pressed }) => [styles.soonCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <LinearGradient colors={["rgba(5,9,20,0.05)", "rgba(5,9,20,0.92)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.soonCardTop}>
        <View style={styles.eventBoxPill}>
          <Text style={styles.eventBoxPillText}>{shortDay(event.startsAt)}</Text>
        </View>
        <View style={styles.eventBoxPill}>
          <Text style={styles.eventBoxPillText}>{formatPrice(event)}</Text>
        </View>
      </View>
      <View style={styles.soonCardBody}>
        <Text style={styles.soonCardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.soonCardMeta} numberOfLines={1}>
          {event.venueName ?? event.locationText ?? event.organizerName ?? event.companyName}
        </Text>
      </View>
    </Pressable>
  );
}

/** Compact poster tile — three per row keeps the catalogue organized. */
function GridTile({
  event,
  index,
  isNew,
  onOpen,
}: {
  event: DiscoverEvent;
  index: number;
  isNew?: boolean;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <Pressable
      onPress={() => onOpen(event)}
      style={({ pressed }) => [styles.gridTile, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <LinearGradient colors={["rgba(8,16,32,0.0)", "rgba(8,16,32,0.94)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.gridTileTopRow}>
        <View style={styles.gridTileDay}>
          <Text style={styles.gridTileDayText}>{shortDay(event.startsAt)}</Text>
        </View>
        {isNew ? (
          <View style={styles.gridTileNew}>
            <Text style={styles.gridTileNewText}>NEW</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.gridTileBody}>
        <Text style={styles.gridTileTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.gridTilePrice}>{formatPrice(event)}</Text>
      </View>
    </Pressable>
  );
}

function MarketplaceRow({
  event,
  index,
  onOpen,
}: {
  event: DiscoverEvent;
  index: number;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const host = event.venueName ?? event.locationText ?? event.organizerName ?? event.companyName;
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  const day = (() => {
    try {
      return new Date(event.startsAt)
        .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" })
        .toUpperCase();
    } catch {
      return "";
    }
  })();
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: Platform.OS !== "web", tension: 220, friction: 12 }).start();
  return (
    <View style={styles.eventGridItem}>
      <SpotlightCard borderRadius={22} spotlightColor="rgba(139,92,246,0.24)">
      <Animated.View style={[styles.eventBox, { transform: [{ scale }] }]}>
        <Pressable
          onPress={() => onOpen(event)}
          onPressIn={() => springTo(0.98)}
          onPressOut={() => springTo(1)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${event.title}`}
          style={styles.eventBoxMedia}
        >
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {event.coverImageUrl ? (
            <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <LinearGradient colors={["rgba(8,16,32,0.05)", "rgba(8,16,32,0.85)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.eventBoxPills}>
            {day ? (
              <View style={styles.eventBoxPill}>
                <Text style={styles.eventBoxPillText}>{day}</Text>
              </View>
            ) : <View />}
            <View style={styles.eventBoxPill}>
              <Text style={styles.eventBoxPillText}>{formatPrice(event)}</Text>
            </View>
          </View>
          <View style={styles.eventBoxTitleWrap}>
            <Text style={styles.eventBoxTitle} numberOfLines={1}>{event.title}</Text>
            {host ? <Text style={styles.eventBoxHost} numberOfLines={1}>{host}</Text> : null}
          </View>
        </Pressable>
        <View style={styles.eventBoxActions}>
          <Pressable style={styles.eventBoxPrimary} onPress={() => onOpen(event)} accessibilityRole="button">
            <LinearGradient colors={["#8B5CF6", "#DB2777"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.eventBoxPrimaryBg}>
              <Text style={styles.eventBoxPrimaryText}>{event.hasTickets ? "Buy tickets" : "Open"}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.eventBoxGhost} onPress={() => onOpen(event)} accessibilityRole="button">
            <Text style={styles.eventBoxGhostText}>Details</Text>
          </Pressable>
        </View>
      </Animated.View>
      </SpotlightCard>
    </View>
  );
}

function BottomTabBar({
  view,
  savedCount,
  onDiscover,
  onSaved,
  onAccount,
}: {
  view: "home" | "list" | "saved";
  savedCount: number;
  onDiscover: () => void;
  onSaved: () => void;
  onAccount: () => void;
}) {
  const discoverActive = view === "home" || view === "list";
  const savedActive = view === "saved";
  const dim = "rgba(255,255,255,0.4)";
  return (
    <View style={styles.tabBar}>
      <Pressable style={styles.tabItem} onPress={onDiscover} accessibilityRole="button" accessibilityLabel="Discover events">
        <Ionicons name={discoverActive ? "home" : "home-outline"} size={21} color={discoverActive ? palette.accentCyan : dim} />
        <Text style={[styles.tabLabel, discoverActive && styles.tabLabelActive]}>Discover</Text>
      </Pressable>
      <Pressable style={styles.tabItem} onPress={onAccount} accessibilityRole="button" accessibilityLabel="My tickets">
        <Ionicons name="ticket-outline" size={21} color={dim} />
        <Text style={styles.tabLabel}>Tickets</Text>
      </Pressable>
      <Pressable style={styles.tabItem} onPress={onSaved} accessibilityRole="button" accessibilityLabel="Saved events">
        <View>
          <Ionicons name={savedActive ? "heart" : "heart-outline"} size={21} color={savedActive ? palette.accentCyan : dim} />
          {savedCount > 0 ? (
            <View style={styles.tabDot}>
              <Text style={styles.tabDotText}>{savedCount > 9 ? "9+" : savedCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabLabel, savedActive && styles.tabLabelActive]}>Saved</Text>
      </Pressable>
      <Pressable style={styles.tabItem} onPress={onAccount} accessibilityRole="button" accessibilityLabel="Account">
        <Ionicons name="person-outline" size={21} color={dim} />
        <Text style={styles.tabLabel}>Account</Text>
      </Pressable>
    </View>
  );
}

function formatEventDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatPrice(event: DiscoverEvent) {
  if (!event.hasTickets) return "Explore";
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

function DiscoverEventCard({
  event,
  onOpen,
  wide,
}: {
  event: DiscoverEvent;
  onOpen: (event: DiscoverEvent) => void;
  wide?: boolean;
}) {
  return (
    <View style={[styles.eventCard, wide && styles.eventCardWide]}>
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={styles.eventImage} resizeMode="cover" />
      ) : (
        <View style={styles.eventImageFallback}>
          <Ionicons name="sparkles-outline" size={28} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.eventCardBody}>
        <Text style={styles.eventDate}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.eventName} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.eventHost} numberOfLines={1}>{event.organizerName ?? event.companyName}</Text>
        {event.shortDescription ? (
          <Text style={styles.eventDescription} numberOfLines={2}>{event.shortDescription}</Text>
        ) : null}
        <View style={styles.eventMetaRow}>
          <View style={styles.eventPricePill}>
            <Text style={styles.eventPriceText}>{formatPrice(event)}</Text>
          </View>
          <Text style={styles.eventTicketText}>
            {event.hasTickets ? `${event.availableTicketCount} ticket types` : "Event page"}
          </Text>
        </View>
        <View style={styles.eventActions}>
          <Pressable
            onPress={() => onOpen(event)}
            style={({ pressed }) => [styles.eventSecondaryButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Explore ${event.title}`}
          >
            <Text style={styles.eventSecondaryText}>Explore</Text>
          </Pressable>
          <Pressable
            onPress={() => onOpen(event)}
            style={({ pressed }) => [styles.eventPrimaryButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Buy tickets for ${event.title}`}
          >
            <Ionicons name="ticket-outline" size={16} color="#FFFFFF" />
            <Text style={styles.eventPrimaryText}>{event.hasTickets ? "Buy tickets" : "Open"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function EventDetailPanel({
  event,
  onBack,
  saved,
  onToggleSaved,
  reminderSet,
  onToggleReminder,
  onAddToCalendar,
  onShare,
}: {
  event: DiscoverEvent;
  onBack: () => void;
  saved: boolean;
  onToggleSaved: () => void;
  reminderSet: boolean;
  onToggleReminder: () => void;
  onAddToCalendar: () => void;
  onShare: () => void;
}) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [companySlug, eventSlug] = event.publicUrl.replace(/^\/e\//, "").split("/");

  function setTicketQuantity(ticketId: string, quantity: number) {
    setSelectedTickets((current) => ({ ...current, [ticketId]: Math.max(0, quantity) }));
  }

  const cartItems = event.ticketTypes
    .map((ticket) => ({
      ticketTypeId: ticket.id,
      name: ticket.name,
      price: ticket.price,
      currency: ticket.currency,
      quantity: selectedTickets[ticket.id] ?? 0,
    }))
    .filter((item) => item.quantity > 0);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartCurrency = cartItems[0]?.currency ?? event.ticketTypes[0]?.currency ?? "BHD";

  async function submitOrder() {
    setMessage(null);
    setCheckoutUrl(null);
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setMessage("Add your name and email to continue.");
      return;
    }
    if (cartItems.length === 0) {
      setMessage("Select at least one ticket.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPublicOrder({
        companySlug,
        eventSlug,
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim(),
        cartItems,
      });
      if (result.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        setMessage("Opening secure payment checkout...");
        await Linking.openURL(result.checkoutUrl);
      } else if (result.success) {
        setMessage("Registration complete. Tickets will be sent by email.");
        setSelectedTickets({});
      } else {
        setMessage("Checkout response was not recognized.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create ticket order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.detailPanel}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.detailBack, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={17} color="#FFFFFF" />
        <Text style={styles.detailBackText}>Events</Text>
      </Pressable>

      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={styles.detailImage} resizeMode="cover" />
      ) : (
        <View style={styles.detailImageFallback}>
          <Ionicons name="sparkles-outline" size={34} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.detailDateRow}>
        <Text style={styles.eventDate}>{formatEventDate(event.startsAt)}</Text>
        {countdownLabel(event.startsAt, event.endsAt) ? (
          <View style={styles.countdownPill}>
            <Ionicons name="time-outline" size={11} color="#A5F3FC" />
            <Text style={styles.countdownPillText}>{countdownLabel(event.startsAt, event.endsAt)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.detailTitle}>{event.title}</Text>
      <Text style={styles.eventHost}>{event.companyName}</Text>
      {event.shortDescription ? <Text style={styles.detailDescription}>{event.shortDescription}</Text> : null}

      <View style={styles.detailActions}>
        <DetailAction
          icon={reminderSet ? "notifications" : "notifications-outline"}
          label={reminderSet ? "Reminding" : "Remind me"}
          active={reminderSet}
          onPress={onToggleReminder}
        />
        <DetailAction icon="calendar-outline" label="Calendar" onPress={onAddToCalendar} />
        <DetailAction icon="share-social-outline" label="Share" onPress={onShare} />
        <DetailAction
          icon={saved ? "heart" : "heart-outline"}
          label={saved ? "Saved" : "Save"}
          active={saved}
          onPress={onToggleSaved}
        />
      </View>

      <View style={styles.ticketBox}>
        <Text style={styles.ticketBoxTitle}>Tickets</Text>
        {event.ticketTypes.length === 0 ? (
          <Text style={styles.eventDescription}>No tickets are available for this event yet.</Text>
        ) : (
          event.ticketTypes.map((ticket) => {
            const quantity = selectedTickets[ticket.id] ?? 0;
            return (
              <View key={ticket.id} style={styles.ticketRow}>
                <View style={styles.ticketCopy}>
                  <Text style={styles.ticketName}>{ticket.name}</Text>
                  {ticket.description ? <Text style={styles.ticketDesc}>{ticket.description}</Text> : null}
                  <Text style={styles.ticketPrice}>{formatTicketPrice(ticket.price, ticket.currency)}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable onPress={() => setTicketQuantity(ticket.id, quantity - 1)} style={styles.stepperBtn}>
                    <Text style={styles.stepperText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{quantity}</Text>
                  <Pressable
                    disabled={!ticket.available || quantity >= ticket.maxPerOrder}
                    onPress={() => setTicketQuantity(ticket.id, quantity + 1)}
                    style={[styles.stepperBtn, !ticket.available && styles.disabled]}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
        {totalQuantity > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total · {totalQuantity} {totalQuantity === 1 ? "ticket" : "tickets"}
            </Text>
            <Text style={styles.totalValue}>{formatTicketPrice(total, cartCurrency)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.checkoutBox}>
        <TextInput
          value={attendeeName}
          onChangeText={setAttendeeName}
          placeholder="Full name"
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={styles.checkoutInput}
        />
        <TextInput
          value={attendeeEmail}
          onChangeText={setAttendeeEmail}
          placeholder="Email address"
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.checkoutInput}
        />
        <Pressable
          disabled={submitting || event.ticketTypes.length === 0}
          onPress={submitOrder}
          style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed, submitting && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              {total > 0 ? `Checkout · ${formatTicketPrice(total, cartCurrency)}` : "Reserve tickets"}
            </Text>
          )}
        </Pressable>
        {message ? <Text style={styles.checkoutMessage}>{message}</Text> : null}
        {checkoutUrl ? (
          <Pressable
            onPress={() => Linking.openURL(checkoutUrl)}
            style={({ pressed }) => [styles.paymentLinkButton, pressed && styles.pressed]}
          >
            <Text style={styles.paymentLinkText}>Open secure payment</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function DetailAction({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.detailAction, active && styles.detailActionActive, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={active ? "#67E8F9" : "#FFFFFF"} />
      <Text style={[styles.detailActionText, active && styles.detailActionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function formatTicketPrice(price: number, currency: string) {
  if (price <= 0) return "Free";
  try {
    return new Intl.NumberFormat("en-BH", {
      style: "currency",
      currency: currency || "BHD",
      minimumFractionDigits: (currency || "BHD").toUpperCase() === "BHD" ? 3 : 2,
      maximumFractionDigits: (currency || "BHD").toUpperCase() === "BHD" ? 3 : 2,
    }).format(price / 100);
  } catch {
    return `${currency} ${price}`;
  }
}

function Feature({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={18} color={palette.text} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWide: {
    alignItems: "center",
  },
  inner: {
    width: "100%",
    minHeight: "100%",
    paddingHorizontal: spacing.xl,
    paddingTop: 52,
    paddingBottom: spacing.xl,
  },
  innerWide: {
    maxWidth: 1180,
    paddingHorizontal: spacing.xxl,
    paddingTop: 44,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gearButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  optionsPanel: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
    maxWidth: 520,
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(127,139,255,0.24)",
    borderRadius: radii.md,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: palette.textInverse,
    fontSize: 15,
    fontWeight: "900",
  },
  optionBody: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  main: {
    minHeight: 560,
    justifyContent: "center",
    gap: spacing.xl,
  },
  mainWide: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xxxl,
  },
  hero: {
    flex: 1,
    gap: spacing.md,
    maxWidth: 660,
  },
  title: {
    color: palette.textInverse,
    fontSize: type.hero + 6,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 43,
  },
  titleWide: {
    fontSize: 48,
    lineHeight: 54,
    maxWidth: 720,
  },
  subtitle: {
    color: "rgba(255,255,255,0.74)",
    fontSize: type.bodyLg,
    lineHeight: 23,
    maxWidth: 390,
  },
  actionCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  actionCardWide: {
    width: 430,
  },
  eventPreview: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  previewIcon: {
    alignItems: "center",
    backgroundColor: "rgba(127,139,255,0.12)",
    borderRadius: radii.md,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  previewCopy: {
    flex: 1,
    gap: 6,
  },
  previewTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  previewBody: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  featureGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  feature: {
    alignItems: "center",
    backgroundColor: palette.surfaceTint,
    borderColor: palette.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 76,
    justifyContent: "center",
    ...shadows.soft,
  },
  featureText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "900",
  },
  eventsSection: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  eventsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  eventsHeaderCopy: {
    gap: 4,
  },
  eventsEyebrow: {
    color: palette.accentLive,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  eventsTitle: {
    color: palette.textInverse,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  eventRail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  eventCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    width: 310,
    ...shadows.soft,
  },
  eventCardWide: {
    width: "100%",
  },
  eventImage: {
    height: 132,
    width: "100%",
  },
  eventImageFallback: {
    alignItems: "center",
    backgroundColor: "rgba(124,58,237,0.28)",
    height: 132,
    justifyContent: "center",
    width: "100%",
  },
  eventCardBody: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eventDate: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  eventName: {
    color: palette.textInverse,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  eventHost: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "800",
  },
  eventDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    minHeight: 36,
  },
  eventMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  eventPricePill: {
    backgroundColor: "rgba(124,58,237,0.4)",
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  eventPriceText: {
    color: palette.textInverse,
    fontSize: 12,
    fontWeight: "900",
  },
  eventTicketText: {
    color: "rgba(255,255,255,0.58)",
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  eventActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
  },
  eventPrimaryButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radii.md,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 46,
  },
  eventPrimaryText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "900",
  },
  eventSecondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  eventSecondaryText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "900",
  },
  eventSkeleton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: "center",
  },
  eventSkeletonText: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  eventEmpty: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  eventEmptyTitle: {
    color: palette.textInverse,
    fontSize: 16,
    fontWeight: "900",
  },
  eventEmptyBody: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
  },
  eventGrid: {
    gap: spacing.md,
  },
  exploreMoreButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  exploreMoreText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "900",
  },
  backToHomeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 7,
    paddingVertical: spacing.sm,
  },
  backToHomeText: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  newBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34,211,238,0.1)",
    borderColor: "rgba(103,232,249,0.35)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  newBannerText: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  tabDot: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DB2777",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  tabDotText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  detailDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderColor: "rgba(103,232,249,0.35)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  countdownPillText: {
    color: "#A5F3FC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  detailActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  detailAction: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 11,
  },
  detailActionActive: {
    backgroundColor: "rgba(34,211,238,0.12)",
    borderColor: "rgba(103,232,249,0.45)",
  },
  detailActionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  detailActionTextActive: {
    color: "#67E8F9",
  },
  detailPanel: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
  },
  detailBack: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 7,
  },
  detailBackText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "900",
  },
  detailImage: {
    borderRadius: radii.md,
    height: 210,
    width: "100%",
  },
  detailImageFallback: {
    alignItems: "center",
    backgroundColor: "rgba(124,58,237,0.28)",
    borderRadius: radii.md,
    height: 210,
    justifyContent: "center",
    width: "100%",
  },
  detailTitle: {
    color: palette.textInverse,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 35,
  },
  detailDescription: {
    color: palette.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  ticketBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  ticketBoxTitle: {
    color: palette.textInverse,
    fontSize: 18,
    fontWeight: "900",
  },
  ticketRow: {
    alignItems: "center",
    borderTopColor: "rgba(255,255,255,0.1)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  ticketCopy: {
    flex: 1,
    gap: 4,
  },
  ticketName: {
    color: palette.textInverse,
    fontSize: 15,
    fontWeight: "900",
  },
  ticketDesc: {
    color: palette.textSoft,
    fontSize: 12,
    lineHeight: 17,
  },
  ticketPrice: {
    color: "#C4B5FD",
    fontSize: 13,
    fontWeight: "900",
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepperBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  stepperText: {
    color: palette.textInverse,
    fontSize: 18,
    fontWeight: "900",
  },
  stepperValue: {
    color: palette.textInverse,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 18,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  totalRow: {
    alignItems: "center",
    borderTopColor: "rgba(255,255,255,0.14)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },
  totalLabel: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  totalValue: {
    color: palette.textInverse,
    fontSize: 18,
    fontWeight: "900",
  },
  checkoutBox: {
    gap: spacing.sm,
  },
  checkoutInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.textInverse,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  checkoutButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 54,
  },
  checkoutButtonText: {
    color: palette.textInverse,
    fontSize: 15,
    fontWeight: "900",
  },
  checkoutMessage: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  paymentLinkButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  paymentLinkText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "900",
  },

  // ---- Home · Marketplace (design) ----
  mkt: {
    gap: spacing.md,
    paddingBottom: 160,
  },
  mktHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mktHeaderCopy: {
    gap: 3,
  },
  mktKicker: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "800",
  },
  mktTitle: {
    color: palette.textInverse,
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  mktHeaderRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  mktGear: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 13,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  mktAvatar: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  mktAvatarText: {
    color: palette.textInverse,
    fontSize: 14,
    fontWeight: "800",
  },
  mktSearch: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  mktSearchInput: {
    color: palette.textInverse,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
  },
  mktPills: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  mktPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  mktPillActive: {
    backgroundColor: palette.accentCyanSoft,
    borderColor: palette.accentCyanSoft,
  },
  mktPillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "900",
  },
  mktPillTextActive: {
    color: "#000000",
  },
  mktSectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  mktSectionEyebrow: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  mktSeeAll: {
    color: palette.accentCyan,
    fontSize: 12,
    fontWeight: "900",
  },
  mktList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  // "Happening soon" horizontal rail
  soonRail: {
    gap: 12,
    paddingRight: spacing.xl,
  },
  soonCard: {
    width: 244,
    height: 150,
    borderRadius: 20,
    overflow: "hidden",
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  soonCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  soonCardBody: {
    gap: 2,
  },
  soonCardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  soonCardMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
  },
  // Compact 3-per-row tiles
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridTile: {
    flexGrow: 1,
    flexBasis: "30%",
    maxWidth: "32.5%",
    aspectRatio: 0.76,
    borderRadius: 18,
    overflow: "hidden",
    padding: 10,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  gridTileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gridTileNew: {
    backgroundColor: "#DB2777",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  gridTileNewText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  gridTileDay: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(8,16,32,0.72)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  gridTileDayText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  gridTileBody: {
    gap: 3,
  },
  gridTileTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  gridTilePrice: {
    color: palette.accentCyanSoft,
    fontSize: 11,
    fontWeight: "900",
  },
  eventGridItem: { flexGrow: 1, flexBasis: "47%", minWidth: 260 },
  eventBox: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  eventBoxMedia: { height: 150, justifyContent: "space-between", padding: 12 },
  eventBoxPills: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eventBoxPill: {
    backgroundColor: "rgba(8,16,32,0.72)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  eventBoxPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  eventBoxTitleWrap: { gap: 2 },
  eventBoxTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  eventBoxHost: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  eventBoxActions: { flexDirection: "row", gap: 10, padding: 12 },
  eventBoxPrimary: { flex: 1, borderRadius: 14, overflow: "hidden" },
  eventBoxPrimaryBg: { paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  eventBoxPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  eventBoxGhost: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  eventBoxGhostText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  featured: {
    aspectRatio: 16 / 13,
    borderRadius: 24,
    maxHeight: 460,
    overflow: "hidden",
    ...shadows.glow,
  },
  featuredBadge: {
    backgroundColor: palette.accentCyanSoft,
    borderRadius: radii.pill,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    top: 16,
  },
  featuredBadgeText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  featuredBody: {
    bottom: 18,
    left: 18,
    position: "absolute",
    right: 18,
  },
  featuredDate: {
    color: palette.accentCyanSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  featuredTitle: {
    color: palette.textInverse,
    fontSize: 27,
    fontStyle: "italic",
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 29,
    marginTop: 7,
  },
  featuredMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  featuredActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },
  featuredBuy: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.pill,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  featuredBuyText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "900",
  },
  featuredDetails: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  featuredDetailsText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "900",
  },
  row: {
    backgroundColor: palette.bgMuted,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 12,
  },
  rowThumb: {
    borderRadius: 15,
    height: 88,
    overflow: "hidden",
    width: 88,
  },
  rowThumbDate: {
    bottom: 8,
    color: palette.accentCyanSoft,
    fontSize: 9,
    fontWeight: "900",
    left: 8,
    position: "absolute",
  },
  rowBody: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  rowHost: {
    color: "#a78bfa",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  rowTitle: {
    color: palette.textInverse,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 19,
    marginTop: 4,
  },
  rowMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  rowPrice: {
    color: palette.textInverse,
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "900",
  },
  rowBuy: {
    backgroundColor: palette.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  rowBuyText: {
    color: palette.textInverse,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  aiFab: {
    position: "absolute",
    right: 16,
    bottom: 118,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "rgba(11,18,36,0.96)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  aiFabText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  tabBar: {
    backgroundColor: "rgba(12,16,32,0.94)",
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    // Android runs edge-to-edge: clear the system gesture/nav area so the
    // tab buttons stay visible and tappable.
    paddingBottom: Platform.OS === "android" ? 40 : 20,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  tabItem: {
    alignItems: "center",
    gap: 5,
    minWidth: 64,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: palette.accentCyan,
  },
});
