const base = require("./app.json");

function normalizeUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

const apiBaseUrl =
  normalizeUrl(process.env.EXPO_PUBLIC_API_URL) ||
  normalizeUrl(base.expo?.extra?.apiBaseUrl) ||
  "https://events-hub.vercel.app";

const allowCleartext =
  process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === "true" || apiBaseUrl.startsWith("http://");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    android: {
      ...(base.expo.android ?? {}),
      usesCleartextTraffic: allowCleartext,
    },
    extra: {
      ...(base.expo.extra ?? {}),
      apiBaseUrl,
    },
    plugins: [...(base.expo.plugins ?? [])],
  },
};
