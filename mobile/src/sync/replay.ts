import Constants from "expo-constants";
import type { PairingSession } from "../types";
import { listQueuedMutations, removeQueuedMutation } from "../storage/offlineQueue";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const baseUrl = extra.apiBaseUrl ?? "http://localhost:3000";

export async function replayQueue(session: PairingSession) {
  const queue = listQueuedMutations();
  for (const item of queue) {
    const response = await fetch(`${baseUrl}${item.endpoint}`, {
      method: item.method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(item.payload),
    });

    if (response.ok) {
      removeQueuedMutation(item.id);
    }
  }
}

