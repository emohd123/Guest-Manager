export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";

const blockSchema = z.object({
  name: z.string().min(1).max(80),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(5).max(100),
  height: z.number().min(5).max(100),
  rotation: z.number().min(-180).max(180),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  price: z.number().int().min(0),
  category: z.string().min(1).max(80),
  rowCount: z.number().int().min(1).max(26),
  seatsPerRow: z.number().int().min(1).max(100),
  confidence: z.number().min(0).max(1),
});
const proposalSchema = z.object({
  summary: z.string().max(500),
  stage: z
    .object({
      text: z.string().max(80),
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      width: z.number().min(5).max(100),
    })
    .nullable(),
  blocks: z.array(blockSchema).min(1).max(12),
  warnings: z.array(z.string().max(240)).max(10),
});

function fallbackProposal(rows: number, seats: number, reason: string) {
  const blockCount = Math.min(3, Math.max(1, Math.ceil(rows / 5)));
  return {
    mode: "assisted" as const,
    reason,
    proposal: {
      summary:
        "Deterministic editable proposal based on the requested grid dimensions.",
      stage: { text: "STAGE", x: 50, y: 8, width: 34 },
      warnings: [
        "No visual seat detection was used. Review every block and seat before saving.",
      ],
      blocks: Array.from({ length: blockCount }, (_, index) => ({
        name: `Suggested block ${index + 1}`,
        x: 20 + index * 30,
        y: 38,
        width: 24,
        height: 28,
        rotation: 0,
        color: ["#2563eb", "#7c3aed", "#dc2626"][index % 3],
        price: 20 + index * 15,
        category: ["Standard", "Premium", "Platinum"][index % 3],
        rowCount: Math.max(1, Math.ceil(rows / blockCount)),
        seatsPerRow: seats,
        confidence: 0,
      })),
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const appUser = await ensureAppUserForAuthUser(supabase, user);
    if (!appUser?.companyId)
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    const { eventId } = await params;
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("company_id", appUser.companyId)
      .maybeSingle();
    if (!event)
      return Response.json({ error: "Event not found" }, { status: 404 });
    const input = z
      .object({
        floorPlanUrl: z.string().url(),
        kind: z.enum(["image", "pdf"]),
        rows: z.number().int().min(1).max(26).default(8),
        seatsPerRow: z.number().int().min(1).max(100).default(12),
      })
      .parse(await request.json());
    if (input.kind === "pdf")
      return Response.json(
        fallbackProposal(
          input.rows,
          input.seatsPerRow,
          "PDF plans remain reference-only because reliable first-page rasterization is not configured.",
        ),
      );
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return Response.json(
        fallbackProposal(
          input.rows,
          input.seatsPerRow,
          "OPENAI_API_KEY is not configured; generated a deterministic editable proposal.",
        ),
      );
    const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    const blockProperties = {
      name: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      width: { type: "number" },
      height: { type: "number" },
      rotation: { type: "number" },
      color: { type: "string" },
      price: { type: "integer" },
      category: { type: "string" },
      rowCount: { type: "integer" },
      seatsPerRow: { type: "integer" },
      confidence: { type: "number" },
    };
    const jsonSchema = {
      type: "object",
      additionalProperties: false,
      required: ["summary", "stage", "blocks", "warnings"],
      properties: {
        summary: { type: "string" },
        stage: {
          anyOf: [
            { type: "null" },
            {
              type: "object",
              additionalProperties: false,
              required: ["text", "x", "y", "width"],
              properties: {
                text: { type: "string" },
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
              },
            },
          ],
        },
        warnings: { type: "array", items: { type: "string" } },
        blocks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: Object.keys(blockProperties),
            properties: blockProperties,
          },
        },
      },
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Inspect this venue floor-plan image. Suggest only clearly plausible rectangular seating blocks and a prominent stage label. Coordinates and sizes are percentages of the full uncropped image. Prefer three price tiers colored blue (#2563eb), purple (#7c3aed), and red (#dc2626). Do not claim exact seat detection; return blocks that an organizer must review.",
              },
              {
                type: "input_image",
                image_url: input.floorPlanUrl,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "hall_map_proposal",
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
    });
    if (!response.ok)
      return Response.json(
        fallbackProposal(
          input.rows,
          input.seatsPerRow,
          response.status === 429
            ? "OpenAI vision quota is unavailable (HTTP 429). Add billing/credits or use a key with available quota, then analyse again. Generated a deterministic editable proposal instead."
            : `Vision analysis failed (${response.status}); generated a deterministic editable proposal.`,
        ),
      );
    const payload = (await response.json()) as any;
    const text = (payload.output ?? [])
      .flatMap((item: any) => item.content ?? [])
      .find((item: any) => item.type === "output_text")?.text;
    const parsed = proposalSchema.safeParse(text ? JSON.parse(text) : null);
    if (!parsed.success)
      return Response.json(
        fallbackProposal(
          input.rows,
          input.seatsPerRow,
          "Vision output failed strict validation; generated a deterministic editable proposal.",
        ),
      );
    return Response.json({
      mode: "ai",
      model,
      reason:
        "AI-generated proposal. Organizer approval is required before it affects the saved plan.",
      proposal: parsed.data,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 400 },
    );
  }
}
