import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { MobileGuest } from "../types";
import { FadeSlideIn } from "../ui/motion";
import {
  PremiumButton,
  PremiumCard,
  PremiumField,
  PremiumPill,
  SectionHeading,
} from "../ui/primitives";
import { palette, radii, spacing } from "../ui/theme";

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
        <PremiumCard tone="dark" style={styles.hero}>
          <SectionHeading
            eyebrow="Front Desk"
            title="Guest list"
            body="Search the live roster, confirm ticket holders, and push guests through the line quickly."
            right={<PremiumPill label={`${filtered.length} Guests`} tone="live" />}
          />
        </PremiumCard>
      </FadeSlideIn>

      <FadeSlideIn delay={70}>
        <PremiumField
          label="Search"
          value={search}
          onChangeText={setSearch}
          placeholder="Name, email, or barcode"
        />
      </FadeSlideIn>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const checkedIn = item.attendanceState === "checked_in" || item.status === "checked_in";
          const loading = busyGuestId === item.id;
          const initials = `${item.firstName?.[0] ?? ""}${item.lastName?.[0] ?? ""}`.trim() || "?";

          return (
            <FadeSlideIn delay={80 + index * 18}>
              <PremiumCard style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
                </View>
                <View style={styles.rowMain}>
                  <View style={styles.rowHead}>
                    <Text style={styles.name}>
                      {`${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "Guest"}
                    </Text>
                    <PremiumPill
                      label={checkedIn ? "Checked In" : "Pending"}
                      tone={checkedIn ? "success" : "default"}
                    />
                  </View>
                  <Text style={styles.meta}>
                    {item.email ?? item.ticket?.barcode ?? "No email"}
                  </Text>
                </View>
                <View style={styles.actionWrap}>
                  <PremiumButton
                    label={checkedIn ? "Check Out" : "Check In"}
                    tone={checkedIn ? "secondary" : "primary"}
                    loading={loading}
                    disabled={loading}
                    onPress={() =>
                      checkedIn ? onQuickCheckOut(item) : onQuickCheckIn(item)
                    }
                  />
                </View>
              </PremiumCard>
            </FadeSlideIn>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No guests found for this search.</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: palette.bgElevated,
    borderColor: "rgba(255,255,255,0.12)",
  },
  listContent: {
    paddingBottom: 120,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: palette.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: palette.textInverse,
    fontWeight: "900",
    fontSize: 14,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: palette.text,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  actionWrap: {
    width: 112,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },
});
