import QRCode from "qrcode";

/**
 * Generates a Base64 encoded Data URI of a QR code containing the input text.
 * @param text The string data to encode (e.g., ticket barcode URL or ID)
 * @returns A Promise resolving to a Data URI string (data:image/png;base64,...)
 */
export async function generateQRCodeDataUri(text: string): Promise<string> {
  try {
    // Generate QR code as a Data URI (Base64 PNG)
    const dataUri = await QRCode.toDataURL(text, {
      margin: 2,
      width: 256,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
    
    return dataUri;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code data URI");
  }
}
