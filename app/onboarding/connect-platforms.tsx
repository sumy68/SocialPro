import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  Linkedin,
  Instagram,
  Music2,
  Youtube,
  CheckCircle,
} from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { Platform } from "@/constants/types";
import { useApp } from "@/contexts/AppContext";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const { EXPO_PUBLIC_APP_URL, EXPO_PUBLIC_SCHEME } = Constants.expoConfig?.extra ?? {};
const APP_URL = (EXPO_PUBLIC_APP_URL as string) || "http://localhost:10000"; // ✅ Fallback für Lokaltests
const API_BASE = `${APP_URL}/api`;
const DEEP_LINK_SCHEME = (EXPO_PUBLIC_SCHEME as string) || "socialpro";
const OAUTH_STATE = "test-user-123";

const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: DEEP_LINK_SCHEME,
  path: "connected/success",
});
console.log("IG Redirect URI 👉", REDIRECT_URI);

// ✅ intent:// Fix + Parsing
const parseQuery = (url: string) => {
  try {
    const safe = url.replace(/^intent:\/\//, "https://");
    const u = new URL(safe);
    return {
      path: u.pathname,
      page_id: u.searchParams.get("page_id") ?? undefined,
      ig_user_id: u.searchParams.get("ig_user_id") ?? undefined,
      error: u.searchParams.get("error") ?? undefined,
      status: u.searchParams.get("status") ?? undefined,
      platform: u.searchParams.get("platform") ?? undefined,
      code: u.searchParams.get("code") ?? undefined,
    };
  } catch {
    return {};
  }
};

export default function ConnectPlatformsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { connectedPlatforms, connectPlatform, disconnectPlatform } = useApp();
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [igConnected, setIgConnected] = useState(false);

  // ✅ Deep-Link abfangen & speichern
  useEffect(() => {
    const handleUrl = async (url: string) => {
      const q = parseQuery(url);
      if (q.platform === "instagram") {
        if (q.status === "ok") {
          await AsyncStorage.setItem("ig_connected", "1");
          setIgConnected(true);
          await connectPlatform("instagram", "Instagram Business", q.ig_user_id ?? "");
          Alert.alert("Instagram", "Erfolgreich verbunden ✅");
        } else {
          await AsyncStorage.removeItem("ig_connected");
          setIgConnected(false);
          if (q.error) Alert.alert("Instagram", `Fehler: ${q.error}`);
        }
      }
    };

    Linking.getInitialURL().then((u) => u && handleUrl(u));
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [connectPlatform]);

  // ✅ gespeicherten Zustand laden
  useEffect(() => {
    AsyncStorage.getItem("ig_connected").then((v) => setIgConnected(v === "1"));
  }, []);

  const startConnect = async (platform: Platform) => {
    try {
      setConnecting(platform);

      if (platform === "linkedin") {
        const START_URL = `${APP_URL}/api/oauth/linkedin/start`;
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: DEEP_LINK_SCHEME,
          path: "linkedin/success",
        });

        const res = await AuthSession.openAuthSessionAsync(START_URL, redirectUri);

        if (res.type !== "success" || !res.url) {
          throw new Error("Login abgebrochen");
        }

        const url = new URL(res.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        if (error) throw new Error(`LinkedIn error: ${error}`);
        if (!code) throw new Error("Kein Code erhalten");

        const ex = await fetch(
          `${APP_URL}/api/oauth/linkedin/callback/exchange?code=${encodeURIComponent(code)}`,
          { headers: { Accept: "application/json" } }
        );
        const data = await ex.json();
        if (!ex.ok || !data?.ok)
          throw new Error(`Exchange failed: ${data?.error || ex.status}`);

        await connectPlatform("linkedin", "LinkedIn", data?.email ?? "");
        Alert.alert("LinkedIn", "Erfolgreich verbunden ✅");
        return;
      }

      if (platform === "tiktok") {
        const redirectUri = encodeURIComponent(`${API_BASE}/oauth/tiktok/callback`);
        const scope = encodeURIComponent("user.info.basic video.list video.upload");
        const state = encodeURIComponent(OAUTH_STATE);
        return await WebBrowser.openBrowserAsync(
          `https://www.tiktok.com/v2/auth/authorize/?client_key=DEIN_TIKTOK_CLIENT_KEY&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
        );
      }

      if (platform === "youtube") {
        const redirectUri = encodeURIComponent(`${API_BASE}/oauth/youtube/callback`);
        const scope = encodeURIComponent(
          "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
        );
        const state = encodeURIComponent(OAUTH_STATE);
        return await WebBrowser.openBrowserAsync(
          `https://accounts.google.com/o/oauth2/v2/auth?client_id=DEIN_YT_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&include_granted_scopes=true&state=${state}`
        );
      }

      if (platform === "instagram") {
        const startUrl = `${APP_URL}/api/oauth/instagram/start?redirect_uri=${encodeURIComponent(
          REDIRECT_URI
        )}`;
        const result = await WebBrowser.openAuthSessionAsync(startUrl, REDIRECT_URI);

        if (result.type === "success" && result.url) {
          const q = parseQuery(result.url);
          if (q.error) {
            Alert.alert("Instagram", `Verbindung fehlgeschlagen: ${q.error}`);
            return;
          }
          if (q.page_id && q.ig_user_id) {
            await AsyncStorage.setItem("ig_connected", "1");
            setIgConnected(true);
            await connectPlatform("instagram", "Instagram Business", q.ig_user_id ?? "");
            Alert.alert("Instagram", `Verbunden ✅\nPage: ${q.page_id}\nIG: ${q.ig_user_id}`);
            return;
          }
        }

        if (result.type === "cancel") {
          Alert.alert("Instagram", "Abgebrochen");
          return;
        }

        Alert.alert("Instagram", "Unbekanntes Ergebnis. Bitte erneut versuchen.");
        return;
      }

      throw new Error("Unsupported platform: " + platform);
    } catch (err: any) {
      console.error("[OAuth] Error:", err);
      Alert.alert("Error", err?.message ?? "OAuth failed");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    Alert.alert("Disconnect Platform", `Disconnect ${t.platforms[platform]}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          await disconnectPlatform(platform);
          if (platform === "instagram") {
            await AsyncStorage.removeItem("ig_connected");
            setIgConnected(false);
          }
          Alert.alert("Done", `${t.platforms[platform]} disconnected`);
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{ title: t.onboarding.platforms.title, headerBackTitle: t.back }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.onboarding.platforms.title}</Text>
          <Text style={styles.subtitle}>{t.onboarding.platforms.subtitle}</Text>
        </View>

        <View style={styles.platforms}>
          <PlatformCard
            icon={<Linkedin size={32} color="#0A66C2" />}
            name={t.platforms.linkedin}
            color="#0A66C2"
            status={connectedPlatforms.find((p) => p.platform === "linkedin")}
            onConnect={() => startConnect("linkedin")}
            onDisconnect={() => handleDisconnect("linkedin")}
            isConnecting={connecting === "linkedin"}
          />

          <PlatformCard
            icon={<Instagram size={32} color="#E1306C" />}
            name={t.platforms.instagram}
            color="#E1306C"
            status={connectedPlatforms.find((p) => p.platform === "instagram")}
            onConnect={() => startConnect("instagram")}
            onDisconnect={() => handleDisconnect("instagram")}
            isConnecting={connecting === "instagram"}
          />

          <PlatformCard
            icon={<Music2 size={32} color="#000000" />}
            name={t.platforms.tiktok}
            color="#000000"
            status={connectedPlatforms.find((p) => p.platform === "tiktok")}
            onConnect={() => startConnect("tiktok")}
            onDisconnect={() => handleDisconnect("tiktok")}
            isConnecting={connecting === "tiktok"}
          />

          <PlatformCard
            icon={<Youtube size={32} color="#FF0000" />}
            name={t.platforms.youtube}
            color="#FF0000"
            status={connectedPlatforms.find((p) => p.platform === "youtube")}
            onConnect={() => startConnect("youtube")}
            onDisconnect={() => handleDisconnect("youtube")}
            isConnecting={connecting === "youtube"}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/subscription" as any)}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>{t.onboarding.platforms.connectLater}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function PlatformCard({
  icon,
  name,
  color,
  status,
  onConnect = () => {},
  onDisconnect = () => {},
  isConnecting = false,
}) {
  const isConnected = !!status?.connected;
  const bg = color || "#888";

  const handlePress = () => {
    try {
      if (isConnected) onDisconnect();
      else onConnect();
    } catch (e) {
      console.error("[PlatformCard] onPress error:", e);
    }
  };

  return (
    <View style={[styles.platformCard, { borderLeftColor: bg, borderLeftWidth: 4 }]}>
      <View style={styles.platformInfo}>
        {icon}
        <View style={styles.platformTextContainer}>
          <Text style={styles.platformName}>{name}</Text>
          {isConnected && status?.accountName && (
            <Text style={styles.accountName}>{status.accountName}</Text>
          )}
        </View>
        {isConnected && <CheckCircle size={20} color="#10B981" />}
      </View>

      {isConnecting ? (
        <ActivityIndicator color={bg} />
      ) : (
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: isConnected ? "#F3F4F6" : bg }]}
          onPress={handlePress}
        >
          <Text
            style={[
              styles.connectButtonText,
              { color: isConnected ? "#6B7280" : "#FFF" },
            ]}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  contentContainer: { padding: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", color: "#0F1419", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", paddingHorizontal: 20 },
  platforms: { gap: 16, marginBottom: 32 },
  platformCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformInfo: { flexDirection: "row", alignItems: "center", gap: 16, flex: 1 },
  platformTextContainer: { flex: 1 },
  platformName: { fontSize: 18, fontWeight: "600", color: "#0F1419" },
  accountName: { fontSize: 12, color: "#666", marginTop: 2 },
  connectButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  connectButtonText: { fontSize: 14, fontWeight: "600" },
  skipButton: { paddingVertical: 16, alignItems: "center" },
  skipButtonText: { fontSize: 16, fontWeight: "600", color: "#0A66C2" },
});
