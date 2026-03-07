import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";
import { PremiumButton, PremiumField, PremiumNotice } from "../ui/primitives";
import { palette, spacing } from "../ui/theme";

export function VisitorSignupScreen({
  onSubmit,
  onBack,
  onGoLogin,
}: {
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onBack: () => void;
  onGoLogin: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="Spark"
      eyebrow="New Visitor"
      title="Create your visitor account"
      subtitle="Set up a profile once, then jump between tickets, schedules, updates, and event messages without friction."
      footer={
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.footerLink} onPress={onGoLogin}>
            Sign in
          </Text>
        </Text>
      }
    >
      <FadeSlideIn delay={90}>
        <View style={styles.form}>
          <View style={styles.row}>
            <PremiumField
              containerStyle={styles.flexOne}
              label="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ahmed"
            />
            <PremiumField
              containerStyle={styles.flexOne}
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Al-Rashad"
            />
          </View>

          <PremiumField
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <PremiumField
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            secureTextEntry
          />

          <PremiumField
            label="Confirm Password *"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter password"
            secureTextEntry
          />

          {error ? <PremiumNotice tone="danger" text={error} /> : null}

          <PremiumButton
            label="Create Account"
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
  flexOne: {
    flex: 1,
  },
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
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
