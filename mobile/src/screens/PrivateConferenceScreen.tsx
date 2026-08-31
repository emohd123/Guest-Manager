import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "../ui/brand-logo";
import type { PrivateConferenceData, PrivateConferenceSession, VisitorSessionItem } from "../types";
import {
  accessPrivateEvent,
  fetchPrivateConference,
  submitPrivateConferenceQuestion,
  updatePrivateConferenceAgenda,
} from "../api/mobileClient";

type Tab = "home" | "agenda" | "speakers" | "resources";

function formatDate(value?: string | null, includeTime = true) {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be confirmed";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time to be confirmed" : new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date);
}

export function PrivateConferenceScreen({
  session,
  onAuthenticated,
  onSignOut,
  onBrowseWebsite,
}: {
  session: PrivateConferenceSession | null;
  onAuthenticated: (session: PrivateConferenceSession) => Promise<void>;
  onSignOut: () => Promise<void>;
  onBrowseWebsite: () => void;
}) {
  const [username, setUsername] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [data, setData] = useState<PrivateConferenceData | null>(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [questionFor, setQuestionFor] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [sendingQuestion, setSendingQuestion] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const next = await fetchPrivateConference(session.token);
    setData(next);
    setSavedIds(next.attendee.savedSessionIds);
  }, [session]);

  useEffect(() => {
    if (!session) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "We could not load this conference.")).finally(() => setLoading(false));
  }, [load, session]);

  const days = useMemo(() => {
    const items = data?.sessions ?? [];
    return [...new Set(items.map((item) => item.startsAt ? new Date(item.startsAt).toDateString() : "Full programme"))];
  }, [data?.sessions]);

  async function openConference() {
    setLoginError(null);
    if (!username.trim() || !eventCode.trim()) {
      setLoginError("Enter the username and conference code given by your organiser.");
      return;
    }
    setLoginBusy(true);
    try {
      const result = await accessPrivateEvent(username, eventCode);
      await onAuthenticated({
        token: result.accessToken,
        eventId: result.eventId,
        guestId: result.guestId,
        username: result.username,
        expiresAt: result.expiresAt,
      });
      setEventCode("");
    } catch (requestError) {
      setLoginError(requestError instanceof Error ? requestError.message : "We could not open this conference.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try { await load(); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "We could not refresh this conference."); } finally { setRefreshing(false); }
  }

  async function toggleSaved(sessionItem: VisitorSessionItem) {
    if (!session) return;
    const nextSaved = !savedIds.includes(sessionItem.id);
    setSavingId(sessionItem.id);
    try {
      const result = await updatePrivateConferenceAgenda(session.token, sessionItem.id, nextSaved);
      setSavedIds(result.savedSessionIds);
    } catch (actionError) {
      Alert.alert("Could not update agenda", actionError instanceof Error ? actionError.message : "Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function sendQuestion() {
    if (!session || !data || !questionFor || !questionText.trim()) return;
    setSendingQuestion(true);
    try {
      await submitPrivateConferenceQuestion(session.token, data.conference.id, questionFor, questionText.trim());
      setQuestionText("");
      setQuestionFor(null);
      Alert.alert("Question sent", "The session speaker can now see your question.");
    } catch (sendError) {
      Alert.alert("Could not send question", sendError instanceof Error ? sendError.message : "Please try again.");
    } finally {
      setSendingQuestion(false);
    }
  }

  if (!session) {
    return <ConferenceLogin
      username={username} eventCode={eventCode} busy={loginBusy} error={loginError}
      onChangeUsername={setUsername} onChangeEventCode={setEventCode}
      onSubmit={() => void openConference()} onBrowseWebsite={onBrowseWebsite}
    />;
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#42DFF5" /><Text style={styles.loadingText}>Opening your conference…</Text></View>;
  if (error || !data) return <View style={styles.loading}><Ionicons name="cloud-offline-outline" size={42} color="#FCA5A5" /><Text style={styles.errorTitle}>Conference unavailable</Text><Text style={styles.errorCopy}>{error ?? "Please check your connection and try again."}</Text><Pressable style={styles.retry} onPress={() => void refresh()}><Text style={styles.retryText}>Try again</Text></Pressable><Pressable onPress={() => void onSignOut()}><Text style={styles.signOutText}>Use another conference</Text></Pressable></View>;

  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#42DFF5" />}>
      <View style={styles.topBar}><BrandLogo size={37} showWordmark /><Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => void onSignOut()} style={styles.iconButton}><Ionicons name="log-out-outline" size={20} color="#D8E2F4" /></Pressable></View>
      {tab === "home" && <Home data={data} setTab={setTab} />}
      {tab === "agenda" && <Agenda days={days} data={data} savedIds={savedIds} savingId={savingId} toggleSaved={toggleSaved} questionFor={questionFor} setQuestionFor={setQuestionFor} questionText={questionText} setQuestionText={setQuestionText} sendingQuestion={sendingQuestion} sendQuestion={sendQuestion} />}
      {tab === "speakers" && <Speakers data={data} />}
      {tab === "resources" && <Resources data={data} />}
      <Pressable style={styles.endSignOut} onPress={() => void onSignOut()}><Ionicons name="log-out-outline" size={18} color="#FCA5A5" /><Text style={styles.endSignOutText}>Sign out of conference</Text></Pressable>
    </ScrollView>
    <View style={styles.tabBar}>{([ ["home", "home-outline", "Home"], ["agenda", "calendar-outline", "Agenda"], ["speakers", "people-outline", "Speakers"], ["resources", "folder-open-outline", "Files"] ] as Array<[Tab, keyof typeof Ionicons.glyphMap, string]>).map(([id, icon, label]) => <Pressable key={id} onPress={() => setTab(id)} style={[styles.tabButton, tab === id && styles.tabButtonActive]}><Ionicons name={icon} size={21} color={tab === id ? "#08111F" : "#9AA9C7"} /><Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text></Pressable>)}</View>
  </View>;
}

function ConferenceLogin(props: { username: string; eventCode: string; busy: boolean; error: string | null; onChangeUsername: (value: string) => void; onChangeEventCode: (value: string) => void; onSubmit: () => void; onBrowseWebsite: () => void }) {
  return <LinearGradient colors={["#07172A", "#0C1221", "#07090E"]} style={styles.loginRoot}>
    <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
      <BrandLogo size={51} showWordmark />
      <View style={styles.loginBadge}><Ionicons name="shield-checkmark-outline" size={16} color="#7DEAF8" /><Text style={styles.loginBadgeText}>PRIVATE CONFERENCE</Text></View>
      <Text style={styles.loginTitle}>Your conference,{"\n"}ready when you are.</Text>
      <Text style={styles.loginCopy}>Use the username and unique code shared by your organiser. Your access remains available on this device until the conference ends.</Text>
      <View style={styles.loginCard}>
        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput value={props.username} onChangeText={props.onChangeUsername} placeholder="Name on your registration" placeholderTextColor="#71809C" style={styles.field} autoCapitalize="words" />
        <Text style={styles.fieldLabel}>Conference code</Text>
        <TextInput value={props.eventCode} onChangeText={(value) => props.onChangeEventCode(value.toUpperCase())} placeholder="e.g. TECH2026" placeholderTextColor="#71809C" style={[styles.field, styles.codeField]} autoCapitalize="characters" autoCorrect={false} />
        {props.error ? <Text style={styles.loginError}>{props.error}</Text> : null}
        <Pressable onPress={props.onSubmit} disabled={props.busy} style={[styles.openButton, props.busy && styles.disabled]}>{props.busy ? <ActivityIndicator color="#07111F" /> : <><Text style={styles.openButtonText}>Open conference</Text><Ionicons name="arrow-forward" size={20} color="#07111F" /></>}</Pressable>
      </View>
      <Pressable onPress={props.onBrowseWebsite} style={styles.websiteButton}><Text style={styles.websiteButtonText}>Browse public iTicket events</Text></Pressable>
    </ScrollView>
  </LinearGradient>;
}

function Home({ data, setTab }: { data: PrivateConferenceData; setTab: (tab: Tab) => void }) {
  const next = data.sessions.filter((item) => item.startsAt && new Date(item.startsAt).getTime() >= Date.now()).sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)))[0];
  return <>
    <LinearGradient colors={["#14334A", "#10172A", "#080C15"]} style={styles.hero}>{data.conference.coverImageUrl ? <Image source={{ uri: data.conference.coverImageUrl }} style={styles.heroImage} /> : null}<View style={styles.heroShade} /><Text style={styles.eyebrow}>CONFERENCE DASHBOARD</Text><Text style={styles.heroTitle}>{data.conference.title}</Text><Text style={styles.heroCopy}>{data.conference.description || "Everything you need for this conference is in one place."}</Text><View style={styles.heroMeta}><Ionicons name="calendar-outline" size={17} color="#8AEFFB" /><Text style={styles.heroMetaText}>{formatDate(data.conference.startsAt)}</Text></View><View style={styles.heroMeta}><Ionicons name="location-outline" size={17} color="#8AEFFB" /><Text style={styles.heroMetaText}>{data.conference.venueName}</Text></View></LinearGradient>
    <View style={styles.quickGrid}>{([ ["agenda", "calendar", "Agenda"], ["speakers", "people", "Speakers"], ["resources", "document-text", "Resources"], ["agenda", "chatbubbles", "Live Q&A"] ] as Array<[Tab, keyof typeof Ionicons.glyphMap, string]>).map(([tab, icon, label]) => <Pressable key={label} onPress={() => setTab(tab)} style={styles.quick}><Ionicons name={icon} size={24} color="#75E8F7" /><Text style={styles.quickText}>{label}</Text></Pressable>)}</View>
    {data.announcements.length > 0 ? <Section eyebrow="LIVE UPDATES" title="Conference notices"><View style={styles.stack}>{data.announcements.slice(0, 3).map((item) => <View key={item.id} style={styles.notice}><Ionicons name="notifications-outline" size={19} color="#75E8F7" /><View style={styles.flex}><Text style={styles.noticeTitle}>{item.title}</Text><Text style={styles.noticeBody}>{item.body}</Text></View></View>)}</View></Section> : null}
    {next ? <Section eyebrow="UP NEXT" title="Your next session"><SessionCard session={next} saved={false} saving={false} onToggleSaved={() => undefined} compact /></Section> : null}
  </>;
}

