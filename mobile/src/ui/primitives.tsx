import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
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
      <View
        style={[
          styles.glow,
          styles.glowTop,
          { backgroundColor: dark ? "rgba(255,110,98,0.18)" : "rgba(255,110,98,0.12)" },
        ]}
      />
      <View
        style={[
          styles.glow,
          styles.glowBottom,
          { backgroundColor: dark ? "rgba(127,139,255,0.16)" : "rgba(127,139,255,0.1)" },
        ]}
      />
      <View
        style={[
          styles.mesh,
          { borderColor: dark ? "rgba(255,255,255,0.04)" : "rgba(19,26,42,0.04)" },
        ]}
      />
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
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "ghost";
}) {
  const secondary = tone === "secondary";
  const ghost = tone === "ghost";

  return (
    <Pressable
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        ghost && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={secondary || ghost ? palette.text : palette.textInverse} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            (secondary || ghost) && styles.buttonTextSecondary,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
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
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#9AA2B4"
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline, props.style]}
      />
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
  glow: {
    position: "absolute",
    borderRadius: radii.pill,
  },
  glowTop: {
    width: 260,
    height: 260,
    top: -80,
    right: -70,
  },
  glowBottom: {
    width: 280,
    height: 280,
    left: -100,
    bottom: 90,
  },
  mesh: {
    ...StyleSheet.absoluteFillObject,
    margin: 18,
    borderRadius: 28,
    borderWidth: 1,
    opacity: 0.75,
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
    backgroundColor: palette.bgElevated,
    borderColor: palette.lineInverse,
  },
  cardGlass: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  button: {
    minHeight: 60,
    borderRadius: radii.md,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    ...shadows.glow,
  },
  buttonSecondary: {
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.line,
    shadowOpacity: 0.06,
  },
  buttonGhost: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: palette.textInverse,
    fontSize: type.bodyLg,
    fontWeight: "800",
    letterSpacing: 0.4,
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
    backgroundColor: "rgba(19,26,42,0.06)",
    borderWidth: 1,
    borderColor: "rgba(19,26,42,0.08)",
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
    backgroundColor: "rgba(19,26,42,0.08)",
  },
  pillLive: {
    backgroundColor: palette.accentLive,
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
    color: palette.accentStrong,
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
