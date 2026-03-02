import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";

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
    <View style={styles.container}>
      <Text style={styles.heading}>Pair with Staff Token</Text>
      <Text style={styles.description}>
        Paste a Supabase access token and event id for your staff account.
      </Text>
      <Text style={styles.label}>Staff Access Token</Text>
      <TextInput
        value={staffToken}
        onChangeText={setStaffToken}
        style={styles.input}
        placeholder="eyJhbGciOi..."
      />
      <Text style={styles.label}>Event ID</Text>
      <TextInput
        value={eventId}
        onChangeText={setEventId}
        style={styles.input}
        placeholder="a67cf2a8-..."
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Pair Device</Text>}
      </Pressable>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  description: {
    color: "#64748b",
    marginBottom: 6,
  },
  label: {
    color: "#334155",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  error: {
    color: "#dc2626",
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#4338ca",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backText: {
    color: "#475569",
  },
});