function Agenda({ days, data, savedIds, savingId, toggleSaved, questionFor, setQuestionFor, questionText, setQuestionText, sendingQuestion, sendQuestion }: { days: string[]; data: PrivateConferenceData; savedIds: string[]; savingId: string | null; toggleSaved: (session: VisitorSessionItem) => void; questionFor: string | null; setQuestionFor: (value: string | null) => void; questionText: string; setQuestionText: (value: string) => void; sendingQuestion: boolean; sendQuestion: () => void }) {
  return <Section eyebrow="FULL PROGRAMME" title="Agenda" body="Save sessions to create your personal schedule.">{days.length ? days.map((day) => <View key={day} style={styles.day}><Text style={styles.dayTitle}>{day === "Full programme" ? day : formatDate(new Date(day).toISOString(), false)}</Text>{data.sessions.filter((item) => (item.startsAt ? new Date(item.startsAt).toDateString() : "Full programme") === day).map((session) => <View key={session.id}><SessionCard session={session} saved={savedIds.includes(session.id)} saving={savingId === session.id} onToggleSaved={() => toggleSaved(session)} />{questionFor === session.id ? <View style={styles.questionBox}><TextInput value={questionText} onChangeText={setQuestionText} placeholder="Ask the speaker a question" placeholderTextColor="#71809C" style={styles.questionInput} multiline maxLength={600} /><View style={styles.questionActions}><Pressable onPress={() => setQuestionFor(null)}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable disabled={sendingQuestion || !questionText.trim()} onPress={() => void sendQuestion()} style={styles.sendButton}>{sendingQuestion ? <ActivityIndicator color="#07111F" /> : <Text style={styles.sendButtonText}>Send question</Text>}</Pressable></View></View> : <Pressable onPress={() => setQuestionFor(session.id)} style={styles.questionLink}><Ionicons name="chatbubble-ellipses-outline" size={17} color="#7DEAF8" /><Text style={styles.questionLinkText}>Ask a live question</Text></Pressable>}</View>)}</View>) : <Text style={styles.empty}>The organiser has not published the programme yet.</Text>}</Section>;
}

