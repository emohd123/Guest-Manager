import React, { useMemo, useState, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Animated } from "react-native";
import type { MobileGuest } from "../types";

export function GuestsScreen({
  guests,
  onQuickCheckIn,
  onQuickCheckOut,
  busyGuestId,
}: {
  guests: MobileGuest[];
  onQuickCheckIn: (guest: MobileGuest) => Promise<void>;
  onQuickCheckOut: (guest: MobileGuest) => Promise<void>;
  busyGuestId?: string | null;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const term = search.toLowerCase();
    return guests.filter((guest) => {
      const name = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.toLowerCase();
      return (
        name.includes(term) ||
        (guest.email ?? "").toLowerCase().includes(term) ||
        (guest.ticket?.barcode ?? "").toLowerCase().includes(term)
      );
    });
  }, [guests, search]);

  const [slideAnim] = useState(() => new Animated.Value(30));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.title}>Guest List</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search guests by name, email, or ticket"
        placeholderTextColor="#A0A5B1"
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const checkedIn = item.attendanceState === "checked_in" || item.status === "checked_in";
          const loading = busyGuestId === item.id;
          return (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.name}>
                  {`${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "Guest"}
                </Text>
                <Text style={styles.meta}>{item.email ?? item.ticket?.barcode ?? "No email"}</Text>
              </View>
              {checkedIn ? (
                <Pressable
                  style={[styles.action, styles.checkout]}
                  disabled={loading}
                  onPress={() => onQuickCheckOut(item)}
                >
                  <Text style={[styles.actionText, { color: "#1A1C30" }]}>{loading ? "..." : "Check Out"}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.action, styles.checkin]}
                  disabled={loading}
                  onPress={() => onQuickCheckIn(item)}
                >
                  <Text style={[styles.actionText, { color: "#FFFFFF" }]}>{loading ? "..." : "Check In"}</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No guests found.</Text>}
        contentContainerStyle={styles.listContent}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
    color: "#1A1C30",
    letterSpacing: -0.5,
  },
  search: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 30, // massive pill
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 15,
    color: "#1A1C30",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  listContent: {
    paddingBottom: 100, // Space for floating tab bar
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EBEFF5",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  rowMain: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1C30",
  },
  meta: {
    marginTop: 4,
    color: "#8E94A3",
    fontSize: 13,
    fontWeight: "500",
  },
  action: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkin: {
    backgroundColor: "#FF5B6A", // Coral action
  },
  checkout: {
    backgroundColor: "rgba(26,28,48,0.05)", // Subdued gray/navy instead of bright blue
  },
  actionText: {
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#8E94A3",
    fontSize: 15,
    fontWeight: "500",
  },
});

