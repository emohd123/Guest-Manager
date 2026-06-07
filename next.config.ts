import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the file-tracing root to THIS project. A stray lockfile in the user's
  // home dir was being auto-selected as the root, which can break server file
  // tracing on deploy. import.meta.dirname = this config's directory (Node 22+).
  outputFileTracingRoot: import.meta.dirname,
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
