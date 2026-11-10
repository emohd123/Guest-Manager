import { EXPO_TOKEN_PATTERN } from "@/lib/push-notifications";

type Message = {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};
type Ticket = {
  status: "ok" | "error";
  id?: string;
  details?: { error?: string };
};

/** Expo acknowledgement is acceptance for delivery, not proof of receipt. */
export async function sendExpoPush(messages: Message[]) {
  const unique = [
    ...new Map(
      messages
        .filter((item) => EXPO_TOKEN_PATTERN.test(item.to))
        .map((item) => [item.to, item]),
    ).values(),
  ];
  const invalidTokens: string[] = [];
  let accepted = 0;
  let failed = 0;
  for (let offset = 0; offset < unique.length; offset += 100) {
    const batch = unique.slice(offset, offset + 100);
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify(
          batch.map((message) => ({
            ...message,
            title: message.title.slice(0, 150),
            body: message.body.slice(0, 1500),
            sound: "default",
            channelId: "general",
          })),
        ),
      });
      if (!response.ok)
        throw new Error(`Push gateway returned ${response.status}`);
      const payload = (await response.json()) as { data?: Ticket[] };
      if (!Array.isArray(payload.data) || payload.data.length !== batch.length)
        throw new Error("Push gateway returned an incomplete acknowledgement");
      payload.data.forEach((ticket, index) => {
        if (ticket.status === "ok") accepted++;
        else {
          failed++;
          if (ticket.details?.error === "DeviceNotRegistered")
            invalidTokens.push(batch[index].to);
        }
      });
    } catch {
      failed += batch.length;
      // Do not log tokens, recipient names, or private announcement bodies.
      console.error("Notification delivery batch was not acknowledged", {
        count: batch.length,
      });
    }
  }
  return { accepted, failed, invalidTokens };
}
