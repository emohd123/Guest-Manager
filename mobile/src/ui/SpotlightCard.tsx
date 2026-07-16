import React, { useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * RN-native approximation of the React Bits "SpotlightCard".
 * The original tracks the mouse and paints a radial gradient via a CSS
 * pseudo-element — not expressible in RN/react-native-web. This overlays a
 * glossy sheen + a coloured diagonal spotlight band. The sheen is always
 * visible so the effect reads on native and static screenshots; on web it
 * brightens on hover. Overlay-only: it does NOT impose its own
 * background/padding, so it can wrap existing styled cards.
 */
const IS_WEB = Platform.OS === "web";

export function SpotlightCard({
  children,
  borderRadius = 22,
  spotlightColor = "rgba(139,92,246,0.5)",
  style,
  onPress,
}: {
  children: React.ReactNode;
  borderRadius?: number;
  spotlightColor?: string;
  style?: any;
  onPress?: () => void;
}) {
  // Base sheen is always on; hover pushes it to full strength.
  const boost = useRef(new Animated.Value(0)).current;
  const [, setHovered] = useState(false);

  const animateBoost = (to: number) =>
    Animated.timing(boost, { toValue: to, duration: 240, useNativeDriver: true }).start();

  const sheenOpacity = boost.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Pressable
      style={[{ borderRadius, overflow: "hidden" }, style]}
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
        if (IS_WEB) animateBoost(1);
      }}
      onHoverOut={() => {
        setHovered(false);
        if (IS_WEB) animateBoost(0);
      }}
    >
      {children}
      {/* Top glossy highlight — always visible */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.03)", "transparent"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Coloured diagonal spotlight band — brightens on hover */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: sheenOpacity }]}>
        <LinearGradient
          colors={["transparent", spotlightColor, "transparent"]}
          locations={[0.15, 0.5, 0.85]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Pressable>
  );
}
