import type { PairingSession } from "../types";
import { secureSet, secureGet, secureDelete, migrateLegacyKey } from "./secureStorage";

const SESSION_KEY = "guest_manager_mobile_v2_session";

export async function saveSession(session: PairingSession) {
  await secureSet(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession() {
  await migrateLegacyKey(SESSION_KEY);
  const raw = await secureGet(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PairingSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await secureDelete(SESSION_KEY);
}
