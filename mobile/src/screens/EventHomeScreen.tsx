import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
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
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    </ScrollView>
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
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  grid: {
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  cardLabel: {
    color: "#64748b",
    fontSize: 12,
  },
  cardValue: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
});

