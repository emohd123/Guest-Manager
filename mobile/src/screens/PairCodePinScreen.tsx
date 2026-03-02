import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";

export function PairCodePinScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (input: { accessCode: string; pin: string }) => Promise<void>;
  onBack: () => void;
}) {
  const [accessCode, setAccessCode] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        accessCode: accessCode.trim().toUpperCase(),
        pin: pin.trim(),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to pair");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pair with Access Code</Text>
      <Text style={styles.label}>Access Code</Text>
      <TextInput
        value={accessCode}
        onChangeText={setAccessCode}
        style={styles.input}
        autoCapitalize="characters"
        placeholder="ABC123"
      />
      <Text style={styles.label}>PIN</Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        style={styles.input}
        keyboardType="number-pad"
        placeholder="1234"
        secureTextEntry
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
    marginBottom: 8,
    color: "#0f172a",
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
    fontWeight: "500",
  },
});

