import Constants from "expo-constants";

export function getBaseUrl() {
  const env =
    (Constants?.expoConfig as any)?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_APP_URL ||
    "https://socialpro-fnvo.onrender.com";
  return String(env).replace(/\/$/, "");
}
