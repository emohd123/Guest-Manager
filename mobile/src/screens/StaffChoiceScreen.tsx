import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

/**
 * Staff method selector — the 3 device pairing options.
 * Shown after the user taps "Staff Login" on RoleChoiceScreen.
 */
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
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.heading}>Pair this device</Text>
      <Text style={styles.subheading}>
        Choose how to connect this device to an event
      </Text>

      <View style={styles.options}>
        <Pressable style={styles.option} onPress={onSelectCodePin}>
          <Text style={styles.optionIcon}>🔢</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Access Code + PIN</Text>
            <Text style={styles.optionDesc}>
              Enter the 6-char code and PIN from your dashboard
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.option} onPress={onSelectQr}>
          <Text style={styles.optionIcon}>📷</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Pair with QR Token</Text>
            <Text style={styles.optionDesc}>
              Scan the QR code shown in the Devices dashboard
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.option} onPress={onSelectStaff}>
          <Text style={styles.optionIcon}>🛠️</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Pair with Staff Token</Text>
            <Text style={styles.optionDesc}>
              Paste your Supabase auth token + event ID (admin setup)
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 20,
    backgroundColor: "#f8fafc",
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    color: "#4338ca",
    fontWeight: "600",
    fontSize: 14,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 28,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
  },
  optionIcon: {
    fontSize: 28,
    width: 36,
    textAlign: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
  },
  chevron: {
    fontSize: 22,
    color: "#cbd5e1",
    fontWeight: "300",
  },
});
