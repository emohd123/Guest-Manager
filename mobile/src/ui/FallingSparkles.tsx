import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

type FallingSparklesProps = {
  /** Sparkle colours, assigned round-robin. */
  colors?: string[];
  /** How many sparkles. Keep modest on low-end devices. */
  count?: number;
  /** Multiplier on fall speed (higher = faster). */
  speed?: number;
};

const DEFAULT_COLORS = ["#38BDF8", "#7C3AED", "#E879F9", "#F59E0B", "#FFFFFF"];
const NATIVE_DRIVER = Platform.OS !== "web";

type Spec = {
  key: number;
  leftPct: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  twinkleMs: number;
  color: string;
  peakOpacity: number;
};

/** One sparkle: falls top→bottom on a loop, sways sideways, and twinkles. */
function Sparkle({ spec, height }: { spec: Spec; height: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fallLoop = Animated.loop(
      Animated.timing(fall, {
        toValue: 1,
        duration: spec.duration,
        delay: spec.delay,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      })
    );
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: spec.twinkleMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: spec.twinkleMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ])
    );
    fallLoop.start();
    twinkleLoop.start();
    return () => {
      fallLoop.stop();
      twinkleLoop.stop();
    };
  }, [fall, twinkle, spec.duration, spec.delay, spec.twinkleMs]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-spec.size - 20, height + spec.size],
  });

  // Animated has no sin(), so approximate a sway with piecewise interpolation.
  const translateX = fall.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, spec.sway, 0, -spec.sway, 0],
  });

  const opacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [spec.peakOpacity * 0.28, spec.peakOpacity],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        {
          left: `${spec.leftPct}%`,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      <Ionicons name="sparkles" size={spec.size} color={spec.color} />
    </Animated.View>
  );
}

export function FallingSparkles({
  colors = DEFAULT_COLORS,
  count = 34,
  speed = 1,
}: FallingSparklesProps) {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  const specs = useMemo<Spec[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = 8 + Math.random() * 16;
      return {
        key: i,
        leftPct: Math.random() * 96,
        size,
        // Bigger sparkles fall faster — cheap depth cue.
        duration: ((16000 - size * 260) / speed) * (0.7 + Math.random() * 0.6),
        delay: Math.random() * 9000,
        sway: 8 + Math.random() * 26,
        twinkleMs: 500 + Math.random() * 1600,
        color: colors[i % colors.length],
        peakOpacity: 0.35 + Math.random() * 0.5,
      };
    });
    // width is included so a rotation/resize reshuffles the field.
  }, [count, colors, speed, width]);

  if (reduceMotion) {
    // Static, evenly-scattered field — no loops, no CPU.
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {specs.map((s) => (
          <View
            key={s.key}
            style={[
              styles.sparkle,
              { left: `${s.leftPct}%`, top: (s.key / count) * height, opacity: s.peakOpacity * 0.6 },
            ]}
          >
            <Ionicons name="sparkles" size={s.size} color={s.color} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {specs.map((s) => (
        <Sparkle key={s.key} spec={s} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: "absolute",
    top: 0,
  },
});
