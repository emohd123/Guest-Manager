import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

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

  const [slideAnim] = useState(() => new Animated.Value(30));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.heading}>Scan Tickets</Text>
      <Text style={styles.description}>
        Use camera scanning or enter barcode manually.
      </Text>

      <View style={styles.controls}>
        <Pressable style={styles.toggle} onPress={toggleCamera}>
          <Text style={styles.toggleText}>{cameraMode ? "Hide Camera" : "Use Camera"}</Text>
        </Pressable>

        {cameraMode && hasPermission ? (
          <Pressable style={styles.toggle} onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}>
            <Text style={styles.toggleText}>Switch to {facing === "back" ? "Front" : "Back"}</Text>
          </Pressable>
        ) : null}
      </View>

      {cameraMode && hasPermission ? (
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
      ) : null}

      <TextInput
        value={barcodeInput}
        onChangeText={setBarcodeInput}
        placeholder="Enter barcode..."
        placeholderTextColor="#A0A5B1"
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={() => submit(barcodeInput)}>
        <Text style={styles.buttonText}>Submit Barcode</Text>
      </Pressable>

      {lastMessage ? <Text style={styles.message}>{lastMessage}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1C30",
    letterSpacing: -0.5,
  },
  description: {
    color: "#8E94A3",
    fontSize: 15,
    marginTop: -8,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
  },
  toggle: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  toggleText: {
    color: "#1A1C30",
    fontWeight: "800",
    fontSize: 13,
  },
  cameraWrap: {
    height: 300, // Make camera slightly larger
    borderRadius: 30, // massive radius
    overflow: "hidden",
    backgroundColor: "#1A1C30",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EBEFF5",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: "#1A1C30",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  button: {
    backgroundColor: "#FF5B6A", // Coral
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#FF5B6A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  message: {
    marginTop: 8,
    color: "#1A1C30",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});
