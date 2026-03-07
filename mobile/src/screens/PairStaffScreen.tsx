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
          <PremiumPill label="Technical Setup" />
          <PremiumField
            label="Staff Access Token"
            value={staffToken}
            onChangeText={setStaffToken}
            placeholder="eyJhbGciOi..."
          />
          <PremiumField
            label="Event ID"
            value={eventId}
            onChangeText={setEventId}
            placeholder="a67cf2a8-..."
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
