import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { VisitorSession } from "../types";

const deployedUrl = "https://events-hub-vert.vercel.app/";

function getWebsiteUrl() {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (configured) return configured.endsWith("/") ? configured : `${configured}/`;
  return __DEV__ ? "http://10.0.2.2:3002/" : deployedUrl;
}

type PublicWebsiteScreenProps = {
  session: VisitorSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onStaff: () => void;
};

export function PublicWebsiteScreen(_props: PublicWebsiteScreenProps) {
  const source = useMemo(() => ({ uri: getWebsiteUrl() }), []);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.root}>
      <WebView
        source={source}
        style={styles.webview}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#06B6D4" size="large" />
          <Text style={styles.loadingText}>Loading iTicket…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  webview: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  loadingText: { color: "#0E172F", fontWeight: "800" },
});
