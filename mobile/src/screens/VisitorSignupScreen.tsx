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
            <View style={[styles.field, styles.flexOne]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ahmed"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={[styles.field, styles.flexOne]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Al-Rashad"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
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
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
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
              <Text style={styles.submitText}>Create Account</Text>
            )}
          </Pressable>
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
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
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
    marginTop: 12,
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
