import React, { useMemo } from "react";
import { View } from "react-native";
import qrcodegen from "qrcode-generator";

/**
 * Dependency-light QR renderer: encodes with the pure-JS `qrcode-generator`
 * and paints the module matrix as plain Views — no SVG/native modules, so it
 * works in every build without a rebuild and renders offline.
 */
export function QrCode({
  value,
  size = 220,
}: {
  value: string;
  size?: number;
}) {
  const matrix = useMemo(() => {
    try {
      const qr = qrcodegen(0, "M");
      qr.addData(value);
      qr.make();
      const count = qr.getModuleCount();
      const rows: boolean[][] = [];
      for (let r = 0; r < count; r += 1) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c += 1) row.push(qr.isDark(r, c));
        rows.push(row);
      }
      return rows;
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) return null;
  // The QR spec requires a quiet zone of 4 modules on every side — scanners
  // reject codes that sit flush against a busy background.
  const cell = size / (matrix.length + 8);
  const quietZone = cell * 4;

  return (
    <View
      style={{
        width: size,
        height: size,
        padding: quietZone,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
      }}
      accessibilityLabel={`QR code: ${value}`}
    >
      {matrix.map((row, r) => {
        // Merge consecutive dark modules into single runs: fractional cell
        // widths otherwise leave hairline gaps between adjacent Views that
        // break scanners.
        const runs: { start: number; length: number }[] = [];
        let c = 0;
        while (c < row.length) {
          if (row[c]) {
            const start = c;
            while (c < row.length && row[c]) c += 1;
            runs.push({ start, length: c - start });
          } else {
            c += 1;
          }
        }
        return (
          <View key={r} style={{ height: cell, position: "relative" }}>
            {runs.map((run) => (
              <View
                key={run.start}
                style={{
                  position: "absolute",
                  left: run.start * cell,
                  top: 0,
                  width: run.length * cell,
                  // Slight vertical overlap closes horizontal hairlines too.
                  height: cell + 0.5,
                  backgroundColor: "#0B1020",
                }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
