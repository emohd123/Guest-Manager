import crypto from "crypto";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createEventNotifications } from "@/server/actions/createEventNotifications";
import {
  type EventChatMessage,
  type EventChatThread,
  type AttendeeNetworkingProfile,
  type EventAnnouncement,
  type EventAppSettings,
  type EventFeatureFlags,
  type EventSessionRecord,
  type EventSessionStatus,
  type SponsorProfile,
} from "@/types/event";

type EventRow = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  visitor_code: string | null;
  settings: Record<string, any> | null;
  metadata: Record<string, any> | null;
  venue_id: string | null;
};

type EventSessionRow = {
  id: string;
  event_id: string;
  title: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  capacity: number | null;
  sort_order: number | null;
};

type GuestRow = {
  id: string;
  event_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  guest_type: string | null;
  tags: string[] | null;
  custom_data: Record<string, any> | null;
  rsvp_status: string | null;
  attendance_state: string | null;
  created_at: string;
};

export type NetworkingRequestRecord = {
  id: string;
  fromGuestId: string;
  toGuestId: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
  createdAt: string;
  updatedAt: string;
};

export type MeetingRecord = {
  id: string;
  requestId: string;
  hostGuestId: string;
  guestGuestId: string;
  status: "pending" | "accepted" | "declined" | "rescheduled";
  scheduledFor?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpoPushRegistration = {
  email: string;
  token: string;
  platform: string;
  eventId: string;
  updatedAt: string;
};

export type ChatThreadRecord = EventChatThread;
export type ChatMessageRecord = EventChatMessage;

function defaultFeatureFlags(): EventFeatureFlags {
  return {
    networkingEnabled: true,
    matchmakingEnabled: true,
    liveStreamEnabled: true,
    pushNotificationsEnabled: true,
    sessionTrackingEnabled: true,
    attendeeChatEnabled: true,
    directoryEnabled: true,
    sponsorHighlightsEnabled: true,
  };
}

export function normalizeEventAppSettings(raw: unknown): EventAppSettings {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const app = (data.eventApp ?? {}) as Record<string, any>;
  const features = (app.features ?? {}) as Record<string, any>;
  const liveStream = (app.liveStream ?? {}) as Record<string, any>;
  const networking = (app.networking ?? {}) as Record<string, any>;
  const taxonomy = (networking.taxonomy ?? {}) as Record<string, any>;
  const directory = (networking.directory ?? {}) as Record<string, any>;
  const sponsors = (app.sponsors ?? {}) as Record<string, any>;

  return {
    welcomeMessage: app.welcomeMessage ?? "Everything you need for this event lives in the app.",
    homeHeadline: app.homeHeadline ?? "Your live event companion",
    features: {
      ...defaultFeatureFlags(),
      ...features,
    },
    liveStream: {
      url: liveStream.url ?? "",
      label: liveStream.label ?? "Watch Live",
      provider: liveStream.provider ?? "embed",
      isLive: Boolean(liveStream.isLive),
    },
    networking: {
      introText:
        networking.introText ??
        "Opt in to discover relevant attendees, request introductions, and schedule meetings.",
      taxonomy: {
        interests: Array.isArray(taxonomy.interests) ? taxonomy.interests.filter(Boolean) : [],
        goals: Array.isArray(taxonomy.goals) ? taxonomy.goals.filter(Boolean) : [],
        industries: Array.isArray(taxonomy.industries) ? taxonomy.industries.filter(Boolean) : [],
      },
      directory: {
        privacyDescription:
          directory.privacyDescription ??
          "Profiles stay hidden until attendees opt in for networking for this event.",
        emptyStateMessage:
          directory.emptyStateMessage ??
          "No attendee profiles are visible yet. Check back once more guests opt in.",
      },
    },
    sponsors: {
      introText:
        sponsors.introText ??
        "Meet featured sponsors and exhibitors driving the event experience.",
      featuredProfiles: Array.isArray(sponsors.featuredProfiles)
        ? (sponsors.featuredProfiles as SponsorProfile[])
        : [],
    },
    announcements: Array.isArray(app.announcements) ? (app.announcements as EventAnnouncement[]) : [],
    sessionDetails:
      app.sessionDetails && typeof app.sessionDetails === "object" ? app.sessionDetails : {},
    push: {
      reminderLeadMinutes:
        typeof app.push?.reminderLeadMinutes === "number" ? app.push.reminderLeadMinutes : 15,
    },
  };
}

function mergeEventAppSettings(existingSettings: unknown, nextApp: EventAppSettings) {
  const current = (existingSettings && typeof existingSettings === "object"
    ? existingSettings
    : {}) as Record<string, any>;
  return {
    ...current,
    eventApp: nextApp,
  };
}

function extractEventAppMeta(raw: unknown) {
  const metadata = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const app = (metadata.eventApp ?? {}) as Record<string, any>;
  return {
    raw: metadata,
    app,
    pushDevices: Array.isArray(app.pushDevices) ? (app.pushDevices as ExpoPushRegistration[]) : [],
    networking: {
      requests: Array.isArray(app.networking?.requests)
        ? (app.networking.requests as NetworkingRequestRecord[])
        : [],
      meetings: Array.isArray(app.networking?.meetings)
        ? (app.networking.meetings as MeetingRecord[])
        : [],
    },
    chat: {
      threads: Array.isArray(app.chat?.threads) ? (app.chat.threads as ChatThreadRecord[]) : [],
      messages: Array.isArray(app.chat?.messages) ? (app.chat.messages as ChatMessageRecord[]) : [],
    },
    analytics: {
      sessionViews:
        app.analytics?.sessionViews && typeof app.analytics.sessionViews === "object"
          ? (app.analytics.sessionViews as Record<string, number>)
          : {},
      sessionSaves:
        app.analytics?.sessionSaves && typeof app.analytics.sessionSaves === "object"
          ? (app.analytics.sessionSaves as Record<string, number>)
          : {},
      sessionPlans:
        app.analytics?.sessionPlans && typeof app.analytics.sessionPlans === "object"
          ? (app.analytics.sessionPlans as Record<string, number>)
          : {},
      liveOpens:
        app.analytics?.liveOpens && typeof app.analytics.liveOpens === "object"
          ? (app.analytics.liveOpens as Record<string, number>)
          : {},
      chatStarts:
        app.analytics?.chatStarts && typeof app.analytics.chatStarts === "object"
          ? (app.analytics.chatStarts as Record<string, number>)
          : {},
      sponsorClicks:
        app.analytics?.sponsorClicks && typeof app.analytics.sponsorClicks === "object"
          ? (app.analytics.sponsorClicks as Record<string, number>)
          : {},
    },
  };
}

function buildEventAppMetadata(
  existingMetadata: unknown,
  appPatch: {
    pushDevices?: ExpoPushRegistration[];
    requests?: NetworkingRequestRecord[];
    meetings?: MeetingRecord[];
    chatThreads?: ChatThreadRecord[];
    chatMessages?: ChatMessageRecord[];
    analytics?: Record<string, Record<string, number>>;
  }
) {
  const meta = extractEventAppMeta(existingMetadata);
  return {
    ...meta.raw,
    eventApp: {
      ...meta.app,
      pushDevices: appPatch.pushDevices ?? meta.pushDevices,
      networking: {
        requests: appPatch.requests ?? meta.networking.requests,
        meetings: appPatch.meetings ?? meta.networking.meetings,
      },
      chat: {
        threads: appPatch.chatThreads ?? meta.chat.threads,
        messages: appPatch.chatMessages ?? meta.chat.messages,
      },
      analytics: {
        sessionViews: appPatch.analytics?.sessionViews ?? meta.analytics.sessionViews,
        sessionSaves: appPatch.analytics?.sessionSaves ?? meta.analytics.sessionSaves,
        sessionPlans: appPatch.analytics?.sessionPlans ?? meta.analytics.sessionPlans,
        liveOpens: appPatch.analytics?.liveOpens ?? meta.analytics.liveOpens,
        chatStarts: appPatch.analytics?.chatStarts ?? meta.analytics.chatStarts,
        sponsorClicks: appPatch.analytics?.sponsorClicks ?? meta.analytics.sponsorClicks,
      },
    },
  };
}

function normalizeNetworkingProfile(raw: unknown): AttendeeNetworkingProfile {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  return {
    optedIn: Boolean(data.optedIn),
    visible: Boolean(data.visible),
    headline: typeof data.headline === "string" ? data.headline : "",
    company: typeof data.company === "string" ? data.company : "",
    role: typeof data.role === "string" ? data.role : "",
    bio: typeof data.bio === "string" ? data.bio : "",
    profileImageUrl: typeof data.profileImageUrl === "string" ? data.profileImageUrl : "",
    interests: Array.isArray(data.interests) ? data.interests.filter(Boolean) : [],
    goals: Array.isArray(data.goals) ? data.goals.filter(Boolean) : [],
    industries: Array.isArray(data.industries) ? data.industries.filter(Boolean) : [],
    availability: typeof data.availability === "string" ? data.availability : "",
    contactSharing: {
      email: data.contactSharing?.email !== false,
      phone: Boolean(data.contactSharing?.phone),
    },
    savedSessionIds: Array.isArray(data.savedSessionIds) ? data.savedSessionIds.filter(Boolean) : [],
    plannedSessionIds: Array.isArray(data.plannedSessionIds) ? data.plannedSessionIds.filter(Boolean) : [],
  };
}

function buildGuestCustomData(currentCustomData: unknown, profile: AttendeeNetworkingProfile) {
  const current = (currentCustomData && typeof currentCustomData === "object"
    ? currentCustomData
    : {}) as Record<string, any>;
  return {
    ...current,
    eventApp: {
      ...(current.eventApp ?? {}),
      networkingProfile: profile,
    },
  };
}

function getGuestProfile(guest: GuestRow) {
  return normalizeNetworkingProfile(guest.custom_data?.eventApp?.networkingProfile);
}

function getGuestDisplayName(guest: GuestRow) {
  return `${guest.first_name ?? ""} ${guest.last_name ?? ""}`.trim() || "Attendee";
}

function normalizeSponsorProfiles(raw: SponsorProfile[] | undefined) {
  return (raw ?? []).map((profile) => ({
    kind: "sponsor" as const,
    boost: 3,
    tags: [],
    ...profile,
  }));
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function toSessionRecord(
  row: EventSessionRow,
  settings: EventAppSettings,
  analytics: ReturnType<typeof extractEventAppMeta>["analytics"]
): EventSessionRecord {
  const extra = settings.sessionDetails?.[row.id] ?? {};
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title ?? "Untitled Session",
    description: extra.description ?? "",
    speaker: extra.speaker ?? "",
    speakerTitle: extra.speakerTitle ?? "",
    speakerCompany: extra.speakerCompany ?? "",
    speakerAvatarUrl: extra.speakerAvatarUrl ?? "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    capacity: row.capacity,
    tags: Array.isArray(extra.tags) ? extra.tags.filter(Boolean) : [],
    status: (extra.status as EventSessionStatus) ?? "upcoming",
    liveStreamUrl: extra.liveStreamUrl ?? "",
    liveStreamLabel: extra.liveStreamLabel ?? "",
    liveNow: Boolean(extra.liveNow),
    sortOrder: row.sort_order ?? 0,
    viewCount: analytics.sessionViews[row.id] ?? 0,
    saveCount: analytics.sessionSaves[row.id] ?? 0,
    planCount: analytics.sessionPlans[row.id] ?? 0,
    liveOpenCount: analytics.liveOpens[row.id] ?? 0,
  };
}

async function getEventById(eventId: string, companyId?: string | null) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("events")
    .select("id,company_id,title,description,short_description,cover_image_url,starts_at,ends_at,visitor_code,settings,metadata,venue_id")
    .eq("id", eventId);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as EventRow | null) ?? null;
}

