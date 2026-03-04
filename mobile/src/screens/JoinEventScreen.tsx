import React, { useState, useEffect } from "react";
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

  const [slideAnim] = useState(() => new Animated.Value(50));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.navyTop}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Connect to Event</Text>
        <Text style={styles.description}>
          Enter the unique code from your ticket or invitation email.
        </Text>
      </View>

      <Animated.ScrollView 
        style={[ styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.cardContent}
        keyboardShouldPersistTaps="handled" 
      >
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
          <Text style={styles.hintText}>
            💡 Find the event code on your ticket email or PDF — it looks like &quot;ED16114A&quot;
          </Text>
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A1C30" },
  navyTop: {
    paddingTop: Platform.OS === "android" ? 44 : 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: "#1A1C30",
  },
  backButton: {
    paddingVertical: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    marginLeft: -8,
    paddingHorizontal: 8,
  },
  backText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 10,
    lineHeight: 22,
  },
  card: {
    flex: 1,
    backgroundColor: "#EFF2F7",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  cardContent: {
    padding: 32,
    paddingTop: 40,
    gap: 12,
  },
  codeBox: { marginBottom: 14 },
  codeInput: {
    borderWidth: 2,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: 4,
    textAlign: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  errorBox: {
    backgroundColor: "rgba(255,91,106,0.1)", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,91,106,0.3)", marginBottom: 8,
  },
  errorText: { color: "#FF5B6A", fontSize: 13, textAlign: "center", fontWeight: "600" },
  successBox: {
    backgroundColor: "rgba(22,163,74,0.1)", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "rgba(22,163,74,0.3)", marginBottom: 8,
  },
  successText: { color: "#16a34a", fontSize: 13, textAlign: "center", fontWeight: "600" },
  primaryButton: {
    marginTop: 8,
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
  submitDisabled: { opacity: 0.5, shadowOpacity: 0 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  hintBox: {
    marginTop: 16,
    backgroundColor: "#ffffff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#EBEFF5",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  hintText: { color: "#8E94A3", fontSize: 13, lineHeight: 20, textAlign: "center", fontWeight: "500" },
});
