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
        <Pressable style={styles.staffCard} onPress={onSelectStaff}>
          <Text style={styles.cardIcon}>🔐</Text>
          <Text style={styles.cardTitle}>Staff Login</Text>
          <Text style={styles.cardDescription}>
            Pair this device to an event and start scanning tickets
          </Text>
          <View style={styles.cardArrow}>
            <Text style={styles.cardArrowText}>→</Text>
          </View>
        </Pressable>

        <Pressable style={styles.visitorCard} onPress={onSelectVisitor}>
          <Text style={styles.cardIcon}>🎟️</Text>
          <Text style={styles.cardTitle}>Visitor Portal</Text>
          <Text style={styles.cardDescription}>
            View your tickets, agenda, events & notifications
          </Text>
          <View style={[styles.cardArrow, styles.cardArrowVisitor]}>
            <Text style={[styles.cardArrowText, styles.cardArrowTextVisitor]}>→</Text>
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
  visitorCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 18,
  },
  cardArrow: {
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
  cardArrowVisitor: {
    backgroundColor: "#f1f5f9",
  },
  cardArrowText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cardArrowTextVisitor: {
    color: "#4338ca",
  },
  footer: {
    marginTop: 28,
    fontSize: 11,
    color: "#94a3b8",
  },
});
