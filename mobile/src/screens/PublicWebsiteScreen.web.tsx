import React from "react";
import { StyleSheet, View } from "react-native";
import type { VisitorSession } from "../types";

const websiteUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim() || "http://localhost:3002/";

type PublicWebsiteScreenProps = {
  session: VisitorSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onStaff: () => void;
};

// WebView is native-only. The Expo web preview uses an iframe so it mirrors the
// same local iTicket website while Android continues to use the native WebView.
const Iframe = "iframe" as unknown as React.ComponentType<Record<string, unknown>>;

export function PublicWebsiteScreen(_props: PublicWebsiteScreenProps) {
  return (
    <View style={styles.root}>
      <Iframe
        title="iTicket"
        src={websiteUrl}
        style={styles.iframe}
        allow="clipboard-read; clipboard-write"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  iframe: {
    borderWidth: 0,
    width: "100%",
    height: "100%",
  },
});
