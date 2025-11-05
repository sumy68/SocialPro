// app/connected/success.tsx
import { View, Text, Button, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const ok = params.ok === "1";
  const platform = params.platform ?? "unknown";

  // ✅ Fix: SplashScreen nur nativ hiden, nie auf Web
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

      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Plattform: {platform}
      </Text>

      <Button title="Zurück" onPress={() => router.replace("/")} />
    </View>
  );
}
