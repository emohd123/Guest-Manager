import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  PremiumButton,
  PremiumCard,
  PremiumField,
  PremiumNotice,
  PremiumPill,
  SectionHeading,
} from "../ui/primitives";
import { FadeSlideIn } from "../ui/motion";
import { spacing } from "../ui/theme";

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
      setMessage("Walk-up guest saved");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Walk-up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <FadeSlideIn>
        <PremiumCard>
          <SectionHeading
            eyebrow="Walk-Up Entry"
            title="Add guest at the door"
            body="Capture a walk-up cleanly, then decide whether to check them in immediately."
            right={<PremiumPill label={checkInNow ? "Check In Now" : "Save Only"} />}
          />
        </PremiumCard>
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <PremiumCard style={styles.formCard}>
          <PremiumField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <PremiumField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
          <PremiumField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <PremiumField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
          <View style={styles.toggle}>
            <PremiumButton
              label={checkInNow ? "Immediate Check-In On" : "Immediate Check-In Off"}
              tone="secondary"
              onPress={() => setCheckInNow((value) => !value)}
            />
          </View>
          {message ? <PremiumNotice text={message} /> : null}
          <PremiumButton
            label="Save Walk-Up"
            onPress={handleSubmit}
            loading={busy}
            disabled={busy}
          />
        </PremiumCard>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  formCard: {
    gap: spacing.md,
  },
  toggle: {
    marginTop: spacing.xs,
  },
});
