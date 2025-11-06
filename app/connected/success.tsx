// app/connected/success.tsx
import { View, Text, Button } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const ok = params.ok === "1";
  const platform = String(params.platform ?? "unknown");
  const error = String(params.error ?? "");

  useEffect(() => {
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        {ok ? "Erfolgreich verbunden ✅" : "Verbindung fehlgeschlagen ❌"}
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 8 }}>Plattform: {platform}</Text>
      {!ok && !!error && (
        <Text style={{ fontSize: 14, color: "crimson", marginBottom: 20 }}>
          {decodeURIComponent(error)}
        </Text>
      )}

      <Button title="Zurück" onPress={() => router.replace("/")} />
    </View>
  );
}
