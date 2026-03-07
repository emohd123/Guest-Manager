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
}
