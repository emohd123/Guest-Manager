import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

  return (
    <View style={styles.container}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search guests"
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
                  <Text style={styles.actionText}>{loading ? "..." : "Check Out"}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.action, styles.checkin]}
                  disabled={loading}
                  onPress={() => onQuickCheckIn(item)}
                >
                  <Text style={styles.actionText}>{loading ? "..." : "Check In"}</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No guests found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowMain: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  meta: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 12,
  },
  action: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  checkin: {
    backgroundColor: "#16a34a",
  },
  checkout: {
    backgroundColor: "#2563eb",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#64748b",
  },
});

