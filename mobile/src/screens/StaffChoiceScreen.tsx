import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Animated } from "react-native";

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
  const [slideAnim] = useState(() => new Animated.Value(50));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
      <View style={styles.navyTop}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Pair this device</Text>
        <Text style={styles.subheading}>
          Choose how to connect this device to an event
        </Text>
      </View>

      <Animated.ScrollView
        style={[ styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] } ]}
        contentContainerStyle={styles.cardContent}
      >
        <View style={styles.options}>
          <Pressable style={styles.option} onPress={onSelectCodePin}>
            <View style={[styles.iconWrapper, { backgroundColor: "rgba(255,91,106,0.1)" }]}>
              <Text style={styles.optionIcon}>🔢</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Access Code + PIN</Text>
              <Text style={styles.optionDesc}>Enter the 6-char code and PIN from your dashboard</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={onSelectQr}>
            <View style={[styles.iconWrapper, { backgroundColor: "rgba(255,91,106,0.1)" }]}>
              <Text style={styles.optionIcon}>📷</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Pair with QR Token</Text>
              <Text style={styles.optionDesc}>Scan the QR code shown in the Devices dashboard</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={onSelectStaff}>
            <View style={[styles.iconWrapper, { backgroundColor: "rgba(255,91,106,0.1)" }]}>
              <Text style={styles.optionIcon}>🛠️</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Pair with Staff Token</Text>
              <Text style={styles.optionDesc}>Paste your Supabase auth token + event ID (admin setup)</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A1C30" },
  navyTop: {
    paddingTop: Platform.OS === "android" ? 44 : 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: "#1A1C30",
  },
  backBtn: {
    paddingVertical: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    marginLeft: -8,
    paddingHorizontal: 8,
  },
  backText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 10,
    lineHeight: 22,
  },
  card: {
    flex: 1,
    backgroundColor: "#EFF2F7", // Very light gray to distinguish from pure white content blocks
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  cardContent: {
    padding: 32,
    paddingTop: 40,
  },
  options: { gap: 16 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EBEFF5",
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIcon: { fontSize: 28 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: "800", color: "#1A1C30", marginBottom: 6 },
  optionDesc: { fontSize: 14, color: "#8E94A3", lineHeight: 20, fontWeight: "500" },
  chevron: { fontSize: 26, color: "#A0A5B1", fontWeight: "600" },
});
