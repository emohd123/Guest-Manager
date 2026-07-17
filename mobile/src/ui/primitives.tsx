import React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette, radii, shadows, spacing, type } from "./theme";

export function PremiumBackdrop({
  children,
  mode = "dark",
}: {
  children: React.ReactNode;
  mode?: "dark" | "light";
}) {
  const dark = mode === "dark";

  return (
    <View
      style={[
        styles.backdropRoot,
        { backgroundColor: dark ? palette.bg : palette.surface },
      ]}
    >
      {children}
    </View>
  );
}

export function PremiumCard({
  children,
  style,
  tone = "light",
}: {
  children: React.ReactNode;
  style?: object;
  tone?: "light" | "dark" | "glass";
}) {
  return (
    <View
      style={[
        styles.card,
        tone === "dark" && styles.cardDark,
        tone === "glass" && styles.cardGlass,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PremiumButton({
  label,
  onPress,
  loading,
  disabled,
  tone = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const secondary = tone === "secondary";
  const ghost = tone === "ghost";
  const pressScale = React.useRef(new Animated.Value(1)).current;
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (secondary || ghost || disabled || loading) {
      shimmer.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.delay(1100),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [disabled, ghost, loading, secondary, shimmer]);

  function animatePress(toValue: number) {
    Animated.spring(pressScale, {
      toValue,
      speed: 32,
      bounciness: 6,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        style={[
          styles.button,
          secondary && styles.buttonSecondary,
          ghost && styles.buttonGhost,
          (disabled || loading) && styles.buttonDisabled,
        ]}
        onPress={onPress}
        onPressIn={() => !disabled && !loading && animatePress(0.975)}
        onPressOut={() => !disabled && !loading && animatePress(1)}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {!secondary && !ghost && !disabled && !loading ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.buttonShimmer,
              {
                transform: [
                  {
                    // End well past the right edge so the sweep fully exits
                    // during the hold (no wedge lingering at the button edge).
                    translateX: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-260, 420],
                    }),
                  },
                  { rotate: "18deg" },
                ],
              },
            ]}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={secondary || ghost ? palette.text : palette.textInverse} />
        ) : (
          <View style={styles.buttonContent}>
            {icon ? (
              <Ionicons
                name={icon}
                size={18}
                color={secondary || ghost ? palette.text : palette.textInverse}
              />
            ) : null}
            <Text
              style={[
                styles.buttonText,
                (secondary || ghost) && styles.buttonTextSecondary,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function PremiumField({
  label,
  hint,
  error,
  multiline,
  containerStyle,
  ...props
}: TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
  containerStyle?: object;
}) {
  // When the field is a password (secureTextEntry), render a show/hide eye
  // toggle. We track visibility locally and override secureTextEntry so the
  // caller just passes `secureTextEntry` as before.
  const isPassword = Boolean(props.secureTextEntry);
  const [hidden, setHidden] = React.useState(true);

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View>
        <TextInput
          {...props}
          secureTextEntry={isPassword ? hidden : props.secureTextEntry}
          multiline={multiline}
          placeholderTextColor="#9AA2B4"
          style={[
            styles.fieldInput,
            multiline && styles.fieldInputMultiline,
            isPassword && styles.fieldInputWithIcon,
            props.style,
          ]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            style={styles.fieldEyeButton}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={palette.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {error ? <PremiumNotice tone="danger" text={error} /> : null}
    </View>
  );
}

export function PremiumNotice({
  tone = "default",
  text,
}: {
  tone?: "default" | "danger" | "success";
  text: string;
}) {
  return (
    <View
      style={[
        styles.notice,
        tone === "danger" && styles.noticeDanger,
        tone === "success" && styles.noticeSuccess,
      ]}
    >
      <Text
        style={[
          styles.noticeText,
          tone === "danger" && styles.noticeTextDanger,
          tone === "success" && styles.noticeTextSuccess,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function PremiumPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "live" | "success";
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "live" && styles.pillLive,
        tone === "success" && styles.pillSuccess,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === "live" && styles.pillTextInverse,
          tone === "success" && styles.pillTextInverse,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  right,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingText}>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
        {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  backdropRoot: {
    flex: 1,
    overflow: "hidden",
  },
  card: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    ...shadows.soft,
  },
  cardDark: {
    backgroundColor: "#0D1733",
    borderColor: palette.lineInverse,
  },
  cardGlass: {
    backgroundColor: "rgba(255,255,255,0.075)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  button: {
    minHeight: 60,
    borderRadius: radii.md,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    ...shadows.glow,
  },
  buttonShimmer: {
    position: "absolute",
    bottom: -24,
    top: -24,
    width: 70,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  buttonSecondary: {
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.line,
    shadowOpacity: 0.06,
  },
  buttonGhost: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
  },
  buttonText: {
    color: palette.textInverse,
    fontSize: type.bodyLg,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  buttonTextSecondary: {
    color: palette.text,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: type.label,
    fontWeight: "800",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  fieldInput: {
    minHeight: 58,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: 17,
    color: palette.text,
    fontSize: 16,
    ...shadows.soft,
  },
  fieldInputWithIcon: {
    paddingRight: 52,
  },
  fieldEyeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldInputMultiline: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  fieldHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  notice: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.sm,
    backgroundColor: "rgba(37,99,235,0.07)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.1)",
  },
  noticeDanger: {
    backgroundColor: "rgba(243,94,115,0.12)",
    borderColor: "rgba(243,94,115,0.24)",
  },
  noticeSuccess: {
    backgroundColor: "rgba(39,192,125,0.12)",
    borderColor: "rgba(39,192,125,0.24)",
  },
  noticeText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  noticeTextDanger: {
    color: palette.danger,
  },
  noticeTextSuccess: {
    color: palette.success,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(37,99,235,0.1)",
  },
  pillLive: {
    backgroundColor: palette.accent,
  },
  pillSuccess: {
    backgroundColor: palette.success,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.text,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  pillTextInverse: {
    color: palette.textInverse,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionEyebrow: {
    color: palette.accentCool,
    fontSize: type.eyebrow,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: type.title,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  sectionBody: {
    marginTop: 8,
    color: palette.textMuted,
    fontSize: type.body,
    lineHeight: 20,
  },
});
