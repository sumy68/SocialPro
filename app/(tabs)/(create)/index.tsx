import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, Platform as RNPlatform, ActivityIndicator, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ImageIcon, Upload, Wand2, Link2, X, Calendar, Clock, Send } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Platform } from '@/constants/types';
import { generateText } from '@/lib/toolkit';
import { usePublishPost } from '@/hooks/usePublishPost';

import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateScreen() {
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
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const pickImage = async () => {
    if (isUploadingImage) return;
    
    try {
      setIsUploadingImage(true);
      console.log('[Image Picker] Requesting permissions...');
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[Image Picker] Permission result:', permissionResult.status);
      
      if (permissionResult.status !== 'granted') {
        setIsUploadingImage(false);
        Alert.alert(
          'Berechtigung erforderlich',
          'Bitte erlauben Sie Zugriff auf Ihre Galerie, um Bilder hochzuladen.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[Image Picker] Launching media picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
        videoMaxDuration: 300,
      });

      console.log('[Image Picker] Result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const images = result.assets.filter(asset => asset.type === 'image').map(asset => asset.uri);
        const videos = result.assets.filter(asset => asset.type === 'video').map(asset => asset.uri);
        
        console.log('[Media Picker] Selected images:', images.length, 'videos:', videos.length);
        
        if (images.length > 0) {
          setSelectedImages(prev => [...prev, ...images]);
        }
        if (videos.length > 0) {
          setSelectedVideos(prev => [...prev, ...videos]);
        }
        
        const totalCount = images.length + videos.length;
        Alert.alert(
          'Erfolg',
          `${totalCount} ${totalCount === 1 ? 'Datei' : 'Dateien'} erfolgreich hochgeladen (${images.length} Bilder, ${videos.length} Videos)`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('[Media Picker] No media selected or cancelled');
      }
    } catch (error) {
      console.error('[Image Picker] Error:', error);
      Alert.alert(
        'Fehler',
        'Bilder konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateCaption = async () => {
    if (isGenerating) return;
    
    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert(
        'Keine Medien',
        'Bitte laden Sie zuerst Bilder oder Videos hoch, damit die KI passende Captions generieren kann.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log('[AI Generator] Starting caption generation with images:', selectedImages.length, 'videos:', selectedVideos.length);
      
      const imageParts = await Promise.all(
        selectedImages.slice(0, 3).map(async (uri) => {
          try {
            let base64Data: string;
            
            if (RNPlatform.OS === 'web') {
              console.log('[AI Generator] Converting web image:', uri);
              const response = await fetch(uri);
              const blob = await response.blob();
              console.log('[AI Generator] Blob size:', blob.size, 'bytes');
              
              base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  const base64 = result.split(',')[1];
                  resolve(base64);
                };
                reader.readAsDataURL(blob);
              });
            } else {
              console.log('[AI Generator] Converting mobile image:', uri);
              base64Data = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            }
            
            console.log('[AI Generator] Base64 data length:', base64Data.length);
            
            return {
              type: 'image' as const,
              image: `data:image/jpeg;base64,${base64Data}`,
            };
          } catch (error) {
            console.error('[AI Generator] Error converting image to base64:', error);
            throw error;
          }
        })
      );

      console.log('[AI Generator] Total image parts:', imageParts.length);

      const hasVideos = selectedVideos.length > 0;
      const mediaTypeText = hasVideos ? (selectedImages.length > 0 ? 'Bilder und Videos' : 'Videos') : 'Bilder';
      
      const prompt = `Analysiere ${hasVideos && selectedImages.length === 0 ? 'diesen Video-Content' : `diese ${mediaTypeText}`} und erstelle eine ansprechende Social-Media-Caption auf Deutsch. Die Caption sollte:
- Emotional und ansprechend sein
- Emojis enthalten (2-3)
- Professionell aber freundlich klingen
- 1-2 Sätze lang sein
- Relevante Hashtags am Ende enthalten (3-5 Hashtags)

Gib nur die Caption zurück, ohne zusätzliche Erklärungen.`;

      console.log('[AI Generator] Calling generateText...');
      
      let response: string;
      try {
        response = await generateText({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                ...imageParts,
              ],
            },
          ],
        });
      } catch {
        console.log('[AI Generator] Using fallback caption generation');
        
        const fallbackCaptions = [
          '✨ Jeden Tag ein neuer Anfang! Nutze die Gelegenheit und mach das Beste daraus. 💪🌟 #Motivation #Success #Growth #Mindset #Goals',
          '🎯 Deine Ziele sind zum Greifen nah! Bleib fokussiert und gib niemals auf. 🚀✨ #Hustle #Achievement #Leadership #Progress #Excellence',
          '💡 Innovation beginnt mit einem mutigen Schritt nach vorne. Sei der Wandel, den du sehen willst! 🌟🔥 #Innovation #Entrepreneurship #Business #Digital #Strategy',
          '🌈 Kleine Schritte führen zu großen Veränderungen. Feiere jeden Fortschritt! 🎉💫 #Growth #Productivity #Success #Performance #Results',
          '🔥 Heute ist der perfekte Tag, um deine Träume zu verwirklichen. Los geht\'s! 💪✨ #Inspiration #Goals #Motivation #Focus #Excellence'
        ];
        
        response = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
        setShowAiFallbackInfo(true);
      }

      console.log('[AI Generator] Generated caption:', response);
      
      if (response && response.trim()) {
        const parts = response.trim().split(/(?=#)/g);
        const captionText = parts[0].trim();
        const hashtagsText = parts.slice(1).join(' ').trim();
        
        setCaption(captionText);
        if (hashtagsText) {
          setHashtags(hashtagsText);
        } else {
          setHashtags('#SocialMedia #Content #Marketing');
        }
      } else {
        throw new Error('Empty response from AI');
      }
    } catch (error: any) {
      console.error('[AI Generator] Error generating caption:', error);
      console.error('[AI Generator] Error message:', error?.message);
      console.error('[AI Generator] Error stack:', error?.stack);
      
      let errorMessage = 'Content konnte nicht generiert werden.';
      if (error?.message?.includes('Network request failed')) {
        errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
      } else if (error?.message?.includes('API-Fehler') || error?.message?.includes('KI-API')) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'KI-Generator Fehler',
        errorMessage,
        [{ text: 'OK' }]
      );
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
        Alert.alert(
          'Ungültige Zeit',
          'Bitte wählen Sie ein Datum in der Zukunft aus.',
          [{ text: 'OK' }]
        );
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
        Alert.alert(
          'Ungültige Zeit',
          'Bitte wählen Sie eine Uhrzeit in der Zukunft aus.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setScheduledDate(newDate);
    }
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert('Fehler', 'Bitte wählen Sie mindestens eine Plattform aus');
      return;
    }
    if (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert('Fehler', 'Bitte fügen Sie eine Caption oder Medien hinzu');
      return;
    }

    const now = new Date();
    if (scheduledDate <= now) {
      Alert.alert(
        'Ungültige Zeit',
        'Die geplante Zeit muss in der Zukunft liegen. Bitte wählen Sie eine spätere Zeit.',
        [{ text: 'OK' }]
      );
      return;
    }

    const allMediaUrls = [...selectedImages, ...selectedVideos];
    const fullCaption = caption.trim() + (hashtags.trim() ? ' ' + hashtags.trim() : '');
    const mediaType = selectedVideos.length > 0 ? 'video' as const : selectedImages.length > 0 ? 'image' as const : undefined;
    
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
      const connectedSelectedPlatforms = selectedPlatforms.filter(platform => {
        const platformData = connectedPlatforms.find(p => p.platform === platform);
        return platformData?.connected;
      });

      if (connectedSelectedPlatforms.length === 0) {
        Alert.alert(
          'Keine verbundenen Plattformen',
          'Bitte verbinden Sie mindestens eine Plattform in den Einstellungen.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[Create] Publishing to platforms:', connectedSelectedPlatforms);
      
      const result = await publishToMultiplePlatforms(connectedSelectedPlatforms, {
        caption: fullCaption,
        mediaUrls: allMediaUrls.length > 0 ? allMediaUrls : undefined,
        mediaType,
        contentType,
      });

      console.log('[Create] Publish result:', result);

      if (result.successfulPlatforms.length > 0) {
        const successMsg = `Erfolgreich veröffentlicht auf: ${result.successfulPlatforms.join(', ')}`;
        const failMsg = result.failedPlatforms.length > 0 
          ? `\n\nFehlgeschlagen: ${result.failedPlatforms.map(p => `${p} (${result.errors[p]})`).join(', ')}`
          : '';
        
        Alert.alert(
          result.failedPlatforms.length > 0 ? 'Teilweise erfolgreich' : 'Erfolg!',
          successMsg + failMsg,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Veröffentlichung fehlgeschlagen',
          `Posts konnten nicht veröffentlicht werden:\n${result.failedPlatforms.map(p => `${p}: ${result.errors[p]}`).join('\n')}`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    await addPost(post);
    
    const dateStr = scheduledDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
    const timeStr = scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    if (!autoPost) {
      Alert.alert(
        'Erfolg!', 
        `Post geplant für ${dateStr} um ${timeStr}`,
        [{ text: 'OK' }]
      );
    }
    
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
      <Stack.Screen
        options={{
          title: 'Erstellen',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
                {isUploadingImage ? 'Lädt...' : 'Aus Galerie'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={isUploadingImage}>
              <Upload size={24} color="#7C3AED" />
              <Text style={styles.mediaButtonText}>Dateien</Text>
            </TouchableOpacity>
          </View>
          
          {(selectedImages.length > 0 || selectedVideos.length > 0) && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.imagePreviewTitle}>
                {`${selectedImages.length > 0 ? `${selectedImages.length} ${selectedImages.length === 1 ? 'Bild' : 'Bilder'}` : ''}${selectedImages.length > 0 && selectedVideos.length > 0 ? ', ' : ''}${selectedVideos.length > 0 ? `${selectedVideos.length} ${selectedVideos.length === 1 ? 'Video' : 'Videos'}` : ''} ausgewählt`}
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imagePreviewScroll}
              >
                {selectedImages.map((uri, index) => (
                  <View key={`img-${index}`} style={styles.imagePreviewWrapper}>
                    <Image 
                      source={{ uri }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedVideos.map((uri, index) => (
                  <View key={`vid-${index}`} style={styles.imagePreviewWrapper}>
                    {RNPlatform.OS === 'web' ? (
                      <View style={[styles.imagePreview, { alignItems: 'center', justifyContent: 'center' }]}
                        testID={`video-fallback-${index}`}>
                        <Text style={styles.videoIndicatorText}>VIDEO</Text>
                      </View>
                    ) : (
                      // @ts-ignore expo-av is not available on web in this project
                      <View style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[styles.videoIndicatorText, { color: '#FFF' }]}>VIDEO</Text>
                      </View>
                    )}
                    <View style={styles.videoIndicator}>
                      <Text style={styles.videoIndicatorText}>VIDEO</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeVideo(index)}
                    >
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
              <Text style={styles.aiGeneratorSubtitle}>
                Lass die KI ansprechende Inhalte basierend auf Trends und deiner Marke erstellen
              </Text>
            </View>
          </View>
          {showAiFallbackInfo && (
            <View style={styles.aiFallbackInfo}>
              <Text style={styles.aiFallbackInfoText}>
                💡 KI-API nicht verfügbar. Beispiel-Caption erstellt.
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateCaption}
            disabled={isGenerating}
          >
            <Wand2 size={18} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generiere...' : 'Captions & Hashtags Generieren'}
            </Text>
          </TouchableOpacity>
        </View>

        {caption.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              multiline
              placeholder="Deine Caption hier..."
              placeholderTextColor="#999"
            />
          </View>
        )}

        {hashtags.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hashtags</Text>
            <TextInput
              style={styles.hashtagsInput}
              value={hashtags}
              onChangeText={setHashtags}
              multiline
              placeholder="#Hashtags"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veröffentlichungsart</Text>
          <Text style={styles.sectionDescription}>
            Wählen Sie, wie Ihr Content veröffentlicht werden soll
          </Text>
          <View style={styles.contentTypeRow}>
            <TouchableOpacity 
              style={[styles.contentTypeButton, contentType === 'post' && styles.contentTypeButtonSelected]}
              onPress={() => setContentType('post')}
            >
              <ImageIcon size={20} color={contentType === 'post' ? '#7C3AED' : '#666'} />
              <Text style={[styles.contentTypeText, contentType === 'post' && styles.contentTypeTextSelected]}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.contentTypeButton, contentType === 'reel' && styles.contentTypeButtonSelected]}
              onPress={() => setContentType('reel')}
            >
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
              style={[
                styles.platformRow,
                selectedPlatforms.includes(platform) && styles.platformRowSelected,
              ]}
              onPress={() => togglePlatform(platform)}
              disabled={!connected}
            >
              <View style={styles.platformInfo}>
                <View style={[styles.platformIconCircle, !connected && styles.platformIconCircleDisabled]}>
                  <ImageIcon size={20} color={connected ? getPlatformColor(platform) : '#CCC'} />
                </View>
                <View>
                  <Text style={[styles.platformNameText, !connected && styles.platformNameTextDisabled]}>
                    {platform === 'instagram' ? 'Instagram' : 
                    platform === 'linkedin' ? 'LinkedIn' : 
                    platform === 'tiktok' ? 'TikTok' : 'YouTube'}
                  </Text>
                  {!connected && (
                    <View style={styles.notConnectedBadge}>
                      <Link2 size={12} color="#EF4444" />
                      <Text style={styles.notConnectedText}>Nicht verbunden</Text>
                    </View>
                  )}
                </View>
              </View>
              {connected && (
                <View style={[
                  styles.checkbox,
                  selectedPlatforms.includes(platform) && styles.checkboxSelected,
                ]}>
                  {selectedPlatforms.includes(platform) && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
              )}
              {!connected && (
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
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={18} color="#7C3AED" />
                  <Text style={styles.dateTimeText}>
                    {scheduledDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}>Uhrzeit</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={18} color="#7C3AED" />
                  <Text style={styles.dateTimeText}>
                    {scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.autoPostRow}>
              <View style={styles.autoPostInfo}>
                <Text style={styles.autoPostTitle}>Automatisch posten</Text>
                <Text style={styles.autoPostDescription}>
                  Post wird automatisch zur geplanten Zeit auf allen ausgewählten Plattformen veröffentlicht
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.autoPostToggle, autoPost && styles.autoPostToggleActive]}
                onPress={() => setAutoPost(!autoPost)}
              >
                <View style={[styles.autoPostToggleCircle, autoPost && styles.autoPostToggleCircleActive]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.scheduleButton,
            (selectedPlatforms.length === 0 || (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) || isPublishing()) && styles.scheduleButtonDisabled
          ]}
          onPress={handleSchedulePost}
          disabled={selectedPlatforms.length === 0 || (!caption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) || isPublishing()}
        >
          {isPublishing() ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={20} color="#FFFFFF" />
          )}
          <Text style={styles.scheduleButtonText}>
            {isPublishing() 
              ? 'Wird veröffentlicht...'
              : autoPost 
                ? 'Post Planen & Automatisch Posten' 
                : 'Als Entwurf Speichern'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {RNPlatform.OS === 'web' ? (
        <>
          {showDatePicker && (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Datum wählen</Text>
                  {/* @ts-ignore */}
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 8,
                      border: '1.5px solid '#7C3AED',
                      marginBottom: 16,
                    }}
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
            <Modal
              visible={showTimePicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowTimePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowTimePicker(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Uhrzeit wählen</Text>
                  {/* @ts-ignore */}
                  <input
                    type="time"
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 8,
                      border: '1.5px solid #7C3AED',
                      marginBottom: 16,
                    }}
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
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
            />
          )}
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
    case 'youtube':
      return '#FF0000';
    default:
      return '#666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  aiGeneratorCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  aiGeneratorHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  aiGeneratorTextContainer: {
    flex: 1,
  },
  aiGeneratorTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  aiGeneratorSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  generateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#7C3AED',
  },
  contentTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contentTypeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contentTypeButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  contentTypeText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
  },
  contentTypeTextSelected: {
    color: '#7C3AED',
    fontWeight: '600' as const,
  },
  platformRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  platformRowSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformIconCircleDisabled: {
    backgroundColor: '#F9F9F9',
  },
  platformNameText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
  },
  platformNameTextDisabled: {
    color: '#999',
  },
  notConnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  notConnectedText: {
    fontSize: 12,
    color: '#EF4444',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  imagePreviewContainer: {
    marginTop: 16,
  },
  imagePreviewTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 12,
  },
  imagePreviewScroll: {
    flexDirection: 'row',
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoIndicatorText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  captionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    padding: 16,
    fontSize: 15,
    color: '#000000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hashtagsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    padding: 16,
    fontSize: 15,
    color: '#7C3AED',
    minHeight: 60,
    textAlignVertical: 'top',
    fontWeight: '500' as const,
  },
  schedulingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeColumn: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    padding: 12,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
  },
  autoPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  autoPostInfo: {
    flex: 1,
    marginRight: 12,
  },
  autoPostTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  autoPostDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  autoPostToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    padding: 2,
    justifyContent: 'center',
  },
  autoPostToggleActive: {
    backgroundColor: '#7C3AED',
  },
  autoPostToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  autoPostToggleCircleActive: {
    alignSelf: 'flex-end',
  },
  scheduleButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  scheduleButtonDisabled: {
    backgroundColor: '#CCC',
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 16,
  },
  aiFallbackInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  aiFallbackInfoText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
