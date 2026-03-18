import { ThemeProvider } from "@/providers/theme-provider";

export const metadata = {
  title: "Check-in App | Events Hub",
  description: "Check in your guests quickly and securely.",
};

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We enforce light mode and a specific kiosk-like background here 
    // to keep the Checkin app distinct from the main dashboard.
    <html lang="en" suppressHydrationWarning className="light">
      <body className="font-sans antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <ThemeProvider>
          {/* Check-in specific content area */}
          <main className="h-screen w-full overflow-hidden flex flex-col">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
