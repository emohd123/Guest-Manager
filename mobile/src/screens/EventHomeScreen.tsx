import React, { useState, useEffect } from "react";
import { RefreshControl, StyleSheet, Text, View, Animated } from "react-native";
import type { SummaryMetrics } from "../types";

export function EventHomeScreen({
  summary,
  refreshing,
  onRefresh,
}: {
  summary: SummaryMetrics | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
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
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1C30" />}
    >
      <Text style={styles.title}>Event Overview</Text>
      <View style={styles.grid}>
        <StatCard label="Checked In" value={summary?.checkedIn ?? 0} />
        <StatCard label="Checked Out" value={summary?.checkedOut ?? 0} />
        <StatCard label="No Show" value={summary?.noShow ?? 0} />
        <StatCard label="Total Guests" value={summary?.totalGuests ?? 0} />
        <StatCard label="Successful Scans" value={summary?.successfulScans ?? 0} />
        <StatCard label="Invalid Scans" value={summary?.unsuccessfulScans ?? 0} />
      </View>
    </Animated.ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: 24,
    paddingBottom: 100, // Room for floating tab bar
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 20,
    color: "#1A1C30",
    letterSpacing: -0.5,
  },
  grid: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardLabel: {
    color: "#A0A5B1",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: -1,
  },
});

