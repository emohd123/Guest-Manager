import { and, desc, eq, gt, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import crypto from "crypto";
import { getDb } from "@/server/db";
import {
  checkIns,
  devices,
  events,
  guests,
  mobileMutationDedup,
  scans,
  ticketTypes,
  tickets,
} from "@/server/db/schema";

type Db = ReturnType<typeof getDb>;
type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type DbClient = Db | DbTx;

type Actor = {
  companyId: string;
  userId?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
};

type ScanWorkflowInput = {
  eventId: string;
  barcode: string;
  action?: "check_in" | "checkout";
  method?: "scan" | "search" | "manual" | "walkup";
  clientMutationId?: string;
  actor: Actor;
};

type ScanWorkflowResult = {
  status: "success" | "revalidated" | "invalid";
  result: string;
  ticketId: string | null;
  guestId: string | null;
  attendeeName: string | null;
  attendanceState: "not_arrived" | "checked_in" | "checked_out" | null;
  scanType: "check_in" | "checkout" | "invalid";
  scanId: string;
};

type WalkupResult = ScanWorkflowResult & {
  guest: typeof guests.$inferSelect;
  ticket: typeof tickets.$inferSelect;
};

function buildCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  };
  const body = rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n");
  return `${headers.join(",")}\n${body}\n`;
}

async function readDedup<T = unknown>(
  db: DbClient,
  input: { eventId: string; deviceId?: string | null; clientMutationId?: string }
) {
  if (!input.deviceId || !input.clientMutationId) return null;

  const [existing] = await db
    .select({
      responseHash: mobileMutationDedup.responseHash,
    })
    .from(mobileMutationDedup)
    .where(
      and(
        eq(mobileMutationDedup.eventId, input.eventId),
        eq(mobileMutationDedup.deviceId, input.deviceId),
        eq(mobileMutationDedup.clientMutationId, input.clientMutationId)
      )
    )
    .limit(1);

  if (!existing?.responseHash) return null;

  try {
    return JSON.parse(existing.responseHash) as T;
  } catch {
    return null;
  }
}

async function writeDedup(
  db: DbClient,
  input: {
    eventId: string;
    deviceId?: string | null;
    clientMutationId?: string;
    response: unknown;
  }
) {
  if (!input.deviceId || !input.clientMutationId) return;

  await db
    .insert(mobileMutationDedup)
    .values({
      eventId: input.eventId,
      deviceId: input.deviceId,
      clientMutationId: input.clientMutationId,
      responseHash: JSON.stringify(input.response),
    })
    .onConflictDoUpdate({
      target: [mobileMutationDedup.deviceId, mobileMutationDedup.clientMutationId],
      set: {
        responseHash: JSON.stringify(input.response),
      },
    });
}

async function writeScanLog(
  tx: DbClient,
  input: {
    actor: Actor;
    eventId: string;
    ticketId?: string | null;
    barcode?: string | null;
    scanType: "check_in" | "checkout" | "invalid";
    method: "scan" | "search" | "manual" | "walkup";
    result: string;
    notes?: string;
  }
) {
  const [scan] = await tx
    .insert(scans)
    .values({
      companyId: input.actor.companyId,
      eventId: input.eventId,
      ticketId: input.ticketId ?? undefined,
      deviceId: input.actor.deviceId ?? undefined,
      scannedBy: input.actor.userId ?? undefined,
      barcode: input.barcode ?? undefined,
      scanType: input.scanType,
      method: input.method,
      result: input.result,
      notes: input.notes,
      deviceInfo: {
        deviceId: input.actor.deviceId ?? null,
        deviceName: input.actor.deviceName ?? null,
      },
      scannedAt: new Date(),
    })
    .returning({ id: scans.id });

  return scan.id;
}

async function writeCheckinAudit(
  tx: DbClient,
  input: {
    actor: Actor;
    eventId: string;
    ticketId?: string | null;
    guestId?: string | null;
    barcode?: string | null;
    action: "check_in" | "check_out";
    method: "scan" | "search" | "manual" | "walkup";
    isDuplicate?: boolean;
    notes?: string;
  }
) {
  await tx.insert(checkIns).values({
    companyId: input.actor.companyId,
    eventId: input.eventId,
    ticketId: input.ticketId ?? undefined,
    guestId: input.guestId ?? undefined,
    deviceId: input.actor.deviceId ?? undefined,
    deviceName: input.actor.deviceName ?? undefined,
    action: input.action,
    method: input.method,
    scannedBarcode: input.barcode ?? undefined,
    isDuplicate: input.isDuplicate ?? false,
    notes: input.notes,
    performedBy: input.actor.userId ?? undefined,
    performedAt: new Date(),
  });
}

