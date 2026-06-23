import type { PairingSession } from "../types";
import {
  listQueuedMutations,
  removeQueuedMutation,
  bumpQueuedMutationAttempt,
} from "../storage/offlineQueue";
import { getApiBaseUrl } from "../config";
import { notifyUnauthorized } from "../api/mobileClient";

const baseUrl = getApiBaseUrl();

// A 5xx is transient (server hiccup) and worth retrying, but not forever —
// after this many attempts we drop the item to avoid an unbounded poison-pill
// loop. Deterministic 4xx client errors (validation, deleted event, conflict)
// are dropped on the first failure since retrying cannot succeed.
const MAX_SERVER_RETRIES = 5;

export async function replayQueue(session: PairingSession) {
  const queue = listQueuedMutations();
  for (const item of queue) {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${item.endpoint}`, {
        method: item.method,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(item.payload),
      });
    } catch {
      // Network error — we're offline or the host is unreachable. Keep this and
      // every following item in the queue and stop; the next interval retries
      // from the front, preserving order.
      return;
    }

    if (response.ok) {
      removeQueuedMutation(item.id);
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      // Token is invalid/expired — no item will ever succeed. Hand off to the
      // app to tear down the session, and stop replaying.
      notifyUnauthorized(response.status);
      return;
    }

    if (response.status >= 400 && response.status < 500) {
      // Non-retryable client error (poison pill): drop it so it can't block the
      // queue. The backend's idempotency dedup means a duplicate that already
      // succeeded also lands here and is correctly discarded.
      removeQueuedMutation(item.id);
      continue;
    }

    // 5xx — transient. Count the attempt and drop once we exceed the cap.
    const attempts = bumpQueuedMutationAttempt(item.id);
    if (attempts >= MAX_SERVER_RETRIES) {
      removeQueuedMutation(item.id);
    }
    // Either way, stop this pass so a struggling server isn't hammered with the
    // rest of the queue; the next interval continues from here.
    return;
  }
}
