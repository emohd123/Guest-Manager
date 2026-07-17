import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type EntranceOptions = {
  delay?: number;
  distance?: number;
  duration?: number;
};

export function useEntranceAnimation(options?: EntranceOptions) {
  const delay = options?.delay ?? 0;
  const distance = options?.distance ?? 28;
  const duration = options?.duration ?? 480;
  const useNativeDriver = Platform.OS !== "web";

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const scale = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: duration + 80,
        delay,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
      opacity.setValue(0);
      translateY.setValue(distance);
      scale.setValue(0.985);
    };
  }, [delay, distance, duration, opacity, scale, translateY]);

  return {
    opacity,
    translateY,
    scale,
  };
}

export function FadeSlideIn({
  children,
  style,
  delay,
  distance,
  duration,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  distance?: number;
  duration?: number;
}) {
  const animation = useEntranceAnimation({ delay, distance, duration });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animation.opacity,
          transform: [
            { translateY: animation.translateY },
            { scale: animation.scale },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Pressable that springs down on touch — makes every card feel tactile. */
export function PressScale({
  children,
  style,
  pressedScale = 0.96,
  ...pressableProps
}: PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
}) {
  const useNativeDriver = Platform.OS !== "web";
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver, speed: 30, bounciness: 9 }).start();

  // The wrapper only carries the transform; the Pressable keeps the layout
  // style so absolutely-positioned children size against the card itself.
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...pressableProps}
        style={style}
        onPressIn={(event) => {
          springTo(pressedScale);
          pressableProps.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          springTo(1);
          pressableProps.onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** Gentle opacity pulse — skeleton shimmer, live dots, NEW badges. */
export function PulseView({
  children,
  style,
  minOpacity = 0.55,
  duration = 900,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minOpacity?: number;
  duration?: number;
}) {
  const useNativeDriver = Platform.OS !== "web";
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver }),
        Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, useNativeDriver, value]);

  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [minOpacity, 1] });
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/** Very slow zoom drift for hero imagery (Ken Burns) — pure native-driver scale. */
export function KenBurns({
  children,
  style,
  maxScale = 1.07,
  duration = 9000,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxScale?: number;
  duration?: number;
}) {
  const useNativeDriver = Platform.OS !== "web";
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, useNativeDriver, value]);

  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] });
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

export function usePulseAnimation(active = true) {
  const useNativeDriver = Platform.OS !== "web";
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      value.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [active, useNativeDriver, value]);

  return useMemo(
    () => ({
      opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.48, 1] }),
      scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }),
    }),
    [value]
  );
}
