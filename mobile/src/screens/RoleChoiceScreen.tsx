import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { createPublicOrder, fetchDiscoverEvents, registerDiscoverPushToken } from "../api/mobileClient";
import { getExpoProjectId } from "../config";
import {
  availableReminderOffsets,
  buildCalendarUrl,
  buildDirectionsUrl,
  cancelEventReminder,
  countdownLabel,
  detectNewEvents,
  eventPublicLink,
  getLang,
  getReminders,
  getSavedIds,
  getTopCategories,
  notifyNewEvents,
  recordCategoryOpen,
  reminderOffsetLabel,
  scheduleEventReminder,
  setLang as persistLang,
  toggleSaved,
  type AppLang,
  type ReminderMap,
  type ReminderOffset,
} from "../features/eventExtras";
import { categoryLabel, eventDescription, eventHost, eventTitle, eventVenue, t } from "../features/i18n";
import { AiConciergeSheet } from "../ui/AiConciergeSheet";
import { FadeSlideIn, KenBurns, PressScale, PulseView } from "../ui/motion";
import { ClickStack } from "../ui/ClickStack";
import { Confetti } from "../ui/Confetti";
import { Dock } from "../ui/Dock";
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
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLangState] = useState<AppLang>("en");
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const insets = useSafeAreaInsets();

  const CATEGORIES = ["All", "Concerts", "Dining", "Family", "Comedy", "Attractions"];

  const loadEvents = React.useCallback(async (notifyFresh: boolean) => {
    try {
      const result = await fetchDiscoverEvents();
      const list = result.events ?? [];
      setEvents(list);
      // Surface anything published since the last visit.
      const fresh = await detectNewEvents(list);
      if (fresh.length > 0) {
        setNewIds((current) => Array.from(new Set([...current, ...fresh])));
        if (notifyFresh) void notifyNewEvents(list.filter((e) => fresh.includes(e.id)));
      }
    } catch {
      setEvents((current) => current);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadEvents(true).finally(() => mounted && setEventsLoading(false));

    getSavedIds().then((ids) => mounted && setSavedIds(ids));
    getReminders().then((map) => mounted && setReminders(map));
    getLang().then((value) => mounted && setLangState(value));
    getTopCategories().then((cats) => mounted && setTopCategories(cats));

    // Register for server "new event" broadcasts. Requires notification
    // permission + FCM credentials in the build; silently skips otherwise.
    (async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== "granted") return;
        const projectId = getExpoProjectId();
        if (!projectId) return;
        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        if (pushToken.data) {
          const cats = await getTopCategories(3);
          await registerDiscoverPushToken({
            token: pushToken.data,
            platform: Platform.OS,
            categories: cats.length ? cats : undefined,
          });
        }
      } catch {
        // Expo push needs FCM config on bare Android — fine to skip until then.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadEvents]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadEvents(false);
    } finally {
      setRefreshing(false);
    }
  }

  function toggleLang() {
    const next: AppLang = lang === "en" ? "ar" : "en";
    setLangState(next);
    void persistLang(next);
  }

  // Deep link: tapping a reminder / new-event notification opens that event.
  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      const eventId = response?.notification.request.content.data?.eventId;
      if (typeof eventId === "string" && eventId) setPendingEventId(eventId);
    };
    Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!pendingEventId || events.length === 0) return;
    const match = events.find((event) => event.id === pendingEventId);
    setPendingEventId(null);
    if (match) openEvent(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEventId, events]);

  async function handleToggleSaved(eventId: string) {
    setSavedIds(await toggleSaved(eventId));
  }

  async function handleToggleReminder(event: DiscoverEvent) {
    if (reminders[event.id]) {
      await cancelEventReminder(event.id);
      setReminders(await getReminders());
      Alert.alert("Reminder removed", `You won't be notified about ${eventTitle(event, lang)}.`);
      return;
    }
    const offsets = availableReminderOffsets(event);
    if (offsets.length === 0) {
      Alert.alert("Couldn't set reminder", "This event starts too soon to schedule a reminder.");
      return;
    }
    const schedule = async (offset: ReminderOffset) => {
      const result = await scheduleEventReminder(event, offset);
      setReminders(await getReminders());
      Alert.alert(result.ok ? "Reminder set" : "Couldn't set reminder", result.message);
    };
    // Suggest a sensible default: soon-starting events need a tighter reminder.
    const hoursUntil = (new Date(event.startsAt).getTime() - Date.now()) / 3_600_000;
    const suggested: ReminderOffset = hoursUntil <= 48 ? "hour" : "day";
    // Android alerts support up to three action buttons — exactly our offsets.
    Alert.alert(
      t(lang, "reminderPickerTitle"),
      t(lang, "reminderPickerBody"),
      offsets.map((offset) => ({
        text: offset === suggested ? `★ ${reminderOffsetLabel(offset)}` : reminderOffsetLabel(offset),
        onPress: () => void schedule(offset),
      })),
      { cancelable: true }
    );
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
    // Feed the "For you" rail with what the user actually opens.
    recordCategoryOpen(event)
      .then(() => getTopCategories())
      .then(setTopCategories)
      .catch(() => undefined);
  }

  const q = query.trim().toLowerCase();
  const filtered = events.filter((e) => {
    // Search across everything a user might remember about an event.
    const haystack = [
      e.title,
      e.titleAr,
      e.venueName,
      e.venueNameAr,
      e.locationText,
      e.organizerName,
      e.companyName,
      e.category,
      e.shortDescription,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !q || haystack.includes(q);
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
  // Up to 3 next events feed the "Happening soon" click stack.
  const soonRail = eventView === "home" ? sorted.slice(1, 4) : [];
  const rest =
    eventView === "home"
      ? sorted.slice(1 + soonRail.length)
      : eventView === "saved"
        ? sorted.filter((e) => savedIds.includes(e.id))
        : sorted;
  // "For you": upcoming events in the categories this user opens most.
  const topThreeIds = new Set(sorted.slice(0, 3).map((e) => e.id));
  const forYou =
    eventView === "home" && topCategories.length > 0
      ? sorted
          .filter((e) => !topThreeIds.has(e.id))
          .filter((e) => {
            const cat = (e.category ?? e.categorySlug ?? "").toLowerCase();
            return cat && topCategories.includes(cat);
          })
          .slice(0, 6)
      : [];

  return (
    <PremiumBackdrop>
      <View style={styles.container}>
        <FallingSparkles count={12} speed={0.7} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#67E8F9" colors={["#67E8F9"]} />
          }
        >
          <FadeSlideIn style={[styles.inner, isWide && styles.innerWide, { paddingTop: insets.top + 16 }]}>
          {eventView === "detail" && selectedEvent ? (
            <EventDetailPanel
              event={selectedEvent}
              lang={lang}
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
                  <View style={styles.kickerRow}>
                    <Text style={styles.mktKicker}>{t(lang, "kicker")}</Text>
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={10} color="#67E8F9" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  </View>
                  <Text style={styles.mktTitle}>
                    {eventView === "list"
                      ? t(lang, "allEventsTitle")
                      : eventView === "saved"
                        ? t(lang, "savedEventsTitle")
                        : t(lang, "discoverTitle")}
                  </Text>
                </View>
                <View style={styles.mktHeaderRight}>
                  <Pressable
                    onPress={toggleLang}
                    style={({ pressed }) => [styles.mktGear, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={lang === "en" ? "التبديل إلى العربية" : "Switch to English"}
                  >
                    <Text style={styles.langToggleText}>{lang === "en" ? "ع" : "EN"}</Text>
                  </Pressable>
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
                  placeholder={t(lang, "searchPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={[styles.mktSearchInput, lang === "ar" && styles.rtlText]}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mktPills}
              >
                {CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat}
                    label={categoryLabel(lang, cat)}
                    active={activeCategory === cat}
                    onPress={() => setActiveCategory(cat)}
                  />
                ))}
              </ScrollView>

              {eventView === "home" && newIds.length > 0 ? (
                <Pressable
                  style={styles.newBanner}
                  onPress={() => setEventView("list")}
                  accessibilityRole="button"
                  accessibilityLabel="See new events"
                >
                  <PulseView minOpacity={0.45} duration={800}>
                    <Ionicons name="sparkles" size={14} color="#67E8F9" />
                  </PulseView>
                  <Text style={styles.newBannerText}>
                    {newIds.length === 1
                      ? t(lang, "newEventOne")
                      : `${newIds.length} ${t(lang, "newEventMany")}`}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}

              {featured && eventView === "home" ? (
                <FeaturedHero event={featured} lang={lang} onOpen={openEvent} />
              ) : null}

              {eventView === "home" && soonRail.length > 0 ? (
                <>
                  <View style={styles.mktSectionHead}>
                    <Text style={styles.mktSectionEyebrow}>{t(lang, "happeningSoon")}</Text>
                    {soonRail.length > 1 ? (
                      <Text style={styles.stackHint}>{t(lang, "tapToCycle")}</Text>
                    ) : null}
                  </View>
                  <FadeSlideIn delay={100} distance={18}>
                    <ClickStack
                      key={soonRail.map((event) => event.id).join("|")}
                      count={soonRail.length}
                      cardHeight={172}
                      spreadY={-13}
                      visibleCount={3}
                      renderCard={(index) => (
                        <StackEventCard event={soonRail[index]} index={index} lang={lang} onOpen={openEvent} />
                      )}
                    />
                  </FadeSlideIn>
                </>
              ) : null}

              {forYou.length > 0 ? (
                <>
                  <View style={styles.mktSectionHead}>
                    <Text style={styles.mktSectionEyebrow}>{t(lang, "forYou")}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.soonRail}
                  >
                    {forYou.map((event, index) => (
                      <SoonCard key={event.id} event={event} index={index + 2} lang={lang} onOpen={openEvent} />
                    ))}
                  </ScrollView>
                </>
              ) : null}

              {eventsLoading ? (
                <View style={styles.gridWrap}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <PulseView key={i} style={styles.gridTileWrap} minOpacity={0.4} duration={800}>
                      <View style={[styles.gridTile, styles.gridTileSkeleton]} />
                    </PulseView>
                  ))}
                </View>
              ) : sorted.length === 0 ? (
                <View style={styles.eventEmpty}>
                  <Ionicons name="calendar-clear-outline" size={22} color="rgba(255,255,255,0.72)" />
                  <Text style={styles.eventEmptyTitle}>{t(lang, "noEventsTitle")}</Text>
                  <Text style={styles.eventEmptyBody}>{t(lang, "noEventsBody")}</Text>
                </View>
              ) : rest.length > 0 || eventView !== "home" ? (
                <>
                  <View style={styles.mktSectionHead}>
                    <Text style={styles.mktSectionEyebrow}>
                      {eventView === "list"
                        ? `${t(lang, "allEvents")} · ${sorted.length}`
                        : eventView === "saved"
                          ? `${t(lang, "savedCount")} · ${rest.length}`
                          : t(lang, "moreEvents")}
                    </Text>
                    {eventView === "home" ? (
                      <Pressable onPress={() => setEventView("list")} accessibilityRole="button" accessibilityLabel="See all events">
                        <Text style={styles.mktSeeAll}>{t(lang, "seeAll")}</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setEventView("home")} accessibilityRole="button" accessibilityLabel="Back to home">
                        <Text style={styles.mktSeeAll}>{t(lang, "back")}</Text>
                      </Pressable>
                    )}
                  </View>
                  {rest.length === 0 ? (
                    <View style={styles.eventEmpty}>
                      <Ionicons name="heart-outline" size={22} color="rgba(255,255,255,0.72)" />
                      <Text style={styles.eventEmptyTitle}>{t(lang, "noSavedTitle")}</Text>
                      <Text style={styles.eventEmptyBody}>{t(lang, "noSavedBody")}</Text>
                    </View>
                  ) : (
                    <View style={styles.gridWrap}>
                      {rest.map((event, index) => (
                        <GridTile
                          key={event.id}
                          event={event}
                          index={index}
                          lang={lang}
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
                  <Text style={styles.mktSectionEyebrow}>{t(lang, "thatsEverything")}</Text>
                  <Text style={styles.mktSeeAll}>{t(lang, "seeAll")}</Text>
                </Pressable>
              )}
            </View>
          )}
        </FadeSlideIn>
        </ScrollView>
        {eventView !== "detail" ? (
          <Pressable
            style={[styles.aiFab, { bottom: 92 + insets.bottom }]}
            onPress={() => setAiOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ask AI about events"
          >
            <Ionicons name="sparkles" size={16} color="#67E8F9" />
            <Text style={styles.aiFabText}>Ask AI</Text>
          </Pressable>
        ) : null}
        {eventView !== "detail" ? (
          <View style={[styles.dockWrap, { bottom: 14 + insets.bottom }]} pointerEvents="box-none">
            <Dock
              panelHeight={60}
              baseItemSize={46}
              magnification={64}
              items={[
                {
                  key: "discover",
                  label: t(lang, "tabDiscover"),
                  active: eventView === "home" || eventView === "list",
                  icon: <Ionicons name="home-outline" size={22} color="#8D98C5" />,
                  activeIcon: <Ionicons name="home" size={22} color="#67E8F9" />,
                  onPress: () => setEventView("home"),
                },
                {
                  key: "tickets",
                  label: t(lang, "tabTickets"),
                  icon: <Ionicons name="ticket-outline" size={22} color="#8D98C5" />,
                  onPress: onSelectVisitor,
                },
                {
                  key: "saved",
                  label: t(lang, "tabSaved"),
                  active: eventView === "saved",
                  badge: savedIds.length,
                  icon: <Ionicons name="heart-outline" size={22} color="#8D98C5" />,
                  activeIcon: <Ionicons name="heart" size={22} color="#67E8F9" />,
                  onPress: () => setEventView("saved"),
                },
                {
                  key: "account",
                  label: t(lang, "tabAccount"),
                  icon: <Ionicons name="person-outline" size={22} color="#8D98C5" />,
                  onPress: onSelectVisitor,
                },
              ]}
            />
          </View>
        ) : null}
        <AiConciergeSheet
          visible={aiOpen}
          lang={lang}
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

/** A glossy diagonal light band that periodically sweeps across a hero card. */
function HeroSheen({ width, delay = 0 }: { width: number; delay?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const useNative = Platform.OS !== "web";
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3600 + delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: useNative,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: useNative }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, progress, useNative]);
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.7, width * 1.2] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.sheen, { transform: [{ translateX }, { rotate: "18deg" }] }]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Category filter chip that springs up and glows when it becomes active. */
function CategoryPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const useNative = Platform.OS !== "web";
  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.07 : 1,
      useNativeDriver: useNative,
      speed: 40,
      bounciness: 14,
    }).start();
  }, [active, scale, useNative]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        style={[styles.mktPill, active && styles.mktPillActive]}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${label}`}
      >
        <Text style={[styles.mktPillText, active && styles.mktPillTextActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Heart icon that springs with a satisfying pop when it becomes saved. */
function PopHeart({ saved }: { saved: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const useNative = Platform.OS !== "web";
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (saved) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, useNativeDriver: useNative, speed: 50, bounciness: 16 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: useNative, speed: 30, bounciness: 10 }),
      ]).start();
    }
  }, [saved, scale, useNative]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={saved ? "heart" : "heart-outline"} size={19} color={saved ? "#67E8F9" : "#FFFFFF"} />
    </Animated.View>
  );
}

function FeaturedHero({
  event,
  lang,
  onOpen,
}: {
  event: DiscoverEvent;
  lang: AppLang;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const host = eventHost(event, lang);
  const price = formatPrice(event);
  const { width } = useWindowDimensions();
  return (
    <View style={styles.featured}>
      <LinearGradient
        colors={["#1e1b4b", "#7c3aed", "#db2777"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {event.coverImageUrl ? (
        <KenBurns style={StyleSheet.absoluteFill}>
          <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </KenBurns>
      ) : null}
      <HeroSheen width={width} />
      <LinearGradient
        colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.1)", "transparent"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <PulseView style={styles.featuredBadge} minOpacity={0.82} duration={1400}>
        <Text style={styles.featuredBadgeText}>{t(lang, "featured")}</Text>
      </PulseView>
      <View style={styles.featuredBody}>
        <Text style={styles.featuredDate}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>{eventTitle(event, lang)}</Text>
        <Text style={styles.featuredMeta} numberOfLines={1}>
          {host}{price ? ` · ${price}` : ""}
        </Text>
        <View style={styles.featuredActions}>
          <Pressable
            onPress={() => onOpen(event)}
            style={({ pressed }) => [styles.featuredBuy, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Buy tickets for ${event.title}`}
          >
            <Text style={styles.featuredBuyText}>
              {event.hasTickets ? t(lang, "buyTicket") : t(lang, "openEvent")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onOpen(event)}
            style={({ pressed }) => [styles.featuredDetails, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Details for ${event.title}`}
          >
            <Text style={styles.featuredDetailsText}>{t(lang, "details")}</Text>
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

/** Full-width card face for the "Happening soon" click stack. Tapping the
 * card cycles the deck (handled by ClickStack); the arrow button opens it. */
function StackEventCard({
  event,
  index,
  lang,
  onOpen,
}: {
  event: DiscoverEvent;
  index: number;
  lang: AppLang;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <View style={styles.stackCard}>
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
      <View style={styles.stackCardBottom}>
        <View style={styles.stackCardCopy}>
          <Text style={styles.soonCardTitle} numberOfLines={2}>{eventTitle(event, lang)}</Text>
          <Text style={styles.soonCardMeta} numberOfLines={1}>{eventVenue(event, lang)}</Text>
        </View>
        <Pressable
          onPress={() => onOpen(event)}
          style={({ pressed }) => [styles.stackOpenBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${event.title}`}
        >
          <Ionicons name={lang === "ar" ? "arrow-back" : "arrow-forward"} size={19} color="#0B1020" />
        </Pressable>
      </View>
    </View>
  );
}

