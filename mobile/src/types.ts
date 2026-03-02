export type AuthMode = "staff" | "code_pin";

export type PairingSession = {
  token: string;
  eventId: string;
  companyId: string;
  deviceId: string;
  deviceName: string;
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

