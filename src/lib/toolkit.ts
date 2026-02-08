import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const preferredModel = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL;

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'image'; image?: string; source?: { type: 'base64'; media_type: string; data: string } };

type Message = { role: string; content: MessagePart[] };

const MODEL_FALLBACKS = [
  preferredModel,
  'claude-3-5-sonnet-20241022',
].filter(Boolean) as string[];

/**
 * Detect image media type from base64 data signature (magic numbers)
 * Supports: JPEG, PNG, GIF, WebP
 */
function detectImageMediaType(base64Data: string): string {
  const cleaned = base64Data.replace(/\s/g, '');
  const header = cleaned.substring(0, 20);
  
  // PNG: iVBORw0KGgo (89 50 4E 47 0D 0A 1A 0A)
  if (header.startsWith('iVBORw0KGgo')) return 'image/png';
  
  // JPEG: /9j/ (FF D8 FF)
  if (header.startsWith('/9j/')) return 'image/jpeg';
  
  // GIF: R0lGOD (47 49 46 38)
  if (header.startsWith('R0lGOD')) return 'image/gif';
  
  // WebP: UklGR (52 49 46 46 - RIFF)
  if (header.startsWith('UklGR')) return 'image/webp';
  
  console.warn('[detectImageMediaType] Unknown format, defaulting to image/jpeg');
  return 'image/jpeg';
}

/**
 * Validate base64 string
 */
function isValidBase64(str: string): boolean {
  const cleaned = str.replace(/\s/g, '');
  return /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) && cleaned.length > 0;
}

/**
 * Normalize media_type to Anthropic-supported formats
 */
function normalizeMediaType(mediaType: string): string {
  const normalized = mediaType.toLowerCase().trim();
  const typeMap: Record<string, string> = {
    'image/jpg': 'image/jpeg',
    'image/jpe': 'image/jpeg',
    'image/jfif': 'image/jpeg',
  };
  return typeMap[normalized] || normalized;
}

function extractSystemText(messages: Message[]): string | undefined {
  const systemMessage = messages.find(m => m.role === 'system');
  if (!systemMessage) return undefined;
  const text = systemMessage.content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join(' ')
    .trim();
  return text.length ? text : undefined;
}

function transformContentParts(parts: MessagePart[]): MessagePart[] {
  return parts
    .map((c) => {
      if (c.type === 'text' && typeof c.text === 'string') return c;
      
      if (c.type === 'image') {
        // Already has proper source format
        if (c.source?.type === 'base64' && c.source.media_type && c.source.data) {
          const mediaType = normalizeMediaType(c.source.media_type);
          
          if (!isValidBase64(c.source.data)) {
            console.error('[transformContentParts] Invalid base64 in source');
            return undefined;
          }
          
          return { 
            type: 'image', 
            source: {
              type: 'base64',
              media_type: mediaType,
              data: c.source.data,
            }
          };
        }
        
        // Handle legacy image field
        if (typeof c.image === 'string') {
          // Try data URL format: data:image/jpeg;base64,/9j/...
          const dataUrlMatch = c.image.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
          if (dataUrlMatch) {
            const mediaType = normalizeMediaType(dataUrlMatch[1]);
            const base64Data = dataUrlMatch[2];
            
            if (!isValidBase64(base64Data)) {
              console.error('[transformContentParts] Invalid base64 in data URL');
              return undefined;
            }
            
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            };
          }
          
          // Raw base64 without data URL prefix - auto-detect type
          if (isValidBase64(c.image)) {
            const detectedType = detectImageMediaType(c.image);
            
            console.log(`[transformContentParts] Auto-detected image type: ${detectedType}`);
            
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: detectedType,
                data: c.image,
              },
            };
          }
          
          console.error('[transformContentParts] Invalid image - not valid base64 or data URL');
        }
      }
      
      return undefined;
    })
    .filter(Boolean) as MessagePart[];
}

function isModelNotFound(error: any): boolean {
  if (error?.status === 404) return true;
  const msg = String(error?.message || '');
  return msg.includes('not_found_error') || msg.includes('model:');
}

export async function generateText({ messages }: { messages: Message[] }): Promise<string> {
  if (!apiKey) {
    console.error('[generateText] No API key found');
    return '✨ Beispiel-Caption: Lass deiner Kreativität freien Lauf! 🚀 #Inspiration #Motivation';
  }

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const system = extractSystemText(messages);
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const transformedMessages = userMessages.map((msg) => ({
      role: msg.role,
      content: transformContentParts(msg.content),
    }));

    // Debug: Log transformed messages
    console.log('[generateText] Transformed messages:', JSON.stringify(transformedMessages, null, 2));

    let lastError: any = null;
    for (const model of MODEL_FALLBACKS) {
      try {
        const response = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          system,
          messages: transformedMessages as any,
        });

        const textContent = response.content.find((block) => block.type === 'text');
        return textContent && 'text' in textContent ? textContent.text : '';
      } catch (error) {
        lastError = error;
        if (isModelNotFound(error)) continue;
        throw error;
      }
    }

    if (lastError && isModelNotFound(lastError)) {
      console.warn('[generateText] Model not found. Set EXPO_PUBLIC_ANTHROPIC_MODEL to a model your key can access.');
      return '✨ Beispiel-Caption: Lass deiner Kreativität freien Lauf! 🚀 #Inspiration #Motivation';
    }

    throw lastError;
  } catch (error) {
    console.error('[generateText] Error:', error);
    return '✨ Beispiel-Caption: Lass deiner Kreativität freien Lauf! 🚀 #Inspiration #Motivation';
  }
}