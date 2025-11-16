import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, Platform as RNPlatform, ActivityIndicator, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ImageIcon, Upload, Wand2, Link2, X, Calendar, Clock, Send } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Platform } from '@/constants/types';
import { Stack } from 'expo-router';
import { generateText } from '@/lib/toolkit';
import { usePublishPost } from '@/hooks/usePublishPost';

import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// 👇 einzig neu:
import { LocalTRPCProvider } from './trpc-local';

function CreateScreenInner() {
  const { addPost, connectedPlatforms } = useApp();
  const { publishToMultiplePlatforms, isPublishing } = usePublishPost();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [autoPost, setAutoPost] = useState<boolean>(true);
  const [contentType, setContentType] = useState<'post' | 'reel'>('post');
  const [showAiFallbackInfo, setShowAiFallbackInfo] = useState<boolean>(false);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const pickImage = async () => {
    if (isUploadingImage) return;
    try {
      setIsUploadingImage(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        setIsUploadingImage(false);
        Alert.alert('Berechtigung erforderlich', 'Bitte Galerie-Zugriff erlauben.', [{ text: 'OK' }]);
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
        const images = result.assets.filter(a => a.type === 'image').map(a => a.uri);
        const videos = result.assets.filter(a => a.type === 'video').map(a => a.uri);
        if (images.length) setSelectedImages(prev => [...prev, ...images]);
        if (videos.length) setSelectedVideos(prev => [...prev, ...videos]);

        const total = images.length + videos.length;
        Alert.alert('Erfolg', `${total} Datei(en) hochgeladen (${images.length} Bilder, ${videos.length} Videos)`);
      }
    } catch (e) {
      console.error('[Image Picker] Error:', e);
      Alert.alert('Fehler', 'Bilder konnten nicht geladen werden.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => setSelectedImages(prev => prev.filter((_, i) => i !== index));
  const removeVideo = (index: number) => setSelectedVideos(prev => prev.filter((_, i) => i !== index));

  // --- SMART VISION CAPTION (JSON-Output) ---
  const handleGenerateCaption = async () => {
    if (isGenerating) return;

    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert('Keine Medien', 'Bitte lade zuerst Bilder oder Videos hoch.');
      return;
    }

    setIsGenerating(true);
    try {
      // Bilder → Base64 (max 3)
      const imageParts = await Promise.all(
        selectedImages.slice(0, 3).map(async (uri) => {
          try {
            let base64Data: string;
            if (RNPlatform.OS === 'web') {
              const res = await fetch(uri);
              const blob = await res.blob();
              base64Data = await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve((r.result as string).split(',')[1]);
                r.readAsDataURL(blob);
              });
            } else {
              base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            }
            return { type: 'image' as const, image: `data:image/jpeg;base64,${base64Data}` };
          } catch (e) {
            console.error('[AI] base64 error', e);
            return null;
          }
        })
      ).then(arr => arr.filter(Boolean) as { type: 'image'; image: string }[]);

      const hasVideos = selectedVideos.length > 0;
      const systemMsg =
        'Du bist ein deutschsprachiger Social-Media-Copywriter. ' +
        'Analysiere die gelieferten Bilder visuell (Objekte, Farben, Stimmung, Setting, Perspektive). ' +
        'Schreibe eine kurze Caption (1–2 Sätze, 2–3 Emojis, freundlicher Profi-Ton). ' +
        'Erzeuge 4–7 relevante, konkrete Hashtags (ohne #SocialMedia o.ä.). ' +
        'Antworte NUR als JSON: {"caption":"…","hashtags":["#…","…"]}';

      const userText =
        `Erzeuge eine zum Inhalt passende Caption.${hasVideos ? ' Es kann auch Video enthalten.' : ''} ` +
        'Keine Erklärungen, nur JSON.';

      let aiRaw = '';
      try {
        aiRaw = await generateText({
          messages: [
            { role: 'system', content: [{ type: 'text', text: systemMsg }] },
            { role: 'user', content: [{ type: 'text', text: userText }, ...imageParts] },
          ],
        });
      } catch (e) {
        console.log('[AI] primary call failed', e);
      }

      type AIResp = { caption: string; hashtags: string[] };
      const tryParse = (txt: string): AIResp | null => {
        if (!txt) return null;
        const match = txt.match(/\{[\s\S]*\}/);
        try {
          const obj = JSON.parse(match ? match[0] : txt);
          if (obj && typeof obj.caption === 'string' && Array.isArray(obj.hashtags)) return obj as AIResp;
          return null;
        } catch {
          return null;
        }
      };

      let parsed = tryParse(aiRaw);

      if (!parsed) {
        setShowAiFallbackInfo(true);
        parsed = {
          caption: '✨ Beispiel-Caption: Lass deiner Kreativität freien Lauf! 🚀',
          hashtags: ['#Inspiration', '#Motivation', '#Creativity', '#Design', '#DailyVibes'],
        };
      }

      const cleanCaption = parsed.caption.trim();
      const cleanTags = parsed.hashtags
        .map(h => (h.startsWith('#') ? h : `#${h}`))
        .filter(h => /^#[\wäöüÄÖÜß]+$/i.test(h))
        .slice(0, 7);

      if (!cleanCaption) throw new Error('Leere Caption vom Modell');

      setCaption(cleanCaption);
      setHashtags(cleanTags.join(' '));
    } catch (error: any) {
      console.error('[AI] failed:', error);
      Alert.alert('KI-Generator Fehler', error?.message || 'Konnte keine Caption erzeugen.');
    } finally {
      setIsGenerating(false);
    }
  };
  // --- /SMART VISION CAPTION ---

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const now = new Date();
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      if (newDate < now) {
        Alert.alert('Ungültige Zeit', 'Bitte Datum in der Zukunft wählen.');
        return;
      }
      setScheduledDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const now = new Date();
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      if (newDate <= now) {
        Alert.alert('Ungültige Zeit', 'Bitte Uhrzeit in der Zukunft wählen.');
        return;
      }
      setScheduledDate(newDate);
    }
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert('Fehler', 'Bitte mindestens eine Plattform auswählen');
      return;
    }
    if (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert('Fehler', 'Bitte Caption oder Medien hinzufügen');
      return;
    }
    const now = new Date();
    if (scheduledDate <= now) {
      Alert.alert('Ungültige Zeit', 'Zeitpunkt muss in der Zukunft liegen.');
      return;
    }

    const allMediaUrls = [...selectedImages, ...selectedVideos];
    const fullCaption = caption.trim() + (hashtags.trim() ? ' ' + hashtags.trim() : '');
    const mediaType =
      selectedVideos.length > 0 ? ('video' as const) : selectedImages.length > 0 ? ('image' as const) : undefined;

    const post = {
      id: Date.now().toString(),
      platforms: selectedPlatforms,
      caption: caption.trim(),
      hashtags: hashtags.split(' ').filter(h => h.trim()),
      mediaUrls: allMediaUrls.length > 0 ? allMediaUrls : undefined,
      mediaType,
      scheduledDate: scheduledDate.toISOString(),
      status: 'scheduled' as const,
      autoPost,
      contentType,
    };

    if (autoPost) {
      const connectedSelectedPlatforms = selectedPlatforms.filter(p => {
        const item = connectedPlatforms.find(x => x.platform === p);
        return item?.connected;
      });

      if (connectedSelectedPlatforms.length === 0) {
        Alert.alert('Keine verbundenen Plattformen', 'Bitte zuerst Plattformen verbinden.');
        return;
      }

      const result = await publishToMultiplePlatforms(connectedSelectedPlatforms, {
        caption: fullCaption,
        mediaUrls: allMediaUrls.length ? allMediaUrls : undefined,
        mediaType,
        contentType,
      });

      if (result.successfulPlatforms.length > 0) {
        const successMsg = `Erfolgreich auf: ${result.successfulPlatforms.join(', ')}`;
        const failMsg =
          result.failedPlatforms.length > 0
            ? `\n\nFehlgeschlagen: ${result.failedPlatforms
                .map(p => `${p} (${result.errors[p]})`)
                .join(', ')}`
            : '';
        Alert.alert(result.failedPlatforms.length ? 'Teilweise erfolgreich' : 'Erfolg!', successMsg + failMsg);
      } else {
        Alert.alert(
          'Veröffentlichung fehlgeschlagen',
          result.failedPlatforms.map(p => `${p}: ${result.errors[p]}`).join('\n')
        );
        return;
      }
    }

    await addPost(post);

    const dateStr = scheduledDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
    const timeStr = scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (!autoPost) Alert.alert('Erfolg!', `Post geplant für ${dateStr} um ${timeStr}`);

    setCaption('');
    setHashtags('');
    setSelectedPlatforms([]);
    setSelectedImages([]);
    setSelectedVideos([]);
    setScheduledDate(new Date(Date.now() + 3600000));
    setContentType('post');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Erstellen' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medien Hochladen</Text>
          <View style={styles.mediaButtonsRow}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={isUploadingImage}>
              {isUploadingImage ? <ActivityIndicator size="small" color="#7C3AED" /> : <ImageIcon size={24} color="#7C3AED" />}
              <Text style={styles.mediaButtonText}>{isUploadingImage ? 'Lädt...' : 'Aus Galerie'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={isUploadingImage}>
              <Upload size={24} color="#7C3AED" />
              <Text style={styles.mediaButtonText}>Dateien</Text>
            </TouchableOpacity>
          </View>

          {(selectedImages.length > 0 || selectedVideos.length > 0) && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.imagePreviewTitle}>
                {`${selectedImages.length > 0 ? `${selectedImages.length} ${selectedImages.length === 1 ? 'Bild' : 'Bilder'}` : ''}${
                  selectedImages.length > 0 && selectedVideos.length > 0 ? ', ' : ''
                }${selectedVideos.length > 0 ? `${selectedVideos.length} ${selectedVideos.length === 1 ? 'Video' : 'Videos'}` : ''} ausgewählt`}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
                {selectedImages.map((uri, index) => (
                  <View key={`img-${index}`} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedVideos.map((uri, index) => (
                  <View key={`vid-${index}`} style={styles.imagePreviewWrapper}>
                    {RNPlatform.OS === 'web' ? (
                      <View style={[styles.imagePreview, { alignItems: 'center', justifyContent: 'center' }]} testID={`video-fallback-${index}`}>
                        <Text style={styles.videoIndicatorText}>VIDEO</Text>
                      </View>
                    ) : (
                      // @ts-ignore: expo-av not bundled here
                      <View style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[styles.videoIndicatorText, { color: '#FFF' }]}>VIDEO</Text>
                      </View>
                    )}
                    <View style={styles.videoIndicator}>
                      <Text style={styles.videoIndicatorText}>VIDEO</Text>
                    </View>
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeVideo(index)}>
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.aiGeneratorCard}>
          <View style={styles.aiGeneratorHeader}>
            <Wand2 size={24} color="#7C3AED" />
            <View style={styles.aiGeneratorTextContainer}>
              <Text style={styles.aiGeneratorTitle}>KI Content Generator</Text>
              <Text style={styles.aiGeneratorSubtitle}>Lass die KI ansprechende Inhalte basierend auf Trends und deiner Marke erstellen</Text>
            </View>
          </View>
          {showAiFallbackInfo && (
            <View style={styles.aiFallbackInfo}>
              <Text style={styles.aiFallbackInfoText}>💡 KI-API nicht verfügbar. Beispiel-Caption erstellt.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateCaption} disabled={isGenerating}>
            <Wand2 size={18} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>{isGenerating ? 'Generiere...' : 'Captions & Hashtags Generieren'}</Text>
          </TouchableOpacity>
        </View>

        {!!caption.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput style={styles.captionInput} value={caption} onChangeText={setCaption} multiline placeholder="Deine Caption hier..." placeholderTextColor="#999" />
          </View>
        )}

        {!!hashtags.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hashtags</Text>
            <TextInput style={styles.hashtagsInput} value={hashtags} onChangeText={setHashtags} multiline placeholder="#Hashtags" placeholderTextColor="#999" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veröffentlichungsart</Text>
          <Text style={styles.sectionDescription}>Wähle, wie dein Content veröffentlicht werden soll</Text>
          <View style={styles.contentTypeRow}>
            <TouchableOpacity style={[styles.contentTypeButton, contentType === 'post' && styles.contentTypeButtonSelected]} onPress={() => setContentType('post')}>
              <ImageIcon size={20} color={contentType === 'post' ? '#7C3AED' : '#666'} />
              <Text style={[styles.contentTypeText, contentType === 'post' && styles.contentTypeTextSelected]}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contentTypeButton, contentType === 'reel' && styles.contentTypeButtonSelected]} onPress={() => setContentType('reel')}>
              <ImageIcon size={20} color={contentType === 'reel' ? '#7C3AED' : '#666'} />
              <Text style={[styles.contentTypeText, contentType === 'reel' && styles.contentTypeTextSelected]}>Reel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plattformen Auswählen</Text>
          {connectedPlatforms.map(({ platform, connected }) => (
            <TouchableOpacity
              key={platform}
              style={[styles.platformRow, selectedPlatforms.includes(platform) && styles.platformRowSelected]}
              onPress={() => togglePlatform(platform)}
              disabled={!connected}
            >
              <View style={styles.platformInfo}>
                <View style={[styles.platformIconCircle, !connected && styles.platformIconCircleDisabled]}>
                  <ImageIcon size={20} color={connected ? getPlatformColor(platform) : '#CCC'} />
                </View>
                <View>
                  <Text style={[styles.platformNameText, !connected && styles.platformNameTextDisabled]}>
                    {platform === 'instagram' ? 'Instagram' : platform === 'linkedin' ? 'LinkedIn' : platform === 'tiktok' ? 'TikTok' : 'YouTube'}
                  </Text>
                  {!connected && (
                    <View style={styles.notConnectedBadge}>
                      <Link2 size={12} color="#EF4444" />
                      <Text style={styles.notConnectedText}>Nicht verbunden</Text>
                    </View>
                  )}
                </View>
              </View>
              {connected ? (
                <View style={[styles.checkbox, selectedPlatforms.includes(platform) && styles.checkboxSelected]}>
                  {selectedPlatforms.includes(platform) && <View style={styles.checkboxInner} />}
                </View>
              ) : (
                <Link2 size={20} color="#CCC" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zeitplanung</Text>
          <View style={styles.schedulingCard}>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}>Datum</Text>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={18} color="#7C3AED" />
                  <Text style={styles.dateTimeText}>{scheduledDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}>Uhrzeit</Text>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
                  <Clock size={18} color="#7C3AED" />
                  <Text style={styles.dateTimeText}>{scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.autoPostRow}>
              <View style={styles.autoPostInfo}>
                <Text style={styles.autoPostTitle}>Automatisch posten</Text>
                <Text style={styles.autoPostDescription}>Post wird automatisch zur geplanten Zeit auf allen ausgewählten Plattformen veröffentlicht</Text>
              </View>
              <TouchableOpacity style={[styles.autoPostToggle, autoPost && styles.autoPostToggleActive]} onPress={() => setAutoPost(!autoPost)}>
                <View style={[styles.autoPostToggleCircle, autoPost && styles.autoPostToggleCircleActive]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.scheduleButton,
            (selectedPlatforms.length === 0 || (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) || isPublishing()) &&
              styles.scheduleButtonDisabled,
          ]}
          onPress={handleSchedulePost}
          disabled={selectedPlatforms.length === 0 || (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) || isPublishing()}
        >
          {isPublishing() ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send size={20} color="#FFFFFF" />}
          <Text style={styles.scheduleButtonText}>
            {isPublishing() ? 'Wird veröffentlicht...' : autoPost ? 'Post Planen & Automatisch Posten' : 'Als Entwurf Speichern'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {RNPlatform.OS === 'web' ? (
        <>
          {showDatePicker && (
            <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Datum wählen</Text>
                  {/* @ts-ignore */}
                  <input
                    type="date"
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1.5px solid #7C3AED', marginBottom: 16 }}
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(scheduledDate);
                      const selectedDate = new Date(e.target.value);
                      newDate.setFullYear(selectedDate.getFullYear());
                      newDate.setMonth(selectedDate.getMonth());
                      newDate.setDate(selectedDate.getDate());
                      setScheduledDate(newDate);
                      setShowDatePicker(false);
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          {showTimePicker && (
            <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Uhrzeit wählen</Text>
                  {/* @ts-ignore */}
                  <input
                    type="time"
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1.5px solid #7C3AED', marginBottom: 16 }}
                    value={`${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newDate = new Date(scheduledDate);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setScheduledDate(newDate);
                      setShowTimePicker(false);
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </>
      ) : (
        <>
          {showDatePicker && (
            <DateTimePicker value={scheduledDate} mode="date" display="spinner" onChange={onDateChange} minimumDate={new Date()} />
          )}
          {showTimePicker && <DateTimePicker value={scheduledDate} mode="time" display="spinner" onChange={onTimeChange} />}
        </>
      )}
    </>
  );
}

function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'instagram':
      return '#E1306C';
    case 'linkedin':
      return '#0A66C2';
    case 'tiktok':
      return '#000000';
    default:
      return '#666';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: '#000', marginBottom: 4, letterSpacing: -0.3 },
  sectionDescription: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  mediaButtonsRow: { flexDirection: 'row', gap: 12 },
  mediaButton: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 2, borderColor: '#7C3AED', paddingVertical: 24, alignItems: 'center', gap: 8 },
  mediaButtonText: { fontSize: 14, fontWeight: '500' as const, color: '#000' },
  aiGeneratorCard: { backgroundColor: '#7C3AED', borderRadius: 16, padding: 20, marginBottom: 24 },
  aiGeneratorHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  aiGeneratorTextContainer: { flex: 1 },
  aiGeneratorTitle: { fontSize: 18, fontWeight: '700' as const, color: '#FFF', marginBottom: 4, letterSpacing: -0.3 },
  aiGeneratorSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  generateButton: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  generateButtonText: { fontSize: 15, fontWeight: '600' as const, color: '#7C3AED' },
  contentTypeRow: { flexDirection: 'row', gap: 12 },
  contentTypeButton: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  contentTypeButtonSelected: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  contentTypeText: { fontSize: 14, fontWeight: '500' as const, color: '#666' },
  contentTypeTextSelected: { color: '#7C3AED', fontWeight: '600' as const },
  platformRow: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  platformRowSelected: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  platformInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platformIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  platformIconCircleDisabled: { backgroundColor: '#F9F9F9' },
  platformNameText: { fontSize: 15, fontWeight: '600' as const, color: '#000' },
  platformNameTextDisabled: { color: '#999' },
  notConnectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  notConnectedText: { fontSize: 12, color: '#EF4444' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#7C3AED', backgroundColor: '#7C3AED' },
  checkboxInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF' },
  imagePreviewContainer: { marginTop: 16 },
  imagePreviewTitle: { fontSize: 14, fontWeight: '600' as const, color: '#000', marginBottom: 12 },
  imagePreviewScroll: { flexDirection: 'row' },
  imagePreviewWrapper: { position: 'relative', marginRight: 12 },
  imagePreview: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F5F5F5' },
  removeImageButton: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  videoIndicator: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  videoIndicatorText: { fontSize: 10, fontWeight: '700' as const, color: '#FFF', letterSpacing: 0.5 },
  captionInput: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', padding: 16, fontSize: 15, color: '#000', minHeight: 100, textAlignVertical: 'top' },
  hashtagsInput: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', padding: 16, fontSize: 15, color: '#7C3AED', minHeight: 60, textAlignVertical: 'top', fontWeight: '500' as const },
  schedulingCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, gap: 16 },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateTimeColumn: { flex: 1 },
  dateTimeLabel: { fontSize: 13, fontWeight: '600' as const, color: '#666', marginBottom: 8 },
  dateTimeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F3FF', borderRadius: 10, borderWidth: 1.5, borderColor: '#7C3AED', padding: 12 },
  dateTimeText: { fontSize: 14, fontWeight: '600' as const, color: '#000' },
  autoPostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  autoPostInfo: { flex: 1, marginRight: 12 },
  autoPostTitle: { fontSize: 15, fontWeight: '600' as const, color: '#000', marginBottom: 4 },
  autoPostDescription: { fontSize: 12, color: '#666', lineHeight: 16 },
  autoPostToggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#E5E5E5', padding: 2, justifyContent: 'center' },
  autoPostToggleActive: { backgroundColor: '#7C3AED' },
  autoPostToggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF' },
  autoPostToggleCircleActive: { alignSelf: 'flex-end' },
  scheduleButton: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  scheduleButtonDisabled: { backgroundColor: '#CCC' },
  scheduleButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: '#000', marginBottom: 16 },
  aiFallbackInfo: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12, marginBottom: 12 },
  aiFallbackInfoText: { fontSize: 13, color: '#FFF', textAlign: 'center', lineHeight: 18 },
});

export default function CreateScreen() {
  return (
    <LocalTRPCProvider>
      <CreateScreenInner />
    </LocalTRPCProvider>
  );
}
