import React, { useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { FadeSlideIn, usePulseAnimation } from "../ui/motion";
import {
  PremiumButton,
  PremiumCard,
  PremiumField,
  PremiumNotice,
  PremiumPill,
  SectionHeading,
} from "../ui/primitives";
import { palette, radii, spacing } from "../ui/theme";

type ScanFeedback = {
  outcome: "success" | "already_used" | "invalid" | "offline";
  attendeeName?: string;
  message: string;
};

export function ScanScreen({
  onSubmitBarcode,
}: {
  onSubmitBarcode: (barcode: string) => Promise<ScanFeedback>;
}) {
  const { width } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraMode, setCameraMode] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [lastFeedback, setLastFeedback] = useState<ScanFeedback | null>(null);
  const [locked, setLocked] = useState(false);
  const pulse = usePulseAnimation(cameraMode);

  const hasPermission = permission?.granted ?? false;
  const cameraHeight = Math.max(360, Math.min(560, width * (Platform.OS === "web" ? 0.48 : 0.9)));

  async function submit(barcode: string) {
    if (!barcode || locked) return;
    setLocked(true);
    try {
      const feedback = await onSubmitBarcode(barcode);
      setLastFeedback(feedback);
      setLastMessage(feedback.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed";
      setLastFeedback({ outcome: "invalid", message });
      setLastMessage(message);
    } finally {
      setTimeout(() => setLocked(false), 900);
    }
  }

  async function toggleCamera() {
    if (!cameraMode && !hasPermission) {
      // If permission was permanently denied, requestPermission() resolves
      // immediately without a prompt — send the user to Settings instead of
      // leaving them stuck in manual mode with no path forward.
      if (permission && !permission.canAskAgain) {
        setLastMessage("Camera access is blocked. Enable it in Settings to scan.");
        Linking.openSettings().catch(() => undefined);
        return;
      }
      const result = await requestPermission();
      if (!result.granted) {
        setLastMessage(
          result.canAskAgain
            ? "Camera permission denied."
            : "Camera access is blocked. Enable it in Settings to scan."
        );
        return;
      }
    }
    setCameraMode((value) => !value);
  }

  function feedbackCard() {
    if (!lastFeedback) return null;
    return (
      <View
        style={[
          styles.resultCard,
          lastFeedback.outcome === "success"
            ? styles.resultSuccess
            : lastFeedback.outcome === "already_used"
              ? styles.resultWarning
              : styles.resultError,
        ]}
      >
        <Text style={styles.resultTitle}>
          {lastFeedback.outcome === "success"
            ? "ENTRY APPROVED"
            : lastFeedback.outcome === "already_used"
              ? "ALREADY SCANNED"
              : lastFeedback.outcome === "offline"
                ? "SAVED OFFLINE"
                : "SCAN NOT VALID"}
        </Text>
        {lastFeedback.attendeeName ? <Text style={styles.resultName}>{lastFeedback.attendeeName}</Text> : null}
        <Text style={styles.resultMessage}>{lastFeedback.message}</Text>
      </View>
    );
  }

  function toggleFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
    setLastMessage(`Switched to ${facing === "back" ? "front" : "back"} lens`);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <FadeSlideIn>
        <PremiumCard tone="dark" style={styles.hero}>
          <View style={styles.heroRow}>
            <SectionHeading
              eyebrow="Scanning"
              title="Ticket capture"
              body="Run camera or manual barcode entry with clear, high-contrast feedback."
            />
            <PremiumPill label={cameraMode ? "Camera Live" : "Manual Mode"} tone="live" />
          </View>
        </PremiumCard>
      </FadeSlideIn>

      <FadeSlideIn delay={70}>
        <View style={styles.controls}>
          <View style={styles.control}>
            <PremiumButton
              label={cameraMode ? "Hide Camera" : "Use Camera"}
              icon={cameraMode ? "eye-off-outline" : "camera-outline"}
              tone="secondary"
              onPress={toggleCamera}
            />
          </View>
          {cameraMode && hasPermission ? (
            <View style={styles.control}>
              <PremiumButton
                label={`Use ${facing === "back" ? "Front" : "Back"} Lens`}
                icon="camera-reverse-outline"
                tone="ghost"
                onPress={toggleFacing}
              />
            </View>
          ) : null}
        </View>
      </FadeSlideIn>

      {cameraMode && hasPermission ? (
        <FadeSlideIn delay={100}>
          <PremiumCard style={styles.cameraShell}>
            <View style={styles.cameraStatus}>
              <Text style={styles.cameraStatusText}>Live scanner ready</Text>
              <View
                style={[
                  styles.cameraPulse,
                  { opacity: pulse.opacity, transform: [{ scale: pulse.scale }] },
                ]}
              />
            </View>
            <View style={[styles.cameraWrap, { height: cameraHeight }]}>
              <CameraView
                key={`camera-${facing}`}
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8", "upc_a", "upc_e"],
                }}
                onBarcodeScanned={({ data }) => submit(data)}
              />
            </View>
          </PremiumCard>
        </FadeSlideIn>
      ) : null}

      {feedbackCard()}

      <FadeSlideIn delay={130}>
        <PremiumCard style={styles.manualCard}>
          <PremiumField
            label="Manual Barcode Entry"
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Enter barcode"
          />
          <PremiumButton label="Submit Barcode" icon="checkmark-circle-outline" onPress={() => submit(barcodeInput)} />
          {!lastFeedback && lastMessage ? <PremiumNotice text={lastMessage} /> : null}
        </PremiumCard>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2.5,
    gap: spacing.md,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: palette.bgElevated,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroRow: {
    gap: spacing.md,
  },
  controls: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  control: {
    flex: 1,
    minWidth: 220,
  },
  cameraShell: {
    gap: spacing.md,
    padding: spacing.md,
  },
  cameraStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraStatusText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800",
  },
  cameraPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.accentLive,
  },
  cameraWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: palette.bgElevated,
  },
  manualCard: {
    gap: spacing.md,
  },
  resultCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  resultSuccess: {
    backgroundColor: "#0b6b46",
    borderColor: "#35e49a",
  },
  resultWarning: {
    backgroundColor: "#72500a",
    borderColor: "#f4c542",
  },
  resultError: {
    backgroundColor: "#7a1f2b",
    borderColor: "#ff7180",
  },
  resultTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  resultName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  resultMessage: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
