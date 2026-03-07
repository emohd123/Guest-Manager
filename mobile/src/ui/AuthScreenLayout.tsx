import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FadeSlideIn } from "./motion";
import { PremiumBackdrop, PremiumCard, PremiumPill } from "./primitives";
import { palette, radii, shadows, spacing, type } from "./theme";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  icon?: string;
  eyebrow?: string;
  footer?: React.ReactNode;
  contentContainerStyle?: object;
};

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  onBack,
  icon,
  eyebrow,
  footer,
  contentContainerStyle,
}: Props) {
  return (
    <PremiumBackdrop>
      <View style={styles.root}>
        <View style={styles.heroPanel}>
          <View style={styles.heroTopRow}>
            {onBack ? (
              <Pressable style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}
            {eyebrow ? <PremiumPill label={eyebrow} tone="live" /> : null}
          </View>

          <View style={styles.top}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Experience</Text>
                <Text style={styles.miniStatValue}>Premium Mobile</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Surface</Text>
                <Text style={styles.miniStatValue}>Attendee + Staff</Text>
              </View>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FadeSlideIn style={styles.cardWrap} delay={40}>
            <PremiumCard style={styles.card}>
              <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.cardContent, contentContainerStyle]}
                keyboardShouldPersistTaps="handled"
              >
                {children}
                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </ScrollView>
            </PremiumCard>
          </FadeSlideIn>
        </KeyboardAvoidingView>
      </View>
    </PremiumBackdrop>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  heroPanel: {
    paddingTop: Platform.OS === "ios" ? 58 : 38,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    minHeight: 42,
  },
  top: {
    gap: spacing.sm,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  backSpacer: {
    width: 64,
  },
  backText: {
    color: palette.textInverse,
    fontWeight: "800",
    fontSize: 13,
  },
  icon: {
    fontSize: 34,
    marginBottom: 8,
    color: palette.textInverse,
    fontWeight: "800",
  },
  title: {
    fontSize: type.hero,
    fontWeight: "900",
    color: palette.textInverse,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 2,
    fontSize: type.bodyLg,
    lineHeight: 23,
    color: palette.textSoft,
    maxWidth: 360,
  },
  miniStats: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  miniStat: {
    flex: 1,
  },
  miniStatDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  miniStatLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  miniStatValue: {
    color: palette.textInverse,
    fontSize: 14,
    fontWeight: "700",
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    padding: 0,
    ...shadows.strong,
  },
  cardContent: {
    padding: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  footer: {
    marginTop: spacing.xl,
  },
});
