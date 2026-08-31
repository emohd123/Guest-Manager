import type { PrivateConferenceSession } from "../types";
import { secureDelete, secureGet, secureSet } from "./secureStorage";

const KEY = "iticket.private-conference.session.v1";

export async function loadPrivateConferenceSession(): Promise<PrivateConferenceSession | null> {
  const raw = await secureGet(KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as PrivateConferenceSession;
    if (!session.token || !session.eventId || !session.guestId || !session.username || !session.expiresAt) throw new Error("Invalid session");
    if (new Date(session.expiresAt).getTime() <= Date.now()) throw new Error("Expired session");
    return session;
  } catch {
    await secureDelete(KEY);
    return null;
  }
}

export async function savePrivateConferenceSession(session: PrivateConferenceSession) {
  await secureSet(KEY, JSON.stringify(session));
}

export async function clearPrivateConferenceSession() {
  await secureDelete(KEY);
}
