import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";

/**
 * Entry point screen — choose Staff or Visitor mode.
 */
export function RoleChoiceScreen({
  onSelectStaff,
  onSelectVisitor,
}: {
  onSelectStaff: () => void;
  onSelectVisitor: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0));
  const slideAnim = useRef(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim.current, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim.current, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.navyBackground} />
      
      <Animated.View style={[styles.inner, { opacity: fadeAnim.current, transform: [{ translateY: slideAnim.current }] }]}>
        <View style={styles.headerArea}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Select your connection mode to start</Text>
        </View>

        <View style={styles.whiteCard}>
          <View style={styles.cards}>
            {/* Staff Card */}
            <Pressable style={styles.staffCard} onPress={onSelectStaff}>
              <View style={styles.cardHeader}>
                <Text style={styles.staffCardIcon}>🔐</Text>
                <View style={styles.staffArrow}>
                  <Text style={styles.staffArrowText}>→</Text>
                </View>
              </View>
              <Text style={styles.staffCardTitle}>Staff Login</Text>
              <Text style={styles.staffCardDescription}>
                Pair to an event and start scanning tickets
              </Text>
            </Pressable>

            {/* Visitor Card */}
            <Pressable style={styles.visitorCard} onPress={onSelectVisitor}>
              <View style={styles.cardHeader}>
                <Text style={styles.visitorCardIcon}>🎫</Text>
                <View style={styles.visitorArrow}>
                  <Text style={styles.visitorArrowText}>→</Text>
                </View>
              </View>
              <Text style={styles.visitorCardTitle}>Visitor Portal</Text>
              <Text style={styles.visitorCardDescription}>
                View your tickets, agenda & events
              </Text>
            </Pressable>
          </View>
          
          <Text style={styles.footer}>Guest Manager · Experience Platform</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1C30", // Deep Navy
  },
  navyBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A1C30",
  },
  inner: {
    flex: 1,
  },
  headerArea: {
    flex: 0.45,
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: "#1A1C30",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
  },
  whiteCard: {
    flex: 0.55,
    backgroundColor: "#EFF2F7", // Very light gray/white background for the cards area
    borderTopLeftRadius: 60,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cards: {
    width: "100%",
    gap: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  
  // ── Staff Card (Dark Navy inside light area) ──────────────────────────────
  staffCard: {
    backgroundColor: "#1A1C30",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#1A1C30",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  staffCardIcon: { fontSize: 24 },
  staffCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  staffCardDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 20,
  },
  staffArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF5B6A", // Coral Accent
    alignItems: "center",
    justifyContent: "center",
  },
  staffArrowText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },

  // ── Visitor Card (White inside light area) ──────────────────────────────
  visitorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  visitorCardIcon: { fontSize: 24 },
  visitorCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1C30",
    marginBottom: 6,
  },
  visitorCardDescription: {
    fontSize: 14,
    color: "#8E94A3",
    lineHeight: 20,
  },
  visitorArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  visitorArrowText: { color: "#1A1C30", fontWeight: "700", fontSize: 16 },

  footer: {
    fontSize: 12,
    color: "#A0A5B1",
    fontWeight: "500",
  },
});
