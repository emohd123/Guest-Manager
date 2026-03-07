import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavy server-only packages out of the client/edge bundle.
  // @react-pdf/renderer uses Node built-ins (fs, canvas, etc.) that can't run
  // in the browser, so Turbopack must treat them as external.
  serverExternalPackages: [
    "@react-pdf/renderer",
    "canvas",
    "pdfkit",
  ],
};

export default nextConfig;
