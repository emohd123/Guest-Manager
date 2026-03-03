import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

/**
 * Entry point screen — choose Staff or Visitor mode.
 */
export function RoleChoiceScreen({
  onSelectStaff,
  onSelectVisitor,
}: {
  onSelectStaff: () => void;
  onSelectVisitor: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>GM</Text>
      </View>
      <Text style={styles.title}>Guest Manager</Text>
      <Text style={styles.subtitle}>Check-In & Events App</Text>

      <View style={styles.cards}>
        {/* Staff Login Card */}
        <Pressable style={styles.staffCard} onPress={onSelectStaff}>
          <Text style={styles.staffCardIcon}>🔐</Text>
          <Text style={styles.staffCardTitle}>Staff Login</Text>
          <Text style={styles.staffCardDescription}>
            Pair this device to an event and start scanning tickets
          </Text>
          <View style={styles.staffArrow}>
            <Text style={styles.staffArrowText}>→</Text>
          </View>
        </Pressable>

        {/* Visitor Portal Card */}
        <Pressable style={styles.visitorCard} onPress={onSelectVisitor}>
          <Text style={styles.visitorCardIcon}>🎫</Text>
          <Text style={styles.visitorCardTitle}>Visitor Portal</Text>
          <Text style={styles.visitorCardDescription}>
            View your tickets, agenda, events & notifications
          </Text>
          <View style={styles.visitorArrow}>
            <Text style={styles.visitorArrowText}>→</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.footer}>Guest Manager · Event Check-In Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: "#f8fafc",
    gap: 8,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#4338ca",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#4338ca",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  logoText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 24,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  cards: {
    width: "100%",
    gap: 14,
  },

  // ── Staff Card (dark blue) ───────────────────────────────────────────────
  staffCard: {
    backgroundColor: "#4338ca",
    borderRadius: 18,
    padding: 22,
    position: "relative",
    shadowColor: "#4338ca",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  staffCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  staffCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  staffCardDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.80)",
    lineHeight: 18,
  },
  staffArrow: {
    position: "absolute",
    top: 22,
    right: 22,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  staffArrowText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },

  // ── Visitor Card (white with border) ─────────────────────────────────────
  visitorCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    position: "relative",
    shadowColor: "#4338ca",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  visitorCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  visitorCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",      // ← dark text on white background
    marginBottom: 4,
  },
  visitorCardDescription: {
    fontSize: 13,
    color: "#64748b",      // ← slate gray text on white background
    lineHeight: 18,
  },
  visitorArrow: {
    position: "absolute",
    top: 22,
    right: 22,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  visitorArrowText: {
    color: "#4338ca",
    fontWeight: "700",
    fontSize: 16,
  },

  footer: {
    marginTop: 28,
    fontSize: 11,
    color: "#94a3b8",
  },
});
