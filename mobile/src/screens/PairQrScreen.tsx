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

export function PairQrScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (token: string) => Promise<void>;
  onBack: () => void;
}) {
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(token.trim());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to pair");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="QR"
      eyebrow="QR Pairing"
      title="Pair with QR token"
      subtitle="Scan the pairing token from Devices or paste the raw token here for manual setup."
    >
      <FadeSlideIn delay={90}>
        <View style={styles.stack}>
          <PremiumPill label="Ops Setup" />
          <PremiumField
            label="QR Token"
            value={token}
            onChangeText={setToken}
            placeholder="Paste QR token"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <PremiumNotice tone="danger" text={error} /> : null}
          <PremiumButton
            label="Pair Device"
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