/** Medium horizontal-rail card for the "Happening soon" / "For you" rails. */
function SoonCard({
  event,
  index,
  lang,
  onOpen,
}: {
  event: DiscoverEvent;
  index: number;
  lang: AppLang;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <FadeSlideIn delay={120 + index * 90} distance={18}>
    <PressScale
      onPress={() => onOpen(event)}
      style={styles.soonCard}
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
        <Text style={styles.soonCardTitle} numberOfLines={2}>{eventTitle(event, lang)}</Text>
        <Text style={styles.soonCardMeta} numberOfLines={1}>{eventVenue(event, lang)}</Text>
      </View>
    </PressScale>
    </FadeSlideIn>
  );
}

/** Compact poster tile — three per row keeps the catalogue organized. */
function GridTile({
  event,
  index,
  lang,
  isNew,
  onOpen,
}: {
  event: DiscoverEvent;
  index: number;
  lang: AppLang;
  isNew?: boolean;
  onOpen: (event: DiscoverEvent) => void;
}) {
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <FadeSlideIn delay={Math.min(index, 8) * 60} distance={16} style={styles.gridTileWrap}>
    <PressScale
      onPress={() => onOpen(event)}
      style={styles.gridTile}
      pressedScale={0.94}
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
          <PulseView style={styles.gridTileNew} minOpacity={0.6} duration={700}>
            <Text style={styles.gridTileNewText}>NEW</Text>
          </PulseView>
        ) : null}
      </View>
      <View style={styles.gridTileBody}>
        <Text style={styles.gridTileTitle} numberOfLines={2}>{eventTitle(event, lang)}</Text>
        <Text style={styles.gridTilePrice}>{formatPrice(event)}</Text>
      </View>
    </PressScale>
    </FadeSlideIn>
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
  lang,
  onBack,
  saved,
  onToggleSaved,
  reminderSet,
  onToggleReminder,
  onAddToCalendar,
  onShare,
}: {
  event: DiscoverEvent;
  lang: AppLang;
  onBack: () => void;
  saved: boolean;
  onToggleSaved: () => void;
  reminderSet: boolean;
  onToggleReminder: () => void;
  onAddToCalendar: () => void;
  onShare: () => void;
}) {
  const { width: detailWidth } = useWindowDimensions();
  const [showConfetti, setShowConfetti] = useState(false);
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
        setShowConfetti(true);
        await Linking.openURL(result.checkoutUrl);
      } else if (result.success) {
        setMessage("Registration complete. Tickets will be sent by email.");
        setSelectedTickets({});
        setShowConfetti(true);
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
      <View style={styles.detailHero}>
        {event.coverImageUrl ? (
          <KenBurns style={StyleSheet.absoluteFill} maxScale={1.05} duration={11000}>
            <Image source={{ uri: event.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </KenBurns>
        ) : (
          <View style={styles.detailHeroFallback}>
            <Ionicons name="sparkles-outline" size={34} color="#FFFFFF" />
          </View>
        )}
        <HeroSheen width={detailWidth} delay={900} />
        <LinearGradient
          colors={["rgba(5,7,15,0)", "rgba(5,7,15,0.28)", "rgba(5,7,15,0.82)"]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.heroCircleBtn, styles.heroCircleLeft, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name={lang === "ar" ? "chevron-forward" : "chevron-back"} size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={onToggleSaved}
          style={({ pressed }) => [
            styles.heroCircleBtn,
            styles.heroCircleRight,
            saved && styles.heroCircleActive,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Saved" : "Save"}
        >
          <PopHeart saved={saved} />
        </Pressable>
        {countdownLabel(event.startsAt, event.endsAt) ? (
          <View style={styles.heroCountdown}>
            <Ionicons name="time-outline" size={11} color="#A5F3FC" />
            <Text style={styles.countdownPillText}>{countdownLabel(event.startsAt, event.endsAt)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.detailBody}>
      <Text style={styles.detailEyebrow}>{formatEventDate(event.startsAt)}</Text>
      <Text style={styles.detailTitle}>{eventTitle(event, lang)}</Text>
      <Text style={styles.eventHost}>{eventHost(event, lang)}</Text>
      {eventDescription(event, lang) ? (
        <Text style={styles.detailDescription}>{eventDescription(event, lang)}</Text>
      ) : null}
      {event.aiTagline ? (
        <View style={styles.taglineRow}>
          <Ionicons name="sparkles" size={13} color="#C4B5FD" />
          <Text style={styles.taglineText}>{event.aiTagline}</Text>
        </View>
      ) : null}

      <View style={styles.detailActions}>
        <DetailAction
          icon={reminderSet ? "notifications" : "notifications-outline"}
          label={reminderSet ? t(lang, "reminding") : t(lang, "remindMe")}
          active={reminderSet}
          onPress={onToggleReminder}
        />
        <DetailAction icon="calendar-outline" label={t(lang, "calendar")} onPress={onAddToCalendar} />
        <DetailAction icon="share-social-outline" label={t(lang, "share")} onPress={onShare} />
      </View>

      <Pressable
        onPress={() =>
          Linking.openURL(buildDirectionsUrl(event)).catch(() =>
            Alert.alert("Unable to open maps", "No maps app could handle the request.")
          )
        }
        style={({ pressed }) => [styles.directionsRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Get directions"
      >
        <Ionicons name="location-outline" size={17} color="#67E8F9" />
        <Text style={styles.directionsText} numberOfLines={1}>
          {eventVenue(event, lang) ?? "Bahrain"}
        </Text>
        <View style={styles.directionsCta}>
          <Text style={styles.directionsCtaText}>{t(lang, "directions")}</Text>
          <Ionicons name="chevron-forward" size={13} color="#67E8F9" />
        </View>
      </Pressable>

      <View style={styles.ticketBox}>
        <Text style={styles.ticketBoxTitle}>{t(lang, "tickets")}</Text>
        {event.ticketTypes.length === 0 ? (
          <Text style={styles.eventDescription}>{t(lang, "noTickets")}</Text>
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
              {t(lang, "total")} · {totalQuantity}{" "}
              {totalQuantity === 1 ? t(lang, "ticketOne") : t(lang, "ticketMany")}
            </Text>
            <Text style={styles.totalValue}>{formatTicketPrice(total, cartCurrency)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.checkoutBox}>
        <TextInput
          value={attendeeName}
          onChangeText={setAttendeeName}
          placeholder={t(lang, "fullName")}
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={[styles.checkoutInput, lang === "ar" && styles.rtlText]}
        />
        <TextInput
          value={attendeeEmail}
          onChangeText={setAttendeeEmail}
          placeholder={t(lang, "emailAddress")}
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.checkoutInput, lang === "ar" && styles.rtlText]}
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
              {total > 0
                ? `${t(lang, "checkout")} · ${formatTicketPrice(total, cartCurrency)}`
                : t(lang, "reserveTickets")}
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
      {showConfetti ? <Confetti onDone={() => setShowConfetti(false)} /> : null}
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
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderColor: "rgba(196,181,253,0.3)",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  taglineText: {
    color: "#DDD6FE",
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "700",
    lineHeight: 18,
  },
  directionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  directionsText: {
    color: palette.textInverse,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  directionsCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  directionsCtaText: {
    color: "#67E8F9",
    fontSize: 12,
    fontWeight: "900",
  },
  detailAction: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
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
    backgroundColor: "rgba(13,19,38,0.72)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.strong,
  },
  detailHero: {
    height: 248,
    width: "100%",
    position: "relative",
    backgroundColor: "#160f2e",
  },
  detailHeroFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.3)",
  },
  heroCircleBtn: {
    position: "absolute",
    top: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,7,15,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroCircleLeft: { left: 14 },
  heroCircleRight: { right: 14 },
  heroCircleActive: {
    backgroundColor: "rgba(34,211,238,0.22)",
    borderColor: "rgba(103,232,249,0.55)",
  },
  heroCountdown: {
    position: "absolute",
    bottom: 14,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(5,7,15,0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.4)",
  },
  detailBody: {
    padding: spacing.lg,
    gap: 13,
  },
  detailEyebrow: {
    color: "rgba(103,232,249,0.9)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
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
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
  },
  aiBadgeText: {
    color: "#67E8F9",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
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
  langToggleText: {
    color: palette.textInverse,
    fontSize: 15,
    fontWeight: "900",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
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
  // "Happening soon" click stack
  stackHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "800",
  },
  stackCard: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0B1224",
  },
  stackCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  stackCardCopy: {
    flex: 1,
    gap: 2,
  },
  stackOpenBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#67E8F9",
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
  gridTileWrap: {
    flexGrow: 1,
    flexBasis: "30%",
    maxWidth: "32.5%",
  },
  gridTile: {
    width: "100%",
    aspectRatio: 0.76,
    borderRadius: 18,
    overflow: "hidden",
    padding: 10,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  gridTileSkeleton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
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
  sheen: {
    position: "absolute",
    top: -60,
    bottom: -60,
    left: 0,
    width: 84,
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
  // Floating magnifying Dock at the bottom of Discover (centered pill).
  dockWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  tabBar: {
    backgroundColor: "rgba(12,16,32,0.94)",
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
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