export async function processScanWorkflow(db: Db, input: ScanWorkflowInput): Promise<ScanWorkflowResult> {
  const dedup = await readDedup<ScanWorkflowResult>(db, {
    eventId: input.eventId,
    deviceId: input.actor.deviceId,
    clientMutationId: input.clientMutationId,
  });
  if (dedup) return dedup;

  const action = input.action ?? "check_in";
  const method = input.method ?? "scan";

  const response: ScanWorkflowResult = await db.transaction(
    async (tx): Promise<ScanWorkflowResult> => {
    const [ticket] = await tx
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.eventId, input.eventId),
          eq(tickets.companyId, input.actor.companyId),
          eq(tickets.barcode, input.barcode)
        )
      )
      .limit(1);

    if (!ticket) {
      const scanId = await writeScanLog(tx, {
        actor: input.actor,
        eventId: input.eventId,
        barcode: input.barcode,
        scanType: "invalid",
        method,
        result: "not_found",
      });

      return {
        status: "invalid" as const,
        result: "not_found",
        ticketId: null,
        guestId: null,
        attendeeName: null,
        attendanceState: null,
        scanType: "invalid" as const,
        scanId,
      };
    }

    if (ticket.status !== "valid" && ticket.status !== "used") {
      const scanId = await writeScanLog(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        barcode: input.barcode,
        scanType: "invalid",
        method,
        result: ticket.status === "voided" ? "voided" : "invalid_status",
      });

      return {
        status: "invalid" as const,
        result: ticket.status === "voided" ? "voided" : "invalid_status",
        ticketId: ticket.id,
        guestId: ticket.guestId ?? null,
        attendeeName: ticket.attendeeName ?? null,
        attendanceState: null,
        scanType: "invalid" as const,
        scanId,
      };
    }

    const [guest] = ticket.guestId
      ? await tx
          .select()
          .from(guests)
          .where(
            and(
              eq(guests.id, ticket.guestId),
              eq(guests.eventId, input.eventId),
              eq(guests.companyId, input.actor.companyId)
            )
          )
          .limit(1)
      : [];

    if (action === "checkout") {
      const alreadyCheckedOut = guest?.attendanceState === "checked_out";
      const notCheckedIn = !ticket.checkedIn && guest?.attendanceState !== "checked_in";

      if (alreadyCheckedOut || notCheckedIn) {
        const resultText = alreadyCheckedOut ? "revalidated" : "not_checked_in";
        const scanId = await writeScanLog(tx, {
          actor: input.actor,
          eventId: input.eventId,
          ticketId: ticket.id,
          barcode: ticket.barcode,
          scanType: "checkout",
          method,
          result: resultText,
        });

        await writeCheckinAudit(tx, {
          actor: input.actor,
          eventId: input.eventId,
          ticketId: ticket.id,
          guestId: guest?.id,
          barcode: ticket.barcode,
          action: "check_out",
          method,
          isDuplicate: true,
          notes: resultText,
        });

        return {
          status: resultText === "revalidated" ? ("revalidated" as const) : ("invalid" as const),
          result: resultText,
          ticketId: ticket.id,
          guestId: guest?.id ?? null,
          attendeeName: ticket.attendeeName ?? null,
          attendanceState:
            (guest?.attendanceState as ScanWorkflowResult["attendanceState"]) ?? null,
          scanType: "checkout" as const,
          scanId,
        };
      }

      await tx
        .update(tickets)
        .set({ checkedIn: false, updatedAt: new Date() })
        .where(eq(tickets.id, ticket.id));

      if (guest) {
        await tx
          .update(guests)
          .set({
            status: "confirmed",
            checkedOutAt: new Date(),
            attendanceState: "checked_out",
            updatedAt: new Date(),
          })
          .where(eq(guests.id, guest.id));
      }

      const scanId = await writeScanLog(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        barcode: ticket.barcode,
        scanType: "checkout",
        method,
        result: "checked_out",
      });

      await writeCheckinAudit(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        guestId: guest?.id,
        barcode: ticket.barcode,
        action: "check_out",
        method,
      });

      return {
        status: "success" as const,
        result: "checked_out",
        ticketId: ticket.id,
        guestId: guest?.id ?? null,
        attendeeName: ticket.attendeeName ?? null,
        attendanceState: guest ? ("checked_out" as const) : null,
        scanType: "checkout" as const,
        scanId,
      };
    }

    const isDuplicate = ticket.checkedIn || guest?.attendanceState === "checked_in";
    if (isDuplicate) {
      const scanId = await writeScanLog(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        barcode: ticket.barcode,
        scanType: "check_in",
        method,
        result: "revalidated",
      });

      await writeCheckinAudit(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        guestId: guest?.id,
        barcode: ticket.barcode,
        action: "check_in",
        method,
        isDuplicate: true,
        notes: "revalidated",
      });

      return {
        status: "revalidated" as const,
        result: "revalidated",
        ticketId: ticket.id,
        guestId: guest?.id ?? null,
        attendeeName: ticket.attendeeName ?? null,
        attendanceState: "checked_in" as const,
        scanType: "check_in" as const,
        scanId,
      };
    }

    await tx
      .update(tickets)
      .set({
        checkedIn: true,
        checkedInAt: new Date(),
        status: "used",
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id));

    if (guest) {
      await tx
        .update(guests)
        .set({
          status: "checked_in",
          checkedInAt: new Date(),
          checkedOutAt: null,
          attendanceState: "checked_in",
          updatedAt: new Date(),
        })
        .where(eq(guests.id, guest.id));
    }

    const scanId = await writeScanLog(tx, {
      actor: input.actor,
      eventId: input.eventId,
      ticketId: ticket.id,
      barcode: ticket.barcode,
      scanType: "check_in",
      method,
      result: "success",
    });

    await writeCheckinAudit(tx, {
      actor: input.actor,
      eventId: input.eventId,
      ticketId: ticket.id,
      guestId: guest?.id,
      barcode: ticket.barcode,
      action: "check_in",
      method,
    });

    return {
      status: "success" as const,
      result: "success",
      ticketId: ticket.id,
      guestId: guest?.id ?? null,
      attendeeName: ticket.attendeeName ?? null,
      attendanceState: guest ? ("checked_in" as const) : null,
      scanType: "check_in" as const,
      scanId,
    };
    }
  );

  await writeDedup(db, {
    eventId: input.eventId,
    deviceId: input.actor.deviceId,
    clientMutationId: input.clientMutationId,
    response,
  });

  return response;
}

