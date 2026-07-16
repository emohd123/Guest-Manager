import React, { useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * RN-native port of the React Bits "Dock" component (which is DOM/motion-only).
 * Uses the built-in Animated API — no extra dependencies — so it runs on web
 * AND on native (Android/EAS). On web it magnifies on hover with a macOS-style
 * neighbour falloff; on touch it scales the pressed item.
 */
export type DockItemData = {
  key?: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  active?: boolean;
  badge?: number;
};

const IS_WEB = Platform.OS === "web";

export function Dock({
  items,
  panelHeight = 66,
  baseItemSize = 50,
  magnification = 68,
}: {
  items: DockItemData[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
}) {
  // One animated size value per item, reset if the item count changes.
  const sizes = useMemo(
    () => items.map(() => new Animated.Value(baseItemSize)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, baseItemSize]
  );

  const animate = (index: number, to: number) => {
    Animated.spring(sizes[index], {
      toValue: to,
      useNativeDriver: false, // width/height are layout props
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const boost = magnification - baseItemSize;
  // Magnify the focused item and let the effect fall off to its neighbours.
  const applyHover = (index: number) => {
    items.forEach((_, i) => {
      const d = Math.abs(i - index);
      const target =
        d === 0 ? magnification : d === 1 ? baseItemSize + boost * 0.5 : d === 2 ? baseItemSize + boost * 0.2 : baseItemSize;
      animate(i, target);
    });
  };
  const clearHover = () => items.forEach((_, i) => animate(i, baseItemSize));

  return (
    <View style={[styles.panel, { minHeight: panelHeight + 12 }]} accessibilityRole="toolbar">
      {items.map((item, i) => (
        <DockItem
          key={item.key ?? i}
          item={item}
          size={sizes[i]}
          baseItemSize={baseItemSize}
          magnification={magnification}
          onHoverIn={() => applyHover(i)}
          onHoverOut={clearHover}
          onPressScale={(to) => !IS_WEB && animate(i, to)}
        />
      ))}
    </View>
  );
}

function DockItem({
  item,
  size,
  baseItemSize,
  magnification,
  onHoverIn,
  onHoverOut,
  onPressScale,
}: {
  item: DockItemData;
  size: Animated.Value;
  baseItemSize: number;
  magnification: number;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPressScale: (to: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const showLabel = hovered || item.active;

  return (
    <Animated.View style={[styles.itemWrap, { width: size, height: size }]}>
      {showLabel ? (
        <View style={styles.label} pointerEvents="none">
          <Text style={styles.labelText}>{item.label}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={item.onPress}
        onHoverIn={() => {
          setHovered(true);
          onHoverIn();
        }}
        onHoverOut={() => {
          setHovered(false);
          onHoverOut();
        }}
        onPressIn={() => onPressScale(magnification)}
        onPressOut={() => onPressScale(baseItemSize)}
        style={[styles.item, item.active && styles.itemActive]}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: !!item.active }}
      >
        {item.active && item.activeIcon ? item.activeIcon : item.icon}
        {item.badge && item.badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge > 9 ? "9+" : item.badge}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 6,
    borderRadius: 28,
    backgroundColor: "rgba(10,16,32,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 12,
  },
  itemWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  item: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  itemActive: {
    backgroundColor: "rgba(124,58,237,0.42)",
    borderColor: "rgba(167,139,250,0.6)",
  },
  label: {
    position: "absolute",
    top: -30,
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(18,15,23,0.96)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    zIndex: 20,
  },
  labelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DB2777",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
});
