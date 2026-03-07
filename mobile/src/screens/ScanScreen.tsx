import React, { useState } from "react";
import {
  StyleSheet,
  Text,
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

export function ScanScreen({
  onSubmitBarcode,
}: {
  onSubmitBarcode: (barcode: string) => Promise<string>;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraMode, setCameraMode] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [locked, setLocked] = useState(false);
  const pulse = usePulseAnimation(cameraMode);

  const hasPermission = permission?.granted ?? false;

  async function submit(barcode: string) {
    if (!barcode || locked) return;
    setLocked(true);
    try {
      const message = await onSubmitBarcode(barcode);
      setLastMessage(message);
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setTimeout(() => setLocked(false), 900);
    }
  }

  async function toggleCamera() {
    if (!cameraMode && !hasPermission) {
      const result = await requestPermission();
      if (!result.granted) {
        setLastMessage("Camera permission denied.");
        return;
      }
    }
    setCameraMode((value) => !value);
  }

  return (
    <View style={styles.container}>
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
              tone="secondary"
              onPress={toggleCamera}
            />
          </View>
          {cameraMode && hasPermission ? (
            <View style={styles.control}>
              <PremiumButton
                label={`Use ${facing === "back" ? "Front" : "Back"} Lens`}
                tone="ghost"
                onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
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
            <View style={styles.cameraWrap}>
              <CameraView
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

      <FadeSlideIn delay={130}>
        <PremiumCard style={styles.manualCard}>
          <PremiumField
            label="Manual Barcode Entry"
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Enter barcode"
          />
          <PremiumButton label="Submit Barcode" onPress={() => submit(barcodeInput)} />
          {lastMessage ? <PremiumNotice text={lastMessage} /> : null}
        </PremiumCard>
      </FadeSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  control: {
    flex: 1,
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
    height: 320,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: palette.bgElevated,
  },
  manualCard: {
    gap: spacing.md,
  },
});
