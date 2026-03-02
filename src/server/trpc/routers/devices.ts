import { z } from "zod";
import { router, protectedProcedure } from "../index";
import {
  archiveDevice,
  createPairingQrToken,
  createPingCommand,
  deleteDevice,
  getDeviceStats,
  getPairingAccess,
  listEventDevices,
  rotatePairingAccess,
  updateDeviceRecord,
} from "@/server/services/checkin";

export const devicesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const devices = await listEventDevices(ctx.db, input.eventId, ctx.companyId);
      const filtered = input.search?.trim()
        ? devices.filter((device) =>
            device.name.toLowerCase().includes(input.search!.trim().toLowerCase())
          )
        : devices;

      const paged = filtered.slice(input.offset, input.offset + input.limit);
      return {
        devices: paged,
        total: filtered.length,
      };
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getDeviceStats(ctx.db, input.eventId, ctx.companyId);
    }),

  getPairingAccess: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getPairingAccess(ctx.db, input.eventId, ctx.userId);
    }),

  rotatePairingAccess: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return rotatePairingAccess(ctx.db, input.eventId, ctx.userId);
    }),

  createPairingQrToken: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return createPairingQrToken(ctx.db, input.eventId, ctx.userId);
    }),

  update: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        deviceId: z.string(),
        patch: z.object({
          name: z.string().max(120).optional(),
          station: z.string().max(120).optional(),
          status: z.enum(["online", "offline"]).optional(),
          battery: z.number().min(0).max(100).optional(),
          scannerBattery: z.number().min(0).max(100).optional(),
          scannerChargeState: z.string().max(40).optional(),
          appVersion: z.string().max(40).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateDeviceRecord(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
        deviceId: input.deviceId,
        ...input.patch,
      });
    }),

  archive: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        deviceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return archiveDevice(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
        deviceId: input.deviceId,
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        deviceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return deleteDevice(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
        deviceId: input.deviceId,
      });
    }),

  ping: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        deviceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createPingCommand(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
        deviceId: input.deviceId,
      });
    }),
});

