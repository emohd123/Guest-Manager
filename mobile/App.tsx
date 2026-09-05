import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PublicWebsiteScreen } from "./src/screens/PublicWebsiteScreen";
import { AppErrorBoundary } from "./src/ui/app-error-boundary";

/**
 * The Android application intentionally renders the production iTicket web
 * experience. This keeps public events, private conferences, ticket wallets,
 * dashboards and scanner fixes in lockstep with every website deployment.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "bottom"]}>
          <PublicWebsiteScreen
            session={null}
            onSignIn={() => undefined}
            onSignOut={() => undefined}
          />
        </SafeAreaView>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
