import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Animated, Platform } from "react-native";

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

  const [slideAnim] = useState(() => new Animated.Value(50));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
      <View style={styles.navyTop}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Pair with Access Code</Text>
        <Text style={styles.description}>
          Enter the access code and PIN from your dashboard.
        </Text>
      </View>

      <Animated.ScrollView 
        style={[ styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.cardContent}
        keyboardShouldPersistTaps="handled" 
      >
        <Text style={styles.label}>Access Code</Text>
        <TextInput
          value={accessCode}
          onChangeText={setAccessCode}
          style={styles.input}
          autoCapitalize="characters"
          placeholder="ABC123"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.label}>PIN</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          style={styles.input}
          keyboardType="number-pad"
          placeholder="1234"
          secureTextEntry
          placeholderTextColor="#94A3B8"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Pair Device</Text>}
        </Pressable>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A1C30" },
  navyTop: {
    paddingTop: Platform.OS === "android" ? 44 : 60,
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
  label: {
    color: "#A0A5B1",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#1A1C30",
    marginBottom: 8,
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
    fontWeight: "600",
    marginBottom: 8,
  },
  primaryButton: {
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
  primaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

