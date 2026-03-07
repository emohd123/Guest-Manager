import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { sendVisitorMessage } from "../api/mobileClient";
import { AuthScreenLayout } from "../ui/AuthScreenLayout";
import {
  PremiumButton,
  PremiumField,
  PremiumNotice,
  PremiumPill,
} from "../ui/primitives";
import { spacing } from "../ui/theme";

interface Props {
  token: string;
  defaultEventCode?: string;
  onBack: () => void;
  onSent: () => void;
}

export function ComposeMessageScreen({
  token,
  defaultEventCode,
  onBack,
  onSent,
}: Props) {
  const [eventCode, setEventCode] = useState(defaultEventCode ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!eventCode.trim()) {
      setError("Please enter the event code.");
      return;
    }
    if (!body.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await sendVisitorMessage(token, {
        eventCode: eventCode.trim().toUpperCase(),
        subject: subject.trim() || "Question about the event",
        body: body.trim(),
      });
      Alert.alert("Sent", res.message, [{ text: "OK", onPress: onSent }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScreenLayout
      onBack={onBack}
      icon="Mail"
      eyebrow="Organizer Inbox"
      title="Send a message to the organizer"
      subtitle="Use the same premium attendee shell to send questions, requests, or event support notes."
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <PremiumPill label="Attendee Messaging" />
          <PremiumField
            label="Event Code"
            value={eventCode}
            onChangeText={(t) => setEventCode(t.toUpperCase())}
            placeholder="ED16114A"
            autoCapitalize="characters"
            maxLength={12}
            hint="Find this on your ticket or invitation email."
          />
          <PremiumField
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Optional subject"
            maxLength={200}
          />
          <PremiumField
            label="Message"
            value={body}
            onChangeText={setBody}
            placeholder="Type your message here..."
            multiline
            maxLength={2000}
            hint={`${body.length}/2000`}
          />
          {error ? <PremiumNotice tone="danger" text={error} /> : null}
          <PremiumButton
            label="Send Message"
            onPress={handleSend}
            loading={sending}
            disabled={sending || !body.trim() || !eventCode.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
});
