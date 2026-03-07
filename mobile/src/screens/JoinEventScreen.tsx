import React, { useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import { FadeSlideIn } from "../ui/motion";
import {
  PremiumButton,
  PremiumCard,
  PremiumField,
  PremiumNotice,
  SectionHeading,
} from "../ui/primitives";
import { palette, spacing } from "../ui/theme";

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

  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="Join"
      eyebrow="Event Access"
      title="Connect to an event"
      subtitle="Enter the code from your invitation or ticket to unlock the event feed inside the app."
    >
      <FadeSlideIn delay={80}>
        <View style={styles.stack}>
          <PremiumField
            label="Event Code"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="ED16114A"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            style={styles.codeInput}
          />

          {error ? <PremiumNotice tone="danger" text={error} /> : null}
          {success ? <PremiumNotice tone="success" text={success} /> : null}

          <PremiumButton
            label="Connect to Event"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !code.trim()}
          />

          <PremiumCard>
            <SectionHeading
              eyebrow="Where to find it"
              title="Invitation or ticket code"
              body="Event codes are usually shown in the invitation email, ticket PDF, or attendee portal."
            />
          </PremiumCard>
        </View>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
    color: palette.text,
  },
});
