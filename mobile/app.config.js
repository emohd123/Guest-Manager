const base = require("./app.json");

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  base.expo?.extra?.apiBaseUrl ||
  "http://localhost:3000";

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
