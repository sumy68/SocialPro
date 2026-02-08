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
        if (c.source?.type === 'base64' && c.source.media_type && c.source.data) {
          return { type: 'image', source: c.source };
        }
        if (typeof c.image === 'string') {
          const match = c.image.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
          if (match) {
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: match[1],
                data: match[2],
              },
            };
          }
          // Assume raw base64 jpeg if no data URL prefix.
          if (/^[A-Za-z0-9+/=]+$/.test(c.image)) {
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: c.image,
              },
            };
          }
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
