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
      {/* Header Area */}
      <View style={styles.headerArea}>
        <View style={styles.headerAreaInner}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Message Organizer</Text>
          <View style={{ width: 60 }} />
        </View>
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
  root: { flex: 1, backgroundColor: "#EFF2F7" }, // Main background is light
  
  // Header with massive wavy corner
  headerArea: {
    backgroundColor: "#1A1C30",
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 60,
    paddingTop: Platform.OS === "android" ? 56 : 60,
    paddingBottom: 24,
    shadowColor: "#1A1C30",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  headerAreaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: { padding: 8, marginLeft: -8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12 },
  backText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 32, paddingBottom: 60 },
  intro: { color: "#8E94A3", fontSize: 15, lineHeight: 22, marginBottom: 32 },
  field: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "800", color: "#A0A5B1", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEFF5",
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: "#1A1C30",
    shadowColor: "#1A1C30",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  textarea: { minHeight: 160, paddingTop: 20 },
  hint: { fontSize: 13, color: "#8E94A3", marginTop: 8, fontWeight: "500" },
  charCount: { fontSize: 12, color: "#A0A5B1", marginTop: 8, textAlign: "right", fontWeight: "600" },
  errorBox: {
    backgroundColor: "rgba(255,91,106,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,91,106,0.3)",
    padding: 16,
    marginBottom: 20,
  },
  errorText: { color: "#FF5B6A", fontSize: 14, fontWeight: "600" },
  sendBtn: {
    backgroundColor: "#FF5B6A",
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});
