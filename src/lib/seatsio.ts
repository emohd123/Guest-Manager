export const DEFAULT_SEATSIO_CHART_KEY = "68f78e07-c80b-5a1a-2f28-a696ec3d4113";

export function readSeatsIoChartKey(settings: unknown): string | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const root = settings as Record<string, unknown>;
  const seatsIo = root.seatsIo && typeof root.seatsIo === "object" && !Array.isArray(root.seatsIo)
    ? (root.seatsIo as Record<string, unknown>)
    : null;
  const value = seatsIo?.chartKey ?? root.seatsIoChartKey;
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,128}$/.test(value) ? value : null;
}

export function mergeSeatsIoChartKey(settings: unknown, chartKey: string | null) {
  const current = settings && typeof settings === "object" && !Array.isArray(settings)
    ? { ...(settings as Record<string, unknown>) }
    : {};
  const seatsIo = current.seatsIo && typeof current.seatsIo === "object" && !Array.isArray(current.seatsIo)
    ? { ...(current.seatsIo as Record<string, unknown>) }
    : {};
  if (chartKey) seatsIo.chartKey = chartKey;
  else delete seatsIo.chartKey;
  current.seatsIo = seatsIo;
  return current;
}
