import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";

export function WalkupScreen({
  onSubmit,
}: {
  onSubmit: (payload: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    checkInNow: boolean;
  }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checkInNow, setCheckInNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!firstName.trim()) {
      setMessage("First name is required");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        checkInNow,
      });
      setMessage("Walkup saved");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Walkup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add Walkup</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />

      <Pressable style={styles.toggle} onPress={() => setCheckInNow((value) => !value)}>
        <Text style={styles.toggleText}>
          {checkInNow ? "Immediate check-in: ON" : "Immediate check-in: OFF"}
        </Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Walkup</Text>}
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggle: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#4338ca",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  message: {
    marginTop: 6,
    color: "#0f172a",
  },
});

