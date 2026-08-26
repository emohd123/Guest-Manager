import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import type { VisitorSession } from "../types";

const deployedUrl = "https://events-hub-vert.vercel.app/";

function getWebsiteUrl() {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (configured) return configured.endsWith("/") ? configured : `${configured}/`;
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const appUrl = typeof extra.appUrl === "string" ? extra.appUrl.trim() : "";
  // The installed app mirrors the customer website. For local Android testing,
  // set EXPO_PUBLIC_WEB_URL to a reachable LAN URL (or http://10.0.2.2:3002/ in
  // the Android emulator). The cache-busting marker prevents an old WebView
  // document from hiding newly published website changes.
  const base = appUrl || deployedUrl;
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}?mobile_app=1`;
}

type PublicWebsiteScreenProps = {
  session: VisitorSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function PublicWebsiteScreen({}: PublicWebsiteScreenProps) {
  const source = useMemo(() => ({ uri: getWebsiteUrl() }), []);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<React.ElementRef<typeof WebView>>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  return (
    <View style={styles.root}>
      <WebView
        ref={webViewRef}
        source={source}
        style={styles.webview}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction={false}
        onNavigationStateChange={(navigation) => setCanGoBack(navigation.canGoBack)}
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

