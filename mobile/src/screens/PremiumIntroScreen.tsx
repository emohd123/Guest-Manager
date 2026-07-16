import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PremiumButton, PremiumPill } from "../ui/primitives";
import { FadeSlideIn } from "../ui/motion";
import { palette, radii, spacing, type } from "../ui/theme";

const IMG = (id: string, w = 1600, h = 2000) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=75`;

const slides = [
  {
    eyebrow: "The Marketplace",
    title: "Every event in Bahrain, one place.",
    body: "Concerts, festivals, dining, and family days — discover what's on tonight.",
    image: IMG("photo-1492684223066-81342ee5ff30"),
  },
  {
    eyebrow: "Buy & Go",
    title: "Tickets in seconds.",
    body: "Secure checkout, instant QR passes, tap to enter. No queues, no printing.",
    image: IMG("photo-1470229722913-7c0e2dbbafd3"),
  },
  {
    eyebrow: "For Organizers",
    title: "More than tickets.",
    body: "Check-in, agendas, live updates, and attendee tools — run the whole event.",
    image: IMG("photo-1517048676732-d65bc937f952"),
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
  const isWide = width >= 900;

  return (
    <View style={styles.root}>
      {/* Full-bleed background image per slide */}
      <Image key={slide.image} source={{ uri: slide.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={["rgba(6,10,24,0.35)", "rgba(6,10,24,0.72)", "rgba(6,10,24,0.98)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(6,10,24,0.75)", "rgba(6,10,24,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <PremiumPill label="Events Hub" tone="live" />
          <Pressable onPress={onSkip} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.middle}>
          <FadeSlideIn key={step} style={[styles.copyBlock, isWide && styles.copyBlockWide]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepLabel}>{stepLabel}</Text>
            </View>
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.body}>{slide.body}</Text>
          </FadeSlideIn>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, index) => (
              <Pressable key={index} onPress={() => setStep(index)} hitSlop={8}>
                <View style={[styles.dot, index === step && styles.dotActive]} />
              </Pressable>
            ))}
          </View>

          <PremiumButton
            label={isLast ? "Enter App" : "Continue"}
            onPress={() => (isLast ? onFinish() : setStep((value) => value + 1))}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#060A18",
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 52,
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 1160,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  skipText: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "800",
  },
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    gap: spacing.lg,
  },
  copyBlock: {
    gap: 14,
    maxWidth: 560,
    alignItems: "center",
  },
  copyBlockWide: {
    maxWidth: 640,
  },
  stepBadge: {
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stepLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    fontSize: type.hero + 14,
    fontWeight: "900",
    color: palette.textInverse,
    letterSpacing: -1.6,
    lineHeight: 50,
    textAlign: "center",
  },
  accentLine: {
    width: 56,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  body: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 480,
    textAlign: "center",
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
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  dotActive: {
    width: 26,
    backgroundColor: palette.accent,
  },
});
