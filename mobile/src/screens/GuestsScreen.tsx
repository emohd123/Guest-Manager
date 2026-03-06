import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MobileGuest } from "../types";
import { FadeSlideIn } from "../ui/motion";

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

  return (
    <View style={styles.container}>
      <FadeSlideIn>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Front Desk</Text>
          <Text style={styles.title}>Guest list</Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={70}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search guests by name, email, or ticket"
          placeholderTextColor="#A0A5B1"
          style={styles.search}
        />
      </FadeSlideIn>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const checkedIn = item.attendanceState === "checked_in" || item.status === "checked_in";
          const loading = busyGuestId === item.id;
          return (
            <FadeSlideIn delay={80 + index * 18}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(`${item.firstName ?? ""}`[0] ?? "?").toUpperCase()}
                  </Text>
                </View>
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
                    <Text style={[styles.actionText, { color: "#1A1C30" }]}>
                      {loading ? "..." : "Check Out"}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.action, styles.checkin]}
                    disabled={loading}
                    onPress={() => onQuickCheckIn(item)}
                  >
                    <Text style={[styles.actionText, { color: "#FFFFFF" }]}>
                      {loading ? "..." : "Check In"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </FadeSlideIn>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No guests found.</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 24,
  },
  hero: {
    marginBottom: 14,
  },
  eyebrow: {
    color: "#8C94A8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: -0.7,
  },
  search: {
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
    borderRadius: 30,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 15,
    color: "#1A1C30",
    shadowColor: "#14192C",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  listContent: {
    paddingBottom: 110,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#14192C",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#14192C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
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
    backgroundColor: "#FF5B6A",
  },
  checkout: {
    backgroundColor: "rgba(26,28,48,0.07)",
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
