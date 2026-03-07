import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";
import { PremiumCard, PremiumPill } from "../ui/primitives";
import { palette, radii, shadows, spacing } from "../ui/theme";

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
  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="Door"
      eyebrow="Staff Pairing"
      title="Connect this device to an event"
      subtitle="Choose the pairing method that fits the floor setup. Each path lands in the same premium operations shell."
    >
      <FadeSlideIn delay={70}>
        <View style={styles.options}>
          <OptionCard
            icon="Code"
            title="Access Code + PIN"
            description="Fastest path for front-desk devices already registered in the dashboard."
            accent="rgba(255,91,106,0.12)"
            onPress={onSelectCodePin}
          />
          <OptionCard
            icon="QR"
            title="Pair with QR Token"
            description="Scan the token shown in Devices when the operations team is configuring hardware."
            accent="rgba(98,129,255,0.12)"
            onPress={onSelectQr}
          />
          <OptionCard
            icon="Token"
            title="Pair with Staff Token"
            description="Use a direct staff token and event ID for admin or technical setup flows."
            accent="rgba(33,184,115,0.12)"
            onPress={onSelectStaff}
          />
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

function OptionCard({
  icon,
  title,
  description,
  accent,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <PremiumCard style={styles.option}>
        <View style={[styles.iconWrapper, { backgroundColor: accent }]}>
          <Text style={styles.optionIcon}>{icon}</Text>
        </View>
        <View style={styles.optionText}>
          <PremiumPill label="Pairing Method" />
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDesc}>{description}</Text>
        </View>
        <View style={styles.chevronWrap}>
          <Text style={styles.chevron}>Go</Text>
        </View>
      </PremiumCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIcon: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1A1C30",
  },
  optionText: {
    flex: 1,
    gap: 8,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.text,
  },
  optionDesc: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 20,
    fontWeight: "500",
  },
  chevronWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: palette.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  chevron: {
    color: palette.textInverse,
    fontSize: 11,
    fontWeight: "800",
  },
});
