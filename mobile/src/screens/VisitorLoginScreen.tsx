import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

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
      setError(e instanceof Error ? e.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.icon}>🎟️</Text>
          <Text style={styles.heading}>Visitor Login</Text>
          <Text style={styles.subheading}>
            Sign in to view your tickets, agenda and notifications
          </Text>
        </View>

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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={onGoSignup}>
            <Text style={styles.footerLink}>Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  backBtn: { marginBottom: 20 },
  backText: { color: "#4338ca", fontWeight: "600", fontSize: 14 },
  header: { marginBottom: 28, alignItems: "center" },
  icon: { fontSize: 44, marginBottom: 10 },
  heading: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  subheading: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
  form: { gap: 14 },
  field: { gap: 5 },
  label: { fontSize: 13, fontWeight: "600", color: "#334155" },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    fontSize: 15,
    color: "#0f172a",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  submitBtn: {
    marginTop: 6,
    backgroundColor: "#4338ca",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#4338ca",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: { color: "#64748b", fontSize: 14 },
  footerLink: { color: "#4338ca", fontWeight: "700", fontSize: 14 },
});
