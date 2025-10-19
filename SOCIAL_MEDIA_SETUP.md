# Social Media API Setup Guide

Diese Anleitung erklärt, wie Sie die Social Media APIs für Instagram, LinkedIn, TikTok und YouTube konfigurieren.

## Wichtig

Um Posts tatsächlich auf Social Media Plattformen zu veröffentlichen, benötigen Sie:

1. **Entwickler-Accounts** bei jeder Plattform
2. **API Credentials** (Client ID, Client Secret)
3. **OAuth 2.0 Konfiguration** für jede Plattform
4. **Review & Approval** von den Plattformen (kann Wochen dauern)

## 1. Instagram (Facebook/Meta)

### Schritt 1: Facebook Developer Account erstellen
1. Gehen Sie zu https://developers.facebook.com/
2. Erstellen Sie einen Account oder melden Sie sich an
3. Erstellen Sie eine neue App
4. Wählen Sie "Business" als App-Typ

### Schritt 2: Instagram Basic Display einrichten
1. Gehen Sie zu Ihrem App Dashboard
2. Fügen Sie "Instagram Basic Display" hinzu
3. Konfigurieren Sie OAuth Redirect URIs
4. Speichern Sie Client ID und Client Secret

### Schritt 3: Berechtigungen
Erforderliche Berechtigungen:
- `instagram_basic`
- `instagram_content_publish`

### Schritt 4: Environment Variables
```bash
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=http://your-domain.com/api/platforms/oauth/instagram/callback
```

**Wichtig:** Instagram API erlaubt nur verifizierte Business Accounts. Sie müssen:
- Ein Instagram Business Konto haben
- Einen Facebook Page mit dem Instagram Account verbinden
- App Review durchführen für Content Publishing

## 2. LinkedIn

### Schritt 1: LinkedIn Developer Account
1. Gehen Sie zu https://www.linkedin.com/developers/apps
2. Erstellen Sie eine neue App
3. Füllen Sie alle erforderlichen Informationen aus

### Schritt 2: OAuth Konfiguration
1. Fügen Sie Redirect URLs hinzu
2. Aktivieren Sie "Sign In with LinkedIn"
3. Beantragen Sie zusätzliche Berechtigungen

### Schritt 3: Berechtigungen
Erforderliche Berechtigungen:
- `w_member_social` (Post als Mitglied)
- Für Company Pages: `w_organization_social`

