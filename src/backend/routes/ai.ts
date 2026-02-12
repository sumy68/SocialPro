import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';

const ai = new Hono();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

ai.post('/content-suggestions', async (c) => {
  try {
    const body = await c.req.json();
    const { accountType, userProfile, companyInfo, connectedPlatforms, language } = body;
    const lang = language || 'de';

    if (!accountType || !userProfile) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const platformsList = connectedPlatforms
      ?.filter((p: any) => p.connected)
      .map((p: any) => p.platform)
      .join(', ') || 'keine';

    const langInstructions: Record<string, string> = {
      de: 'Antworte komplett auf Deutsch.',
      en: 'Respond entirely in English.',
      es: 'Responde completamente en español.',
      tr: 'Tamamen Türkçe yanıt ver.',
    };

    const prompt = `You are a Social Media Content Strategist. Generate 3 personalized content suggestions based on this profile:

Account type: ${accountType}
Name: ${userProfile.name}
${accountType === 'business' || accountType === 'both' ? `Industry: ${userProfile.industry}` : ''}
${accountType === 'creator' || accountType === 'both' ? `Niche: ${userProfile.niche}` : ''}
Target audience: ${userProfile.targetAudience}
Content goals: ${userProfile.contentGoals}
Tone: ${companyInfo?.tonePreference || 'casual'}
Connected platforms: ${platformsList}

Create 3 specific, actionable content ideas that:
1. Fit the industry/niche
2. Appeal to the target audience
3. Support the content goals
4. Are optimized for the connected platforms

IMPORTANT: ${langInstructions[lang] || langInstructions['en']} All titles, descriptions, and reasons must be in this language.

Respond ONLY with a JSON array in this format:
[
  {
    "title": "Short catchy title",
    "description": "Detailed description (2-3 sentences)",
    "platform": "instagram|linkedin|tiktok",
    "contentType": "reel|post|carousel|story",
    "priority": "high|medium|low",
    "estimatedReach": "Estimated reach in K",
    "reason": "Why this content matters now (1 sentence)"
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


ai.post('/weekly-tips', async (c) => {
  try {
    const body = await c.req.json();
    const { language, accountType, companyInfo, connectedPlatforms, analytics } = body;
    const lang = language || 'de';

    const langInstructions: Record<string, string> = {
      de: 'Antworte komplett auf Deutsch.',
      en: 'Respond entirely in English.',
      es: 'Responde completamente en español.',
      tr: 'Tamamen Türkçe yanıt ver.',
    };

    const platformsList = connectedPlatforms
      ?.filter((p: any) => p.connected)
      .map((p: any) => p.platform)
      .join(', ') || 'none';

    const prompt = `You are a social media growth strategist. Based on this profile and analytics, generate 3 actionable weekly tips.

Account type: ${accountType || 'business'}
Industry: ${companyInfo?.industry || 'general'}
Target audience: ${companyInfo?.targetAudience || 'general'}
Tone: ${companyInfo?.tonePreference || 'casual'}
Connected platforms: ${platformsList}
${analytics ? `Current followers: ${analytics.followers || 0}
Engagement rate: ${analytics.engagementRate || 0}%
Posts this week: ${analytics.postsCount || 0}
Reach: ${analytics.reach || 0}` : ''}

Generate 3 specific, data-driven tips that:
1. One HIGH priority tip (most impactful action this week)
2. One MEDIUM priority tip (optimization opportunity)
3. One LOW priority tip (nice-to-have improvement)

Each tip should reference the actual analytics when available.

IMPORTANT: ${langInstructions[lang] || langInstructions['en']} All content must be in this language.

Respond ONLY with a JSON array:
[
  {
    "id": "tip-1",
    "priority": "high|medium|low",
    "title": "Short actionable title",
    "description": "2-3 sentence explanation with specific advice",
    "actionLabel": "Button text for CTA",
    "actionRoute": "/(tabs)/(create)|/(tabs)/(calendar)|/(tabs)/(reports)",
    "icon": "trending|clock|lightbulb"
  }
]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse AI response');
    const tips = JSON.parse(jsonMatch[0]);
    return c.json({ tips, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('[AI] Weekly tips error:', error);
    return c.json({ error: error.message || 'Failed to generate tips' }, 500);
  }
});

export default ai;
