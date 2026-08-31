import { NextRequest, NextResponse } from "next/server";
import { addPrivateConferenceSpeakerResource } from "@/server/services/event-app";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { privateEventAccessCookie, readPrivateEventAccess } from "@/server/services/private-event-access";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const allowedTypes: Record<string, "PDF" | "PPTX" | "DOCX" | "XLSX" | "IMAGE"> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
};

export async function POST(request: NextRequest) {
  const access = readPrivateEventAccess(request.cookies.get(privateEventAccessCookie.name)?.value);
  if (!access || access.role !== "speaker" || !access.speakerName) {
    return NextResponse.json({ error: "Speaker access is required." }, { status: 401 });
  }
  try {
    const data = await request.formData();
    const file = data.get("file");
    const title = String(data.get("title") ?? "").trim();
    const sessionId = String(data.get("sessionId") ?? "").trim() || undefined;
    if (!(file instanceof File) || !title) return NextResponse.json({ error: "Add a title and file." }, { status: 400 });
    const fileType = allowedTypes[file.type];
    if (!fileType) return NextResponse.json({ error: "Upload a PDF, PowerPoint, Word, Excel, JPG, or PNG file." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `conference-resources/${access.eventId}/${crypto.randomUUID()}-${safeName}`;
    const supabase = createSupabaseAdminClient();
    const { error: uploadError } = await supabase.storage.from("events").upload(filePath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data: urlData } = supabase.storage.from("events").getPublicUrl(filePath);
    const resource = await addPrivateConferenceSpeakerResource({
      eventId: access.eventId,
      speakerName: access.speakerName,
      title,
      url: urlData.publicUrl,
      fileType,
      sessionId,
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not upload this resource." }, { status: 500 });
  }
}