type WalkupInput = {
  eventId: string;
  actor: Actor;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  guestType?: string;
  ticketTypeId?: string;
  checkInNow?: boolean;
  notes?: string;
  clientMutationId?: string;
};

async function resolveWalkupTicketType(
  tx: DbClient,
  input: { eventId: string; companyId: string; ticketTypeId?: string }
) {
  if (input.ticketTypeId) {
    const [selected] = await tx
      .select()
      .from(ticketTypes)
      .where(
        and(
          eq(ticketTypes.id, input.ticketTypeId),
          eq(ticketTypes.eventId, input.eventId),
          eq(ticketTypes.companyId, input.companyId)
        )
      )
      .limit(1);
    if (!selected) throw new Error("Ticket type not found");
    return selected;
  }

  const [active] = await tx
    .select()
    .from(ticketTypes)
    .where(
      and(
        eq(ticketTypes.eventId, input.eventId),
        eq(ticketTypes.companyId, input.companyId),
        eq(ticketTypes.status, "active")
      )
    )
    .orderBy(desc(ticketTypes.createdAt))
    .limit(1);

  if (active) return active;

  const [created] = await tx
    .insert(ticketTypes)
    .values({
      companyId: input.companyId,
      eventId: input.eventId,
      name: "General Admission",
      description: "Auto-created for walkups",
      status: "active",
      price: 0,
      currency: "USD",
    })
    .returning();

  return created;
}

