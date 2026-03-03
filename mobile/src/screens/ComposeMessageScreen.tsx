import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { sendVisitorMessage } from "../api/mobileClient";

interface Props {
  token: string;
  /** Pre-fill the event code if the visitor already joined an event */
  defaultEventCode?: string;
  onBack: () => void;
  onSent: () => void;
}

export function ComposeMessageScreen({ token, defaultEventCode, onBack, onSent }: Props) {
  const [eventCode, setEventCode] = useState(defaultEventCode ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!eventCode.trim()) { setError("Please enter the event code."); return; }
    if (!body.trim()) { setError("Message cannot be empty."); return; }
    setError(null);
    setSending(true);
    try {
      const res = await sendVisitorMessage(token, {
        eventCode: eventCode.trim().toUpperCase(),
        subject: subject.trim() || "Question about the event",
        body: body.trim(),
      });
      Alert.alert("✅ Sent!", res.message, [{ text: "OK", onPress: onSent }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Organizer</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Have a question or comment? Send a message to the event organizer.
        </Text>

        {/* Event Code */}
        <View style={styles.field}>
          <Text style={styles.label}>Event Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ED16114A"
            placeholderTextColor="#9ca3af"
            value={eventCode}
            onChangeText={(t) => setEventCode(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={12}
          />
          <Text style={styles.hint}>Find this on your ticket or invitation email.</Text>
        </View>

        {/* Subject */}
        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional subject"
            placeholderTextColor="#9ca3af"
            value={subject}
            onChangeText={setSubject}
            maxLength={200}
          />
        </View>

        {/* Message */}
        <View style={styles.field}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Type your message here…"
            placeholderTextColor="#9ca3af"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{body.length}/2000</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, (sending || !body.trim() || !eventCode.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending || !body.trim() || !eventCode.trim()}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>✉️ Send Message</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: { padding: 8 },
  backText: { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  intro: { color: "#64748b", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  textarea: { minHeight: 140, paddingTop: 12 },
  hint: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  charCount: { fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: "right" },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#dc2626", fontSize: 13 },
  sendBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
