import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { Toaster } from "@/components/ui/sonner";
import { getAppUrlObject } from "@/lib/app-urls";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: getAppUrlObject(),
  title: {
    default: "iTicket - Bahrain Events, Tickets & Managed Event Services",
    template: "%s | iTicket",
  },
  description:
    "Discover Bahrain events, buy tickets, manage QR passes, and work with iTicket for ticketing, check-in, staffing, and managed event operations.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

/** Light UI + a light browser chrome colour, so mobile browsers don't
 *  auto-darken the marketing pages. */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f7fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
