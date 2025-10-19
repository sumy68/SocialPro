# Backend-Setup für OAuth-Verbindungen

## Problem
Die App benötigt einen Backend-Server für echte OAuth-Verbindungen mit LinkedIn, Instagram, TikTok und YouTube.

## Demo-Mode (Standard)
Ohne Backend läuft die App automatisch im **Demo-Mode**:
- Plattformen können "verbunden" werden ohne echten OAuth-Flow
- Alle Funktionen funktionieren, aber Posts werden nicht wirklich veröffentlicht
- Ideal zum Testen der UI/UX

## Für echte OAuth-Verbindungen

### Option 1: Lokaler Backend-Server (Development)

1. **Backend starten:**
   ```bash
   # Im Projekt-Root
   bun run dev
   ```

2. **Umgebungsvariablen konfigurieren (.env):**
   ```env
   # Deine lokale IP-Adresse (nicht localhost!)
   EXPO_PUBLIC_APP_URL=http://192.168.1.XXX:8081
   
   # LinkedIn OAuth Credentials
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_REDIRECT_URI=http://192.168.1.XXX:8081/api/platforms/oauth/linkedin/callback
   
   # Instagram, TikTok, YouTube analog...
   ```

3. **App neu starten:**
   ```bash
   bun start
   ```

### Option 2: Produktions-Backend (Production)

1. **Backend deployen** (z.B. auf Vercel, Railway, Render)

2. **.env konfigurieren:**
   ```env
   EXPO_PUBLIC_APP_URL=https://deine-domain.com
   
   # OAuth Redirects auf Production-URL
   LINKEDIN_REDIRECT_URI=https://deine-domain.com/api/platforms/oauth/linkedin/callback
   ```

3. **Bei OAuth-Providern registrieren:**
   - LinkedIn: https://www.linkedin.com/developers/apps
   - Instagram: https://developers.facebook.com/apps/
   - TikTok: https://developers.tiktok.com/
   - YouTube: https://console.cloud.google.com/

## Troubleshooting

### "Expected JSON response but got text/html"
→ Backend ist nicht erreichbar. App wechselt automatisch in Demo-Mode.

### Lösung:
1. Prüfe `EXPO_PUBLIC_APP_URL` in `.env`
2. Stelle sicher, dass Backend läuft
3. Teste: `curl http://deine-url/api/trpc` sollte JSON zurückgeben

### OAuth-Redirect funktioniert nicht
→ Redirect-URI muss exakt mit der bei OAuth-Provider registrierten URL übereinstimmen.

## Status prüfen

Konsolen-Logs beachten:
```
[tRPC] Using base URL from env: http://...
[OAuth] Backend not available, using Demo Mode automatically  ← Demo-Mode aktiv
```
