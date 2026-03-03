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
  ticketId: string;
  barcode: string;
  status: string;
  ticketType: string;
  event: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string | null;
    location: string | null;
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

export type VisitorEvent = {
  eventId: string;
  eventName: string;
  startsAt: string;
  ticketStatus: string;
  attendanceState: string | null;
};

export type VisitorNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  type: "info" | "warning" | "update";
};
