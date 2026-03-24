import React from "react";
import { Image, StyleSheet, View } from "react-native";

type BrandLogoProps = {
  size?: number;
  variant?: "pin" | "tile";
};

const pinSource = require("../../assets/events-hub-mark.png");
const tileSource = require("../../assets/events-hub-icon.png");

export function BrandLogo({
  size = 124,
  variant = "pin",
}: BrandLogoProps) {
  const isTile = variant === "tile";
  const imageSize = isTile ? Math.round(size * 0.9) : Math.round(size * 0.94);

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: isTile ? Math.round(size * 0.28) : Math.round(size * 0.38),
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
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tileFrame: {
    backgroundColor: "rgba(246,243,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(255,106,150,0.18)",
    shadowColor: "#FF5A7A",
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
  },
  tileGlow: {
    backgroundColor: "rgba(124,77,255,0.15)",
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.24,
  },
});
