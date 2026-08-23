import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { accessPrivateEvent, createPublicOrder, fetchDiscoverEvents, fetchPublicSeating, fetchVisitorEvents, fetchVisitorTicket, holdPublicSeats } from "../api/mobileClient";
import type { DiscoverEvent, VisitorEvent, VisitorSession, VisitorTicket } from "../types";
import { BrandLogo } from "../ui/brand-logo";
import { QrCode } from "../ui/QrCode";
import { PaymentWebView } from "../ui/PaymentWebView";
import { buildCalendarUrl, eventPublicLink } from "../features/eventExtras";

type Tab = "home" | "search" | "favourite" | "private" | "profile";
const FAVOURITES_KEY = "iticket_public_favourites_v1";
const DEFAULT_CATEGORIES = [
  "All",
  "Concerts",
  "Comedy",
  "Theatre",
  "Sports",
  "Nightlife",
  "Dining",
  "Family",
  "Exhibitions",
] as const;
const CUSTOMER_TERMS = [
  "QR tickets are valid once for the stated event and date.",
  "Entry is subject to venue and organiser safety rules.",
  "Unauthorized resale or copying of tickets is not permitted.",
  "Schedules, performers, and artists may change where necessary.",
  "Refund and transfer requests follow the organiser's policy and applicable law.",
];

const tabs: Array<{key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap}> = [
  {key: "home", label: "Home", icon: "home-outline"},
  {key: "search", label: "Search", icon: "search-outline"},
  {key: "favourite", label: "Favourite", icon: "heart-outline"},
  {key: "private", label: "Private Event", icon: "calendar-outline"},
  {key: "profile", label: "Profile", icon: "person-outline"},
];

function eventDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {weekday: "short", month: "short", day: "numeric"});
}

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function EventCard({event, favourite, onFavourite, onOpen}: {event: DiscoverEvent; favourite: boolean; onFavourite: () => void; onOpen: () => void}) {
  return (
    <View style={styles.eventCard}>
      <Pressable onPress={onOpen}>
        <View style={styles.cover}>
          {event.coverImageUrl ? <Image source={{uri: event.coverImageUrl}} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          <LinearGradient colors={["rgba(2,8,18,0.02)", "rgba(2,8,18,0.92)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.coverTop}>
            <Text style={styles.datePill}>{eventDate(event.startsAt)}</Text>
            <Pressable onPress={onFavourite} style={styles.heartButton} hitSlop={10}>
              <Ionicons name={favourite ? "heart" : "heart-outline"} size={22} color={favourite ? "#22D3EE" : "#FFFFFF"} />
            </Pressable>
          </View>
          <View style={styles.coverCopy}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.eventMeta} numberOfLines={1}>{event.venueName || event.locationText || event.companyName}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.eventActions}>
        <Text style={styles.price}>{event.minPrice && event.minPrice > 0 ? `From ${event.currency} ${event.minPrice}` : "Free / Open"}</Text>
        <Pressable onPress={onOpen} style={styles.ticketButton}>
          <Text style={styles.ticketButtonText}>{event.hasTickets ? "Get tickets" : "View event"}</Text>
          <Ionicons name="arrow-forward" size={16} color="#03131A" />
        </Pressable>
      </View>
    </View>
  );
}

export function PublicHubScreen({session, onSignIn, onSignOut, onStaff}: {session: VisitorSession | null; onSignIn: () => void; onSignOut: () => void; onStaff: () => void}) {
  const [tab, setTab] = useState<Tab>("home");
  const [events, setEvents] = useState<DiscoverEvent[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "custom">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [privateBusy, setPrivateBusy] = useState(false);
  const [privateError, setPrivateError] = useState("");
  const [ticket, setTicket] = useState<VisitorTicket | null>(null);
  const [myEvents, setMyEvents] = useState<VisitorEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DiscoverEvent | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attendeeName, setAttendeeName] = useState(session?.name ?? "");
  const [attendeeEmail, setAttendeeEmail] = useState(session?.email ?? "");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [issuedBarcode, setIssuedBarcode] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [seatingPlan, setSeatingPlan] = useState<any>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  async function load() {
    setError("");
    try {
      const [discover, saved] = await Promise.all([fetchDiscoverEvents(), AsyncStorage.getItem(FAVOURITES_KEY)]);
      setEvents(discover.events);
      setFavourites(saved ? JSON.parse(saved) : []);
      if (session) {
        const [ticketResult, eventResult] = await Promise.all([fetchVisitorTicket(session.token), fetchVisitorEvents(session.token)]);
        setTicket(ticketResult.ticket);
        setMyEvents(eventResult.events);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, [session?.token]);

  async function toggleFavourite(id: string) {
    const next = favourites.includes(id) ? favourites.filter((item) => item !== id) : [...favourites, id];
    setFavourites(next);
    await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
  }

  function openEvent(event: DiscoverEvent) {
    setSelectedEvent(event);
    setQuantities({});
    setCheckoutMessage("");
    setIssuedBarcode(null);
    setTermsOpen(false);
    setSelectedSeatIds([]);
    void fetchPublicSeating(event.id).then((result)=>setSeatingPlan(result.plan)).catch(()=>setSeatingPlan(null));
  }

  async function checkout() {
    if (!selectedEvent) return;
    const cartItems = selectedEvent.ticketTypes
      .map((ticket) => ({ ticketTypeId: ticket.id, name: ticket.name, price: ticket.price, currency: ticket.currency, quantity: quantities[ticket.id] ?? 0 }))
      .filter((item) => item.quantity > 0);
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setCheckoutMessage("Enter your name and email to continue.");
      return;
    }
    if (!cartItems.length) {
      setCheckoutMessage("Choose at least one ticket.");
      return;
    }
    let seatHoldToken: string | undefined;
    const requestedQuantity=cartItems.reduce((sum,item)=>sum+item.quantity,0);
    if(seatingPlan?.enabled){if(selectedSeatIds.length!==requestedQuantity){setCheckoutMessage(`Select ${requestedQuantity} seat${requestedQuantity===1?"":"s"} to continue.`);return;}try{seatHoldToken=(await holdPublicSeats(selectedEvent.id,selectedSeatIds)).holdToken;}catch(caught){setCheckoutMessage(caught instanceof Error?caught.message:"Those seats are unavailable.");return;}}
    const [, companySlug, eventSlug] = selectedEvent.publicUrl.replace(/^\//, "").split("/");
    if (!companySlug || !eventSlug) {
      setCheckoutMessage("This event cannot be purchased in the app yet.");
      return;
    }
    setCheckoutBusy(true);
    setCheckoutMessage("");
    try {
      const result = await createPublicOrder({ companySlug, eventSlug, attendeeName: attendeeName.trim(), attendeeEmail: attendeeEmail.trim(), cartItems, selectedSeatIds, seatHoldToken });
      if (result.success) {
        setIssuedBarcode(result.orderId ?? "ITICKET-ORDER");
        setCheckoutMessage("Your ticket is confirmed and saved in iTicket.");
        if (session) await load();
      } else if (result.checkoutUrl) {
        setPaymentUrl(result.checkoutUrl);
      } else {
        setCheckoutMessage(result.error ?? "We could not complete the order.");
      }
    } catch (caught) {
      setCheckoutMessage(caught instanceof Error ? caught.message : "We could not complete the order.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  const visibleEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return events.filter((event) => {
      if (tab === "favourite" && !favourites.includes(event.id)) return false;
      if (activeCategory !== "All" && event.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
      const eventDay = dateKey(new Date(event.startsAt));
      if (dateFilter === "today" && eventDay !== dateKey(today)) return false;
      if (dateFilter === "tomorrow" && eventDay !== dateKey(tomorrow)) return false;
      if (dateFilter === "custom" && selectedDate && eventDay !== selectedDate) return false;
      return !term || [event.title, event.shortDescription, event.category, event.venueName, event.locationText, event.companyName]
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [activeCategory, dateFilter, events, favourites, query, selectedDate, tab]);

  const categories = useMemo(() => {
    const merged = new Map<string, string>();
    for (const category of DEFAULT_CATEGORIES) merged.set(category.toLowerCase(), category);
    for (const event of events) {
      const category = event.category?.trim();
      if (category) merged.set(category.toLowerCase(), category);
    }
    return Array.from(merged.values());
  }, [events]);
  const calendarDays = useMemo(() => Array.from({length: 28}, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  }), []);

  async function openPrivateEvent() {
    if (username.trim().length < 2 || eventCode.trim().length < 4) {
      setPrivateError("Enter your username and the event code from your organiser.");
      return;
    }
    setPrivateBusy(true);
    setPrivateError("");
    try {
      await accessPrivateEvent(username, eventCode);
      setPrivateError("Private-event access is verified. The conference portal is being added to this native app.");
    } catch (caught) {
      setPrivateError(caught instanceof Error ? caught.message : "We could not open this private event.");
    } finally {
      setPrivateBusy(false);
    }
  }

  return (
    <View style={styles.shell}>
      <LinearGradient colors={["#07101A", "#07141E", "#03070C"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <BrandLogo size={34} showWordmark />
        <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>Live events</Text></View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#22D3EE" onRefresh={() => {setRefreshing(true); void load();}} />}
      >
        {paymentUrl ? (
          <View style={styles.paymentShell}>
            <View style={styles.paymentHeader}><Pressable onPress={() => setPaymentUrl(null)} style={styles.backButton}><Ionicons name="close" size={22} color="#FFFFFF" /><Text style={styles.backButtonText}>Cancel payment</Text></Pressable><Text style={styles.paymentTitle}>Secure payment</Text></View>
            <PaymentWebView
              source={{uri: paymentUrl}}
              style={styles.paymentWebView}
              onNavigationStateChange={(state) => {
                if (state.url.includes("success=1")) {
                  setPaymentUrl(null);
                  setCheckoutMessage("Payment confirmed. Your ticket will appear in Profile shortly.");
                  void load();
                }
              }}
            />
          </View>
        ) : selectedEvent ? (
          <View style={styles.detailCard}>
            <Pressable onPress={() => setSelectedEvent(null)} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>All events</Text>
            </Pressable>
            <View style={styles.detailCover}>
              {selectedEvent.coverImageUrl ? <Image source={{uri: selectedEvent.coverImageUrl}} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
              <LinearGradient colors={["rgba(2,8,18,0)", "rgba(2,8,18,.92)"]} style={StyleSheet.absoluteFill} />
              <View style={styles.coverCopy}><Text style={styles.eventTitle}>{selectedEvent.title}</Text><Text style={styles.eventMeta}>{eventDate(selectedEvent.startsAt)} · {selectedEvent.venueName || selectedEvent.locationText || "Venue TBA"}</Text></View>
            </View>
            <Text style={styles.detailDescription}>{selectedEvent.shortDescription || "Event details will be shared by the organiser."}</Text>
            <View style={styles.detailActions}>
              <Pressable onPress={() => void Share.share({message: `${selectedEvent.title}\n${eventPublicLink(selectedEvent)}`})} style={styles.detailActionButton}>
                <Ionicons name="share-social-outline" size={17} color="#67E8F9" /><Text style={styles.detailActionText}>Share event</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(buildCalendarUrl(selectedEvent))} style={styles.detailActionButton}>
                <Ionicons name="calendar-outline" size={17} color="#67E8F9" /><Text style={styles.detailActionText}>Add to calendar</Text>
              </Pressable>
            </View>
            {issuedBarcode ? <View style={styles.confirmation}><Text style={styles.ticketEyebrow}>TICKET CONFIRMED</Text><Text style={styles.ticketTitle}>{selectedEvent.title}</Text><QrCode value={issuedBarcode} size={180} /><Text style={styles.ticketMeta}>Your QR ticket is saved in iTicket.</Text></View> : <>
              {seatingPlan?.enabled ? <View style={styles.seatMap}><View style={styles.seatMapHeader}><View><Text style={styles.termsTitle}>Choose your seats</Text><Text style={styles.ticketDescription}>Held for 10 minutes at checkout</Text></View><Text style={styles.seatCount}>{selectedSeatIds.length} selected</Text></View>{seatingPlan.floor_plan_url?<Image source={{uri:seatingPlan.floor_plan_url}} resizeMode="contain" style={styles.floorPlan}/>:null}{seatingPlan.sections.map((section:any)=><View key={section.id} style={styles.seatSection}><Text style={styles.ticketName}>{section.name}</Text>{section.rows.map((row:any)=><View key={row.id} style={styles.seatRow}><Text style={styles.rowLabel}>{row.label}</Text><View style={styles.seats}>{row.seats.map((seat:any)=>{const active=selectedSeatIds.includes(seat.id);return <Pressable key={seat.id} disabled={seat.unavailable} onPress={()=>setSelectedSeatIds(current=>active?current.filter(id=>id!==seat.id):[...current,seat.id])} style={[styles.seat,active&&styles.seatActive,seat.unavailable&&styles.seatUnavailable]}><Text style={[styles.seatText,active&&styles.seatTextActive]}>{seat.label}</Text></Pressable>})}</View></View>)}</View>)}</View>:null}
              <Text style={styles.sectionTitle}>Select tickets</Text>
              {selectedEvent.ticketTypes.map((ticket) => {
                const quantity = quantities[ticket.id] ?? 0;
                return <View key={ticket.id} style={styles.ticketRow}><View style={{flex: 1}}><Text style={styles.ticketName}>{ticket.name}</Text>{ticket.description ? <Text style={styles.ticketDescription}>{ticket.description}</Text> : null}<Text style={styles.price}>{ticket.price > 0 ? `${ticket.currency} ${ticket.price}` : "Free"}</Text></View><View style={styles.stepper}><Pressable onPress={() => setQuantities((current) => ({...current, [ticket.id]: Math.max(0, quantity - 1)}))} style={styles.stepperButton}><Text style={styles.stepperText}>−</Text></Pressable><Text style={styles.quantity}>{quantity}</Text><Pressable disabled={!ticket.available || quantity >= ticket.maxPerOrder} onPress={() => setQuantities((current) => ({...current, [ticket.id]: quantity + 1}))} style={[styles.stepperButton, (!ticket.available || quantity >= ticket.maxPerOrder) && styles.disabled]}><Text style={styles.stepperText}>+</Text></Pressable></View></View>;
              })}
              <TextInput value={attendeeName} onChangeText={setAttendeeName} placeholder="Full name" placeholderTextColor="#718096" style={styles.field} />
              <TextInput value={attendeeEmail} onChangeText={setAttendeeEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Email address" placeholderTextColor="#718096" style={styles.field} />
              <View style={styles.termsCard}>
                <Pressable onPress={() => setTermsOpen((open) => !open)} style={styles.termsHeader} accessibilityRole="button" accessibilityState={{expanded: termsOpen}}>
                  <View style={styles.termsTitleRow}><Ionicons name="shield-checkmark-outline" size={20} color="#22D3EE" /><Text style={styles.termsTitle}>Terms &amp; Conditions</Text></View>
                  <Ionicons name={termsOpen ? "chevron-up" : "chevron-down"} size={19} color="#67E8F9" />
                </Pressable>
                {termsOpen ? <View style={styles.termsBody}>{CUSTOMER_TERMS.map((term) => <View key={term} style={styles.termRow}><View style={styles.termDot} /><Text style={styles.termText}>{term}</Text></View>)}</View> : null}
              </View>
              {checkoutMessage ? <Text style={styles.error}>{checkoutMessage}</Text> : null}
              <Pressable disabled={checkoutBusy} onPress={() => void checkout()} style={[styles.primaryButton, checkoutBusy && styles.disabled]}>{checkoutBusy ? <ActivityIndicator color="#03131A" /> : <><Text style={styles.primaryButtonText}>Complete in-app checkout</Text><Ionicons name="card-outline" size={19} color="#03131A" /></>}</Pressable>
            </>}
          </View>
        ) : (<>
        {(tab === "home" || tab === "search" || tab === "favourite") && (
          <>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>{tab === "favourite" ? "SAVED FOR YOU" : "LIVE EXPERIENCES"}</Text>
              <Text style={styles.heroTitle}>{tab === "search" ? "Find your next event." : tab === "favourite" ? "Your favourites." : "What will you experience next?"}</Text>
              <Text style={styles.heroBody}>Discover concerts, conferences, family experiences and more with iTicket.</Text>
            </View>
            {(tab === "search" || tab === "home") && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#67E8F9" />
                <TextInput value={query} onChangeText={setQuery} onFocus={() => setTab("search")} placeholder="Search events, venues, artists..." placeholderTextColor="#718096" style={styles.searchInput} />
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((category) => {
                const active = activeCategory === category;
                return <Pressable key={category} onPress={() => setActiveCategory(category)} style={[styles.categoryChip, active && styles.categoryChipActive]}><Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{category}</Text></Pressable>;
              })}
            </ScrollView>
            <View style={styles.dateFilterRow}>
              <Pressable onPress={() => {setDateFilter("today"); setSelectedDate(null); setShowCalendar(false);}} style={[styles.dateFilterButton, dateFilter === "today" && styles.dateFilterButtonActive]}><Text style={[styles.dateFilterText, dateFilter === "today" && styles.dateFilterTextActive]}>Today</Text></Pressable>
              <Pressable onPress={() => {setDateFilter("tomorrow"); setSelectedDate(null); setShowCalendar(false);}} style={[styles.dateFilterButton, dateFilter === "tomorrow" && styles.dateFilterButtonActive]}><Text style={[styles.dateFilterText, dateFilter === "tomorrow" && styles.dateFilterTextActive]}>Tomorrow</Text></Pressable>
              <Pressable onPress={() => setShowCalendar((open) => !open)} style={[styles.dateFilterButton, dateFilter === "custom" && styles.dateFilterButtonActive]}><Ionicons name="calendar-outline" size={16} color={dateFilter === "custom" ? "#03131A" : "#A5F3FC"} /><Text style={[styles.dateFilterText, dateFilter === "custom" && styles.dateFilterTextActive]}>{selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric"}) : "Choose a date"}</Text></Pressable>
              {dateFilter !== "all" ? <Pressable onPress={() => {setDateFilter("all"); setSelectedDate(null); setShowCalendar(false);}} style={styles.clearDateButton}><Text style={styles.clearDateText}>Clear</Text></Pressable> : null}
            </View>
            {showCalendar ? <View style={styles.calendarPanel}><Text style={styles.calendarTitle}>Choose a date</Text><View style={styles.calendarGrid}>{calendarDays.map((date) => { const value = dateKey(date); const active = value === selectedDate; return <Pressable key={value} onPress={() => {setSelectedDate(value); setDateFilter("custom"); setShowCalendar(false);}} style={[styles.calendarDay, active && styles.calendarDayActive]}><Text style={[styles.calendarDayWeek, active && styles.calendarDayTextActive]}>{date.toLocaleDateString("en-US", {weekday: "short"})}</Text><Text style={[styles.calendarDayNumber, active && styles.calendarDayTextActive]}>{date.getDate()}</Text></Pressable>; })}</View></View> : null}
            <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{tab === "favourite" ? "Saved events" : query ? "Search results" : "Featured events"}</Text><Text style={styles.count}>{visibleEvents.length} events</Text></View>
            {loading ? <ActivityIndicator color="#22D3EE" size="large" style={{marginTop: 50}} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!loading && visibleEvents.length === 0 ? <View style={styles.empty}><Ionicons name="calendar-outline" size={38} color="#22D3EE" /><Text style={styles.emptyTitle}>No events here yet</Text><Text style={styles.emptyBody}>{tab === "favourite" ? "Tap the heart on an event to save it." : "Try a different search."}</Text></View> : null}
            {visibleEvents.map((event) => <EventCard key={event.id} event={event} favourite={favourites.includes(event.id)} onFavourite={() => void toggleFavourite(event.id)} onOpen={() => openEvent(event)} />)}
          </>
        )}

        {tab === "private" && (
          <View style={styles.privateCard}>
            <View style={styles.privateIcon}><Ionicons name="shield-checkmark" size={32} color="#22D3EE" /></View>
            <Text style={styles.eyebrow}>PRIVATE ACCESS</Text>
            <Text style={styles.privateTitle}>Your conference, ready when you are.</Text>
            <Text style={styles.heroBody}>Enter the username and event code shared by your organiser to open the private conference portal.</Text>
            <Text style={styles.label}>Username</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="Name on your registration" placeholderTextColor="#718096" style={styles.field} />
            <Text style={styles.label}>Event code</Text>
            <TextInput value={eventCode} onChangeText={(value) => setEventCode(value.toUpperCase())} autoCapitalize="characters" placeholder="e.g. CONF2026" placeholderTextColor="#718096" style={[styles.field, styles.codeField]} />
            {privateError ? <Text style={styles.error}>{privateError}</Text> : null}
            <Pressable onPress={() => void openPrivateEvent()} disabled={privateBusy} style={styles.primaryButton}>
              {privateBusy ? <ActivityIndicator color="#03131A" /> : <><Text style={styles.primaryButtonText}>Open conference</Text><Ionicons name="arrow-forward" size={19} color="#03131A" /></>}
            </Pressable>
          </View>
        )}

        {tab === "profile" && (
          <View>
            <View style={styles.profileHero}>
              <View style={styles.avatar}><Ionicons name="person" size={36} color="#03131A" /></View>
              <Text style={styles.privateTitle}>{session ? (session.name || session.email) : "Your iTicket profile"}</Text>
              <Text style={styles.heroBody}>{session ? "Your tickets and joined events, always within reach." : "Sign in to see your tickets, orders and event access."}</Text>
              {!session ? <Pressable onPress={onSignIn} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Sign in or create account</Text></Pressable> : null}
            </View>
            {session && ticket ? (
              <View style={styles.digitalTicket}>
                <Text style={styles.ticketEyebrow}>YOUR TICKET</Text>
                <Text style={styles.ticketTitle}>{ticket.event.name}</Text>
                <Text style={styles.ticketMeta}>{eventDate(ticket.event.startsAt)} · {ticket.event.location || "Location TBA"}</Text>
                <View style={styles.barcode}><Text style={styles.barcodeText}>{ticket.barcode}</Text></View>
                <Text style={styles.ticketType}>{ticket.ticketType} · {ticket.status}</Text>
                {ticket.seat ? <Text style={styles.ticketMeta}>Seat: {ticket.seat.section} · Row {ticket.seat.row} · {ticket.seat.seat}</Text> : null}
              </View>
            ) : null}
            {session ? <Text style={styles.sectionTitle}>My events</Text> : null}
            {session && myEvents.map((event) => <View key={event.eventId} style={styles.myEvent}><View><Text style={styles.myEventTitle}>{event.eventName}</Text><Text style={styles.myEventMeta}>{eventDate(event.startsAt)} · {event.ticketStatus}</Text></View><Ionicons name="ticket-outline" size={24} color="#22D3EE" /></View>)}
            {session ? <Pressable onPress={onSignOut} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable> : null}
            <Pressable onPress={onStaff} style={styles.staffLink}><Ionicons name="scan-outline" size={18} color="#94A3B8" /><Text style={styles.staffLinkText}>Event staff access</Text></Pressable>
          </View>
        )}
        </>) }
      </ScrollView>

      <View style={styles.dockWrap}>
        <View style={styles.dock}>
          {tabs.map((item) => {
            const active = tab === item.key;
            return <Pressable key={item.key} onPress={() => setTab(item.key)} style={styles.dockItem}><Ionicons name={active ? item.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap : item.icon} size={21} color={active ? "#0891B2" : "#172033"} /><Text numberOfLines={1} style={[styles.dockLabel, active && styles.dockLabelActive]}>{item.label}</Text></Pressable>;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {flex: 1, backgroundColor: "#03070C"},
  header: {height: 74, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.07)"},
  livePill: {flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(34,211,238,.25)", backgroundColor: "rgba(34,211,238,.08)", borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7},
  liveDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: "#22D3EE"}, liveText: {color: "#A5F3FC", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: .7},
  content: {padding: 18, paddingBottom: 128}, hero: {paddingVertical: 24}, eyebrow: {color: "#22D3EE", fontSize: 11, fontWeight: "900", letterSpacing: 2.2, marginBottom: 12},
  heroTitle: {color: "#FFFFFF", fontSize: 38, lineHeight: 42, fontWeight: "900", letterSpacing: -1.6}, heroBody: {color: "#9FB0C7", fontSize: 15, lineHeight: 23, marginTop: 13},
  searchBox: {height: 58, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, borderColor: "rgba(34,211,238,.24)", backgroundColor: "rgba(255,255,255,.06)", paddingHorizontal: 17, marginBottom: 26},
  searchInput: {flex: 1, color: "#FFFFFF", fontSize: 15}, sectionRow: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14}, sectionTitle: {color: "#FFFFFF", fontSize: 21, fontWeight: "900", marginVertical: 16}, count: {color: "#718096", fontSize: 12, fontWeight: "700"},
  categoryRow: {gap: 9, paddingBottom: 14}, categoryChip: {borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: "rgba(255,255,255,.07)", borderWidth: 1, borderColor: "rgba(255,255,255,.1)"}, categoryChipActive: {backgroundColor: "#22D3EE", borderColor: "#22D3EE"}, categoryChipText: {color: "#E2E8F0", fontSize: 12, fontWeight: "800"}, categoryChipTextActive: {color: "#03131A"},
  dateFilterRow: {flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16}, dateFilterButton: {flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, borderRadius: 13, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,.07)", borderWidth: 1, borderColor: "rgba(255,255,255,.1)"}, dateFilterButtonActive: {backgroundColor: "#22D3EE", borderColor: "#22D3EE"}, dateFilterText: {color: "#E2E8F0", fontSize: 12, fontWeight: "800"}, dateFilterTextActive: {color: "#03131A"}, clearDateButton: {paddingHorizontal: 7, paddingVertical: 9}, clearDateText: {color: "#67E8F9", fontSize: 12, fontWeight: "800"},
  calendarPanel: {borderRadius: 18, padding: 14, marginBottom: 12, backgroundColor: "#0E1723", borderWidth: 1, borderColor: "rgba(34,211,238,.2)"}, calendarTitle: {color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginBottom: 12}, calendarGrid: {flexDirection: "row", flexWrap: "wrap", gap: 7}, calendarDay: {width: "13%", minWidth: 42, alignItems: "center", paddingVertical: 8, borderRadius: 11, backgroundColor: "rgba(255,255,255,.05)"}, calendarDayActive: {backgroundColor: "#22D3EE"}, calendarDayWeek: {color: "#94A3B8", fontSize: 9, fontWeight: "800"}, calendarDayNumber: {color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginTop: 3}, calendarDayTextActive: {color: "#03131A"},
  eventCard: {borderRadius: 25, overflow: "hidden", backgroundColor: "#0E1723", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", marginBottom: 18}, cover: {height: 255, backgroundColor: "#172033"}, coverTop: {flexDirection: "row", justifyContent: "space-between", padding: 15}, datePill: {color: "#FFFFFF", fontSize: 11, fontWeight: "900", backgroundColor: "rgba(3,7,12,.76)", paddingHorizontal: 11, paddingVertical: 8, borderRadius: 99, overflow: "hidden"}, heartButton: {width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(3,7,12,.76)"}, coverCopy: {position: "absolute", left: 18, right: 18, bottom: 18}, eventTitle: {color: "#FFFFFF", fontSize: 25, lineHeight: 29, fontWeight: "900"}, eventMeta: {color: "#CBD5E1", fontSize: 13, marginTop: 7},
  eventActions: {padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between"}, price: {color: "#CFFAFE", fontSize: 13, fontWeight: "800"}, ticketButton: {flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#22D3EE", borderRadius: 13, paddingHorizontal: 15, paddingVertical: 11}, ticketButtonText: {color: "#03131A", fontSize: 12, fontWeight: "900"},
  empty: {alignItems: "center", padding: 38, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,.08)", backgroundColor: "rgba(255,255,255,.04)"}, emptyTitle: {color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 13}, emptyBody: {color: "#94A3B8", fontSize: 13, marginTop: 7, textAlign: "center"},
  privateCard: {marginTop: 24, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: "rgba(34,211,238,.2)", backgroundColor: "rgba(14,23,35,.94)"}, privateIcon: {width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(34,211,238,.1)", alignItems: "center", justifyContent: "center", marginBottom: 22}, privateTitle: {color: "#FFFFFF", fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -1}, label: {color: "#DCE8F5", fontSize: 13, fontWeight: "800", marginTop: 23, marginBottom: 8}, field: {height: 54, borderRadius: 15, backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.1)", paddingHorizontal: 15, color: "#FFFFFF", fontSize: 15}, codeField: {letterSpacing: 3, fontWeight: "900"}, error: {color: "#FDA4AF", backgroundColor: "rgba(244,63,94,.1)", borderRadius: 12, padding: 12, marginTop: 14},
  primaryButton: {minHeight: 54, marginTop: 24, borderRadius: 15, backgroundColor: "#22D3EE", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 18}, primaryButtonText: {color: "#03131A", fontSize: 15, fontWeight: "900"},
  profileHero: {alignItems: "center", padding: 28, marginTop: 20, borderRadius: 26, backgroundColor: "rgba(14,23,35,.94)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)"}, avatar: {width: 74, height: 74, borderRadius: 37, alignItems: "center", justifyContent: "center", backgroundColor: "#22D3EE", marginBottom: 18},
  digitalTicket: {padding: 22, marginTop: 18, borderRadius: 25, backgroundColor: "#0C6675", borderWidth: 1, borderColor: "rgba(103,232,249,.35)"}, ticketEyebrow: {color: "#A5F3FC", fontSize: 11, fontWeight: "900", letterSpacing: 2}, ticketTitle: {color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 12}, ticketMeta: {color: "#CFFAFE", fontSize: 13, marginTop: 8}, barcode: {height: 74, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, marginTop: 20}, barcodeText: {color: "#03131A", fontSize: 16, fontWeight: "900", letterSpacing: 2}, ticketType: {color: "#FFFFFF", fontSize: 12, fontWeight: "800", marginTop: 13},
  detailCard: {marginTop: 14, borderRadius: 25, overflow: "hidden", backgroundColor: "#0E1723", borderWidth: 1, borderColor: "rgba(255,255,255,.09)", paddingBottom: 22}, backButton: {flexDirection: "row", alignItems: "center", gap: 4, padding: 15, alignSelf: "flex-start"}, backButtonText: {color: "#CFFAFE", fontSize: 13, fontWeight: "800"}, detailCover: {height: 265, backgroundColor: "#172033", position: "relative"}, detailDescription: {color: "#CBD5E1", fontSize: 14, lineHeight: 22, margin: 18}, detailActions: {flexDirection: "row", flexWrap: "wrap", gap: 9, marginHorizontal: 18, marginBottom: 4}, detailActionButton: {flexDirection: "row", alignItems: "center", gap: 7, minHeight: 38, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "rgba(34,211,238,.08)", borderWidth: 1, borderColor: "rgba(34,211,238,.28)"}, detailActionText: {color: "#CFFAFE", fontSize: 12, fontWeight: "800"}, ticketRow: {marginHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.08)", flexDirection: "row", gap: 12, alignItems: "center"}, ticketName: {color: "#FFFFFF", fontSize: 15, fontWeight: "900"}, ticketDescription: {color: "#94A3B8", fontSize: 12, marginTop: 4}, stepper: {flexDirection: "row", alignItems: "center", gap: 8}, stepperButton: {width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(34,211,238,.15)", borderWidth: 1, borderColor: "rgba(34,211,238,.35)"}, stepperText: {color: "#67E8F9", fontSize: 20, fontWeight: "900"}, quantity: {color: "#FFFFFF", fontSize: 15, fontWeight: "900", minWidth: 18, textAlign: "center"}, disabled: {opacity: .45}, confirmation: {alignItems: "center", margin: 18, padding: 20, borderRadius: 22, backgroundColor: "#0C6675", gap: 12},
  termsCard: {marginHorizontal: 18, marginTop: 16, borderRadius: 16, overflow: "hidden", backgroundColor: "#09151D", borderWidth: 1, borderColor: "rgba(34,211,238,.3)"}, termsHeader: {minHeight: 55, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between"}, termsTitleRow: {flexDirection: "row", alignItems: "center", gap: 9}, termsTitle: {color: "#FFFFFF", fontSize: 14, fontWeight: "900"}, termsBody: {paddingHorizontal: 15, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.08)", gap: 10}, termRow: {flexDirection: "row", alignItems: "flex-start", gap: 9}, termDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: "#22D3EE", marginTop: 7}, termText: {flex: 1, color: "#B8C7D9", fontSize: 12, lineHeight: 18},
  seatMap:{margin:18,padding:15,borderRadius:18,backgroundColor:"#09151D",borderWidth:1,borderColor:"rgba(34,211,238,.3)"},seatMapHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:14},seatCount:{color:"#67E8F9",fontSize:11,fontWeight:"900"},floorPlan:{width:"100%",height:180,borderRadius:12,backgroundColor:"rgba(255,255,255,.04)",marginBottom:14},seatSection:{marginBottom:16},seatRow:{flexDirection:"row",gap:8,marginTop:9},rowLabel:{width:24,color:"#94A3B8",fontSize:11,fontWeight:"900",paddingTop:8},seats:{flex:1,flexDirection:"row",flexWrap:"wrap",gap:7},seat:{minWidth:34,height:34,paddingHorizontal:6,borderRadius:9,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,.07)",borderWidth:1,borderColor:"rgba(34,211,238,.25)"},seatActive:{backgroundColor:"#22D3EE"},seatUnavailable:{opacity:.25},seatText:{color:"#FFFFFF",fontSize:10,fontWeight:"900"},seatTextActive:{color:"#03131A"},
  paymentShell: {flex: 1, minHeight: 640, marginTop: 8, backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden"}, paymentHeader: {height: 64, backgroundColor: "#07101A", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 16}, paymentTitle: {color: "#FFFFFF", fontSize: 15, fontWeight: "900"}, paymentWebView: {flex: 1, minHeight: 576, backgroundColor: "#FFFFFF"},
  myEvent: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 17, borderRadius: 17, backgroundColor: "#0E1723", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", marginBottom: 10}, myEventTitle: {color: "#FFFFFF", fontSize: 15, fontWeight: "900"}, myEventMeta: {color: "#94A3B8", fontSize: 12, marginTop: 5},
  secondaryButton: {height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,.14)", marginTop: 18}, secondaryButtonText: {color: "#FFFFFF", fontSize: 14, fontWeight: "800"}, staffLink: {flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", padding: 20}, staffLinkText: {color: "#94A3B8", fontSize: 13, fontWeight: "700"},
  dockWrap: {position: "absolute", left: 8, right: 8, bottom: 8, alignItems: "center"}, dock: {width: "100%", maxWidth: 520, minHeight: 72, flexDirection: "row", alignItems: "stretch", borderRadius: 21, backgroundColor: "rgba(255,255,255,.98)", paddingHorizontal: 3, paddingVertical: 5, shadowColor: "#000", shadowOpacity: .34, shadowRadius: 24, shadowOffset: {width: 0, height: 12}, elevation: 14}, dockItem: {flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 16, paddingHorizontal: 1}, dockLabel: {color: "#263247", fontSize: 9, lineHeight: 11, fontWeight: "800", textAlign: "center"}, dockLabelActive: {color: "#0891B2"},
});
