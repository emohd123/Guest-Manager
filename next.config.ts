import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray lockfile in the user's home
  // dir made Next infer the wrong root for output file tracing; this silences
  // that warning and keeps standalone tracing correct.
  outputFileTracingRoot: path.join(__dirname),

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
