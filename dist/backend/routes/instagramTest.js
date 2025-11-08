import { Hono } from 'hono';
export const instagramTest = new Hono();
instagramTest.get('/test', async (c) => {
    const IG_ID = process.env.FACEBOOK_IG_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    try {
        const crypto = await import('crypto');
        const appsecret_proof = crypto
            .createHmac('sha256', APP_SECRET || '')
            .update(ACCESS_TOKEN || '')
            .digest('hex');
        const res = await fetch(`https://graph.facebook.com/v24.0/${IG_ID}?fields=username,ig_id&access_token=${ACCESS_TOKEN}&appsecret_proof=${appsecret_proof}`);
        const data = await res.json();
        return c.json({ ok: true, data });
    }
    catch (err) {
        console.error(err);
        return c.json({ ok: false, error: err.message }, 500);
    }
});