### Schritt 4: Environment Variables
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://your-domain.com/api/platforms/oauth/linkedin/callback
```

**Wichtig:** LinkedIn erfordert eine App Review für Marketing Developer Platform Access.

## 3. TikTok

### Schritt 1: TikTok Developer Account
1. Gehen Sie zu https://developers.tiktok.com/
2. Registrieren Sie sich als Developer
3. Erstellen Sie eine neue App

### Schritt 2: TikTok for Business API
1. Beantragen Sie Zugriff auf Content Posting API
2. Warten Sie auf Genehmigung (kann mehrere Wochen dauern)
3. Konfigurieren Sie OAuth Settings

### Schritt 3: Berechtigungen
Erforderliche Scopes:
- `video.upload`
- `video.publish`

### Schritt 4: Environment Variables
```bash
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://your-domain.com/api/platforms/oauth/tiktok/callback
```

**Wichtig:** TikTok API Zugang ist sehr restriktiv und nur für verifizierte Business Partner verfügbar.

## 4. YouTube (Google)

### Schritt 1: Google Cloud Console
1. Gehen Sie zu https://console.cloud.google.com/
2. Erstellen Sie ein neues Projekt
3. Aktivieren Sie "YouTube Data API v3"

### Schritt 2: OAuth Credentials
1. Gehen Sie zu "Credentials"
2. Erstellen Sie "OAuth 2.0 Client ID"
3. Wählen Sie "Web application"
4. Fügen Sie Authorized redirect URIs hinzu

### Schritt 3: Berechtigungen
Erforderliche Scopes:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

### Schritt 4: Environment Variables
```bash
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://your-domain.com/api/platforms/oauth/youtube/callback
```

**Wichtig:** 
- Für > 100 Uploads pro Tag benötigen Sie eine API Quota Erhöhung
- OAuth Consent Screen muss konfiguriert und verifiziert sein

## Installation & Konfiguration

### Schritt 1: .env Datei erstellen
Kopieren Sie `.env.example` zu `.env`:
```bash
cp .env.example .env
```

### Schritt 2: Credentials eintragen
Tragen Sie alle API Credentials in die `.env` Datei ein.

### Schritt 3: Backend starten
```bash
bun run start
```

### Schritt 4: OAuth Flow testen
1. Öffnen Sie die App
2. Gehen Sie zu "Plattformen verbinden"
3. Klicken Sie auf "Connect" für eine Plattform
4. Sie werden zur OAuth Seite weitergeleitet
5. Erlauben Sie die Berechtigungen
6. Sie werden zurück zur App weitergeleitet

## API Limits & Quotas

### Instagram
- 25 Posts pro User pro Tag
- Rate Limit: 200 Calls pro User pro Stunde

### LinkedIn
- 100 Posts pro User pro Tag
- Rate Limit: Abhängig vom App Tier

### TikTok
- 5 Videos pro Tag für normale Accounts
- Höhere Limits für verifizierte Partner

### YouTube
- Default Quota: 10.000 Units pro Tag
- 1 Upload = ~1.600 Units
- Quota Erhöhung möglich nach Review

## Wichtige Hinweise

1. **Entwicklungsmodus vs. Produktionsmodus:**
   - Im Entwicklungsmodus funktionieren APIs nur mit Test-Accounts
   - Für Produktion benötigen Sie App Reviews

2. **Webhook URLs:**
   - Alle Redirect URIs müssen HTTPS verwenden (außer localhost)
   - Für Produktion benötigen Sie eine öffentliche Domain

3. **Token Management:**
   - Access Tokens haben unterschiedliche Gültigkeitsdauern
   - Implementieren Sie Token Refresh Logic
   - Speichern Sie Tokens sicher (verschlüsselt)

4. **Content Richtlinien:**
   - Jede Plattform hat eigene Content Policies
   - Verstöße können zum API Ban führen
   - Implementieren Sie Content Moderation

5. **Kosten:**
   - Die meisten APIs sind in Basis-Tiers kostenlos
   - Enterprise Features kosten Geld
   - Beachten Sie versteckte Kosten (z.B. Google Cloud)

## Testing ohne echte APIs

Für Entwicklung und Testing ohne echte API Credentials:

1. Die App verwendet derzeit Mock-Daten
2. Posts werden lokal gespeichert aber nicht wirklich gepostet
3. Zum Aktivieren der echten APIs: Environment Variables setzen

## Support & Weitere Informationen

- **Instagram:** https://developers.facebook.com/docs/instagram-api
- **LinkedIn:** https://learn.microsoft.com/en-us/linkedin/
- **TikTok:** https://developers.tiktok.com/doc
- **YouTube:** https://developers.google.com/youtube/v3

## Häufige Fehler

### OAuth Redirect Error
- Überprüfen Sie, ob Redirect URI exakt übereinstimmt
- HTTPS vs HTTP Probleme
- URL Encoding Probleme

### Token Expired
- Implementieren Sie Refresh Token Logic
- Speichern Sie Refresh Tokens sicher

### Rate Limit Exceeded
- Implementieren Sie Retry Logic mit Exponential Backoff
- Cachen Sie Responses wo möglich
- Monitoren Sie API Usage

### Permission Denied
- App Review noch nicht abgeschlossen
- Fehlende Berechtigungen in OAuth Scope
- Account Typ nicht kompatibel (z.B. Personal statt Business)

## Nächste Schritte

1. **Erstellen Sie Developer Accounts** bei allen Plattformen
2. **Konfigurieren Sie OAuth Apps** und holen Sie Credentials
3. **Tragen Sie Credentials ein** in `.env`
4. **Testen Sie OAuth Flow** im Development Mode
5. **Beantragen Sie App Review** für Produktions-Zugang
6. **Implementieren Sie Error Handling** und Retry Logic
7. **Monitoring & Logging** für API Calls einrichten