export async function getEventExperience(eventId: string, companyId?: string | null) {
  const supabase = createSupabaseAdminClient();
  const event = await getEventById(eventId, companyId);
  if (!event) throw new Error("Event not found");

  const settings = normalizeEventAppSettings(event.settings);
  const meta = extractEventAppMeta(event.metadata);

  const { data: sessionRows, error: sessionsError } = await supabase
    .from("event_sessions")
    .select("id,event_id,title,starts_at,ends_at,location,capacity,sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (sessionsError) throw new Error(sessionsError.message);

  const { data: guestsData, error: guestsError } = await supabase
    .from("guests")
    .select("id,event_id,first_name,last_name,email,phone,guest_type,tags,custom_data,rsvp_status,attendance_state,created_at")
    .eq("event_id", eventId);

  if (guestsError) throw new Error(guestsError.message);

  const guests = (guestsData ?? []) as GuestRow[];
  let optedInCount = 0;
  for (const guest of guests) {
    if (getGuestProfile(guest).optedIn) optedInCount += 1;
  }

  const sessions = ((sessionRows ?? []) as EventSessionRow[]).map((row) =>
    toSessionRecord(row, settings, meta.analytics)
  );

  return {
    event,
    settings,
    sessions,
    networkingSummary: {
      optedInCount,
      requestCount: meta.networking.requests.length,
      meetingCount: meta.networking.meetings.length,
    },
  };
}

export async function updateEventExperienceSettings(
  eventId: string,
  companyId: string,
  nextSettings: EventAppSettings
) {
  const supabase = createSupabaseAdminClient();
  const event = await getEventById(eventId, companyId);
  if (!event) throw new Error("Event not found");

  const { data, error } = await supabase
    .from("events")
    .update({
      settings: mergeEventAppSettings(event.settings, nextSettings),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("company_id", companyId)
    .select("settings")
    .single();

  if (error) throw new Error(error.message);
  return normalizeEventAppSettings((data as { settings: unknown }).settings);
}

export async function upsertEventSession(
  eventId: string,
  companyId: string,
  input: Omit<EventSessionRecord, "eventId" | "viewCount" | "saveCount" | "planCount" | "liveOpenCount">
) {
  const supabase = createSupabaseAdminClient();
  const experience = await getEventExperience(eventId, companyId);
  const sessionId = input.id || crypto.randomUUID();
  const payload = {
    id: sessionId,
    event_id: eventId,
    title: input.title,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    location: input.location ?? null,
    capacity: input.capacity ?? null,
    sort_order: input.sortOrder ?? 0,
  };

  const existingSession = experience.sessions.find((session) => session.id === sessionId);
  let sessionRow: EventSessionRow;
  if (existingSession) {
    const { data, error } = await supabase
      .from("event_sessions")
      .update(payload)
      .eq("id", sessionId)
      .eq("event_id", eventId)
      .select("id,event_id,title,starts_at,ends_at,location,capacity,sort_order")
      .single();
    if (error) throw new Error(error.message);
    sessionRow = data as EventSessionRow;
  } else {
    const { data, error } = await supabase
      .from("event_sessions")
      .insert(payload)
      .select("id,event_id,title,starts_at,ends_at,location,capacity,sort_order")
      .single();
    if (error) throw new Error(error.message);
    sessionRow = data as EventSessionRow;
  }

  const nextSettings = normalizeEventAppSettings(experience.event.settings);
  nextSettings.sessionDetails = {
    ...(nextSettings.sessionDetails ?? {}),
    [sessionId]: {
      description: input.description ?? "",
      speaker: input.speaker ?? "",
      speakerTitle: input.speakerTitle ?? "",
      speakerCompany: input.speakerCompany ?? "",
      speakerAvatarUrl: input.speakerAvatarUrl ?? "",
      tags: input.tags ?? [],
      status: input.status ?? "upcoming",
      liveStreamUrl: input.liveStreamUrl ?? "",
      liveStreamLabel: input.liveStreamLabel ?? "",
      liveNow: Boolean(input.liveNow),
    },
  };

  await updateEventExperienceSettings(eventId, companyId, nextSettings);
  return toSessionRecord(sessionRow, nextSettings, extractEventAppMeta(experience.event.metadata).analytics);
}

export async function deleteEventSession(eventId: string, companyId: string, sessionId: string) {
  const supabase = createSupabaseAdminClient();
  const experience = await getEventExperience(eventId, companyId);

  const { error } = await supabase
    .from("event_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  const nextSettings = normalizeEventAppSettings(experience.event.settings);
  if (nextSettings.sessionDetails?.[sessionId]) {
    delete nextSettings.sessionDetails[sessionId];
    await updateEventExperienceSettings(eventId, companyId, nextSettings);
  }

  return { success: true };
}

export async function getVisitorGuestContext(token: string, eventId?: string | null) {
  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) {
    throw new Error("Invalid or expired token");
  }

  const email = userData.user.email;
  let query = supabase
    .from("guests")
    .select("id,event_id,first_name,last_name,email,phone,guest_type,tags,custom_data,rsvp_status,attendance_state,created_at")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data: guestRows, error: guestError } = await query;
  if (guestError) throw new Error(guestError.message);
  const guest = ((guestRows ?? []) as GuestRow[])[0] ?? null;
  if (!guest) throw new Error("Guest profile not found for this attendee");

  const event = await getEventById(guest.event_id);
  if (!event) throw new Error("Event not found");

  return {
    email,
    authUser: userData.user,
    guest,
    event,
    settings: normalizeEventAppSettings(event.settings),
    meta: extractEventAppMeta(event.metadata),
  };
}

export async function updateVisitorNetworkingProfile(
  token: string,
  eventId: string,
  patch: Partial<AttendeeNetworkingProfile>
) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const current = getGuestProfile(ctx.guest);
  const next: AttendeeNetworkingProfile = {
    ...current,
    ...patch,
    contactSharing: {
      ...current.contactSharing,
      ...(patch.contactSharing ?? {}),
    },
    interests: patch.interests ?? current.interests,
    goals: patch.goals ?? current.goals,
    industries: patch.industries ?? current.industries,
    savedSessionIds: patch.savedSessionIds ?? current.savedSessionIds,
    plannedSessionIds: patch.plannedSessionIds ?? current.plannedSessionIds,
  };

  const { data, error } = await supabase
    .from("guests")
    .update({
      custom_data: buildGuestCustomData(ctx.guest.custom_data, next),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.guest.id)
    .select("id,event_id,first_name,last_name,email,phone,guest_type,tags,custom_data,rsvp_status,attendance_state,created_at")
    .single();

  if (error) throw new Error(error.message);
  return getGuestProfile(data as GuestRow);
}

function scoreRecommendation(
  viewer: AttendeeNetworkingProfile,
  candidate: AttendeeNetworkingProfile,
  guest: GuestRow
) {
  let score = 0;
  const reasons: string[] = [];

  const sharedInterests = viewer.interests.filter((item) => candidate.interests.includes(item));
  if (sharedInterests.length) {
    score += sharedInterests.length * 3;
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(", ")}`);
  }

  const sharedGoals = viewer.goals.filter((item) => candidate.goals.includes(item));
  if (sharedGoals.length) {
    score += sharedGoals.length * 4;
    reasons.push(`Aligned goals: ${sharedGoals.slice(0, 2).join(", ")}`);
  }

  const sharedIndustries = viewer.industries.filter((item) => candidate.industries.includes(item));
  if (sharedIndustries.length) {
    score += sharedIndustries.length * 2;
    reasons.push(`Shared industries: ${sharedIndustries.slice(0, 2).join(", ")}`);
  }

  if (viewer.company && candidate.company && viewer.company !== candidate.company) {
    score += 1;
    reasons.push("Cross-company connection");
  }

  if (guest.guest_type && guest.guest_type.toLowerCase().includes("vip")) {
    score += 1;
  }

  return { score, reasons };
}

export async function getVisitorNetworkingData(token: string, eventId: string) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const viewerProfile = getGuestProfile(ctx.guest);

  const { data: guestsData, error: guestsError } = await supabase
    .from("guests")
    .select("id,event_id,first_name,last_name,email,phone,guest_type,tags,custom_data,rsvp_status,attendance_state,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (guestsError) throw new Error(guestsError.message);
  const guests = (guestsData ?? []) as GuestRow[];

  const directory = guests
    .filter((guest) => guest.id !== ctx.guest.id)
    .map((guest) => {
      const profile = getGuestProfile(guest);
      if (!profile.optedIn || !profile.visible) return null;
      const scored = scoreRecommendation(viewerProfile, profile, guest);
      return {
        guestId: guest.id,
        name: `${guest.first_name ?? ""} ${guest.last_name ?? ""}`.trim() || "Attendee",
        headline: profile.headline,
        company: profile.company,
        role: profile.role,
        bio: profile.bio,
        profileImageUrl: profile.profileImageUrl,
        interests: profile.interests,
        goals: profile.goals,
        industries: profile.industries,
        score: scored.score,
        reasons: scored.reasons,
        isSponsor: false,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score);

  const featuredSponsors = normalizeSponsorProfiles(ctx.settings.sponsors?.featuredProfiles).map((profile) => ({
    guestId: profile.guestId ?? profile.id,
    name: profile.name,
    headline: profile.headline,
    company: profile.company,
    role: profile.role,
    bio: profile.bio,
    profileImageUrl: profile.profileImageUrl,
    interests: dedupeStrings([...(profile.tags ?? [])]),
    goals: [],
    industries: [],
    score: 100 + (profile.boost ?? 0),
    reasons: [profile.kind === "exhibitor" ? "Featured exhibitor" : "Featured sponsor"],
    isSponsor: true,
    booth: profile.booth,
    ctaLabel: profile.ctaLabel,
    ctaUrl: profile.ctaUrl,
    kind: profile.kind,
  }));

  const recommendations = [...featuredSponsors, ...directory]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const requests = ctx.meta.networking.requests.filter(
    (request) => request.fromGuestId === ctx.guest.id || request.toGuestId === ctx.guest.id
  );
  const meetings = ctx.meta.networking.meetings.filter(
    (meeting) => meeting.hostGuestId === ctx.guest.id || meeting.guestGuestId === ctx.guest.id
  );

  return {
    viewerGuestId: ctx.guest.id,
    profile: viewerProfile,
    recommendations,
    directory,
    featuredSponsors,
    requests,
    meetings,
    taxonomy: ctx.settings.networking.taxonomy,
    introText: ctx.settings.networking.introText,
    privacyDescription: ctx.settings.networking.directory?.privacyDescription,
    directoryEmptyState: ctx.settings.networking.directory?.emptyStateMessage,
  };
}

export async function updateVisitorSessionState(
  token: string,
  eventId: string,
  sessionId: string,
  action: "save" | "unsave" | "plan" | "unplan" | "view" | "live_open"
) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const profile = getGuestProfile(ctx.guest);

  if (action === "save" && !profile.savedSessionIds.includes(sessionId)) {
    profile.savedSessionIds = [...profile.savedSessionIds, sessionId];
  }
  if (action === "unsave") {
    profile.savedSessionIds = profile.savedSessionIds.filter((id) => id !== sessionId);
  }
  if (action === "plan" && !profile.plannedSessionIds.includes(sessionId)) {
    profile.plannedSessionIds = [...profile.plannedSessionIds, sessionId];
  }
  if (action === "unplan") {
    profile.plannedSessionIds = profile.plannedSessionIds.filter((id) => id !== sessionId);
  }

  if (["save", "unsave", "plan", "unplan"].includes(action)) {
    await updateVisitorNetworkingProfile(token, eventId, {
      savedSessionIds: profile.savedSessionIds,
      plannedSessionIds: profile.plannedSessionIds,
    });
  }

  const nextAnalytics = {
    ...ctx.meta.analytics,
    sessionViews: { ...ctx.meta.analytics.sessionViews },
    sessionSaves: { ...ctx.meta.analytics.sessionSaves },
    sessionPlans: { ...ctx.meta.analytics.sessionPlans },
    liveOpens: { ...ctx.meta.analytics.liveOpens },
  };

  if (action === "view") {
    nextAnalytics.sessionViews[sessionId] = (nextAnalytics.sessionViews[sessionId] ?? 0) + 1;
  }
  if (action === "save") {
    nextAnalytics.sessionSaves[sessionId] = (nextAnalytics.sessionSaves[sessionId] ?? 0) + 1;
  }
  if (action === "plan") {
    nextAnalytics.sessionPlans[sessionId] = (nextAnalytics.sessionPlans[sessionId] ?? 0) + 1;
  }
  if (action === "live_open") {
    nextAnalytics.liveOpens[sessionId] = (nextAnalytics.liveOpens[sessionId] ?? 0) + 1;
  }

  const { error } = await supabase
    .from("events")
    .update({
      metadata: buildEventAppMetadata(ctx.event.metadata, {
        analytics: nextAnalytics,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  return {
    savedSessionIds: profile.savedSessionIds,
    plannedSessionIds: profile.plannedSessionIds,
  };
}

export async function registerVisitorPushToken(
  token: string,
  eventId: string,
  pushToken: string,
  platform: string
) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);

  const deduped = ctx.meta.pushDevices.filter((item) => item.token !== pushToken);
  deduped.push({
    email: ctx.email,
    token: pushToken,
    platform,
    eventId,
    updatedAt: new Date().toISOString(),
  });

  const { error } = await supabase
    .from("events")
    .update({
      metadata: buildEventAppMetadata(ctx.event.metadata, {
        pushDevices: deduped,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function createNetworkingRequest(
  token: string,
  eventId: string,
  targetGuestId: string,
  message?: string
) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const now = new Date().toISOString();
  const request: NetworkingRequestRecord = {
    id: crypto.randomUUID(),
    fromGuestId: ctx.guest.id,
    toGuestId: targetGuestId,
    status: "pending",
    message,
    createdAt: now,
    updatedAt: now,
  };

  const requests = [...ctx.meta.networking.requests, request];
  const { error } = await supabase
    .from("events")
    .update({
      metadata: buildEventAppMetadata(ctx.event.metadata, {
        requests,
      }),
      updated_at: now,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  return request;
}

export async function respondToNetworkingRequest(
  token: string,
  eventId: string,
  requestId: string,
  status: "accepted" | "declined",
  scheduledFor?: string,
  location?: string,
  notes?: string
) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const now = new Date().toISOString();
  const requests = ctx.meta.networking.requests.map((request) =>
    request.id === requestId ? { ...request, status, updatedAt: now } : request
  );
  const target = requests.find((request) => request.id === requestId);
  if (!target) throw new Error("Request not found");

  const meetings =
    status === "accepted"
      ? [
          ...ctx.meta.networking.meetings,
          {
            id: crypto.randomUUID(),
            requestId,
            hostGuestId: target.fromGuestId,
            guestGuestId: target.toGuestId,
            status: "accepted" as const,
            scheduledFor,
            location,
            notes,
            createdAt: now,
            updatedAt: now,
          },
        ]
      : ctx.meta.networking.meetings;

  const { error } = await supabase
    .from("events")
    .update({
      metadata: buildEventAppMetadata(ctx.event.metadata, {
        requests,
        meetings,
      }),
      updated_at: now,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  return { success: true };
}

function canGuestsChat(
  guestId: string,
  targetGuestId: string,
  requests: NetworkingRequestRecord[],
  meetings: MeetingRecord[]
) {
  const hasAcceptedRequest = requests.some(
    (request) =>
      request.status === "accepted" &&
      ((request.fromGuestId === guestId && request.toGuestId === targetGuestId) ||
        (request.fromGuestId === targetGuestId && request.toGuestId === guestId))
  );

  const hasAcceptedMeeting = meetings.some(
    (meeting) =>
      meeting.status === "accepted" &&
      ((meeting.hostGuestId === guestId && meeting.guestGuestId === targetGuestId) ||
        (meeting.hostGuestId === targetGuestId && meeting.guestGuestId === guestId))
  );

  return hasAcceptedRequest || hasAcceptedMeeting;
}

export async function getVisitorChatData(token: string, eventId: string) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const { data: guestsData, error: guestsError } = await supabase
    .from("guests")
    .select("id,event_id,first_name,last_name,email,phone,guest_type,tags,custom_data,rsvp_status,attendance_state,created_at")
    .eq("event_id", eventId);

  if (guestsError) throw new Error(guestsError.message);
  const guests = (guestsData ?? []) as GuestRow[];
  const guestMap = new Map(guests.map((guest) => [guest.id, guest]));

  const threads = ctx.meta.chat.threads
    .filter((thread) => thread.participantGuestIds.includes(ctx.guest.id))
    .map((thread) => {
      const peerIds = thread.participantGuestIds.filter((id) => id !== ctx.guest.id);
      const peers = peerIds
        .map((id) => guestMap.get(id))
        .filter((guest): guest is GuestRow => Boolean(guest))
        .map((guest) => ({
          guestId: guest.id,
          name: getGuestDisplayName(guest),
          company: getGuestProfile(guest).company,
          role: getGuestProfile(guest).role,
        }));

      return {
        ...thread,
        peers,
        messages: ctx.meta.chat.messages
          .filter((message) => message.threadId === thread.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    })
    .sort((a, b) => (b.lastMessageAt ?? b.updatedAt).localeCompare(a.lastMessageAt ?? a.updatedAt));

  return {
    viewerGuestId: ctx.guest.id,
    threads,
  };
}

export async function sendVisitorChatMessage(
  token: string,
  eventId: string,
  body: string,
  options?: { threadId?: string; targetGuestId?: string }
) {
  const supabase = createSupabaseAdminClient();
  const ctx = await getVisitorGuestContext(token, eventId);
  const now = new Date().toISOString();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message body is required");

  let threads = [...ctx.meta.chat.threads];
  let messages = [...ctx.meta.chat.messages];
  let thread = options?.threadId ? threads.find((item) => item.id === options.threadId) : null;

  if (!thread) {
    if (!options?.targetGuestId) throw new Error("targetGuestId is required");
    if (
      !canGuestsChat(
        ctx.guest.id,
        options.targetGuestId,
        ctx.meta.networking.requests,
        ctx.meta.networking.meetings
      )
    ) {
      throw new Error("Attendee chat unlocks after a confirmed connection or meeting");
    }

    thread =
      threads.find(
        (item) =>
          item.participantGuestIds.length === 2 &&
          item.participantGuestIds.includes(ctx.guest.id) &&
          item.participantGuestIds.includes(options.targetGuestId as string)
      ) ?? null;

    if (!thread) {
      thread = {
        id: crypto.randomUUID(),
        eventId,
        participantGuestIds: [ctx.guest.id, options.targetGuestId],
        kind: "attendee",
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      };
      threads = [...threads, thread];
    }
  }

  if (!thread.participantGuestIds.includes(ctx.guest.id)) {
    throw new Error("You do not have access to this thread");
  }

  const message: ChatMessageRecord = {
    id: crypto.randomUUID(),
    threadId: thread.id,
    eventId,
    senderGuestId: ctx.guest.id,
    senderName: getGuestDisplayName(ctx.guest),
    body: trimmed,
    createdAt: now,
  };

  messages = [...messages, message];
  threads = threads.map((item) =>
    item.id === thread?.id ? { ...item, updatedAt: now, lastMessageAt: now } : item
  );

  const nextAnalytics = {
    ...ctx.meta.analytics,
    sessionViews: { ...ctx.meta.analytics.sessionViews },
    sessionSaves: { ...ctx.meta.analytics.sessionSaves },
    sessionPlans: { ...ctx.meta.analytics.sessionPlans },
    liveOpens: { ...ctx.meta.analytics.liveOpens },
    chatStarts: { ...ctx.meta.analytics.chatStarts },
    sponsorClicks: { ...ctx.meta.analytics.sponsorClicks },
  };

  nextAnalytics.chatStarts[thread.id] = (nextAnalytics.chatStarts[thread.id] ?? 0) + 1;

  const { error } = await supabase
    .from("events")
    .update({
      metadata: buildEventAppMetadata(ctx.event.metadata, {
        chatThreads: threads,
        chatMessages: messages,
        analytics: nextAnalytics,
      }),
      updated_at: now,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  const { data: guestsData, error: guestsError } = await supabase
    .from("guests")
    .select("id,event_id,first_name,last_name,email,phone,guest_type,tags,custom_data,rsvp_status,attendance_state,created_at")
    .eq("event_id", eventId);
  if (guestsError) throw new Error(guestsError.message);
  const guests = (guestsData ?? []) as GuestRow[];
  const guestMap = new Map(guests.map((guest) => [guest.id, guest]));

  const targetGuestId = thread.participantGuestIds.find((id) => id !== ctx.guest.id);
  const targetGuest = targetGuestId ? guestMap.get(targetGuestId) : null;
  if (targetGuest?.email) {
    await createEventNotifications({
      eventId,
      recipientEmail: targetGuest.email,
      title: `${getGuestDisplayName(ctx.guest)} sent you a message`,
      body: trimmed,
      type: "chat_message",
    });
  }

  return { threadId: thread.id, message };
}