function generateWalkupBarcode() {
  return `WKP-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function createWalkup(db: Db, input: WalkupInput) {
  const immediateCheckin = input.checkInNow ?? true;
  const dedup = await readDedup<WalkupResult>(db, {
    eventId: input.eventId,
    deviceId: input.actor.deviceId,
    clientMutationId: input.clientMutationId,
  });

  if (dedup) return dedup;

  const response = await db.transaction(async (tx) => {
    const ticketType = await resolveWalkupTicketType(tx, {
      eventId: input.eventId,
      companyId: input.actor.companyId,
      ticketTypeId: input.ticketTypeId,
    });

    const [guest] = await tx
      .insert(guests)
      .values({
        companyId: input.actor.companyId,
        eventId: input.eventId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        guestType: input.guestType ?? "Walkup",
        source: "walkup",
        status: immediateCheckin ? "checked_in" : "confirmed",
        checkedInAt: immediateCheckin ? new Date() : null,
        checkedOutAt: null,
        attendanceState: immediateCheckin ? "checked_in" : "not_arrived",
      })
      .returning();

    const [ticket] = await tx
      .insert(tickets)
      .values({
        companyId: input.actor.companyId,
        eventId: input.eventId,
        ticketTypeId: ticketType.id,
        guestId: guest.id,
        barcode: generateWalkupBarcode(),
        attendeeName: `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim(),
        attendeeEmail: guest.email,
        status: immediateCheckin ? "used" : "valid",
        checkedIn: immediateCheckin,
        checkedInAt: immediateCheckin ? new Date() : null,
      })
      .returning();

    let scanId = "";
    if (immediateCheckin) {
      scanId = await writeScanLog(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        barcode: ticket.barcode,
        scanType: "check_in",
        method: "walkup",
        result: "success",
      });

      await writeCheckinAudit(tx, {
        actor: input.actor,
        eventId: input.eventId,
        ticketId: ticket.id,
        guestId: guest.id,
        barcode: ticket.barcode,
        action: "check_in",
        method: "walkup",
      });
    }

    const base: WalkupResult = {
      status: "success" as const,
      result: immediateCheckin ? "success" : "created",
      ticketId: ticket.id,
      guestId: guest.id,
      attendeeName: ticket.attendeeName,
      attendanceState: guest.attendanceState as ScanWorkflowResult["attendanceState"],
      scanType: immediateCheckin ? ("check_in" as const) : ("invalid" as const),
      scanId,
      guest,
      ticket,
    };
    return base;
  });

  await writeDedup(db, {
    eventId: input.eventId,
    deviceId: input.actor.deviceId,
    clientMutationId: input.clientMutationId,
    response,
  });

  return response;
}

export async function getMobileBootstrap(db: Db, input: { eventId: string; companyId: string }) {
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      timezone: events.timezone,
      status: events.status,
    })
    .from(events)
    .where(and(eq(events.id, input.eventId), eq(events.companyId, input.companyId)))
    .limit(1);

  if (!event) throw new Error("Event not found");

  const summary = await getCheckinSummary(db, {
    eventId: input.eventId,
    companyId: input.companyId,
  });

  const latestScans = await db
    .select({
      id: scans.id,
      scanType: scans.scanType,
      result: scans.result,
      scannedAt: scans.scannedAt,
      barcode: scans.barcode,
    })
    .from(scans)
    .where(and(eq(scans.eventId, input.eventId), eq(scans.companyId, input.companyId)))
    .orderBy(desc(scans.scannedAt))
    .limit(20);

  const availableTicketTypes = await db
    .select({
      id: ticketTypes.id,
      name: ticketTypes.name,
      status: ticketTypes.status,
    })
    .from(ticketTypes)
    .where(and(eq(ticketTypes.eventId, input.eventId), eq(ticketTypes.companyId, input.companyId)))
    .orderBy(desc(ticketTypes.createdAt));

  return {
    event,
    summary,
    latestScans,
    ticketTypes: availableTicketTypes,
  };
}

export async function getIncrementalGuests(
  db: Db,
  input: {
    eventId: string;
    companyId: string;
    updatedSince?: Date;
    limit?: number;
  }
) {
  const filters = [eq(guests.eventId, input.eventId), eq(guests.companyId, input.companyId)];
  if (input.updatedSince) {
    filters.push(gt(guests.updatedAt, input.updatedSince));
  }

  const guestRows = await db
    .select()
    .from(guests)
    .where(and(...filters))
    .orderBy(desc(guests.updatedAt))
    .limit(input.limit ?? 1000);

  const guestIds = guestRows.map((item) => item.id);
  const ticketRows =
    guestIds.length > 0
      ? await db
          .select({
            id: tickets.id,
            guestId: tickets.guestId,
            barcode: tickets.barcode,
            status: tickets.status,
            checkedIn: tickets.checkedIn,
            checkedInAt: tickets.checkedInAt,
            ticketTypeId: tickets.ticketTypeId,
          })
          .from(tickets)
          .where(and(eq(tickets.eventId, input.eventId), inArray(tickets.guestId, guestIds)))
      : [];

  return guestRows.map((guest) => ({
    ...guest,
    ticket: ticketRows.find((ticket) => ticket.guestId === guest.id) ?? null,
  }));
}

