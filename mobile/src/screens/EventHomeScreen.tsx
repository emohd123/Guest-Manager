import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { SummaryMetrics } from "../types";
import { FadeSlideIn, usePulseAnimation } from "../ui/motion";
import { PremiumCard, PremiumPill, SectionHeading } from "../ui/primitives";
import { palette, radii, spacing } from "../ui/theme";

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
    { label: "Checked In", value: summary?.checkedIn ?? 0, tone: palette.accent },
    { label: "Checked Out", value: summary?.checkedOut ?? 0, tone: palette.accentCool },
    { label: "No Show", value: summary?.noShow ?? 0, tone: palette.warning },
    { label: "Total Guests", value: summary?.totalGuests ?? 0, tone: palette.text },
  ];
  const secondary = [
    { label: "Successful Scans", value: summary?.successfulScans ?? 0 },
    { label: "Invalid Scans", value: summary?.unsuccessfulScans ?? 0 },
  ];
  const pulse = usePulseAnimation(true);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.surface} />
      }
    >
      <FadeSlideIn>
        <PremiumCard tone="dark" style={styles.hero}>
          <View style={styles.heroRow}>
            <SectionHeading
              eyebrow="Live Ops"
              title="Operations dashboard"
              body="A premium floor view for arrivals, exits, scan quality, and sync confidence."
            />
            <View style={styles.liveBadge}>
              <View style={styles.liveDotWrap}>
                <View style={styles.liveDotCore} />
                <View
                  style={[
                    styles.liveDotPulse,
                    { opacity: pulse.opacity, transform: [{ scale: pulse.scale }] },
                  ]}
                />
              </View>
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.secondaryStats}>
            {secondary.map((item) => (
              <View key={item.label} style={styles.secondaryStat}>
                <Text style={styles.secondaryLabel}>{item.label}</Text>
                <Text style={styles.secondaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </PremiumCard>
      </FadeSlideIn>

      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <FadeSlideIn key={stat.label} delay={60 + index * 35}>
            <PremiumCard style={styles.card}>
              <View style={[styles.cardDot, { backgroundColor: stat.tone }]} />
              <Text style={styles.cardLabel}>{stat.label}</Text>
              <Text style={styles.cardValue}>{stat.value}</Text>
            </PremiumCard>
          </FadeSlideIn>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 132,
  },
  hero: {
    marginBottom: spacing.lg,
    backgroundColor: palette.bgElevated,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  liveDotWrap: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentLive,
  },
  liveDotPulse: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.accentLive,
  },
  liveText: {
    color: palette.textInverse,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  secondaryStats: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  secondaryStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  secondaryLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  secondaryValue: {
    marginTop: 8,
    color: palette.textInverse,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  cardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  cardLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: "900",
    color: palette.text,
    letterSpacing: -1,
  },
});
