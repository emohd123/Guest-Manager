import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";
import {
  PremiumButton,
  PremiumField,
  PremiumNotice,
  PremiumPill,
} from "../ui/primitives";
import { spacing } from "../ui/theme";

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
    <AuthScreenLayout
      onBack={onBack}
      icon="link-outline"
      eyebrow="Staff Access / Check-in"
      title="Open event scanner"
      subtitle="Enter the event access code and PIN shared by the organiser. This device will be restricted to that event."
    >
      <FadeSlideIn delay={90}>
        <View style={styles.stack}>
          <PremiumPill label="Event-restricted scanner" tone="live" />
          <PremiumField
            label="Access Code"
            value={accessCode}
            onChangeText={setAccessCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="ABC123"
          />
          <PremiumField
            label="PIN"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            placeholder="1234"
            secureTextEntry
          />
          {error ? <PremiumNotice tone="danger" text={error} /> : null}
          <PremiumButton
            label="Open check-in scanner"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
});
