import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type BrandLogoProps = {
  size?: number;
  variant?: "pin" | "tile";
  showWordmark?: boolean;
};

const pinSource = require("../../assets/iticket-mark.png");
const tileSource = require("../../assets/iticket-icon.png");

export function BrandLogo({
  size = 124,
  variant = "pin",
  showWordmark = false,
}: BrandLogoProps) {
  const isTile = variant === "tile";
  const imageSize = isTile ? Math.round(size * 0.9) : Math.round(size * 0.94);
  const frameRadius = isTile ? Math.round(size * 0.28) : Math.round(size * 0.38);
  const compactMarkSize = Math.round(size * 0.72);
  const logoFrame = (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: frameRadius,
        },
        isTile && styles.tileFrame,
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            width: Math.round(size * 0.86),
            height: Math.round(size * 0.86),
            borderRadius: Math.round(size * 0.43),
          },
          isTile && styles.tileGlow,
        ]}
      />
      <Image
        source={isTile ? tileSource : pinSource}
        resizeMode="contain"
        style={{ width: imageSize, height: imageSize }}
      />
    </View>
  );

  if (showWordmark) {
    return (
      <View style={styles.wordmarkRow}>
        <View
          style={[
            styles.wordmarkMark,
            {
              width: size,
              height: size,
              borderRadius: Math.round(size / 2),
            },
          ]}
        >
          <Image
            source={pinSource}
            resizeMode="contain"
            style={{ width: compactMarkSize, height: compactMarkSize }}
          />
        </View>
        <Text style={styles.wordmarkText}>
          <Text style={styles.wordmarkAccent}>i</Text>
          Ticket
        </Text>
      </View>
    );
  }

  return logoFrame;
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  wordmarkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  wordmarkMark: {
    alignItems: "center",
    backgroundColor: "#101B3D",
    borderColor: "rgba(124,58,237,0.22)",
    borderWidth: 1,
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
  },
  wordmarkText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 34,
  },
  wordmarkAccent: {
    color: "#5B8CFF",
  },
  tileFrame: {
    backgroundColor: "rgba(239,246,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#2563EB",
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(37,99,235,0.16)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
  },
  tileGlow: {
    backgroundColor: "rgba(124,58,237,0.14)",
    shadowColor: "#DB2777",
    shadowOpacity: 0.24,
  },
});
