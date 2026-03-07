import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const QR_OPTIONS = {
  margin: 2,
  width: 256,
  color: { dark: "#000000", light: "#ffffff" },
  errorCorrectionLevel: "H" as const,
};

/**
 * Generates a Base64 Data URI QR code. Use only for PDF generation —
 * email clients block data: URIs. For emails use generateAndUploadQRCode().
 */
export async function generateQRCodeDataUri(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, QR_OPTIONS);
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code data URI");
  }
}

/**
 * Generates a QR code PNG, uploads it to Supabase storage, and returns a
 * public HTTPS URL suitable for use in emails.
 * Falls back to a data URI if the upload fails.
 */
export async function generateAndUploadQRCode(barcode: string): Promise<string> {
  const buffer = await QRCode.toBuffer(barcode, QR_OPTIONS);

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const filePath = `qrcodes/${barcode}.png`;
    const { error } = await supabase.storage
      .from("events")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "86400",
      });

    if (error) throw error;

    const { data } = supabase.storage.from("events").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("[generateAndUploadQRCode] Upload failed, falling back to data URI:", err);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }
}
