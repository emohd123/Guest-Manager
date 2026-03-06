import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";

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
      subtitle="Choose the pairing method that matches your ops setup. Each option now lands in the same polished shell and motion pattern."
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
    <Pressable style={styles.option} onPress={onPress}>
      <View style={[styles.iconWrapper, { backgroundColor: accent }]}>
        <Text style={styles.optionIcon}>{icon}</Text>
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
      <View style={styles.chevronWrap}>
        <Text style={styles.chevron}>Go</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
    gap: 16,
    shadowColor: "#14192C",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 4,
  },
  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 20,
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
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1C30",
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 14,
    color: "#74809A",
    lineHeight: 20,
    fontWeight: "500",
  },
  chevronWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#13182C",
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});
