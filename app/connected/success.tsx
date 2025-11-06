// app/connected/success.tsx
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // aus Deep Link: socialpro://connected/success?page_id=...&ig_user_id=...&error=...
  const pageId = useMemo(() => String(params.page_id ?? ""), [params.page_id]);
  const igUserId = useMemo(() => String(params.ig_user_id ?? ""), [params.ig_user_id]);
  const error = useMemo(() => String(params.error ?? ""), [params.error]);

  // ok, wenn keine Fehlermeldung und beide IDs vorhanden
  const ok = !error && !!pageId && !!igUserId;

  useEffect(() => {
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // 👉 Wenn du serverseitig speichern willst, ent-kommentiere und passe den Endpoint an:
      /*
      const res = await fetch("https://socialpro-fnvo.onrender.com/api/link/instagram/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, igUserId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server error");
      }
      */

      Alert.alert("Instagram", "Verbindung gespeichert ✅");
      router.replace("/(tabs)/(dashboard)");
    } catch (e: any) {
      Alert.alert("Fehler", e?.message ?? "Konnte nicht speichern");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>
        {ok ? "Erfolgreich verbunden ✅" : "Verbindung fehlgeschlagen ❌"}
      </Text>

      {ok ? (
        <>
          <Text style={{ fontSize: 16 }}>Page ID: {pageId}</Text>
          <Text style={{ fontSize: 16 }}>IG User ID: {igUserId}</Text>

          {saving ? (
            <ActivityIndicator />
          ) : (
            <Button title="Speichern & weiter" onPress={handleSave} />
          )}

          <Button title="Später" onPress={() => router.replace("/(tabs)/(dashboard)")} />
        </>
      ) : (
        <>
          {!!error && (
            <Text style={{ fontSize: 14, color: "crimson" }}>
              {decodeURIComponent(error)}
            </Text>
          )}
          <Button title="Zurück" onPress={() => router.replace("/onboarding/connect-platforms")} />
        </>
      )}
    </View>
  );
}
