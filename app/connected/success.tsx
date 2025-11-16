import { View, Text, Button, ActivityIndicator, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useApp } from "@/contexts/AppContext";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";

type LinkedInUser = { sub?: string; name?: string; email?: string; picture?: string } | null;

// simple fetch timeout helper (7s)
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export default function ConnectedSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { connectPlatform } = useApp();

  // provider: instagram | linkedin | tiktok
  const provider = useMemo(
    () => String(params.provider ?? "instagram").toLowerCase(),
    [params.provider]
  );
  const code = useMemo(() => String(params.code ?? ""), [params.code]);
  const initialError = useMemo(() => String(params.error ?? ""), [params.error]);

  // IG result
  const [pageId, setPageId] = useState<string>("");
  const [igUserId, setIgUserId] = useState<string>("");

  // LI result
  const [liUser, setLiUser] = useState<LinkedInUser>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(initialError);

  // run-once guard (verhindert doppelten Exchange)
  const didRunRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web") SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const run = async () => {
      if (didRunRef.current) return;
      didRunRef.current = true;

      // Startzustand
      setErr(initialError || "");

      // 🔹 TikTok: kein Code, kein Exchange, Backend hat schon alles erledigt
            // 🔹 TikTok: kein Code, aber wir speichern direkt als verbunden
            if (provider === "tiktok") {
              try {
                await connectPlatform(
                  "tiktok",
                  "TikTok Sandbox User",
                  "tiktok-sandbox"
                );
              } catch (e) {
                console.log("TikTok connect error", e);
                setErr("Konnte TikTok nicht speichern");
              }
              return;
            }
      

      // LinkedIn & Instagram brauchen code (Exchange)
      if (!code) return;

      setLoading(true);
      setErr("");

      try {
        if (provider === "linkedin") {
          const url = `${APP_URL}/api/oauth/linkedin/callback/exchange?code=${encodeURIComponent(
            code
          )}`;

          const res = await fetchWithTimeout(
            url,
            { method: "GET", headers: { Accept: "application/json" } },
            7000
          );
          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || `exchange_failed (${res.status})`);
          }

          setLiUser(data?.me ?? null);
        } else {
          // instagram (default)
          const url = `${APP_URL}/api/oauth/instagram/callback/exchange?code=${encodeURIComponent(
            code
          )}`;

          const res = await fetchWithTimeout(
            url,
            { method: "GET", headers: { Accept: "application/json" } },
            7000
          );
          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || `exchange_failed (${res.status})`);
          }

          setPageId(String(data.page_id ?? ""));
          setIgUserId(String(data.ig_user_id ?? ""));
        }
      } catch (e: any) {
        const msg =
          e?.name === "AbortError"
            ? "Zeitüberschreitung beim Verbinden. Bitte erneut versuchen."
            : e?.message || "exchange_failed";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [code, provider, initialError, connectPlatform]);

  const ok =
    provider === "linkedin"
      ? !!liUser?.sub
      : provider === "tiktok"
      ? !err // TikTok: ok, solange kein Fehlerparam
      : !!pageId && !!igUserId; // Instagram

      const handleSave = async () => {
        try {
          // 🔹 TikTok: dauerhaft speichern (wie bei LinkedIn & Instagram)
          if (provider === "tiktok") {
            Alert.alert("TikTok", "Erfolgreich verbunden ✅");
            router.replace("/(tabs)/(dashboard)");
            return;
          }

      
          // 🔹 LinkedIn
          if (provider === "linkedin") {
            await connectPlatform(
              "linkedin",
              liUser?.name ?? "LinkedIn User",
              liUser?.email ?? ""
            );
            Alert.alert("LinkedIn", "Erfolgreich verbunden ✅");
            router.replace("/(tabs)/(dashboard)");
            return;
          }
      
          // 🔹 Instagram
          await connectPlatform(
            "instagram",
            "Instagram Business",
            igUserId
          );
          Alert.alert("Instagram", "Erfolgreich verbunden ✅");
          router.replace("/(tabs)/(dashboard)");
      
        } catch (e: any) {
          Alert.alert("Fehler", e?.message ?? "Konnte nicht speichern");
        }
      };
    
    
  const showErr = !loading && (!ok || !!err);

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
            <Button
              title="Später"
              onPress={() => router.replace("/(tabs)/(dashboard)")}
            />
          </>
        ) : provider === "tiktok" ? (
          <>
            <Text style={{ fontSize: 16 }}>TikTok erfolgreich verbunden 🎉</Text>
            <Button title="Speichern & weiter" onPress={handleSave} />
            <Button
              title="Später"
              onPress={() => router.replace("/(tabs)/(dashboard)")}
            />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16 }}>Page ID: {pageId}</Text>
            <Text style={{ fontSize: 16 }}>IG User ID: {igUserId}</Text>
            <Button title="Speichern & weiter" onPress={handleSave} />
            <Button
              title="Später"
              onPress={() => router.replace("/(tabs)/(dashboard)")}
            />
          </>
        )
      ) : (
        <>
          {showErr && (
            <Text style={{ fontSize: 14, color: "crimson" }}>
              {err ? decodeURIComponent(err) : "Unbekannter Fehler beim Verbinden"}
            </Text>
          )}
          <Button
            title="Zurück"
            onPress={() => router.replace("/onboarding/connect-platforms")}
          />
        </>
      )}
    </View>
  );
}