export async function getArrivals(
  db: Db,
  input: {
    eventId: string;
    companyId: string;
    search?: string;
    action?: "check_in" | "checkout" | "invalid";
    limit?: number;
    offset?: number;
  }
) {
  const filters = [eq(scans.eventId, input.eventId), eq(scans.companyId, input.companyId)];
  if (input.action) {
    filters.push(eq(scans.scanType, input.action));
  }
  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    filters.push(
      or(
        ilike(scans.barcode, term),
        ilike(tickets.attendeeName, term),
        ilike(guests.firstName, term),
        ilike(guests.lastName, term)
      )!
    );
  }

  const rows = await db
    .select({
      id: scans.id,
      scannedAt: scans.scannedAt,
      scanType: scans.scanType,
      method: scans.method,
      barcode: scans.barcode,
      result: scans.result,
      eventId: scans.eventId,
      ticketId: scans.ticketId,
      attendeeName: tickets.attendeeName,
      attendeeEmail: tickets.attendeeEmail,
      guestFirstName: guests.firstName,
      guestLastName: guests.lastName,
      guestType: guests.guestType,
      deviceId: scans.deviceId,
      deviceName: devices.name,
      deviceInfo: scans.deviceInfo,
    })
    .from(scans)
    .leftJoin(tickets, eq(scans.ticketId, tickets.id))
    .leftJoin(guests, eq(tickets.guestId, guests.id))
    .leftJoin(devices, eq(scans.deviceId, devices.id))
    .where(and(...filters))
    .orderBy(desc(scans.scannedAt))
    .limit(input.limit ?? 100)
    .offset(input.offset ?? 0);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(scans)
    .leftJoin(tickets, eq(scans.ticketId, tickets.id))
    .leftJoin(guests, eq(tickets.guestId, guests.id))
    .where(and(...filters));

  return {
    scans: rows,
    total: Number(countRow?.count ?? 0),
  };
}

