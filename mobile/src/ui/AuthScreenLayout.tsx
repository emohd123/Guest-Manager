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
    <View style={styles.root}>
      <View style={styles.backdrop}>
        <View style={[styles.orb, styles.orbCoral]} />
        <View style={[styles.orb, styles.orbBlue]} />
        <View style={styles.grid} />
      </View>

      <View style={styles.top}>
        {onBack ? (
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FadeSlideIn style={styles.card} delay={40}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.cardContent,
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </FadeSlideIn>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#13182C",
  },
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbCoral: {
    width: 220,
    height: 220,
    right: -72,
    top: 72,
    backgroundColor: "rgba(255,91,106,0.16)",
  },
  orbBlue: {
    width: 180,
    height: 180,
    left: -48,
    top: 220,
    backgroundColor: "rgba(98,129,255,0.14)",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    borderWidth: 0,
  },
  top: {
    paddingTop: Platform.OS === "ios" ? 58 : 38,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 22,
  },
  backSpacer: {
    height: 50,
  },
  backText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  eyebrow: {
    color: "#FF8B96",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  icon: {
    fontSize: 36,
    marginBottom: 12,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.72)",
    maxWidth: 340,
  },
  card: {
    flex: 1,
    backgroundColor: "#EEF2F8",
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    overflow: "hidden",
  },
  cardContent: {
    padding: 28,
    paddingTop: 30,
    paddingBottom: 40,
  },
  footer: {
    marginTop: 28,
  },
});