function Speakers({ data }: { data: PrivateConferenceData }) { return <Section eyebrow="CONFERENCE SPEAKERS" title="Meet the speakers">{data.speakers.length ? <View style={styles.speakerGrid}>{data.speakers.map((speaker) => <View key={speaker.id} style={styles.speaker}><View style={styles.speakerPhoto}>{speaker.imageUrl ? <Image source={{ uri: speaker.imageUrl }} style={styles.speakerImage} /> : <Text style={styles.initial}>{speaker.name.charAt(0)}</Text>}</View><Text style={styles.speakerName}>{speaker.name}</Text>{speaker.role ? <Text style={styles.speakerRole}>{speaker.role}</Text> : null}{speaker.bio ? <Text style={styles.speakerBio}>{speaker.bio}</Text> : null}</View>)}</View> : <Text style={styles.empty}>Speaker profiles will appear here once added by the organiser.</Text>}</Section>; }

function Resources({ data }: { data: PrivateConferenceData }) { return <Section eyebrow="RESOURCE CENTER" title="Slides & files" body="Download conference documents and session materials.">{data.venueMapUrl ? <Pressable onPress={() => void Linking.openURL(data.venueMapUrl)} style={styles.resource}><Ionicons name="map-outline" size={22} color="#75E8F7" /><View style={styles.flex}><Text style={styles.resourceTitle}>Venue map</Text><Text style={styles.resourceMeta}>Open map and directions</Text></View><Ionicons name="open-outline" size={19} color="#AAB8D0" /></Pressable> : null}{data.resources.length ? data.resources.map((resource) => <Pressable key={resource.id} onPress={() => void Linking.openURL(resource.url)} style={styles.resource}><Ionicons name="document-text-outline" size={22} color="#75E8F7" /><View style={styles.flex}><Text style={styles.resourceTitle}>{resource.title}</Text><Text style={styles.resourceMeta}>{resource.fileType ?? "Document"}</Text></View><Ionicons name="download-outline" size={19} color="#AAB8D0" /></Pressable>) : <Text style={styles.empty}>No documents have been added yet.</Text>}</Section>; }

