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

export function PairStaffScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (input: { staffToken: string; eventId: string }) => Promise<void>;
  onBack: () => void;
}) {
  const [staffToken, setStaffToken] = useState("");
  const [eventId, setEventId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        staffToken: staffToken.trim(),
        eventId: eventId.trim(),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to pair");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="Admin"
      eyebrow="Manual Pairing"
      title="Pair with staff token"
      subtitle="Use a staff token and event ID when this device is being set up by your event team."
    >
      <FadeSlideIn delay={90}>
        <View style={styles.stack}>
          <Text style={styles.label}>Staff Access Token</Text>
          <TextInput
            value={staffToken}
            onChangeText={setStaffToken}
            style={styles.input}
            placeholder="eyJhbGciOi..."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Event ID</Text>
          <TextInput
            value={eventId}
            onChangeText={setEventId}
            style={styles.input}
            placeholder="a67cf2a8-..."
            placeholderTextColor="#94A3B8"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Pair Device</Text>}
          </Pressable>
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  label: {
    color: "#8C94A8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(26,28,48,0.06)",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#1A1C30",
    marginBottom: 8,
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
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 16,
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
  primaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
