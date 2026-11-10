export {
  EXPO_TOKEN_PATTERN,
  notificationDestination,
} from "../../mobile/src/features/notificationRouting";

export function changedAnnouncements<T extends { title: string; body: string }>(
  previous: T[],
  next: T[],
): T[] {
  const seen = new Set(
    previous.map((item) => `${item.title}\u0000${item.body}`),
  );
  return next.filter((item) => {
    const key = `${item.title}\u0000${item.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
