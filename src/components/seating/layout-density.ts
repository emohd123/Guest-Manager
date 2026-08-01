type SeatRowLike = { seats?: unknown[] };

export type SeatDensity = {
  rows: number;
  columns: number;
  dotSize: string;
};

/**
 * Keeps chair dots within 68% of their row/column cell at the initial fit.
 * Container query units make the same calculation work in dashboard and buyer maps.
 */
export function getSeatDensity(rows: SeatRowLike[]): SeatDensity {
  const rowCount = Math.max(1, rows.length);
  const columnCount = Math.max(
    1,
    ...rows.map((row) => row.seats?.length ?? 0),
  );
  const columnShare = 68 / columnCount;
  const rowShare = 68 / rowCount;
  return {
    rows: rowCount,
    columns: columnCount,
    dotSize: `clamp(2px, min(${columnShare.toFixed(4)}cqw, ${rowShare.toFixed(4)}cqh), 9px)`,
  };
}

// Deterministic regression fixture: 30 x 30 must resolve to a density-limited size.
export const DENSE_LAYOUT_30_X_30 = getSeatDensity(
  Array.from({ length: 30 }, () => ({ seats: Array(30) })),
);
