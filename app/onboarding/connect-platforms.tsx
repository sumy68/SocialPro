// app/onboarding/connect-platforms.tsx
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
import { Linkedin, Instagram, Music2, CheckCircle } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { Platform } from "@/constants/types";
import { useApp } from "@/contexts/AppContext";
import { startTikTokLogin } from "@/utils/tiktokOAuth";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const { EXPO_PUBLIC_APP_URL, EXPO_PUBLIC_SCHEME } =
  (Constants.expoConfig?.extra as any) ?? {};
const APP_URL: string = EXPO_PUBLIC_APP_URL || "http://localhost:10000";
const DEEP_LINK_SCHEME: string = EXPO_PUBLIC_SCHEME || "socialpro";

const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: DEEP_LINK_SCHEME,
  path: "connected/success",
});
console.log("OAuth Redirect URI 👉", REDIRECT_URI);

const parseQuery = (url: string) => {
  try {
    const safe = url.replace(/^intent:\/\//, "https://").replace("#", "?");
    const u = new URL(safe);
    return {
      path: u.pathname,
      page_id: u.searchParams.get("page_id") ?? undefined,
      ig_user_id: u.searchParams.get("ig_user_id") ?? undefined,
      error: u.searchParams.get("error") ?? undefined,
      status: u.searchParams.get("status") ?? undefined,
      platform: u.searchParams.get("platform") ?? undefined,
      code: u.searchParams.get("code") ?? undefined,
      auth_code: u.searchParams.get("auth_code") ?? undefined,
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

  useEffect(() => {
    AsyncStorage.getItem("ig_connected").then((v) => setIgConnected(v === "1"));
  }, []);

  const startConnect = async (platform: Platform) => {
    try {
      setConnecting(platform);

      if (platform === "linkedin") {
        const START_URL = `${APP_URL}/api/oauth/linkedin/start`;
        const res = await WebBrowser.openAuthSessionAsync(START_URL, REDIRECT_URI);

        if (res.type === "cancel" || res.type === "dismiss") {
          return;
        }
        
        if (res.type !== "success" || !res.url) {
          return;
        }

        console.log("[LinkedIn] Deep link URL:", res.url);
        const q = parseQuery(res.url);
        const code = q.code || q.auth_code;
        if (q.error) throw new Error(`LinkedIn error: ${q.error}`);
        if (!code) throw new Error("Kein Code erhalten");

        const ex = await fetch(
          `${APP_URL}/api/oauth/linkedin/callback/exchange?code=${encodeURIComponent(code)}`,
          { method: "POST", headers: { Accept: "application/json" } }
        );
        const data = await ex.json().catch(() => ({} as any));
        if (!ex.ok || !data?.ok) {
          throw new Error(`Exchange failed: ${data?.error || ex.status}`);
        }

        await connectPlatform("linkedin", "LinkedIn", data?.email ?? "");
        Alert.alert("LinkedIn", "Erfolgreich verbunden ✅");
        return;
      }

      if (platform === "tiktok") {
        const res = await startTikTokLogin();
        console.log("[TikTok] AuthSession result:", res);

        if (res.type === "cancel") {
          Alert.alert("TikTok", "Abgebrochen");
          return;
        }

        if (res.type === "success") {
          await connectPlatform("tiktok", "TikTok", "");
          Alert.alert("TikTok", "Erfolgreich verbunden ✅");
        }

        return;
      }

      if (platform === "instagram") {
        const startUrl = `${APP_URL}/api/oauth/instagram/start?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
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
    Alert.alert(
      "Disconnect Platform",
      `Disconnect ${({ instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok" } as const)[platform]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              if (platform === "tiktok") {
                await fetch(`${APP_URL}/api/oauth/tiktok/disconnect`);
                console.log("[TikTok] Backend tokens cleared");
              }
            } catch (e) {
              console.log("[TikTok] disconnect error", e);
            }

            await disconnectPlatform(platform);

            if (platform === "instagram") {
              await AsyncStorage.removeItem("ig_connected");
              setIgConnected(false);
            }

            Alert.alert("Done", `${({ instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok" } as const)[platform]} disconnected`);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Plattformen verbinden",
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/(dashboard)")}
            style={styles.skipButtonTop}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipButtonTopText}>Überspringen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Plattformen verbinden</Text>
          <Text style={styles.subtitle}>Verbinde Instagram, LinkedIn oder TikTok</Text>
        </View>

        <View style={styles.platforms}>
          <PlatformCard
            icon={<Linkedin size={32} color="#0A66C2" />}
            name="LinkedIn"
            color="#0A66C2"
            status={connectedPlatforms.find((p) => p.platform === "linkedin")}
            onConnect={() => startConnect("linkedin")}
            onDisconnect={() => handleDisconnect("linkedin")}
            isConnecting={connecting === "linkedin"}
          />

          <PlatformCard
            icon={<Instagram size={32} color="#E1306C" />}
            name="Instagram"
            color="#E1306C"
            status={connectedPlatforms.find((p) => p.platform === "instagram")}
            onConnect={() => startConnect("instagram")}
            onDisconnect={() => handleDisconnect("instagram")}
            isConnecting={connecting === "instagram"}
          />

          <PlatformCard
            icon={<Music2 size={32} color="#000000" />}
            name="TikTok"
            color="#000000"
            status={connectedPlatforms.find((p) => p.platform === "tiktok")}
            onConnect={() => startConnect("tiktok")}
            onDisconnect={() => handleDisconnect("tiktok")}
            isConnecting={connecting === "tiktok"}
          />
        </View>
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
          <Text style={[styles.connectButtonText, { color: isConnected ? "#6B7280" : "#FFF" }]}>
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  skipButtonTop: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  skipButtonTopText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  header: { alignItems: "center", marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F1419",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  platforms: { gap: 16, marginBottom: 32 },
  platformCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  platformTextContainer: { flex: 1 },
  platformName: { fontSize: 18, fontWeight: "600", color: "#0F1419" },
  accountName: { fontSize: 12, color: "#666", marginTop: 2 },
  connectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  connectButtonText: { fontSize: 14, fontWeight: "600" },
});