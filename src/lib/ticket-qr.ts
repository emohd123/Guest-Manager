export type TicketQrPayload = {
  v: 1;
  ticket: string;
  expiresAt?: string;
};

export function createTicketQrPayload(ticket: string, expiresAt?: string | null) {
  return JSON.stringify({
    v: 1,
    ticket,
    ...(expiresAt ? { expiresAt } : {}),
  } satisfies TicketQrPayload);
}

export function parseTicketQrValue(value: string) {
  const raw = value.trim();
  if (!raw) return { ticket: "", expiresAt: undefined as string | undefined };

  try {
    const parsed = JSON.parse(raw) as Partial<TicketQrPayload>;
    if (parsed && parsed.v === 1 && typeof parsed.ticket === "string") {
      return {
        ticket: parsed.ticket.trim(),
        expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : undefined,
      };
    }
  } catch {
    // Legacy tickets encoded only the barcode. Keep accepting them.
  }

  return { ticket: raw, expiresAt: undefined as string | undefined };
}

export function isTicketExpired(expiresAt?: string | null, now = Date.now()) {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && now >= timestamp;
}
