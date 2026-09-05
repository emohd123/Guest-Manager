const base = require("./app.json");

function normalizeUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

const apiBaseUrl =
  normalizeUrl(process.env.EXPO_PUBLIC_API_URL) ||
  normalizeUrl(base.expo?.extra?.apiBaseUrl) ||
  "https://www.iticket.info";

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      ...(base.expo.extra ?? {}),
      apiBaseUrl,
    },
    plugins: [...(base.expo.plugins ?? [])],
  },
};
