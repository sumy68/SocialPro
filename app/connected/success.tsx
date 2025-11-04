import { View, Text, Button } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const ok = params.ok === "1";
  const platform = params.platform ?? "unknown";

  // Verhindert SplashError beim Zurückspringen
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
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
