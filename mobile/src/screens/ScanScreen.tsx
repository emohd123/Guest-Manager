import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export function ScanScreen({
  onSubmitBarcode,
}: {
  onSubmitBarcode: (barcode: string) => Promise<string>;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraMode, setCameraMode] = useState(false);
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Scan Tickets</Text>
      <Text style={styles.description}>
        Use camera scanning or enter barcode manually.
      </Text>

      <Pressable style={styles.toggle} onPress={toggleCamera}>
        <Text style={styles.toggleText}>{cameraMode ? "Hide Camera" : "Use Camera"}</Text>
      </Pressable>

      {cameraMode && hasPermission ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
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
        placeholder="Enter barcode"
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={() => submit(barcodeInput)}>
        <Text style={styles.buttonText}>Submit Barcode</Text>
      </Pressable>

      {lastMessage ? <Text style={styles.message}>{lastMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  description: {
    color: "#64748b",
  },
  toggle: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toggleText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  cameraWrap: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#4338ca",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  message: {
    marginTop: 6,
    color: "#0f172a",
  },
});
