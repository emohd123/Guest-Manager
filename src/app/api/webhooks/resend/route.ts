import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { sentEmails } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
// import { Webhook } from "svix";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // To properly secure in production using Svix:
    // const headersList = req.headers;
    // const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
    // const event = wh.verify(JSON.stringify(payload), {
    //   "svix-id": headersList.get("svix-id")!,
    //   "svix-timestamp": headersList.get("svix-timestamp")!,
    //   "svix-signature": headersList.get("svix-signature")!,
    // });

    const { type, data } = payload;
    const resendId = data?.email_id;

    if (!resendId) {
      return NextResponse.json({ error: "No email ID" }, { status: 400 });
    }

    const db = getDb();

    switch (type) {
      case "email.delivered":
        await db.update(sentEmails)
          .set({ state: "Delivered", updatedAt: new Date() })
          .where(eq(sentEmails.resendId, resendId));
        break;
      case "email.bounced":
        await db.update(sentEmails)
          .set({ 
            state: "Bounced", 
            reason: data.reason || "Bounced",
            updatedAt: new Date() 
          })
          .where(eq(sentEmails.resendId, resendId));
        break;
      case "email.opened":
        await db.update(sentEmails)
          .set({ 
            status: "Opened",
            openCount: sql`${sentEmails.openCount} + 1`,
            updatedAt: new Date() 
          })
          .where(eq(sentEmails.resendId, resendId));
        break;
      case "email.clicked":
        await db.update(sentEmails)
          .set({ 
            status: "Clicked",
            clickCount: sql`${sentEmails.clickCount} + 1`,
            updatedAt: new Date() 
          })
          .where(eq(sentEmails.resendId, resendId));
        break;
      case "email.complained":
        await db.update(sentEmails)
          .set({ 
            state: "Spam Complaint",
            updatedAt: new Date() 
          })
          .where(eq(sentEmails.resendId, resendId));
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Resend webhook error:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