export async function getCheckinSummary(
  db: Db,
  input: { eventId: string; companyId: string }
) {
  const [guestCounts] = await db
    .select({
      totalGuests: sql<number>`count(*)`.mapWith(Number),
      checkedIn: sql<number>`count(*) filter (where ${guests.attendanceState} = 'checked_in')`.mapWith(Number),
      checkedOut: sql<number>`count(*) filter (where ${guests.attendanceState} = 'checked_out')`.mapWith(Number),
      noShow: sql<number>`count(*) filter (where ${guests.status} = 'no_show')`.mapWith(Number),
    })
    .from(guests)
    .where(and(eq(guests.eventId, input.eventId), eq(guests.companyId, input.companyId)));

  const [scanCounts] = await db
    .select({
      successfulScans: sql<number>`count(*) filter (where ${scans.scanType} <> 'invalid')`.mapWith(Number),
      unsuccessfulScans: sql<number>`count(*) filter (where ${scans.scanType} = 'invalid')`.mapWith(Number),
      totalScans: sql<number>`count(*)`.mapWith(Number),
    })
    .from(scans)
    .where(and(eq(scans.eventId, input.eventId), eq(scans.companyId, input.companyId)));

  const checkinsByTicketTypeRows = await db
    .select({
      id: ticketTypes.id,
      name: ticketTypes.name,
      checkedIn: sql<number>`count(${tickets.id}) filter (where ${guests.attendanceState} = 'checked_in')`.mapWith(Number),
      checkedOut: sql<number>`count(${tickets.id}) filter (where ${guests.attendanceState} = 'checked_out')`.mapWith(Number),
      noShow: sql<number>`count(${tickets.id}) filter (where ${guests.status} = 'no_show')`.mapWith(Number),
      total: sql<number>`count(${tickets.id})`.mapWith(Number),
    })
    .from(ticketTypes)
    .leftJoin(tickets, eq(ticketTypes.id, tickets.ticketTypeId))
    .leftJoin(guests, eq(tickets.guestId, guests.id))
    .where(and(eq(ticketTypes.eventId, input.eventId), eq(ticketTypes.companyId, input.companyId)))
    .groupBy(ticketTypes.id, ticketTypes.name)
    .orderBy(ticketTypes.name);

  const checkinsByTicketType = checkinsByTicketTypeRows.map(row => ({
    ...row,
    arrivedPct: row.total > 0 ? Math.round((row.checkedIn / row.total) * 100) : 0,
  }));

  const rawTimeSeries = await db.execute(sql`
    SELECT 
      date_trunc('hour', scanned_at) as "hour",
      count(*) filter (where scan_type <> 'invalid') as "success",
      count(*) filter (where scan_type = 'invalid') as "failure"
    FROM scans
    WHERE event_id = ${input.eventId} AND company_id = ${input.companyId}
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  const arrivalsTimeSeries = (rawTimeSeries as Record<string, unknown>[]).map((r) => ({
    hour: r.hour as string | null,
    success: Number(r.success || 0),
    failure: Number(r.failure || 0),
  }));

  return {
    totalGuests: Number(guestCounts?.totalGuests ?? 0),
    checkedIn: Number(guestCounts?.checkedIn ?? 0),
    checkedOut: Number(guestCounts?.checkedOut ?? 0),
    noShow: Number(guestCounts?.noShow ?? 0),
    successfulScans: Number(scanCounts?.successfulScans ?? 0),
    unsuccessfulScans: Number(scanCounts?.unsuccessfulScans ?? 0),
    totalScans: Number(scanCounts?.totalScans ?? 0),
    checkinsByTicketType,
    arrivalsTimeSeries,
  };
}

export async function exportCheckinsCsv(
  db: Db,
  input: { eventId: string; companyId: string }
) {
  const rows = await db
    .select({
      guestId: guests.id,
      firstName: guests.firstName,
      lastName: guests.lastName,
      email: guests.email,
      phone: guests.phone,
      attendanceState: guests.attendanceState,
      checkedInAt: guests.checkedInAt,
      checkedOutAt: guests.checkedOutAt,
      ticketBarcode: tickets.barcode,
      ticketStatus: tickets.status,
    })
    .from(guests)
    .leftJoin(tickets, eq(tickets.guestId, guests.id))
    .where(
      and(
        eq(guests.eventId, input.eventId),
        eq(guests.companyId, input.companyId),
        isNotNull(guests.checkedInAt)
      )
    )
    .orderBy(desc(guests.checkedInAt));

  return buildCsv(rows);
}

export async function exportNoShowsCsv(
  db: Db,
  input: { eventId: string; companyId: string }
) {
  const rows = await db
    .select({
      guestId: guests.id,
      firstName: guests.firstName,
      lastName: guests.lastName,
      email: guests.email,
      phone: guests.phone,
      guestStatus: guests.status,
      attendanceState: guests.attendanceState,
      ticketBarcode: tickets.barcode,
      ticketStatus: tickets.status,
    })
    .from(guests)
    .leftJoin(tickets, eq(tickets.guestId, guests.id))
    .where(
      and(
        eq(guests.eventId, input.eventId),
        eq(guests.companyId, input.companyId),
        eq(guests.status, "no_show")
      )
    )
    .orderBy(desc(guests.updatedAt));

  return buildCsv(rows);
}

export async function exportArrivalsCsv(
  db: Db,
  input: { eventId: string; companyId: string }
) {
  const rows = await db
    .select({
      scanId: scans.id,
      scannedAt: scans.scannedAt,
      scanType: scans.scanType,
      method: scans.method,
      result: scans.result,
      barcode: scans.barcode,
      attendeeName: tickets.attendeeName,
      attendeeEmail: tickets.attendeeEmail,
      guestFirstName: guests.firstName,
      guestLastName: guests.lastName,
      deviceName: devices.name,
    })
    .from(scans)
    .leftJoin(tickets, eq(scans.ticketId, tickets.id))
    .leftJoin(guests, eq(tickets.guestId, guests.id))
    .leftJoin(devices, eq(scans.deviceId, devices.id))
    .where(and(eq(scans.eventId, input.eventId), eq(scans.companyId, input.companyId)))
    .orderBy(desc(scans.scannedAt));

  return buildCsv(rows);
}
