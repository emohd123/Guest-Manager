import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from "react-native";

const COLORS = ["#67E8F9", "#7C3AED", "#EC4899", "#F59E0B", "#34D399", "#FFFFFF"];
const { width: SCREEN_W } = Dimensions.get("window");

/**
 * Lightweight celebratory confetti — a one-shot burst of colored shreds that
 * rain down, spin, and fade. Native-driver transforms only; renders nothing
 * once finished. Mount it when something worth celebrating happens.
 */
export function Confetti({
  count = 28,
  onDone,
}: {
  count?: number;
  onDone?: () => void;
}) {
  const useNative = Platform.OS !== "web";
  const pieces = useRef(
    Array.from({ length: count }, (_, i) => ({
      key: i,
      left: Math.random() * SCREEN_W,
      color: COLORS[i % COLORS.length],
      size: 7 + Math.random() * 7,
      delay: Math.random() * 260,
      duration: 1500 + Math.random() * 900,
      drift: (Math.random() - 0.5) * 180,
      spin: (Math.random() > 0.5 ? 1 : -1) * (540 + Math.random() * 360),
      progress: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const anims = pieces.map((p) =>
      Animated.timing(p.progress, {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      })
    );
    const group = Animated.parallel(anims);
    group.start(() => onDone?.());
    return () => group.stop();
  }, [pieces, useNative, onDone]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => {
        const translateY = p.progress.interpolate({ inputRange: [0, 1], outputRange: [-30, 640] });
        const translateX = p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = p.progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] });
        const opacity = p.progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={p.key}
            style={{
              position: "absolute",
              top: 0,
              left: p.left,
              width: p.size,
              height: p.size * 0.6,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
