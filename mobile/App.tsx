import React, { useEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PublicWebsiteScreen } from "./src/screens/PublicWebsiteScreen";
import { PrivateConferenceScreen } from "./src/screens/PrivateConferenceScreen";
import { AppErrorBoundary } from "./src/ui/app-error-boundary";
import type { PrivateConferenceSession } from "./src/types";
import {
  clearPrivateConferenceSession,
  loadPrivateConferenceSession,
  savePrivateConferenceSession,
} from "./src/storage/conferenceSession";

/**
 * Private conferences use a native, conference-focused experience. Public
 * iTicket browsing remains available from the access screen and stays on the
 * production web surface for checkout and ticketing.
 */
export default function App() {
  const [conferenceSession, setConferenceSession] = useState<PrivateConferenceSession | null>(null);
  const [ready, setReady] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);

  useEffect(() => {
    void loadPrivateConferenceSession().then(setConferenceSession).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!showWebsite) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowWebsite(false);
      return true;
    });
    return () => subscription.remove();
  }, [showWebsite]);

  async function handleAuthenticated(session: PrivateConferenceSession) {
    await savePrivateConferenceSession(session);
    setConferenceSession(session);
  }

  async function handleSignOut() {
    await clearPrivateConferenceSession();
    setConferenceSession(null);
    setShowWebsite(false);
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <SafeAreaView style={{ flex: 1, backgroundColor: showWebsite ? "#FFFFFF" : "#080B13" }} edges={["top", "bottom"]}>
          {!ready ? <View style={{ flex: 1, backgroundColor: "#080B13" }} /> : showWebsite ? (
            <PublicWebsiteScreen session={null} onSignIn={() => undefined} onSignOut={() => setShowWebsite(false)} />
          ) : (
            <PrivateConferenceScreen
              session={conferenceSession}
              onAuthenticated={handleAuthenticated}
              onSignOut={handleSignOut}
              onBrowseWebsite={() => setShowWebsite(true)}
            />
          )}
        </SafeAreaView>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
