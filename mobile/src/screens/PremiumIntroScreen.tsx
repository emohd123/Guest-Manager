import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { PremiumBackdrop, PremiumButton, PremiumCard, PremiumPill } from "../ui/primitives";
import { FadeSlideIn } from "../ui/motion";
import { BrandLogo } from "../ui/brand-logo";
import { palette, radii, spacing, type } from "../ui/theme";

const slides = [
  {
    eyebrow: "Premium Event Hub",
    title: "One app for arrival, agenda, live moments, and networking.",
    body: "Give attendees a luxury event surface while the floor team keeps operations moving from the same product.",
  },
  {
    eyebrow: "Attendee Experience",
    title: "Ticket, agenda, live stream, sponsors, and private connections.",
    body: "The attendee side stays immersive without getting noisy, with richer motion and cleaner hierarchy.",
  },
  {
    eyebrow: "Ops Ready",
    title: "High-contrast check-in, quick pairing, and confident offline sync.",
    body: "Staff flows stay fast and operational while using the same premium visual system.",
  },
];

export function PremiumIntroScreen({
  onFinish,
  onSkip,
}: {
  onFinish: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();
  const slide = slides[step];
  const isLast = step === slides.length - 1;
  const stepLabel = useMemo(() => `${step + 1} / ${slides.length}`, [step]);
  const isWide = width >= 960;

  return (
    <PremiumBackdrop>
      <View style={styles.container}>
        <FadeSlideIn style={[styles.inner, isWide && styles.innerWide]}>
          <View style={styles.header}>
            <PremiumPill label="Events Hub" tone="live" />
            <Pressable onPress={onSkip} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <View style={[styles.main, isWide && styles.mainWide]}>
            <View style={[styles.heroBlock, isWide && styles.heroBlockWide]}>
              <Text style={styles.stepLabel}>{stepLabel}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>

            <PremiumCard tone="glass" style={[styles.previewCard, isWide && styles.previewCardWide]}>
              <Text style={styles.previewEyebrow}>{slide.eyebrow}</Text>
              <View style={styles.previewRows}>
                <View style={styles.previewHero}>
                  <BrandLogo size={136} variant="tile" />
                  <View style={styles.previewCopy}>
                    <Text style={styles.previewTitle}>Events Hub</Text>
                    <Text style={styles.previewBody}>Premium check-in, ticketing, and attendee flow in one polished product.</Text>
                  </View>
                </View>
                <View style={styles.previewRow}>
                  <View style={styles.previewPanelSm} />
                  <View style={styles.previewPanelSm} />
                </View>
              </View>
            </PremiumCard>
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === step && styles.dotActive]}
                />
              ))}
            </View>
            <PremiumButton
              label={isLast ? "Enter App" : "Continue"}
              onPress={() => (isLast ? onFinish() : setStep((value) => value + 1))}
            />
          </View>
        </FadeSlideIn>
      </View>
    </PremiumBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: 1160,
  },
  innerWide: {
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xl,
  },
  mainWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xxxl,
  },
  skip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  skipText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "800",
  },
  heroBlock: {
    justifyContent: "center",
    gap: spacing.md,
    maxWidth: 520,
  },
  heroBlockWide: {
    flex: 1,
  },
  stepLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: type.hero + 4,
    fontWeight: "900",
    color: palette.textInverse,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  body: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 420,
  },
  previewCard: {
    gap: spacing.lg,
    minHeight: 220,
  },
  previewCardWide: {
    flex: 1,
    maxWidth: 520,
  },
  previewEyebrow: {
    color: palette.textInverse,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  previewRows: {
    gap: spacing.md,
  },
  previewHero: {
    minHeight: 154,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  previewCopy: {
    flex: 1,
    gap: 8,
  },
  previewTitle: {
    color: palette.textInverse,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  previewBody: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 20,
  },
  previewRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  previewPanelSm: {
    flex: 1,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.lg,
    width: "100%",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  dotActive: {
    width: 26,
    backgroundColor: palette.accent,
  },
});
