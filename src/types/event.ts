export interface DesignSettings {
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
  publicPage?: {
    enabled?: boolean;
    isPaidEvent?: boolean;
    heroLabel?: string;
    headline?: string;
    subheadline?: string;
    venueName?: string;
    locationText?: string;
    ctaLabel?: string;
    highlights?: string[];
    showAgenda?: boolean;
    showSponsors?: boolean;
    showAppDownload?: boolean;
  };
}

export type EventFeatureFlags = {
  networkingEnabled: boolean;
  matchmakingEnabled: boolean;
  liveStreamEnabled: boolean;
  pushNotificationsEnabled: boolean;
  sessionTrackingEnabled: boolean;
  attendeeChatEnabled: boolean;
  directoryEnabled: boolean;
  sponsorHighlightsEnabled: boolean;
};

export type EventLiveStreamSettings = {
  url?: string;
  label?: string;
  provider?: string;
  isLive?: boolean;
};

export type EventAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type EventSessionStatus = "upcoming" | "live" | "completed";

export type EventSessionRecord = {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  speaker?: string;
  speakerTitle?: string;
  speakerCompany?: string;
  speakerAvatarUrl?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  capacity?: number | null;
  tags: string[];
  status: EventSessionStatus;
  liveStreamUrl?: string;
  liveStreamLabel?: string;
  liveNow?: boolean;
  sortOrder: number;
  viewCount?: number;
  saveCount?: number;
  planCount?: number;
  liveOpenCount?: number;
};

export type EventNetworkingTaxonomy = {
  interests: string[];
  goals: string[];
  industries: string[];
};

export type SponsorProfile = {
  id: string;
  guestId?: string;
  name: string;
  company?: string;
  role?: string;
  headline?: string;
  bio?: string;
  booth?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  kind?: "sponsor" | "exhibitor" | "partner";
  boost?: number;
  tags?: string[];
  profileImageUrl?: string;
};

export type EventDirectorySettings = {
  privacyDescription?: string;
  emptyStateMessage?: string;
};

export type EventAppSettings = {
  welcomeMessage?: string;
  homeHeadline?: string;
  features: EventFeatureFlags;
  liveStream: EventLiveStreamSettings;
  networking: {
    introText?: string;
    taxonomy: EventNetworkingTaxonomy;
    directory?: EventDirectorySettings;
  };
  sponsors?: {
    introText?: string;
    featuredProfiles: SponsorProfile[];
  };
  announcements: EventAnnouncement[];
  sessionDetails?: Record<string, Partial<EventSessionRecord>>;
  push?: {
    reminderLeadMinutes?: number;
  };
};

export type AttendeeNetworkingProfile = {
  optedIn: boolean;
  visible: boolean;
  headline?: string;
  company?: string;
  role?: string;
  bio?: string;
  profileImageUrl?: string;
  interests: string[];
  goals: string[];
  industries: string[];
  availability?: string;
  contactSharing: {
    email: boolean;
    phone: boolean;
  };
  savedSessionIds: string[];
  plannedSessionIds: string[];
};

export type EventChatThread = {
  id: string;
  eventId: string;
  participantGuestIds: string[];
  participantNames?: string[];
  kind: "attendee" | "meeting";
  linkedMeetingId?: string;
  linkedRequestId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
};

export type EventChatMessage = {
  id: string;
  threadId: string;
  eventId: string;
  senderGuestId: string;
  senderName?: string;
  body: string;
  createdAt: string;
};
