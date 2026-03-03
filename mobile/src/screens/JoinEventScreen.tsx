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
} from "react-native";

export function JoinEventScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (code: string) => Promise<string>;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Please enter a valid event code.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const msg = await onSubmit(trimmed);
      setSuccess(msg);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code not found. Check and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.icon}>🔗</Text>
        <Text style={styles.heading}>Join with Event Code</Text>
        <Text style={styles.subheading}>
          Enter the unique code from your ticket or invitation email to connect to an event
        </Text>

        <View style={styles.codeBox}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="e.g. ED16114A"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ {success}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.submitBtn, (loading || !code.trim()) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading || !code.trim()}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Connect to Event</Text>}
        </Pressable>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {'💡 Find the event code on your ticket email or PDF — it looks like “ED16114A”'}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f8fafc" },
  backBtn: { marginBottom: 24 },
  backText: { color: "#4338ca", fontWeight: "600", fontSize: 14 },
  icon: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  heading: { fontSize: 22, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 8 },
  subheading: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 28 },
  codeBox: { marginBottom: 14 },
  codeInput: {
    borderWidth: 2,
    borderColor: "#c7d2fe",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    color: "#4338ca",
    letterSpacing: 4,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fef2f2", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#fecaca", marginBottom: 12,
  },
  errorText: { color: "#dc2626", fontSize: 13, textAlign: "center" },
  successBox: {
    backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#bbf7d0", marginBottom: 12,
  },
  successText: { color: "#15803d", fontSize: 13, textAlign: "center", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#4338ca", borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginBottom: 20,
    shadowColor: "#4338ca", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: {
    backgroundColor: "#eef2ff", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#c7d2fe",
  },
  hintText: { color: "#4338ca", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
