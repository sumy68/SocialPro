import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform as RNPlatform,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import {
  ImageIcon,
  Upload,
  Wand2,
  Link2,
  X,
  Calendar,
  Clock,
  Send,
} from "lucide-react-native";

import { useApp } from "@/contexts/AppContext";
import { Platform } from "@/constants/types";
import { generateText } from "@/lib/toolkit";
import { usePublishPost } from "@/hooks/usePublishPost";

import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CreateScreen() {
  const { addPost, connectedPlatforms } = useApp();
  const { publishToMultiplePlatforms, isPublishing } = usePublishPost();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(
    new Date(Date.now() + 3600000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [autoPost, setAutoPost] = useState(true);
  const [contentType, setContentType] = useState<"post" | "reel">("post");
  const [showAiFallbackInfo, setShowAiFallbackInfo] = useState(false);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const pickImage = async () => {
    if (isUploadingImage) return;
    try {
      setIsUploadingImage(true);
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== "granted") {
        setIsUploadingImage(false);
        Alert.alert(
          "Berechtigung erforderlich",
          "Bitte Galerie-Zugriff erlauben.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets?.length) {
        const images = result.assets
          .filter((a) => a.type === "image")
          .map((a) => a.uri);
        const videos = result.assets
          .filter((a) => a.type === "video")
          .map((a) => a.uri);
        if (images.length) setSelectedImages((prev) => [...prev, ...images]);
        if (videos.length) setSelectedVideos((prev) => [...prev, ...videos]);

        const total = images.length + videos.length;
        Alert.alert(
          "Erfolg",
          `${total} Datei(en) hochgeladen (${images.length} Bilder, ${videos.length} Videos)`
        );
      }
    } catch (e) {
      console.error("[Image Picker] Error:", e);
      Alert.alert("Fehler", "Bilder konnten nicht geladen werden.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) =>
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  const removeVideo = (index: number) =>
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));

  const handleGenerateCaption = async () => {
    if (isGenerating) return;

    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert("Keine Medien", "Bitte lade zuerst Bilder oder Videos hoch.");
      return;
    }

    setIsGenerating(true);
    try {
      const imageParts = await Promise.all(
        selectedImages.slice(0, 3).map(async (uri) => {
          try {
            const base64Data = await FileSystem.readAsStringAsync(uri, {
              encoding: "base64",
            });
            return {
              type: "image" as const,
              image: `data:image/jpeg;base64,${base64Data}`,
            };
          } catch (e) {
            console.error("[AI] base64 error", e);
            return null;
          }
        })
      ).then(
        (arr) => arr.filter(Boolean) as { type: "image"; image: string }[]
      );

      const hasVideos = selectedVideos.length > 0;
      const systemMsg =
        "Du bist ein deutschsprachiger Social-Media-Copywriter. " +
        "Analysiere die gelieferten Bilder visuell. Schreibe eine kurze Caption (1–2 Sätze, 2–3 Emojis). " +
        'Antworte nur als JSON: {"caption":"…","hashtags":["#…","…"]}';

      const userText = `Erzeuge eine Caption${
        hasVideos ? " (auch für Video)" : ""
      }.`;

      let aiRaw = "";
      try {
        aiRaw = await generateText({
          messages: [
            { role: "system", content: [{ type: "text", text: systemMsg }] },
            {
              role: "user",
              content: [{ type: "text", text: userText }, ...imageParts],
            },
          ],
        });
      } catch (e) {
        console.log("[AI] primary call failed", e);
      }

      const match = aiRaw.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : null;
      const captionText =
        parsed?.caption?.trim() ||
        "✨ Beispiel-Caption: Lass deiner Kreativität freien Lauf! 🚀";
      const cleanTags = (parsed?.hashtags || [])
        .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
        .slice(0, 7);

      setCaption(captionText);
      setHashtags(cleanTags.join(" "));
    } catch (error: any) {
      console.error("[AI] failed:", error);
      Alert.alert(
        "KI-Generator Fehler",
        error?.message || "Konnte keine Caption erzeugen."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert("Fehler", "Bitte mindestens eine Plattform auswählen");
      return;
    }

    const allMediaUrls = [...selectedImages, ...selectedVideos];
    const post = {
      id: Date.now().toString(),
      platforms: selectedPlatforms,
      caption: caption.trim(),
      hashtags: hashtags.split(" ").filter((h) => h.trim()),
      mediaUrls: allMediaUrls.length ? allMediaUrls : undefined,
      mediaType:
        selectedVideos.length > 0
          ? ("video" as const)
          : selectedImages.length > 0
          ? ("image" as const)
          : undefined,
      scheduledDate: scheduledDate.toISOString(),
      status: "scheduled" as const,
      autoPost,
      contentType,
    };

    await addPost(post);
    Alert.alert("Erfolg!", "Post erfolgreich erstellt 🎉");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* dein UI wie gehabt … */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medien Hochladen</Text>
        <View style={styles.mediaButtonsRow}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={pickImage}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <ImageIcon size={24} color="#7C3AED" />
            )}
            <Text style={styles.mediaButtonText}>
              {isUploadingImage ? "Lädt..." : "Aus Galerie"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.aiGeneratorCard}>
        <Text style={styles.aiGeneratorTitle}>KI Content Generator</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateCaption}
          disabled={isGenerating}
        >
          <Wand2 size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>
            {isGenerating ? "Generiere..." : "Captions & Hashtags Generieren"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.scheduleButton,
          selectedPlatforms.length === 0 && styles.scheduleButtonDisabled,
        ]}
        onPress={handleSchedulePost}
        disabled={selectedPlatforms.length === 0}
      >
        {isPublishing() ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Send size={20} color="#FFFFFF" />
        )}
        <Text style={styles.scheduleButtonText}>
          {isPublishing() ? "Wird veröffentlicht..." : "Post Planen"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  mediaButtonsRow: { flexDirection: "row", gap: 12 },
  mediaButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7C3AED",
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  mediaButtonText: { fontSize: 14, fontWeight: "500", color: "#000" },
  aiGeneratorCard: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  aiGeneratorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7C3AED",
  },
  scheduleButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  scheduleButtonDisabled: { backgroundColor: "#CCC" },
  scheduleButtonText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
