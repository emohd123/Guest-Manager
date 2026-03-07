import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";

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
  const [slideAnim] = useState(() => new Animated.Value(30));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    color: "#A0A5B1",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: "900",
    color: "#1A1C30",
  },
  valueSmall: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1C30",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#FF5B6A", // Coral
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  secondaryText: {
    color: "#1A1C30",
    fontWeight: "800",
    fontSize: 16,
  },
});

