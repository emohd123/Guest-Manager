import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FadeSlideIn } from "../ui/motion";
import { PremiumBackdrop, PremiumCard, PremiumPill } from "../ui/primitives";
import { palette, radii, shadows, spacing, type } from "../ui/theme";

export function RoleChoiceScreen({
  onSelectStaff,
  onSelectVisitor,
}: {
  onSelectStaff: () => void;
  onSelectVisitor: () => void;
}) {
  return (
    <PremiumBackdrop>
      <View style={styles.container}>
        <FadeSlideIn style={styles.inner}>
          <View style={styles.headerArea}>
            <PremiumPill label="Guest Manager Mobile" tone="live" />
            <Text style={styles.title}>Choose how this device should move through the event</Text>
            <Text style={styles.subtitle}>
              One premium shell for attendees and a sharper operational shell for floor staff.
            </Text>
          </View>

          <PremiumCard style={styles.whiteCard}>
            <View style={styles.cards}>
              <Pressable style={styles.staffCard} onPress={onSelectStaff}>
                <View style={styles.cardHeader}>
                  <PremiumPill label="Staff" />
                  <View style={styles.staffArrow}>
                    <Text style={styles.staffArrowText}>Operate</Text>
                  </View>
                </View>
                <Text style={styles.staffCardTitle}>Check-In Operations</Text>
                <Text style={styles.staffCardDescription}>
                  Pair the device, scan arrivals, manage walk-ins, and stay synced with the queue.
                </Text>
              </Pressable>

              <Pressable style={styles.visitorCard} onPress={onSelectVisitor}>
                <View style={styles.cardHeader}>
                  <PremiumPill label="Attendee" />
                  <View style={styles.visitorArrow}>
                    <Text style={styles.visitorArrowText}>Enter</Text>
                  </View>
                </View>
                <Text style={styles.visitorCardTitle}>Live Event Experience</Text>
                <Text style={styles.visitorCardDescription}>
                  Tickets, agenda, live sessions, networking, inbox, and event updates in one place.
                </Text>
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Premium Event Platform</Text>
              <Text style={styles.footerValue}>Attendee + Ops</Text>
            </View>
          </PremiumCard>
        </FadeSlideIn>
      </View>
    </PremiumBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 52,
    paddingBottom: spacing.xl,
  },
  headerArea: {
    flex: 0.44,
    justifyContent: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: type.hero,
    fontWeight: "900",
    color: palette.textInverse,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: type.bodyLg,
    color: "rgba(255,255,255,0.74)",
    lineHeight: 23,
    maxWidth: 360,
  },
  whiteCard: {
    flex: 0.56,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingTop: spacing.xl,
    justifyContent: "space-between",
  },
  cards: {
    width: "100%",
    gap: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  staffCard: {
    backgroundColor: palette.bgElevated,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...shadows.strong,
  },
  staffCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.textInverse,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  staffCardDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.66)",
    lineHeight: 21,
  },
  staffArrow: {
    minWidth: 82,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  staffArrowText: {
    color: palette.textInverse,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  visitorCard: {
    backgroundColor: palette.surfaceTint,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.line,
  },
  visitorCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  visitorCardDescription: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 21,
  },
  visitorArrow: {
    minWidth: 76,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: "rgba(19,26,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  visitorArrowText: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  footerLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: 13,
    color: palette.text,
    fontWeight: "800",
  },
});
