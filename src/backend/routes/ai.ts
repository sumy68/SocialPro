import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';

const ai = new Hono();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

ai.post('/content-suggestions', async (c) => {
  try {
    const body = await c.req.json();
    const { accountType, userProfile, companyInfo, connectedPlatforms } = body;

    if (!accountType || !userProfile) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const platformsList = connectedPlatforms
      ?.filter((p: any) => p.connected)
      .map((p: any) => p.platform)
      .join(', ') || 'keine';

    const prompt = `Du bist ein Social Media Content Strategist. Generiere 3 personalisierte Content-Vorschläge basierend auf diesem Profil:

Account-Typ: ${accountType === 'business' ? 'Unternehmen' : accountType === 'creator' ? 'Creator' : 'Unternehmen & Creator'}
Name: ${userProfile.name}
${accountType === 'business' || accountType === 'both' ? `Branche: ${userProfile.industry}` : ''}
${accountType === 'creator' || accountType === 'both' ? `Nische: ${userProfile.niche}` : ''}
Zielgruppe: ${userProfile.targetAudience}
Content-Ziele: ${userProfile.contentGoals}
Tonalität: ${companyInfo?.tonePreference || 'casual'}
Verbundene Plattformen: ${platformsList}

Erstelle 3 spezifische, umsetzbare Content-Ideen die:
1. Zur Branche/Nische passen
2. Die Zielgruppe ansprechen
3. Die Content-Ziele unterstützen
4. Für die verbundenen Plattformen optimiert sind

Antworte NUR mit einem JSON-Array in diesem Format:
[
  {
    "title": "Kurzer prägnanter Titel",
    "description": "Detaillierte Beschreibung (2-3 Sätze)",
    "platform": "instagram|linkedin|tiktok",
    "contentType": "reel|post|carousel|story",
    "priority": "high|medium|low",
    "estimatedReach": "Geschätzte Reichweite in K",
    "reason": "Warum dieser Content jetzt wichtig ist (1 Satz)"
  }
]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    return c.json({ suggestions });
  } catch (error: any) {
    console.error('[AI] Content suggestions error:', error);
    return c.json({ error: error.message || 'Failed to generate suggestions' }, 500);
  }
});

export default ai;
