import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
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
