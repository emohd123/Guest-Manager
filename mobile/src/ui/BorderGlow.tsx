import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * RN-native approximation of the React Bits "BorderGlow".
 * The original is a DOM-only effect (conic-gradient mask + mix-blend-mode on
 * pseudo-elements) that RN/react-native-web can't express. This version keeps
 * the spirit: a multi-colour gradient border with a softly pulsing glow that
 * intensifies on hover (web) — and it runs on native too.
 */
const IS_WEB = Platform.OS === "web";

export function BorderGlow({
  children,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  backgroundColor = "#0d1326",
  borderRadius = 28,
  borderWidth = 1.5,
  glowRadius = 26,
  style,
}: {
  children: React.ReactNode;
  colors?: string[];
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  glowRadius?: number;
  style?: any;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const ring = [colors[0], colors[1] ?? colors[0], colors[2] ?? colors[0], colors[0]];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2600, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 2600, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowOpacity = hovered ? 0.95 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const webGlow = IS_WEB
    ? ({
        boxShadow: `0 0 ${glowRadius}px ${hovered ? 6 : 2}px ${hexToRgba(colors[0], hovered ? 0.55 : 0.32)}`,
      } as any)
    : {
        shadowColor: colors[0],
        shadowOpacity: hovered ? 0.6 : 0.35,
        shadowRadius: glowRadius,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
      };

  return (
    <Pressable
      style={style}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Animated.View style={[{ borderRadius }, webGlow]}>
        {/* Bright pulsing halo ring */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius, opacity: glowOpacity }]}>
          <LinearGradient
            colors={ring as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius }}
          />
        </Animated.View>
        {/* Solid gradient border ring */}
        <LinearGradient
          colors={ring as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius, padding: borderWidth }}
        >
          <View style={{ borderRadius: Math.max(borderRadius - borderWidth, 0), backgroundColor, overflow: "hidden" }}>
            {children}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
