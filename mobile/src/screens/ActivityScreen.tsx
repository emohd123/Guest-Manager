import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export function ActivityScreen({
  queueCount,
  lastSyncAt,
  onSyncNow,
  onHeartbeat,
  syncing,
}: {
  queueCount: number;
  lastSyncAt: string | null;
  onSyncNow: () => Promise<void>;
  onHeartbeat: () => Promise<void>;
  syncing: boolean;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity & Sync</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Queued Mutations</Text>
        <Text style={styles.value}>{queueCount}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Last Sync</Text>
        <Text style={styles.valueSmall}>{lastSyncAt ?? "Never"}</Text>
      </View>
      <Pressable style={styles.button} onPress={onSyncNow} disabled={syncing}>
        <Text style={styles.buttonText}>{syncing ? "Syncing..." : "Sync Now"}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onHeartbeat}>
        <Text style={styles.secondaryText}>Send Heartbeat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  label: {
    color: "#64748b",
    fontSize: 12,
  },
  value: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "700",
    color: "#0f172a",
  },
  valueSmall: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  button: {
    marginTop: 4,
    backgroundColor: "#4338ca",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});

