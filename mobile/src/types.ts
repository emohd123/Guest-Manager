export type AuthMode = "staff" | "code_pin";

export type PairingSession = {
  token: string;
  eventId: string;
  companyId: string;
  deviceId: string;
  deviceName: string;
};

/** Session for an authenticated visitor/attendee */
export type VisitorSession = {
  /** Supabase access token */
  token: string;
  /** Supabase user ID */
  userId: string;
  email: string;
  name: string;
};

export type VisitorHomeData = {
  event: {
    id: string;
    title: string;
    description: string | null;
    shortDescription: string | null;
    coverImageUrl: string | null;
    startsAt: string;
    endsAt: string | null;
    visitorCode: string | null;
  };
  settings: {
    welcomeMessage?: string;
    homeHeadline?: string;
    liveStream?: {
      url?: string;
      label?: string;
      provider?: string;
      isLive?: boolean;
    };
    announcements?: Array<{
      id: string;
      title: string;
      body: string;
      createdAt: string;
    }>;
  };
  nextSession?: VisitorSessionItem | null;
  liveSession?: VisitorSessionItem | null;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
  }>;
  networking: {
    optedIn: boolean;
    visible: boolean;
    recommendationCount: number;
    pendingRequestCount: number;
    meetingsCount: number;
  };
  featuredSponsors?: VisitorSponsorProfile[];
  profile?: VisitorNetworkingProfile | null;
};

export type SummaryMetrics = {
  totalGuests: number;
  checkedIn: number;
  checkedOut: number;
  noShow: number;
  successfulScans: number;
  unsuccessfulScans: number;
  totalScans: number;
};

export type MobileGuest = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: string;
  attendanceState?: string | null;
  ticket?: {
    id: string;
    barcode: string;
    status: string;
    checkedIn: boolean | null;
  } | null;
};

export type QueueItem = {
  id: string;
  endpoint: string;
  method: "POST";
  payload: Record<string, unknown>;
  eventId: string;
  createdAt: string;
};

export type VisitorTicket = {
  guestId: string;
  ticketId: string;
  barcode: string;
  status: string;
  ticketType: string;
  rsvpStatus: string | null;
  rsvpAt: string | null;
  event: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string | null;
    location: string | null;
    visitorCode?: string | null;
  };
  agenda?: AgendaItem[] | null;
  agendaTitle?: string | null;
};

export type AgendaItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  speaker?: string;
};

export type VisitorSessionItem = {
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
  status: "upcoming" | "live" | "completed";
  liveStreamUrl?: string;
  liveStreamLabel?: string;
  liveNow?: boolean;
  sortOrder: number;
  viewCount?: number;
  saveCount?: number;
  planCount?: number;
  liveOpenCount?: number;
  isSaved?: boolean;
  isPlanned?: boolean;
};

export type VisitorEvent = {
  guestId: string;
  eventId: string;
  eventName: string;
  startsAt: string;
  ticketStatus: string;
  attendanceState: string | null;
  rsvpStatus: string | null;
  rsvpAt: string | null;
};

export type VisitorGuestListItem = {
  id: string;
  firstName: string;
  lastName: string | null;
  eventId: string;
  eventName: string | null;
  rsvpStatus: string | null;
  rsvpAt: string | null;
};

export type VisitorNotification = {
  id: string;
  eventId: string;
  eventName?: string | null;
  title: string;
  /** Body text from the DB */
  body?: string;
  /** Legacy field — same as body, kept for backwards compat */
  message?: string;
  createdAt: string;
  type:
    | "info"
    | "warning"
    | "update"
    | "event_update"
    | "agenda_update"
    | "message_reply"
    | "networking_request"
    | "networking_accept"
    | "meeting_update"
    | "session_reminder"
    | "live_stream"
    | "chat_message";
  isRead: boolean;
};

export type VisitorNetworkingProfile = {
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

export type VisitorNetworkingRecommendation = {
  guestId: string;
  name: string;
  headline?: string;
  company?: string;
  role?: string;
  bio?: string;
  profileImageUrl?: string;
  interests: string[];
  goals: string[];
  industries: string[];
  score: number;
  reasons: string[];
  isSponsor?: boolean;
  booth?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  kind?: "sponsor" | "exhibitor" | "partner";
};

export type VisitorSponsorProfile = {
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
  tags?: string[];
  profileImageUrl?: string;
};

export type VisitorNetworkingRequest = {
  id: string;
  fromGuestId: string;
  toGuestId: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
  createdAt: string;
  updatedAt: string;
};

export type VisitorMeeting = {
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

export type VisitorChatThread = {
  id: string;
  eventId: string;
  participantGuestIds: string[];
  kind: "attendee" | "meeting";
  linkedMeetingId?: string;
  linkedRequestId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  peers: Array<{
    guestId: string;
    name: string;
    company?: string;
    role?: string;
  }>;
  messages: VisitorChatMessage[];
};

export type VisitorChatMessage = {
  id: string;
  threadId: string;
  eventId: string;
  senderGuestId: string;
  senderName?: string;
  body: string;
  createdAt: string;
};