function SessionCard({ session, saved, saving, onToggleSaved, compact = false }: { session: VisitorSessionItem; saved: boolean; saving: boolean; onToggleSaved: () => void; compact?: boolean }) { return <View style={styles.session}><View style={styles.sessionHead}><View style={styles.flex}><Text style={styles.sessionTime}>{formatTime(session.startsAt)} · {session.location || "Room to be confirmed"}</Text><Text style={styles.sessionTitle}>{session.title}</Text>{session.speaker ? <Text style={styles.sessionSpeaker}>{session.speaker}{session.speakerTitle ? ` · ${session.speakerTitle}` : ""}</Text> : null}</View>{!compact && <Pressable disabled={saving} onPress={onToggleSaved} style={styles.saveButton}>{saving ? <ActivityIndicator size="small" color="#07111F" /> : <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={19} color="#07111F" />}</Pressable>}</View>{!compact && session.description ? <Text style={styles.sessionDescription}>{session.description}</Text> : null}{session.liveNow ? <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE NOW</Text></View> : null}{session.liveStreamUrl ? <Pressable onPress={() => void Linking.openURL(session.liveStreamUrl!)} style={styles.watchButton}><Ionicons name="play-circle-outline" size={18} color="#7DEAF8" /><Text style={styles.watchText}>{session.liveStreamLabel || "Open live session"}</Text></Pressable> : null}</View>; }
function Section({ eyebrow, title, body, children }: { eyebrow: string; title: string; body?: string; children: React.ReactNode }) { return <View style={styles.section}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text>{body ? <Text style={styles.sectionBody}>{body}</Text> : null}{children}</View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080B13" }, scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 124, gap: 22 }, loading: { flex: 1, backgroundColor: "#080B13", alignItems: "center", justifyContent: "center", padding: 30, gap: 14 }, loadingText: { color: "#D8E2F4", fontSize: 15, fontWeight: "700" }, errorTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" }, errorCopy: { color: "#AAB8D0", textAlign: "center", fontSize: 14, lineHeight: 21 }, retry: { backgroundColor: "#67E8F9", paddingHorizontal: 18, paddingVertical: 13, borderRadius: 16 }, retryText: { color: "#07111F", fontWeight: "900" }, signOutText: { color: "#AAB8D0", fontWeight: "700" }, topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { borderColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderRadius: 16, padding: 10 }, hero: { minHeight: 300, borderRadius: 28, padding: 23, overflow: "hidden", justifyContent: "flex-end", borderWidth: 1, borderColor: "rgba(117,232,247,0.24)" }, heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.32 }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,10,20,0.45)" }, eyebrow: { color: "#75E8F7", fontSize: 10, fontWeight: "900", letterSpacing: 1.7, marginBottom: 8 }, heroTitle: { color: "#FFFFFF", fontSize: 31, fontWeight: "900", letterSpacing: -1, lineHeight: 36 }, heroCopy: { color: "#D3DEEF", marginTop: 11, lineHeight: 21, fontSize: 14 }, heroMeta: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 13 }, heroMetaText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", flex: 1 }, quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, quick: { width: "48%", flexGrow: 1, minHeight: 90, backgroundColor: "#11192A", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderRadius: 20, justifyContent: "center", alignItems: "center", gap: 8 }, quickText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, section: { gap: 11 }, sectionTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -0.6 }, sectionBody: { color: "#AAB8D0", fontSize: 14, lineHeight: 20, marginTop: -4 }, stack: { gap: 9 }, notice: { flexDirection: "row", gap: 11, backgroundColor: "#102033", borderWidth: 1, borderColor: "rgba(117,232,247,0.16)", borderRadius: 18, padding: 15 }, flex: { flex: 1 }, noticeTitle: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 }, noticeBody: { color: "#C2CEE2", fontSize: 13, lineHeight: 19, marginTop: 3 }, day: { gap: 10, marginTop: 5 }, dayTitle: { color: "#75E8F7", fontWeight: "900", fontSize: 14 }, session: { backgroundColor: "#11192A", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 16, borderRadius: 20, gap: 9 }, sessionHead: { flexDirection: "row", gap: 10 }, sessionTime: { color: "#8DECF8", fontWeight: "800", fontSize: 12 }, sessionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 5 }, sessionSpeaker: { color: "#CBD7EA", fontSize: 13, marginTop: 4, fontWeight: "700" }, sessionDescription: { color: "#AAB8D0", fontSize: 13, lineHeight: 19 }, saveButton: { alignSelf: "flex-start", backgroundColor: "#75E8F7", padding: 10, borderRadius: 13 }, livePill: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "rgba(244,63,94,0.18)", paddingHorizontal: 9, paddingVertical: 5 }, liveDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: "#FB7185" }, liveText: { color: "#FDA4AF", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, watchButton: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 2 }, watchText: { color: "#7DEAF8", fontWeight: "800", fontSize: 13 }, questionLink: { flexDirection: "row", alignItems: "center", gap: 7, paddingTop: 7 }, questionLinkText: { color: "#7DEAF8", fontSize: 13, fontWeight: "800" }, questionBox: { backgroundColor: "#102033", borderColor: "rgba(117,232,247,0.2)", borderWidth: 1, borderRadius: 18, padding: 12, marginTop: -4, gap: 10 }, questionInput: { color: "#FFFFFF", minHeight: 78, textAlignVertical: "top", fontSize: 14 }, questionActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cancelText: { color: "#B9C7DC", fontWeight: "800" }, sendButton: { backgroundColor: "#75E8F7", borderRadius: 12, minWidth: 125, minHeight: 42, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 }, sendButtonText: { color: "#07111F", fontWeight: "900" }, speakerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, speaker: { width: "47%", flexGrow: 1, backgroundColor: "#11192A", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden", paddingBottom: 15 }, speakerPhoto: { height: 155, backgroundColor: "#163145", alignItems: "center", justifyContent: "center" }, speakerImage: { width: "100%", height: "100%" }, initial: { color: "#7DEAF8", fontSize: 42, fontWeight: "900" }, speakerName: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginTop: 13, marginHorizontal: 14 }, speakerRole: { color: "#7DEAF8", marginTop: 3, marginHorizontal: 14, fontSize: 12, fontWeight: "800" }, speakerBio: { color: "#B9C7DC", marginTop: 8, marginHorizontal: 14, fontSize: 12, lineHeight: 18 }, resource: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 19, backgroundColor: "#11192A", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }, resourceTitle: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 }, resourceMeta: { color: "#AAB8D0", fontSize: 12, marginTop: 4 }, empty: { color: "#AAB8D0", fontSize: 14, lineHeight: 21, backgroundColor: "#11192A", borderRadius: 18, padding: 17 }, endSignOut: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 16, marginTop: 8 }, endSignOutText: { color: "#FCA5A5", fontWeight: "800" }, tabBar: { position: "absolute", bottom: 20, left: 14, right: 14, flexDirection: "row", borderRadius: 23, backgroundColor: "#F8FAFC", padding: 6, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 }, tabButton: { flex: 1, alignItems: "center", borderRadius: 17, paddingVertical: 9, gap: 3 }, tabButtonActive: { backgroundColor: "#75E8F7" }, tabText: { color: "#53617A", fontSize: 10, fontWeight: "800" }, tabTextActive: { color: "#07111F" }, loginRoot: { flex: 1 }, loginScroll: { padding: 24, paddingTop: 56, paddingBottom: 42, gap: 19 }, loginBadge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(125,234,248,0.3)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginTop: 22 }, loginBadgeText: { color: "#7DEAF8", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 }, loginTitle: { color: "#FFFFFF", fontSize: 35, lineHeight: 40, fontWeight: "900", letterSpacing: -1.4 }, loginCopy: { color: "#C5D1E4", fontSize: 15, lineHeight: 23 }, loginCard: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderRadius: 26, padding: 19, gap: 10, marginTop: 6 }, fieldLabel: { color: "#B6C5DB", fontWeight: "800", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }, field: { backgroundColor: "rgba(0,0,0,0.22)", borderColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderRadius: 16, minHeight: 56, paddingHorizontal: 15, color: "#FFFFFF", fontSize: 16 }, codeField: { letterSpacing: 2.3, fontWeight: "800" }, loginError: { backgroundColor: "rgba(244,63,94,0.16)", color: "#FECACA", borderRadius: 12, padding: 11, fontSize: 13, fontWeight: "700", lineHeight: 19 }, openButton: { backgroundColor: "#75E8F7", borderRadius: 17, minHeight: 58, marginTop: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, openButtonText: { color: "#07111F", fontSize: 16, fontWeight: "900" }, disabled: { opacity: 0.65 }, websiteButton: { alignItems: "center", padding: 12 }, websiteButtonText: { color: "#AAB8D0", fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
});
