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
    <AuthScreenLayout
      onBack={onBack}
      icon="Join"
      eyebrow="Event Access"
      title="Connect to an event"
      subtitle="Enter the code from your invitation or ticket to unlock the event feed inside the app."
    >
      <FadeSlideIn delay={80}>
        <View style={styles.stack}>
          <View style={styles.codeBox}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="ED16114A"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.primaryButton, (loading || !code.trim()) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading || !code.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Connect to Event</Text>}
          </Pressable>

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Where to find it</Text>
            <Text style={styles.hintText}>
              Event codes are usually shown in the invitation email, ticket PDF, or attendee portal.
            </Text>
          </View>
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  codeBox: {
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: "rgba(26,28,48,0.06)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: 4,
    textAlign: "center",
    shadowColor: "#14192C",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  errorBox: {
    backgroundColor: "rgba(255,91,106,0.1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,91,106,0.3)",
  },
  errorText: {
    color: "#FF5B6A",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  successBox: {
    backgroundColor: "rgba(22,163,74,0.1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.3)",
  },
  successText: {
    color: "#16a34a",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 8,
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
    opacity: 0.5,
    shadowOpacity: 0,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  hintBox: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
  },
  hintTitle: {
    color: "#1A1C30",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  hintText: {
    color: "#74809A",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
});
