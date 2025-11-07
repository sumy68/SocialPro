// app/connected/success.tsx
import { View, Text, Button, ActivityIndicator, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Unterstützt beide Flows:
  // 1) Neuer Flow: socialpro://connected/success?code=...
  // 2) Alter Flow: socialpro://connected/success?page_id=...&ig_user_id=...
  const initialPageId = useMemo(() => String(params.page_id ?? ""), [params.page_id]);
  const initialIgUserId = useMemo(() => String(params.ig_user_id ?? ""), [params.ig_user_id]);
  const code = useMemo(() => String(params.code ?? ""), [params.code]);
  const initialError = useMemo(() => String(params.error ?? ""), [params.error]);

  const [pageId, setPageId] = useState(initialPageId);
  const [igUserId, setIgUserId] = useState(initialIgUserId);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(initialError);

  const ok = !err && !!pageId && !!igUserId;

  useEffect(() => {
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  // Neuer Flow: wenn wir einen ?code haben, aber noch keine IDs, dann Exchange callen.
  useEffect(() => {
    const run = async () => {
      if (!code || pageId || igUserId) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${APP_URL}/api/oauth/instagram/callback/exchange?code=${encodeURIComponent(code)}`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "exchange_failed");

        setPageId(String(data.page_id ?? ""));
        setIgUserId(String(data.ig_user_id ?? ""));
        setErr("");
      } catch (e: any) {
        setErr(e?.message || "exchange_failed");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [code, pageId, igUserId]);

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    try {
      setSaving(true);
      // Optional: serverseitig persistieren
      // await fetch(`${APP_URL}/api/link/instagram/confirm`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ pageId, igUserId }),
      // });

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
        {ok ? "Erfolgreich verbunden ✅" : loading ? "Verbinde…" : "Verbindung fehlgeschlagen ❌"}
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : ok ? (
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
          {!!err && <Text style={{ fontSize: 14, color: "crimson" }}>{decodeURIComponent(err)}</Text>}
          <Button title="Zurück" onPress={() => router.replace("/onboarding/connect-platforms")} />
        </>
      )}
    </View>
  );
}
