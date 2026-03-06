import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FadeSlideIn } from "../ui/motion";

export function RoleChoiceScreen({
  onSelectStaff,
  onSelectVisitor,
}: {
  onSelectStaff: () => void;
  onSelectVisitor: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.backdrop}>
        <View style={[styles.orb, styles.orbCoral]} />
        <View style={[styles.orb, styles.orbBlue]} />
      </View>

      <FadeSlideIn style={styles.inner}>
        <View style={styles.headerArea}>
          <Text style={styles.eyebrow}>Guest Manager Mobile</Text>
          <Text style={styles.title}>Choose how this device should behave</Text>
          <Text style={styles.subtitle}>
            Staff gets a fast operational shell for scanning and walk-ins. Visitors get a personal portal for tickets and updates.
          </Text>
        </View>

        <View style={styles.whiteCard}>
          <View style={styles.cards}>
            <Pressable style={styles.staffCard} onPress={onSelectStaff}>
              <View style={styles.cardHeader}>
                <Text style={styles.staffCardIcon}>Staff</Text>
                <View style={styles.staffArrow}>
                  <Text style={styles.staffArrowText}>Open</Text>
                </View>
              </View>
              <Text style={styles.staffCardTitle}>Staff Login</Text>
              <Text style={styles.staffCardDescription}>
                Pair to an event, scan tickets, manage arrivals, and keep the line moving.
              </Text>
            </Pressable>

            <Pressable style={styles.visitorCard} onPress={onSelectVisitor}>
              <View style={styles.cardHeader}>
                <Text style={styles.visitorCardIcon}>Visitor</Text>
                <View style={styles.visitorArrow}>
                  <Text style={styles.visitorArrowText}>Open</Text>
                </View>
              </View>
              <Text style={styles.visitorCardTitle}>Visitor Portal</Text>
              <Text style={styles.visitorCardDescription}>
                View tickets, schedules, attendee updates, and organizer replies.
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>Experience Platform</Text>
        </View>
      </FadeSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#13182C",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbCoral: {
    width: 260,
    height: 260,
    top: -40,
    right: -90,
    backgroundColor: "rgba(255,91,106,0.15)",
  },
  orbBlue: {
    width: 220,
    height: 220,
    bottom: 180,
    left: -80,
    backgroundColor: "rgba(98,129,255,0.14)",
  },
  inner: {
    flex: 1,
  },
  headerArea: {
    flex: 0.46,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FF8B96",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 23,
  },
  whiteCard: {
    flex: 0.54,
    backgroundColor: "#EEF2F8",
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  cards: {
    width: "100%",
    gap: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  staffCard: {
    backgroundColor: "#14192C",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#13182C",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 8,
  },
  staffCardIcon: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  staffCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  staffCardDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 20,
  },
  staffArrow: {
    minWidth: 60,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF5B6A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  staffArrowText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 11,
  },
  visitorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#14192C",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 5,
  },
  visitorCardIcon: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1A1C30",
  },
  visitorCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1C30",
    marginBottom: 6,
  },
  visitorCardDescription: {
    fontSize: 14,
    color: "#7D859B",
    lineHeight: 20,
  },
  visitorArrow: {
    minWidth: 60,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2F8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  visitorArrowText: {
    color: "#1A1C30",
    fontWeight: "800",
    fontSize: 11,
  },
  footer: {
    fontSize: 12,
    color: "#9098AB",
    fontWeight: "600",
    textAlign: "center",
  },
});
