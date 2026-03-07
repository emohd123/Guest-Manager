import type { PairingSession } from "../types";
import { listQueuedMutations, removeQueuedMutation } from "../storage/offlineQueue";
import { getApiBaseUrl } from "../config";

const baseUrl = getApiBaseUrl();

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
