import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

/**
 * ClickStack — click-to-cycle animated card stack.
 *
 * Native adaptation of the React Bits Pro "Click Stack" component
 * (https://pro.reactbits.dev/docs/components/click-stack) with the same
 * tuning knobs (spreadX / spreadY / duration / visibleCount / depthScale /
 * depthOpacity). Tapping the top card flings it off and cycles it to the
 * back of the deck; the rest of the deck springs forward one level.
 */
export function ClickStack({
  count,
  renderCard,
  cardHeight = 170,
  spreadX = 0,
  spreadY = -14,
  duration = 320,
  visibleCount = 3,
  depthScale = 0.05,
  depthOpacity = 0.28,
  onCycle,
}: {
  count: number;
  renderCard: (index: number) => React.ReactNode;
  cardHeight?: number;
  spreadX?: number;
  spreadY?: number;
  duration?: number;
  visibleCount?: number;
  depthScale?: number;
  depthOpacity?: number;
  /** Called with the item index that just became the top card. */
  onCycle?: (topIndex: number) => void;
}) {
  const useNative = Platform.OS !== "web";
  const { width } = useWindowDimensions();
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: count }, (_, i) => i));
  const depthRef = useRef<Animated.Value[]>([]);
  if (depthRef.current.length !== count) {
    depthRef.current = Array.from({ length: count }, (_, i) => new Animated.Value(i));
  }
  const fling = useRef(new Animated.Value(0)).current;
  const [flingingIndex, setFlingingIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Re-initialise when the data set changes size (e.g. events load async).
  useEffect(() => {
    setOrder(Array.from({ length: count }, (_, i) => i));
    depthRef.current.forEach((value, i) => value.setValue(i));
    fling.setValue(0);
    setFlingingIndex(null);
    setBusy(false);
  }, [count, fling]);

  if (count === 0) return null;

  const maxDepth = Math.max(count - 1, 1);
  const headroom = Math.abs(spreadY) * Math.min(visibleCount - 1, maxDepth);

  const cycle = () => {
    if (busy || count < 2) return;
    setBusy(true);
    const top = order[0];
    setFlingingIndex(top);
    Animated.timing(fling, {
      toValue: 1,
      duration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: useNative,
    }).start(() => {
      const nextOrder = [...order.slice(1), top];
      setOrder(nextOrder);
      depthRef.current[top].setValue(maxDepth + 1);
      fling.setValue(0);
      setFlingingIndex(null);
      Animated.parallel(
        nextOrder.map((itemIndex, position) =>
          Animated.spring(depthRef.current[itemIndex], {
            toValue: position,
            useNativeDriver: useNative,
            speed: 15,
            bounciness: 7,
          })
        )
      ).start(() => setBusy(false));
      onCycle?.(nextOrder[0]);
    });
  };

  return (
    <View style={{ height: cardHeight + headroom, paddingTop: headroom }}>
      {order
        .map((itemIndex, position) => ({ itemIndex, position }))
        // Paint back-to-front so the top card wins touches without zIndex games.
        .sort((a, b) => b.position - a.position)
        .map(({ itemIndex, position }) => {
          const depth = depthRef.current[itemIndex];
          const inputRange = [0, maxDepth + 1];
          const translateY = depth.interpolate({
            inputRange,
            outputRange: [0, spreadY * (maxDepth + 1)],
          });
          const baseX = depth.interpolate({
            inputRange,
            outputRange: [0, spreadX * (maxDepth + 1)],
          });
          const scale = depth.interpolate({
            inputRange,
            outputRange: [1, Math.max(1 - depthScale * (maxDepth + 1), 0.5)],
          });
          const fade = depth.interpolate({
            inputRange:
              count > visibleCount
                ? [0, Math.max(visibleCount - 1, 0.001), visibleCount, maxDepth + 1]
                : [0, Math.max(maxDepth, 0.001), maxDepth + 0.5, maxDepth + 1],
            outputRange:
              count > visibleCount
                ? [1, Math.max(1 - depthOpacity * (visibleCount - 1), 0.1), 0, 0]
                : [1, Math.max(1 - depthOpacity * maxDepth, 0.15), Math.max(1 - depthOpacity * maxDepth, 0.15) / 2, 0],
            extrapolate: "clamp",
          });
          const isFlinging = flingingIndex === itemIndex;
          const flingX = fling.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 1.05] });
          const flingRotate = fling.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-9deg"] });

          return (
            <Animated.View
              key={itemIndex}
              pointerEvents={position === 0 ? "auto" : "none"}
              style={[
                StyleSheet.absoluteFillObject,
                { top: headroom, height: cardHeight },
                {
                  opacity: isFlinging ? 1 : fade,
                  transform: isFlinging
                    ? [{ translateX: flingX }, { rotate: flingRotate }]
                    : [{ translateX: baseX }, { translateY }, { scale }],
                },
              ]}
            >
              <Pressable
                onPress={cycle}
                disabled={position !== 0 || count < 2}
                style={styles.cardPressable}
                accessibilityRole="button"
                accessibilityLabel="Show next card"
              >
                {renderCard(itemIndex)}
              </Pressable>
            </Animated.View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    flex: 1,
  },
});
