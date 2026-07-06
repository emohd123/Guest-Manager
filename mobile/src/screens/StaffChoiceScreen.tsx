import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BrandLogo } from "../ui/brand-logo";
import { FloatingLines } from "../ui/FloatingLines";
import { FadeSlideIn } from "../ui/motion";
import { PremiumBackdrop, PremiumPill } from "../ui/primitives";
import { palette, radii, shadows, spacing, type } from "../ui/theme";

export function StaffChoiceScreen({
  onSelectCodePin,
  onSelectQr,
  onSelectStaff,
  onBack,
}: {
  onSelectCodePin: () => void;
  onSelectQr: () => void;
  onSelectStaff: () => void;
  onBack: () => void;
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 820;

  return (
    <PremiumBackdrop>
      <View style={styles.root}>
        <FloatingLines
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={[10, 16, 18]}
          lineDistance={[8, 6, 5]}
          linesGradient={["#2563EB", "#7C3AED", "#DB2777"]}
          animationSpeed={1}
          topWavePosition={{ x: isWide ? 0.2 : -2.8, y: 0.52, rotate: -0.14 }}
          middleWavePosition={{ x: isWide ? -0.6 : -3.4, y: 0.12, rotate: 0.1 }}
          bottomWavePosition={{ x: isWide ? -1.4 : -3.8, y: -0.5, rotate: -0.2 }}
        />

        <FadeSlideIn style={[styles.inner, isWide && styles.innerWide]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </Pressable>
            <BrandLogo size={42} showWordmark />
            <PremiumPill label="Staff Pairing" tone="live" />
          </View>

          <View style={[styles.main, isWide && styles.mainWide]}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons name="scan-outline" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, isWide && styles.titleWide]}>
                Connect this device to an event.
              </Text>
              <Text style={styles.subtitle}>
                Pick a pairing method for check-in, scanning, walk-ins, and floor sync.
              </Text>

              <View style={styles.signalRow}>
                <Signal label="Mode" value="Operations" />
                <View style={styles.signalDivider} />
                <Signal label="Surface" value="Scanner + Queue" />
              </View>
            </View>

            <View style={[styles.methods, isWide && styles.methodsWide]}>
              <OptionCard
                icon="keypad-outline"
                title="Access Code + PIN"
                description="Fast setup for front-desk devices already registered in the dashboard."
                accent={palette.accent}
                onPress={onSelectCodePin}
              />
              <OptionCard
                icon="qr-code-outline"
                title="Pair with QR Token"
                description="Scan the device token while the operations team configures hardware."
                accent={palette.accentStrong}
                onPress={onSelectQr}
              />
              <OptionCard
                icon="shield-checkmark-outline"
                title="Pair with Staff Token"
                description="Use a direct staff token and event ID for admin setup flows."
                accent={palette.accentPink}
                onPress={onSelectStaff}
              />
            </View>
          </View>
        </FadeSlideIn>
      </View>
    </PremiumBackdrop>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.signal}>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={styles.signalValue}>{value}</Text>
    </View>
  );
}

function OptionCard({
  icon,
  title,
  description,
  accent,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.optionIcon, { backgroundColor: `${accent}33` }]}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionKicker}>Pairing Method</Text>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
      <View style={[styles.goButton, { borderColor: `${accent}99` }]}>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 38,
    paddingBottom: spacing.xl,
  },
  innerWide: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 34,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 46,
  },
  backBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  main: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: "center",
    paddingTop: spacing.xl,
  },
  mainWide: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxxl,
    justifyContent: "space-between",
  },
  hero: {
    gap: spacing.md,
    maxWidth: 570,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(124,58,237,0.24)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  title: {
    color: palette.textInverse,
    fontSize: type.hero + 4,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 42,
  },
  titleWide: {
    fontSize: 50,
    lineHeight: 56,
  },
  subtitle: {
    color: palette.textSoft,
    fontSize: type.bodyLg,
    fontWeight: "600",
    lineHeight: 23,
    maxWidth: 390,
  },
  signalRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  signal: {
    flex: 1,
    gap: 6,
  },
  signalDivider: {
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.12)",
    width: 1,
  },
  signalLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  signalValue: {
    color: palette.textInverse,
    fontSize: 14,
    fontWeight: "800",
  },
  methods: {
    gap: spacing.md,
  },
  methodsWide: {
    flex: 1,
    maxWidth: 590,
  },
  option: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 118,
    padding: spacing.lg,
    ...shadows.soft,
  },
  optionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  optionIcon: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.md,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  optionText: {
    flex: 1,
    gap: 6,
  },
  optionKicker: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  optionTitle: {
    color: palette.textInverse,
    fontSize: 17,
    fontWeight: "900",
  },
  optionDesc: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  goButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
});
