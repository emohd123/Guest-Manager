import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

type Wave = "top" | "middle" | "bottom";

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: Wave[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  animationSpeed?: number;
  topWavePosition?: { x: number; y: number; rotate: number };
  middleWavePosition?: { x: number; y: number; rotate: number };
  bottomWavePosition?: { x: number; y: number; rotate: number };
};

const DEFAULT_GRADIENT = ["#2563EB", "#7C3AED", "#DB2777"];

export function FloatingLines({
  linesGradient = DEFAULT_GRADIENT,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [8, 12, 16],
  lineDistance = [10, 8, 6],
  animationSpeed = 1,
  topWavePosition = { x: -24, y: 40, rotate: -8 },
  middleWavePosition = { x: -16, y: 180, rotate: 5 },
  bottomWavePosition = { x: -28, y: 330, rotate: -10 },
}: FloatingLinesProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = Math.max(4200, 8200 / animationSpeed);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animationSpeed, progress]);

  const waves = useMemo(
    () =>
      [
        { key: "top" as const, position: topWavePosition, opacity: 0.5 },
        { key: "middle" as const, position: middleWavePosition, opacity: 0.62 },
        { key: "bottom" as const, position: bottomWavePosition, opacity: 0.42 },
      ].filter((wave) => enabledWaves.includes(wave.key)),
    [bottomWavePosition, enabledWaves, middleWavePosition, topWavePosition]
  );

  function getValue(source: number | number[], index: number, fallback: number) {
    return Array.isArray(source) ? source[index] ?? fallback : source;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {waves.map((wave, waveIndex) => {
        const count = Math.max(1, getValue(lineCount, waveIndex, 8));
        const distance = getValue(lineDistance, waveIndex, 8);
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [wave.position.x, wave.position.x + 42 + waveIndex * 18],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [wave.position.y, wave.position.y + (waveIndex % 2 === 0 ? 18 : -16)],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [`${wave.position.rotate}deg`, `${wave.position.rotate * -0.55}deg`],
        });

        return (
          <Animated.View
            key={wave.key}
            style={[
              styles.wave,
              {
                opacity: wave.opacity,
                transform: [{ translateX }, { translateY }, { rotate }],
              },
            ]}
          >
            {Array.from({ length: count }).map((_, index) => {
              const color = linesGradient[index % linesGradient.length] ?? DEFAULT_GRADIENT[0];
              const width = 220 + (index % 5) * 46;
              const left = index * distance * 8 - 90;
              const top = Math.sin(index * 0.82) * 34 + index * 7;
              const lineOpacity = 0.32 + (index % 4) * 0.07;

              return (
                <Animated.View
                  key={`${wave.key}-${index}`}
                  style={[
                    styles.line,
                    {
                      left,
                      top,
                      width,
                      opacity: lineOpacity,
                      backgroundColor: color,
                    },
                  ]}
                />
              );
            })}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    position: "absolute",
    left: -140,
    right: -140,
    height: 340,
  },
  line: {
    position: "absolute",
    height: 1.6,
    borderRadius: 999,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.72,
    shadowRadius: 18,
  },
});
