import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { sentEmails } from "../../db/schema/sent-emails";
import { eq, desc } from "drizzle-orm";

export const sentEmailsRouter = router({
  list: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(sentEmails)
        .where(eq(sentEmails.eventId, input.eventId))
        .orderBy(desc(sentEmails.createdAt))
        .limit(input.limit);
        
      return {
        emails: results
      };
    }),
});
