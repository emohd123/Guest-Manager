export interface Guest {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  guestType: string | null;
  tableNumber: string | null;
  seatNumber: string | null;
  tags?: string[] | null;
  notes: string | null;
  source: string | null;
  rsvpStatus?: string | null;
  rsvpAt?: string | null;
  checkedInAt: string | null;
  createdAt: string;
  customData?: {
    position?: string;
    organization?: string;
    conferenceRole?: "guest" | "speaker" | "staff";
    accessUsername?: string;
    accessCode?: string;
    credentialsCreatedAt?: string;
  } | null;
  ticket?: {
    id: string;
    barcode: string;
    status: string | null;
    checkedIn: boolean;
  } | null;
}
