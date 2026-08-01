import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type DockItemData = {
  key?: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  active?: boolean;
  badge?: number;
};

/** Fixed five-item navigation, shared by the visitor app and website. */
export function Dock({ items }: { items: DockItemData[]; panelHeight?: number; baseItemSize?: number; magnification?: number }) {
  return (
    <View style={styles.panel} accessibilityRole="tablist">
      {items.map((item, index) => (
        <Pressable
          key={item.key ?? index}
          onPress={item.onPress}
          style={({ pressed }) => [styles.item, item.active && styles.itemActive, pressed && styles.itemPressed]}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: !!item.active }}
        >
          <View style={styles.iconWrap}>
            {item.active && item.activeIcon ? item.activeIcon : item.icon}
            {item.badge && item.badge > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.badge > 9 ? "9+" : item.badge}</Text></View> : null}
          </View>
          <Text numberOfLines={1} style={[styles.label, item.active && styles.labelActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 420, borderRadius: 24, padding: 5, backgroundColor: "rgba(255,255,255,0.97)", borderWidth: 1, borderColor: "rgba(148,163,184,0.28)", shadowColor: "#0f172a", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 12 },
  item: { flex: 1, minWidth: 52, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 18, paddingVertical: 7 },
  itemActive: { backgroundColor: "#EFF6FF" },
  itemPressed: { opacity: 0.72 },
  iconWrap: { position: "relative", height: 24, alignItems: "center", justifyContent: "center" },
  label: { color: "#334155", fontSize: 9, fontWeight: "800", letterSpacing: -0.1 },
  labelActive: { color: "#2563EB" },
  badge: { position: "absolute", top: -4, right: -10, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: "#db2777", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
});
