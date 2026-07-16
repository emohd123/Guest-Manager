import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getApiBaseUrl } from "../config";

type AiEventCard = {
  id: string;
  title: string;
  coverImageUrl: string | null;
  minPrice: number | null;
  currency: string | null;
  buyUrl: string;
};

type ChatItem = {
  key: string;
  role: "user" | "assistant";
  text: string;
  events?: AiEventCard[];
  source?: "claude" | "smart";
};

const SUGGESTIONS = ["What's on this weekend?", "Family friendly events", "Concerts under BHD 20"];

function formatBhd(minPrice: number | null, currency: string | null) {
  if (minPrice == null || minPrice === 0) return "Free";
  return `${currency ?? "BHD"} ${(minPrice / 100).toFixed(3)}`;
}

/**
 * AI concierge chat sheet for the mobile app. Calls the same /api/ai backend
 * as the website (Claude when configured, smart fallback otherwise).
 */
export function AiConciergeSheet({
  visible,
  onClose,
  onOpenEvent,
}: {
  visible: boolean;
  onClose: () => void;
  /** Optional: open an event natively by id; return false to fall back to the browser. */
  onOpenEvent?: (eventId: string) => boolean;
}) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<ChatItem>>(null);

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || busy) return;
      setInput("");
      setBusy(true);
      setMessages((current) => [...current, { key: `u${Date.now()}`, role: "user", text: message }]);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000);
      try {
        const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
        const response = await fetch(`${getApiBaseUrl()}/api/ai`, {
          method: "POST",
          signal: controller.signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "concierge", message, history, locale: "en" }),
        });
        const data = (await response.json()) as {
          reply?: string;
          events?: AiEventCard[];
          source?: "claude" | "smart";
          error?: string;
        };
        setMessages((current) => [
          ...current,
          {
            key: `a${Date.now()}`,
            role: "assistant",
            text: data.reply || data.error || "Something went wrong — try again.",
            events: data.events?.slice(0, 3),
            source: data.source,
          },
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          { key: `a${Date.now()}`, role: "assistant", text: "Couldn't reach the assistant — check your connection." },
        ]);
      } finally {
        clearTimeout(timer);
        setBusy(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    },
    [busy, messages]
  );

  function openEvent(card: AiEventCard) {
    if (onOpenEvent?.(card.id)) return;
    const url = card.buyUrl.startsWith("http") ? card.buyUrl : `${getApiBaseUrl()}${card.buyUrl}`;
    void Linking.openURL(url);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Events concierge</Text>
                  <Text style={styles.headerSub}>BAHRAIN · LIVE DATA</Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close AI chat">
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {/* Messages */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View>
                  <Text style={styles.introText}>
                    Hi! I&apos;m your guide to what&apos;s on in Bahrain. Tell me a vibe, a budget, or a night — I&apos;ll
                    pick from real listed events.
                  </Text>
                  <View style={styles.chipsRow}>
                    {SUGGESTIONS.map((suggestion) => (
                      <Pressable key={suggestion} style={styles.chip} onPress={() => void send(suggestion)}>
                        <Text style={styles.chipText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.bubbleRow, item.role === "user" ? styles.rowEnd : styles.rowStart]}>
                  <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAi]}>
                    <Text style={item.role === "user" ? styles.bubbleUserText : styles.bubbleAiText}>{item.text}</Text>
                    {item.events?.map((card) => (
                      <Pressable key={card.id} style={styles.eventCard} onPress={() => openEvent(card)}>
                        {card.coverImageUrl ? (
                          <Image source={{ uri: card.coverImageUrl }} style={styles.eventImage} />
                        ) : (
                          <View style={[styles.eventImage, styles.eventImageFallback]}>
                            <Ionicons name="ticket-outline" size={18} color="rgba(255,255,255,0.6)" />
                          </View>
                        )}
                        <View style={styles.eventMeta}>
                          <Text style={styles.eventTitle} numberOfLines={1}>{card.title}</Text>
                          <Text style={styles.eventPrice}>{formatBhd(card.minPrice, card.currency)}</Text>
                        </View>
                        <View style={styles.bookPill}>
                          <Text style={styles.bookPillText}>Book</Text>
                        </View>
                      </Pressable>
                    ))}
                    {item.role === "assistant" && item.source ? (
                      <Text style={styles.sourceTag}>
                        {item.source === "claude" ? "AI ANSWER" : "SMART SEARCH"}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
              ListFooterComponent={
                busy ? (
                  <View style={[styles.bubbleRow, styles.rowStart]}>
                    <View style={[styles.bubble, styles.bubbleAi]}>
                      <ActivityIndicator size="small" color="#67E8F9" />
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Composer */}
            <View style={styles.composer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about events…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={() => void send(input)}
              />
              <Pressable
                onPress={() => void send(input)}
                disabled={busy || !input.trim()}
                style={[styles.sendBtn, (busy || !input.trim()) && styles.sendBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Send"
              >
                <Ionicons name="arrow-up" size={18} color="#0B1020" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheetWrap: { maxHeight: "88%" },
  sheet: {
    backgroundColor: "#0A0F1E",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    height: 560,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: "#7C3AED",
  },
  headerTitle: { color: "#fff", fontWeight: "900", fontSize: 15 },
  headerSub: { color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  introText: { color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 21, marginBottom: 14 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  bubbleRow: { flexDirection: "row" },
  rowEnd: { justifyContent: "flex-end" },
  rowStart: { justifyContent: "flex-start" },
  bubble: { maxWidth: "88%", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10 },
  bubbleUser: { backgroundColor: "#67E8F9", borderBottomRightRadius: 4 },
  bubbleAi: {
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: { color: "#0B1020", fontWeight: "700", fontSize: 14 },
  bubbleAiText: { color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 21 },
  eventCard: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10,
    backgroundColor: "rgba(0,0,0,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14, padding: 8,
  },
  eventImage: { width: 58, height: 42, borderRadius: 10 },
  eventImageFallback: { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  eventMeta: { flex: 1, minWidth: 0 },
  eventTitle: { color: "#fff", fontWeight: "900", fontSize: 12.5 },
  eventPrice: { color: "#A5F3FC", fontWeight: "800", fontSize: 11, marginTop: 2 },
  bookPill: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  bookPillText: { color: "#000", fontWeight: "900", fontSize: 10 },
  sourceTag: { color: "rgba(255,255,255,0.3)", fontSize: 8.5, fontWeight: "900", letterSpacing: 1.2, marginTop: 8 },
  composer: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1, color: "#fff", fontSize: 14, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.05)",
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
    backgroundColor: "#67E8F9",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
