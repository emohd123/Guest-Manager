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
  Animated,
} from "react-native";
import { useEffect } from "react";

export function VisitorSignupScreen({
  onSubmit,
  onBack,
  onGoLogin,
}: {
  onSubmit: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
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
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Animations
  const [slideAnim] = useState(() => new Animated.Value(50));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
      {/* Top Navy Section */}
      <View style={styles.navyTop}>
        <View style={styles.headerNav}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.header}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>
            Register to access your event tickets & agenda
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          style={[ { flex: 1 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] } ]}
        >

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ahmed"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={onGoLogin}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A1C30" }, // Deep Navy behind everything
  navyTop: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: "#1A1C30",
  },
  headerNav: { flexDirection: "row", marginBottom: 20 },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  header: { alignItems: "center" },
  icon: { fontSize: 44, marginBottom: 16 },
  heading: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", marginBottom: 8, letterSpacing: -0.5 },
  subheading: { fontSize: 15, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 22 },
  
  container: {
    flexGrow: 1,
    padding: 32,
    backgroundColor: "#EFF2F7", // Very light gray content wrapper
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  form: { gap: 16 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: "800", color: "#A0A5B1", textTransform: "uppercase", letterSpacing: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#1A1C30",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  error: {
    color: "#FF5B6A",
    fontSize: 13,
    backgroundColor: "rgba(255,91,106,0.1)",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,91,106,0.3)",
    fontWeight: "600"
  },
  submitBtn: {
    marginTop: 12,
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
  submitDisabled: { opacity: 0.6, shadowOpacity: 0 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: { color: "#8E94A3", fontSize: 14, fontWeight: "500" },
  footerLink: { color: "#1A1C30", fontWeight: "800", fontSize: 14 },
});
