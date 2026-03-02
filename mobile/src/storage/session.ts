import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PairingSession } from "../types";

const SESSION_KEY = "guest_manager_mobile_v2_session";

export async function saveSession(session: PairingSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PairingSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

