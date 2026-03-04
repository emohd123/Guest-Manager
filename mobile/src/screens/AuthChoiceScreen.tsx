import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";

export function AuthChoiceScreen({
  onSelectCodePin,
  onSelectQr,
  onSelectStaff,
}: {
  onSelectCodePin: () => void;
  onSelectQr: () => void;
  onSelectStaff: () => void;
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
    <View style={styles.container}>
      {/* Deep Navy Background Layer */}
      <View style={styles.navyBackground} />
      
      {/* Animated Content Card */}
      <Animated.View style={[
        styles.card,
         { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <View style={styles.headerArea}>
          <Text style={styles.title}>Check In & Scanning</Text>
          <Text style={styles.subtitle}>Pair this device to an event</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={onSelectCodePin}>
          <Text style={styles.primaryText}>Use Access Code + PIN</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onSelectQr}>
          <Text style={styles.secondaryText}>Pair with QR Token</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onSelectStaff}>
          <Text style={styles.secondaryText}>Pair with Staff Token</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1C30",
  },
  navyBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A1C30",
  },
  card: {
    flex: 1,
    marginTop: 100, // Leave some navy at the top
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    padding: 32,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 20,
    elevation: 10,
  },
  headerArea: {
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#8E94A3",
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#FF5B6A", // Coral
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  secondaryButton: {
    borderColor: "#EBEFF5",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryText: {
    color: "#1A1C30",
    fontWeight: "700",
    fontSize: 15,
  },
});
