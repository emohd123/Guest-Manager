import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../index";
import {
  deleteEventSession,
  getEventExperience,
  updateEventExperienceSettings,
  upsertEventSession,
} from "@/server/services/event-app";

const eventFeatureFlagsSchema = z.object({
  networkingEnabled: z.boolean(),
  matchmakingEnabled: z.boolean(),
  liveStreamEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
  sessionTrackingEnabled: z.boolean(),
  attendeeChatEnabled: z.boolean(),
  directoryEnabled: z.boolean(),
  sponsorHighlightsEnabled: z.boolean(),
});

const sponsorProfileSchema = z.object({
  id: z.string(),
  guestId: z.string().optional(),
  name: z.string(),
  company: z.string().optional(),
  role: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  booth: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  kind: z.enum(["sponsor", "exhibitor", "partner"]).optional(),
  boost: z.number().optional(),
  tags: z.array(z.string()).optional(),
  profileImageUrl: z.string().optional(),
});

const sessionSchema = z.object({
  id: z.string().optional().default(""),
  title: z.string().min(1).max(255),
  description: z.string().optional().default(""),
  speaker: z.string().optional().default(""),
  speakerTitle: z.string().optional().default(""),
  speakerCompany: z.string().optional().default(""),
  speakerAvatarUrl: z.string().optional().default(""),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  capacity: z.number().int().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["upcoming", "live", "completed"]).default("upcoming"),
  liveStreamUrl: z.string().optional().default(""),
  liveStreamLabel: z.string().optional().default(""),
  liveNow: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const eventExperienceRouter = router({
  get: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getEventExperience(input.eventId, ctx.companyId);
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        settings: z.object({
          welcomeMessage: z.string().optional(),
          homeHeadline: z.string().optional(),
          features: eventFeatureFlagsSchema,
          liveStream: z.object({
            url: z.string().optional(),
            label: z.string().optional(),
            provider: z.string().optional(),
            isLive: z.boolean().optional(),
          }),
          networking: z.object({
            introText: z.string().optional(),
            taxonomy: z.object({
              interests: z.array(z.string()).default([]),
              goals: z.array(z.string()).default([]),
              industries: z.array(z.string()).default([]),
            }),
            directory: z
              .object({
                privacyDescription: z.string().optional(),
                emptyStateMessage: z.string().optional(),
              })
              .optional(),
          }),
          sponsors: z
            .object({
              introText: z.string().optional(),
              featuredProfiles: z.array(sponsorProfileSchema).default([]),
            })
            .optional(),
          announcements: z
            .array(
              z.object({
                id: z.string(),
                title: z.string(),
                body: z.string(),
                createdAt: z.string(),
              })
            )
            .default([]),
          push: z
            .object({
              reminderLeadMinutes: z.number().int().optional(),
            })
            .optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateEventExperienceSettings(input.eventId, ctx.companyId, input.settings as any);
    }),

  upsertSession: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        session: sessionSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return upsertEventSession(input.eventId, ctx.companyId, {
        eventId: input.eventId,
        ...input.session,
      } as any);
    }),

  deleteSession: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        sessionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return deleteEventSession(input.eventId, ctx.companyId, input.sessionId);
    }),

  publicSummary: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ input }) => {
      const experience = await getEventExperience(input.eventId);
      return {
        settings: experience.settings,
        sessions: experience.sessions,
        networkingSummary: experience.networkingSummary,
      };
    }),
});
