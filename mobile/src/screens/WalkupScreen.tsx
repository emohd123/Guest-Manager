import React, { useState, useEffect } from "react";
import { Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Animated } from "react-native";

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

  const [slideAnim] = useState(() => new Animated.Value(30));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.ScrollView 
      style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Add Walkup</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#A0A5B1" />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#A0A5B1" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" placeholderTextColor="#A0A5B1" />
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" placeholderTextColor="#A0A5B1" />

      <Pressable style={styles.toggle} onPress={() => setCheckInNow((value) => !value)}>
        <Text style={styles.toggleText}>
          {checkInNow ? "Immediate check-in: ON" : "Immediate check-in: OFF"}
        </Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Walkup</Text>}
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: 24,
    paddingBottom: 100, // accommodate tab bar
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1C30",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: "#1A1C30",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  toggle: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  toggleText: {
    color: "#1A1C30",
    fontWeight: "800",
    fontSize: 14,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#FF5B6A", // Coral
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  message: {
    marginTop: 12,
    color: "#1A1C30",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});

