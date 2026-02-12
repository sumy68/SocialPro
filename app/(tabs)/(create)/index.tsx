import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, Platform as RNPlatform, ActivityIndicator, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ImageIcon, Upload, Wand2, Link2, X, Calendar, Clock, Send } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';
import { Platform } from '@/constants/types';
import { Stack } from 'expo-router';
import { generateText } from '@/lib/toolkit';
import { usePublishPost } from '@/hooks/usePublishPost';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';

import { LocalTRPCProvider } from './trpc-local';

function CreateScreenInner() {
  const { addPost, connectedPlatforms , language} = useApp();
  const cr = (translations[language as Language] ?? translations.de).create;
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
        Alert.alert(cr.title, cr.title, [{ text: 'OK' }]);
        return;
      }
      
      const mediaTypes = (ImagePicker as any).MediaType
        ? [(ImagePicker as any).MediaType.Images, (ImagePicker as any).MediaType.Videos]
        : undefined;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: false,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets?.length) {
        const images = result.assets.filter(a => a.type === 'image').map(a => a.uri);
        const videos = result.assets.filter(a => a.type === 'video').map(a => a.uri);
        
        if (images.length) setSelectedImages(prev => [...prev, ...images]);
        if (videos.length) setSelectedVideos(prev => [...prev, ...videos]);

        // ✅ AUTOMATISCH contentType setzen basierend auf Medium
        if (videos.length > 0) {
          setContentType('reel');
          Alert.alert('📹', cr.videoDetected);
        } else if (images.length > 0) {
          setContentType('post');
          Alert.alert('🖼️', cr.imageDetected);
        }

        const total = images.length + videos.length;
        console.log(`✅ ${total} Datei(en) hochgeladen (${images.length} Bilder, ${videos.length} Videos)`);
      }
    } catch (e) {
      console.error('[Image Picker] Error:', e);
      Alert.alert('Error', 'Error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    // Wenn keine Videos mehr da sind und keine Bilder, reset auf post
    if (selectedVideos.length === 0 && selectedImages.length === 1) {
      setContentType('post');
    }
  };
  
  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    // Wenn keine Videos mehr da sind, zurück auf post
    if (selectedVideos.length === 1) {
      setContentType('post');
    }
  };

  const handleGenerateCaption = async () => {
    if (isGenerating) return;

    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert('!', cr.uploadMedia);
      return;
    }

    setIsGenerating(true);
    try {
      const imageParts = await Promise.all(
        selectedImages.slice(0, 3).map(async (uri) => {
          try {
            const resized = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
            const compressedUri = resized.uri;
            let base64Data: string;
            if (RNPlatform.OS === 'web') {
              const res = await fetch(compressedUri);
              const blob = await res.blob();
              base64Data = await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve((r.result as string).split(',')[1]);
                r.readAsDataURL(blob);
              });
            } else {
              base64Data = await FileSystem.readAsStringAsync(compressedUri, { encoding: 'base64' });
            }
            return { type: 'image' as const, image: base64Data };
          } catch (e) {
            console.error('[AI] base64 error', e);
            return null;
          }
        })
      ).then(arr => arr.filter(Boolean) as { type: 'image'; image: string }[]);

      const hasVideos = selectedVideos.length > 0;
      const langMap: Record<string, string> = {
          de: 'Du bist ein deutschsprachiger Social-Media-Copywriter. Schreibe auf Deutsch.',
          en: 'You are a social media copywriter. Write in English.',
          es: 'Eres un copywriter de redes sociales. Escribe en español.',
          tr: 'Sen bir sosyal medya metin yazarısın. Türkçe yaz.',
        };
        const systemMsg =
          (langMap[language] || langMap['en']) + ' ' +
          'Analyze the provided images visually (objects, colors, mood, setting, perspective). ' +
          'Write a short caption (1-2 sentences, 2-3 emojis, friendly professional tone). ' +
          'Generate 4-7 relevant, specific hashtags (no generic ones like #SocialMedia). ' +
          'Respond ONLY as JSON: {"caption":"…","hashtags":["#…","…"]}';

      const userText =
        `Generate a matching caption for this content.${hasVideos ? ' May contain video.' : ''} No explanations, only JSON.`;

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
          caption: language === 'de' ? '✨ Lass deiner Kreativität freien Lauf! 🚀' : language === 'es' ? '✨ ¡Da rienda suelta a tu creatividad! 🚀' : language === 'tr' ? '✨ Yaratıcılığını serbest bırak! 🚀' : '✨ Let your creativity shine! 🚀',
          hashtags: ['#Inspiration', '#Motivation', '#Creativity', '#Design', '#DailyVibes'],
        };
      }

      const cleanCaption = parsed.caption.trim();
      const cleanTags = parsed.hashtags
        .map(h => (h.startsWith('#') ? h : `#${h}`))
        .filter(h => /^#[\wäöüÄÖÜß]+$/i.test(h))
        .slice(0, 7);

      if (!cleanCaption) throw new Error('Empty caption');

      setCaption(cleanCaption);
      setHashtags(cleanTags.join(' '));
    } catch (error: any) {
      console.error('[AI] failed:', error);
      Alert.alert('AI Error', error?.message || 'Error');
    } finally {
      setIsGenerating(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const now = new Date();
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      if (newDate < now) {
        Alert.alert('!', cr.date);
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
        Alert.alert('!', cr.time);
        return;
      }
      setScheduledDate(newDate);
    }
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert('!', cr.selectPlatforms);
      return;
    }
    if (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert('!', cr.caption);
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
        Alert.alert('!', cr.notConnected);
        return;
      }
  
      const result = await publishToMultiplePlatforms(connectedSelectedPlatforms,{
        caption: fullCaption,
        mediaUrls: allMediaUrls.length ? allMediaUrls : undefined,
        mediaType,
        contentType,
      });
  
      if (result.successfulPlatforms.length > 0) {
        const successMsg = `Success: ${result.successfulPlatforms.join(', ')}`;
        const failMsg =
          result.failedPlatforms.length > 0
            ? `\n\nFehlgeschlagen: ${result.failedPlatforms
                .map(p => `${p} (${result.errors[p]})`)
                .join(', ')}`
            : '';
        Alert.alert(result.failedPlatforms.length ? 'Partial success' : 'Success!', successMsg + failMsg);
      } else {
        Alert.alert(
          'Veröffentlichung fehlgeschlagen',
          result.failedPlatforms.map(p => `${p}: ${result.errors[p]}`).join('\n')
        );
        return;
      }
    } else {
      try {
        const { trpcVanillaClient } = await import('@/lib/trpc');
        
        const scheduledResults = await Promise.allSettled(
          selectedPlatforms.map(async (platform) => {
            const platformConn = connectedPlatforms.find(x => x.platform === platform);
            if (!platformConn?.connected) {
              throw new Error(`${platform} nicht verbunden`);
            }
  
            const tokenResult = await trpcVanillaClient.platforms.getToken.query({ platform });
            if (!tokenResult.ok || !tokenResult.accessToken) {
              throw new Error(`Kein Token für ${platform}`);
            }
  
            const result = await trpcVanillaClient.posts.schedule.mutate({
              userId: 'default-user',
              platform: platform as any,
              caption: fullCaption,
              mediaUrls: allMediaUrls.length ? allMediaUrls : undefined,
              mediaType,
              contentType,
              scheduledDate: scheduledDate.toISOString(),
              accessToken: tokenResult.accessToken,
              platformUserId: tokenResult.accountId,
            });
  
            if (!result.ok) {
              throw new Error(`Backend error for ${platform}`);
            }
  
            return { platform, success: true };
          })
        );
  
        const successful = scheduledResults.filter(r => r.status === 'fulfilled').map(r => (r as any).value.platform);
        const failed = scheduledResults.filter(r => r.status === 'rejected');
  
        if (successful.length > 0) {
          const dateStr = scheduledDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
          const timeStr = scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          Alert.alert(
            'Post geplant!',
            `Wird automatisch am ${dateStr} um ${timeStr} auf ${successful.join(', ')} veröffentlicht!` +
            (failed.length > 0 ? `\n\nErrors: ${failed.length} platform(s)` : '')
          );
        } else {
          Alert.alert('Error', cr.errorScheduling);
          return;
        }
      } catch (error: any) {
        console.error('[Schedule] Error:', error);
        Alert.alert('Error', error.message || cr.errorScheduling);
        return;
      }
    }
  
    await addPost(post);
  
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
      <Stack.Screen options={{ title: cr.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{cr.uploadMedia}</Text>
          <View style={styles.mediaButtonsRow}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={isUploadingImage}>
              {isUploadingImage ? <ActivityIndicator size="small" color="#EF4444" /> : <ImageIcon size={24} color="#EF4444" />}
              <Text style={styles.mediaButtonText}>{isUploadingImage ? 'Lädt...' : cr.fromGallery}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={isUploadingImage}>
              <Upload size={24} color="#EF4444" />
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
            <Wand2 size={24} color="#EF4444" />
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
            <Text style={styles.generateButtonText}>{isGenerating ? cr.generating : cr.generateCaption}</Text>
          </TouchableOpacity>
        </View>

        {!!caption.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput style={styles.captionInput} value={caption} onChangeText={setCaption} multiline placeholder={cr.captionPlaceholder} placeholderTextColor="#999" />
          </View>
        )}

        {!!hashtags.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hashtags</Text>
            <TextInput style={styles.hashtagsInput} value={hashtags} onChangeText={setHashtags} multiline placeholder="#Hashtags" placeholderTextColor="#999" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{cr.publishType}</Text>
          <Text style={styles.sectionDescription}>
            {selectedVideos.length > 0 
              ? cr.videoDetected 
              : selectedImages.length > 0 
              ? cr.imageDetected
              : cr.uploadToSeeType}
          </Text>
          <View style={styles.contentTypeRow}>
            <TouchableOpacity 
              style={[
                styles.contentTypeButton, 
                contentType === 'post' && styles.contentTypeButtonSelected,
                selectedVideos.length > 0 && styles.contentTypeButtonDisabled
              ]} 
              onPress={() => selectedVideos.length === 0 && setContentType('post')}
              disabled={selectedVideos.length > 0}
            >
              <ImageIcon size={20} color={contentType === 'post' && selectedVideos.length === 0 ? '#EF4444' : '#CCC'} />
              <Text style={[styles.contentTypeText, contentType === 'post' && selectedVideos.length === 0 && styles.contentTypeTextSelected]}>Post (Foto)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.contentTypeButton, 
                contentType === 'reel' && styles.contentTypeButtonSelected,
                selectedImages.length > 0 && selectedVideos.length === 0 && styles.contentTypeButtonDisabled
              ]} 
              onPress={() => selectedImages.length === 0 && setContentType('reel')}
              disabled={selectedImages.length > 0 && selectedVideos.length === 0}
            >
              <ImageIcon size={20} color={contentType === 'reel' && selectedVideos.length > 0 ? '#EF4444' : '#CCC'} />
              <Text style={[styles.contentTypeText, contentType === 'reel' && selectedVideos.length > 0 && styles.contentTypeTextSelected]}>Reel (Video)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{cr.selectPlatforms}</Text>
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
                      <Text style={styles.notConnectedText}>{cr.notConnected}</Text>
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
          <Text style={styles.sectionTitle}>{cr.scheduling}</Text>
          <View style={styles.schedulingCard}>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}>Datum</Text>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={18} color="#EF4444" />
                  <Text style={styles.dateTimeText}>{scheduledDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}>Uhrzeit</Text>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
                  <Clock size={18} color="#EF4444" />
                  <Text style={styles.dateTimeText}>{scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.autoPostRow}>
              <View style={styles.autoPostInfo}>
                <Text style={styles.autoPostTitle}>{cr.autoPost}</Text>
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
            {isPublishing() ? cr.publishing : autoPost ? cr.scheduleAndPost : cr.saveAsDraft}
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
                  <input
                    type="date"
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1.5px solid #EF4444', marginBottom: 16 }}
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
                  <input
                    type="time"
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1.5px solid #EF4444', marginBottom: 16 }}
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
  mediaButton: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 2, borderColor: '#EF4444', paddingVertical: 24, alignItems: 'center', gap: 8 },
  mediaButtonText: { fontSize: 14, fontWeight: '500' as const, color: '#000' },
  aiGeneratorCard: { backgroundColor: '#EF4444', borderRadius: 16, padding: 20, marginBottom: 24 },
  aiGeneratorHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  aiGeneratorTextContainer: { flex: 1 },
  aiGeneratorTitle: { fontSize: 18, fontWeight: '700' as const, color: '#FFF', marginBottom: 4, letterSpacing: -0.3 },
  aiGeneratorSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  generateButton: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  generateButtonText: { fontSize: 15, fontWeight: '600' as const, color: '#EF4444' },
  contentTypeRow: { flexDirection: 'row', gap: 12 },
  contentTypeButton: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  contentTypeButtonSelected: { borderColor: '#EF4444', backgroundColor: '#F5F3FF' },
  contentTypeButtonDisabled: { opacity: 0.5, backgroundColor: '#F5F5F5' },
  contentTypeText: { fontSize: 14, fontWeight: '500' as const, color: '#666' },
  contentTypeTextSelected: { color: '#EF4444', fontWeight: '600' as const },
  platformRow: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  platformRowSelected: { borderColor: '#EF4444', backgroundColor: '#F5F3FF' },
  platformInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platformIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  platformIconCircleDisabled: { backgroundColor: '#F9F9F9' },
  platformNameText: { fontSize: 15, fontWeight: '600' as const, color: '#000' },
  platformNameTextDisabled: { color: '#999' },
  notConnectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  notConnectedText: { fontSize: 12, color: '#EF4444' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#EF4444', backgroundColor: '#EF4444' },
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
  hashtagsInput: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', padding: 16, fontSize: 15, color: '#EF4444', minHeight: 60, textAlignVertical: 'top', fontWeight: '500' as const },
  schedulingCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, gap: 16 },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateTimeColumn: { flex: 1 },
  dateTimeLabel: { fontSize: 13, fontWeight: '600' as const, color: '#666', marginBottom: 8 },
  dateTimeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F3FF', borderRadius: 10, borderWidth: 1.5, borderColor: '#EF4444', padding: 12 },
  dateTimeText: { fontSize: 14, fontWeight: '600' as const, color: '#000' },
  autoPostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  autoPostInfo: { flex: 1, marginRight: 12 },
  autoPostTitle: { fontSize: 15, fontWeight: '600' as const, color: '#000', marginBottom: 4 },
  autoPostDescription: { fontSize: 12, color: '#666', lineHeight: 16 },
  autoPostToggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#E5E5E5', padding: 2, justifyContent: 'center' },
  autoPostToggleActive: { backgroundColor: '#EF4444' },
  autoPostToggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF' },
  autoPostToggleCircleActive: { alignSelf: 'flex-end' },
  scheduleButton: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
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