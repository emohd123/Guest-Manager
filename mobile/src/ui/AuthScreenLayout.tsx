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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FadeSlideIn } from "./motion";
import { PremiumBackdrop, PremiumCard, PremiumPill } from "./primitives";
import { palette, radii, shadows, spacing, type } from "./theme";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  /** Ionicons glyph name shown in the badge above the title. */
  icon?: keyof typeof Ionicons.glyphMap;
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
  const insets = useSafeAreaInsets();
  return (
    <PremiumBackdrop>
      <View style={styles.root}>
        <View style={[styles.heroPanel, { paddingTop: insets.top + 14 }]}>
          <View style={styles.heroTopRow}>
            {onBack ? (
              <Pressable style={styles.backBtn} onPress={onBack} accessibilityRole="button">
                <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}
            {eyebrow ? <PremiumPill label={eyebrow} tone="live" /> : null}
          </View>

          <View style={styles.top}>
            {icon ? (
              <View style={styles.iconBadge}>
                <Ionicons name={icon} size={26} color="#FFFFFF" />
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Experience</Text>
                <Text style={styles.miniStatValue}>Live Event</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Surface</Text>
                <Text style={styles.miniStatValue}>Ticket + Agenda</Text>
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
                contentContainerStyle={[styles.cardContent, { paddingBottom: spacing.xxxl + insets.bottom }, contentContainerStyle]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
    // paddingTop is applied inline from safe-area insets.
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    minHeight: 42,
  },
  top: {
    gap: spacing.sm,
  },
  backBtn: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
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
  iconBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    marginBottom: 8,
    width: 58,
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
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
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
