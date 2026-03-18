import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { Toaster } from "@/components/ui/sonner";
import { getAppUrlObject } from "@/lib/app-urls";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: getAppUrlObject(),
  title: {
    default: "Events Hub - Event Check-In & Ticketing Software",
    template: "%s | Events Hub",
  },
  description:
    "Event management software for guest check-in, ticket scanning, CRM, and online ticketing. Manage events of any size with real-time sync across unlimited devices.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
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
