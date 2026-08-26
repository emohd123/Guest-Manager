import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PublicWebsiteScreen } from "./src/screens/PublicWebsiteScreen";
import { AppErrorBoundary } from "./src/ui/app-error-boundary";

/**
 * The Android application intentionally renders the same production web
 * experience as the browser. Keeping one customer surface prevents checkout,
 * ticket, dashboard, scanner, and permission flows from drifting between two
 * independent implementations.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "bottom"]}>
          <PublicWebsiteScreen session={null} onSignIn={() => undefined} onSignOut={() => undefined} />
        </SafeAreaView>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
