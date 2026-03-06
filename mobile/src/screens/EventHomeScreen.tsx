import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { SummaryMetrics } from "../types";
import { FadeSlideIn } from "../ui/motion";

export function EventHomeScreen({
  summary,
  refreshing,
  onRefresh,
}: {
  summary: SummaryMetrics | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) {
  const stats = [
    { label: "Checked In", value: summary?.checkedIn ?? 0, tone: "#FF5B6A" },
    { label: "Checked Out", value: summary?.checkedOut ?? 0, tone: "#5B6CFF" },
    { label: "No Show", value: summary?.noShow ?? 0, tone: "#F59E0B" },
    { label: "Total Guests", value: summary?.totalGuests ?? 0, tone: "#13182C" },
    { label: "Successful Scans", value: summary?.successfulScans ?? 0, tone: "#22C55E" },
    { label: "Invalid Scans", value: summary?.unsuccessfulScans ?? 0, tone: "#8C94A8" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1C30" />
      }
    >
      <FadeSlideIn>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Live Ops</Text>
          <Text style={styles.title}>Event overview</Text>
          <Text style={styles.subtitle}>
            A fast snapshot of arrivals, exits, and scan quality for the floor team.
          </Text>
        </View>
      </FadeSlideIn>

      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <FadeSlideIn key={stat.label} delay={60 + index * 35}>
            <StatCard label={stat.label} value={stat.value} tone={stat.tone} />
          </FadeSlideIn>
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardDot, { backgroundColor: tone }]} />
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
    paddingBottom: 110,
  },
  hero: {
    marginBottom: 18,
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#14192C",
    shadowColor: "#14192C",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 8,
  },
  eyebrow: {
    color: "#FF8B96",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 21,
  },
  grid: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#14192C",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 4,
  },
  cardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  cardLabel: {
    color: "#8C94A8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: -1,
  },
});
