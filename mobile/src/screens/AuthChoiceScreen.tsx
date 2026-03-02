import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export function AuthChoiceScreen({
  onSelectCodePin,
  onSelectQr,
  onSelectStaff,
}: {
  onSelectCodePin: () => void;
  onSelectQr: () => void;
  onSelectStaff: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check In & Scanning App</Text>
      <Text style={styles.subtitle}>Pair this device to an event</Text>

      <Pressable style={styles.primaryButton} onPress={onSelectCodePin}>
        <Text style={styles.primaryText}>Use Access Code + PIN</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onSelectQr}>
        <Text style={styles.secondaryText}>Pair with QR Token</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onSelectStaff}>
        <Text style={styles.secondaryText}>Pair with Staff Token</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    marginBottom: 12,
    color: "#64748b",
  },
  primaryButton: {
    backgroundColor: "#4338ca",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButton: {
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
