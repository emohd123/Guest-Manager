import React from "react";
import { StyleSheet, View } from "react-native";
import { FadeSlideIn } from "../ui/motion";
import {
  PremiumButton,
  PremiumCard,
  PremiumPill,
  SectionHeading,
} from "../ui/primitives";
import { palette, spacing } from "../ui/theme";
import { Text } from "react-native";

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
      <FadeSlideIn>
        <PremiumCard tone="dark" style={styles.hero}>
          <SectionHeading
            eyebrow="Operations Sync"
            title="Activity and device health"
            body="Monitor queued offline work and push the device state back to the server when needed."
            right={<PremiumPill label={syncing ? "Syncing" : "Ready"} tone="live" />}
          />
        </PremiumCard>
      </FadeSlideIn>

      <FadeSlideIn delay={70}>
        <PremiumCard style={styles.card}>
          <Text style={styles.label}>Queued Mutations</Text>
          <Text style={styles.value}>{queueCount}</Text>
        </PremiumCard>
      </FadeSlideIn>
      <FadeSlideIn delay={110}>
        <PremiumCard style={styles.card}>
          <Text style={styles.label}>Last Sync</Text>
          <Text style={styles.valueSmall}>{lastSyncAt ?? "Never"}</Text>
        </PremiumCard>
      </FadeSlideIn>
      <FadeSlideIn delay={140}>
        <View style={styles.actions}>
          <PremiumButton label={syncing ? "Syncing..." : "Sync Now"} onPress={onSyncNow} disabled={syncing} />
          <PremiumButton label="Send Heartbeat" tone="secondary" onPress={onHeartbeat} />
        </View>
      </FadeSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: palette.bgElevated,
    borderColor: "rgba(255,255,255,0.12)",
  },
  card: {
    gap: 8,
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    marginTop: 8,
    fontSize: 40,
    fontWeight: "900",
    color: palette.text,
    letterSpacing: -1,
  },
  valueSmall: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
  },
  actions: {
    gap: spacing.md,
  },
});
