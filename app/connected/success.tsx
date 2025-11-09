// app/connected/success.tsx
import { View, Text, Button, ActivityIndicator, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";

type LinkedInUser = { sub?: string; name?: string; email?: string; picture?: string } | null;

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ?provider=instagram | linkedin  (fallback: instagram)
  const provider = useMemo(() => String(params.provider ?? "instagram"), [params.provider]);
  const code = useMemo(() => String(params.code ?? ""), [params.code]);
  const initialError = useMemo(() => String(params.error ?? ""), [params.error]);

  // IG result
  const [pageId, setPageId] = useState<string>("");
  const [igUserId, setIgUserId] = useState<string>("");

  // LI result
  const [liUser, setLiUser] = useState<LinkedInUser>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(initialError);

  useEffect(() => {
    if (Platform.OS !== "web") SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!code) return;
      setLoading(true);
      setErr("");
      try {
        if (provider === "linkedin") {
          const res = await fetch(
            `${APP_URL}/api/oauth/linkedin/callback/exchange?code=${encodeURIComponent(code)}`,
            { headers: { Accept: "application/json" } }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) throw new Error(data?.error || "exchange_failed");
          setLiUser(data?.me ?? null);
        } else {
          // instagram (default)
          const res = await fetch(
            `${APP_URL}/api/oauth/instagram/callback/exchange?code=${encodeURIComponent(code)}`,
            { headers: { Accept: "application/json" } }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) throw new Error(data?.error || "exchange_failed");
          setPageId(String(data.page_id ?? ""));
          setIgUserId(String(data.ig_user_id ?? ""));
        }
      } catch (e: any) {
        setErr(e?.message || "exchange_failed");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [code, provider]);

  const ok =
    provider === "linkedin"
      ? !!liUser?.sub
      : !!pageId && !!igUserId;

  const handleSave = async () => {
    try {
      // hier könntest du serverseitig speichern, wenn du willst
      // await fetch(`${APP_URL}/api/link/${provider}/confirm`, {...})
      Alert.alert(
        provider === "linkedin" ? "LinkedIn" : "Instagram",
        "Verbindung gespeichert ✅"
      );
      router.replace("/(tabs)/(dashboard)");
    } catch (e: any) {
      Alert.alert("Fehler", e?.message ?? "Konnte nicht speichern");
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
        provider === "linkedin" ? (
          <>
            <Text style={{ fontSize: 16 }}>Name: {liUser?.name ?? "-"}</Text>
            <Text style={{ fontSize: 16 }}>E-Mail: {liUser?.email ?? "-"}</Text>
            <Button title="Speichern & weiter" onPress={handleSave} />
            <Button title="Später" onPress={() => router.replace("/(tabs)/(dashboard)")} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16 }}>Page ID: {pageId}</Text>
            <Text style={{ fontSize: 16 }}>IG User ID: {igUserId}</Text>
            <Button title="Speichern & weiter" onPress={handleSave} />
            <Button title="Später" onPress={() => router.replace("/(tabs)/(dashboard)")} />
          </>
        )
      ) : (
        <>
          {!!err && <Text style={{ fontSize: 14, color: "crimson" }}>{decodeURIComponent(err)}</Text>}
          <Button title="Zurück" onPress={() => router.replace("/onboarding/connect-platforms")} />
        </>
      )}
    </View>
  );
}
