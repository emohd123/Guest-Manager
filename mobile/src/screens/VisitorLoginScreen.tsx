import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";
import { PremiumButton, PremiumField, PremiumNotice } from "../ui/primitives";
import { palette, spacing } from "../ui/theme";

export function VisitorLoginScreen({
  onSubmit,
  onBack,
  onGoSignup,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  onGoSignup: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Login failed. Check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="Ticket"
      eyebrow="Visitor Portal"
      title="Sign in to your event space"
      subtitle="Access tickets, event updates, agenda changes, and organizer messages from one place."
      footer={
        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Text style={styles.footerLink} onPress={onGoSignup}>
            Create one
          </Text>
        </Text>
      }
    >
      <FadeSlideIn delay={90}>
        <View style={styles.form}>
          <PremiumField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <PremiumField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
          />

          {error ? <PremiumNotice tone="danger" text={error} /> : null}

          <PremiumButton
            label="Sign In"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  footerText: {
    color: palette.textMuted,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  footerLink: {
    color: palette.text,
    fontWeight: "800",
  },
});
