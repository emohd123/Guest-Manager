import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";

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
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              placeholderTextColor="#94a3b8"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Sign In</Text>
            )}
          </Pressable>
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8C94A8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#1A1C30",
    shadowColor: "#14192C",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  error: {
    color: "#FF5B6A",
    fontSize: 13,
    backgroundColor: "rgba(255,91,106,0.1)",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,91,106,0.3)",
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: "#FF5B6A",
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 7,
  },
  submitDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footerText: {
    color: "#7D859B",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  footerLink: {
    color: "#1A1C30",
    fontWeight: "800",
  },
});
