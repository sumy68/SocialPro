import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Calendar,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Hash,
  Clock,
  Wand2,
  Upload,
  Plus,
  X,
  Link,
  Check,
  Settings,
  Play,
} from "lucide-react-native";
import { useSocialMedia } from '@/contexts/SocialMediaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MediaFile } from '@/types/social';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, mediaFiles, connectAccount, uploadMedia, deleteMedia, isAccountConnected } = useSocialMedia();
  const { t, language } = useLanguage();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram"]);
  const [contentType, setContentType] = useState<"post" | "reel" | "story">("post");
  const [caption, setCaption] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const platforms = [
    { name: "Instagram", icon: Instagram, color: "#E4405F" },
    { name: "TikTok", icon: Video, color: "#000000" },
    { name: "LinkedIn", icon: Linkedin, color: "#0077B5" },
    { name: "YouTube", icon: Youtube, color: "#FF0000" },
    { name: "Facebook", icon: Facebook, color: "#1877F2" },
  ];

  const contentTypes = [
    { type: "post", label: t('create.post'), icon: ImageIcon },
    { type: "reel", label: t('create.reel'), icon: Video },
    { type: "story", label: t('create.story'), icon: Calendar },
  ];

  const getAISuggestions = () => {
    switch (language) {
      case 'de':
        return [
          "Motivierendes Montagszitat mit Farbverlauf-Hintergrund",
          "Behind-the-Scenes Arbeitsplatz Setup",
          "Schneller Produktivitätstipp in 60 Sekunden",
          "Branchentrend-Analyse Karussell",
          "Kundenerfolgsgeschichte hervorheben",
        ];
      case 'en':
        return [
          "Motivational Monday quote with gradient background",
          "Behind-the-scenes workplace setup",
          "Quick productivity tip in 60 seconds",
          "Industry trend analysis carousel",
          "Highlight customer success story",
        ];
      case 'tr':
        return [
          "Gradyan arka planlı motivasyonel Pazartesi sözü",
          "Sahne arkası çalışma alanı kurulumu",
          "60 saniyede hızlı verimlilik ipucu",
          "Sektör trend analizi karuseli",
          "Müşteri başarı hikayesini öne çıkar",
        ];
      case 'es':
        return [
          "Cita motivacional de lunes con fondo degradado",
          "Configuración del lugar de trabajo detrás de escena",
          "Consejo rápido de productividad en 60 segundos",
          "Carrusel de análisis de tendencias de la industria",
          "Destacar historia de éxito del cliente",
        ];
      case 'fr':
        return [
          "Citation motivationnelle du lundi avec arrière-plan dégradé",
          "Configuration de l'espace de travail en coulisses",
          "Conseil de productivité rapide en 60 secondes",
          "Carrousel d'analyse des tendances de l'industrie",
          "Mettre en avant l'histoire de succès client",
        ];
      default:
        return [];
    }
  };

  const getTrendingHashtags = () => {
    switch (language) {
      case 'de':
        return ["#produktivität", "#unternehmer", "#motivation", "#erfolg", "#business", "#mindset", "#wachstum", "#innovation", "#führung", "#inspiration"];
      case 'en':
        return ["#productivity", "#entrepreneur", "#motivation", "#success", "#business", "#mindset", "#growth", "#innovation", "#leadership", "#inspiration"];
      case 'tr':
        return ["#verimlilik", "#girişimci", "#motivasyon", "#başarı", "#iş", "#zihniyet", "#büyüme", "#yenilik", "#liderlik", "#ilham"];
      case 'es':
        return ["#productividad", "#emprendedor", "#motivación", "#éxito", "#negocio", "#mentalidad", "#crecimiento", "#innovación", "#liderazgo", "#inspiración"];
      case 'fr':
        return ["#productivité", "#entrepreneur", "#motivation", "#succès", "#affaires", "#mentalité", "#croissance", "#innovation", "#leadership", "#inspiration"];
      default:
        return [];
    }
  };

  const aiSuggestions = getAISuggestions();
  const trendingHashtags = getTrendingHashtags();

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const generateAIContent = async () => {
    setIsGeneratingAI(true);
    // Simulate AI generation
    setTimeout(() => {
      setCaption("🚀 Bereit, dein Produktivitätsspiel auf das nächste Level zu bringen? Hier sind 3 einfache Strategien, auf die erfolgreiche Unternehmer schwören:\n\n1️⃣ Zeitblöcke - Plane deine Prioritäten zuerst\n2️⃣ Die 2-Minuten-Regel - Wenn es weniger als 2 Minuten dauert, mach es jetzt\n3️⃣ Energiemanagement - Arbeite mit deinen natürlichen Rhythmen\n\nWelche wirst du heute ausprobieren? 💪\n\n#produktivität #unternehmer #erfolg #mindset #wachstum");
      setIsGeneratingAI(false);
    }, 2000);
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert(t('create.permissionRequired'), t('create.galleryPermission'));
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets) {
        setIsUploading(true);
        try {
          const uploadedFiles = await uploadMedia(result.assets);
          setSelectedMedia(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
          if (Platform.OS !== 'web') {
            Alert.alert(t('common.error'), t('create.uploadError'));
          }
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setIsUploading(true);
        try {
          const uploadedFiles = await uploadMedia(result.assets);
          setSelectedMedia(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
          if (Platform.OS !== 'web') {
            Alert.alert(t('common.error'), t('create.uploadError'));
          }
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setIsUploading(false);
    }
  };

  const removeSelectedMedia = (fileId: string) => {
    setSelectedMedia(prev => prev.filter(file => file.id !== fileId));
  };

  const handleConnectAccount = async (platform: string) => {
    try {
      await connectAccount(platform);
      if (Platform.OS !== 'web') {
        Alert.alert(t('common.success'), t('create.accountConnected').replace('{platform}', platform));
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      if (Platform.OS !== 'web') {
        Alert.alert(t('common.error'), t('create.connectionFailed'));
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>{t('create.title')}</Text>
              <Text style={styles.subtitle}>{t('create.subtitle')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowAccountSettings(!showAccountSettings)}
            >
              <Settings color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings */}
        {showAccountSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('create.socialMediaAccounts')}</Text>
            <View style={styles.accountsContainer}>
              {platforms.map((platform) => {
                const account = accounts.find(acc => acc.platform === platform.name);
                const isConnected = isAccountConnected(platform.name);
                
                return (
                  <View key={platform.name} style={styles.accountCard}>
                    <View style={styles.accountInfo}>
                      <View style={[styles.platformIconContainer, { backgroundColor: platform.color + "20" }]}>
                        <platform.icon color={platform.color} size={20} />
                      </View>
                      <View style={styles.accountDetails}>
                        <Text style={styles.accountPlatform}>{platform.name}</Text>
                        <Text style={styles.accountStatus}>
                          {isConnected ? account?.username || t('create.connected') : t('create.notConnected')}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.connectButton,
                        isConnected && styles.connectedButton
                      ]}
                      onPress={() => handleConnectAccount(platform.name)}
                    >
                      {isConnected ? (
                        <Check color="#10B981" size={16} />
                      ) : (
                        <Link color="#8B5CF6" size={16} />
                      )}
                      <Text style={[
                        styles.connectButtonText,
                        isConnected && styles.connectedButtonText
                      ]}>
                        {isConnected ? t('create.connected') : t('create.connect')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Media Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.mediaUpload')}</Text>
          <View style={styles.uploadContainer}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickImageFromGallery}
              disabled={isUploading}
            >
              <ImageIcon color="#8B5CF6" size={20} />
              <Text style={styles.uploadButtonText}>
                {isUploading ? t('create.uploading') : t('create.fromGallery')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickDocument}
              disabled={isUploading}
            >
              <Upload color="#8B5CF6" size={20} />
              <Text style={styles.uploadButtonText}>
                {isUploading ? t('create.uploading') : t('create.files')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Selected Media Preview */}
          {selectedMedia.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <FlatList
                data={selectedMedia}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.mediaPreviewItem}>
                    <View style={styles.mediaContainer}>
                      {item.type === 'video' ? (
                        <View style={styles.videoPreview}>
                          <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                          <View style={styles.playOverlay}>
                            <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
                          </View>
                        </View>
                      ) : (
                        <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                      )}
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => removeSelectedMedia(item.id)}
                      >
                        <X color="#FFFFFF" size={12} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.mediaName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>

        {/* AI Content Generator */}
        <LinearGradient
          colors={["#8B5CF6", "#7C3AED"]}
          style={styles.aiSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.aiHeader}>
            <Sparkles color="#FFFFFF" size={24} />
            <Text style={styles.aiTitle}>{t('create.aiContentGenerator')}</Text>
          </View>
          <Text style={styles.aiDescription}>
            {t('create.aiDescription')}
          </Text>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={generateAIContent}
            disabled={isGeneratingAI}
          >
            <Wand2 color="#8B5CF6" size={16} />
            <Text style={styles.aiButtonText}>
              {isGeneratingAI ? t('create.generating') : t('create.generateContent')}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Content Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.contentType')}</Text>
          <View style={styles.contentTypeContainer}>
            {contentTypes.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.contentTypeButton,
                  contentType === type.type && styles.contentTypeButtonActive,
                ]}
                onPress={() => setContentType(type.type as any)}
              >
                <type.icon
                  color={contentType === type.type ? "#8B5CF6" : "#6B7280"}
                  size={20}
                />
                <Text
                  style={[
                    styles.contentTypeText,
                    contentType === type.type && styles.contentTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Platform Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.selectPlatforms')}</Text>
          <View style={styles.platformsContainer}>
            {platforms.map((platform) => {
              const isConnected = isAccountConnected(platform.name);
              const isDisabled = !isConnected;
              
              return (
                <TouchableOpacity
                  key={platform.name}
                  style={[
                    styles.platformButton,
                    selectedPlatforms.includes(platform.name) && styles.platformButtonActive,
                    isDisabled && styles.platformButtonDisabled,
                  ]}
                  onPress={() => !isDisabled && togglePlatform(platform.name)}
                  disabled={isDisabled}
                >
                  <View
                    style={[
                      styles.platformIconContainer,
                      { backgroundColor: platform.color + "20" },
                    ]}
                  >
                    <platform.icon color={isDisabled ? "#9CA3AF" : platform.color} size={20} />
                  </View>
                  <View style={styles.platformInfo}>
                    <Text style={[
                      styles.platformText,
                      isDisabled && styles.platformTextDisabled
                    ]}>
                      {platform.name}
                    </Text>
                    {!isConnected && (
                      <Text style={styles.platformStatus}>{t('create.notConnected')}</Text>
                    )}
                  </View>
                  {selectedPlatforms.includes(platform.name) && !isDisabled && (
                    <View style={styles.selectedIndicator} />
                  )}
                  {!isConnected && (
                    <Link color="#9CA3AF" size={16} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Caption Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.description')}</Text>
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder={t('create.descriptionPlaceholder')}
              multiline
              numberOfLines={6}
              value={caption}
              onChangeText={setCaption}
              textAlignVertical="top"
            />
            <View style={styles.captionActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Hash color="#6B7280" size={16} />
                <Text style={styles.actionText}>{t('create.addHashtags')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Sparkles color="#6B7280" size={16} />
                <Text style={styles.actionText}>{t('create.aiImprove')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AI Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.aiContentIdeas')}</Text>
          {aiSuggestions.map((suggestion, index) => (
            <TouchableOpacity key={index} style={styles.suggestionCard}>
              <Sparkles color="#8B5CF6" size={16} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.trendingHashtags')}</Text>
          <View style={styles.hashtagsContainer}>
            {trendingHashtags.map((hashtag, index) => (
              <TouchableOpacity key={index} style={styles.hashtagButton}>
                <Text style={styles.hashtagText}>{hashtag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Schedule Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('create.publishingOptions')}</Text>
          <View style={styles.publishingContainer}>
            <TouchableOpacity style={styles.publishButton}>
              <Text style={styles.publishButtonText}>{t('create.postNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleButton}>
              <Clock color="#8B5CF6" size={16} />
              <Text style={styles.scheduleButtonText}>{t('create.schedule')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  aiSection: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  aiDescription: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 16,
    lineHeight: 20,
  },
  aiButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  contentTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  contentTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    gap: 8,
  },
  contentTypeButtonActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F8F5FF",
  },
  contentTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  contentTypeTextActive: {
    color: "#8B5CF6",
  },
  platformsContainer: {
    gap: 12,
  },
  platformButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    position: "relative",
  },
  platformButtonActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F8F5FF",
  },
  platformIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  platformText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
  },
  captionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  captionInput: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    minHeight: 120,
    marginBottom: 12,
  },
  captionActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hashtagButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  hashtagText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  publishingContainer: {
    flexDirection: "row",
    gap: 12,
  },
  publishButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  accountsContainer: {
    gap: 12,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountDetails: {
    flex: 1,
  },
  accountPlatform: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  accountStatus: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F8F5FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    gap: 4,
  },
  connectedButton: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  connectedButtonText: {
    color: "#10B981",
  },
  uploadContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  mediaPreviewContainer: {
    marginTop: 12,
  },
  mediaPreviewItem: {
    marginRight: 12,
    width: 80,
  },
  mediaContainer: {
    position: "relative",
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  videoPreview: {
    position: "relative",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
  },
  removeMediaButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaName: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  platformButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#F9FAFB",
  },
  platformInfo: {
    flex: 1,
  },
  platformTextDisabled: {
    color: "#9CA3AF",
  },
  platformStatus: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
  },
});