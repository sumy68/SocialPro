# Plattform-Verbindung Setup Guide

## Problemlösung

### Symptom
Wenn Sie auf "Verbundene Plattformen" in den Einstellungen klicken und dann auf "Connect" bei einer Plattform klicken, öffnet sich entweder nichts oder Sie erhalten eine Fehlermeldung.

### Ursache
Die OAuth-Credentials für die Social-Media-Plattformen sind nicht konfiguriert.

## Lösung 1: OAuth-Credentials konfigurieren (Produktion)

### 1. Instagram/Facebook
1. Gehen Sie zu https://developers.facebook.com/apps/
2. Erstellen Sie eine neue App oder wählen Sie eine bestehende aus
3. Fügen Sie "Instagram Basic Display" hinzu
4. Kopieren Sie Client ID und Client Secret
5. Fügen Sie diese in Ihre `.env`-Datei ein:
```env
INSTAGRAM_CLIENT_ID=ihre_instagram_client_id
INSTAGRAM_CLIENT_SECRET=ihr_instagram_client_secret
INSTAGRAM_REDIRECT_URI=ihre_app_url/api/platforms/oauth/instagram/callback
```

### 2. LinkedIn
1. Gehen Sie zu https://www.linkedin.com/developers/apps
2. Erstellen Sie eine neue App
3. Aktivieren Sie "Sign In with LinkedIn" und fügen Sie die Scopes hinzu
4. Kopieren Sie Client ID und Client Secret
5. Fügen Sie diese in Ihre `.env`-Datei ein:
```env
LINKEDIN_CLIENT_ID=ihre_linkedin_client_id
LINKEDIN_CLIENT_SECRET=ihr_linkedin_client_secret
LINKEDIN_REDIRECT_URI=ihre_app_url/api/platforms/oauth/linkedin/callback
```

### 3. TikTok
1. Gehen Sie zu https://developers.tiktok.com/
2. Erstellen Sie eine neue App
3. Aktivieren Sie die erforderlichen Berechtigungen
4. Kopieren Sie Client Key und Client Secret
5. Fügen Sie diese in Ihre `.env`-Datei ein:
```env
TIKTOK_CLIENT_KEY=ihr_tiktok_client_key
TIKTOK_CLIENT_SECRET=ihr_tiktok_client_secret
TIKTOK_REDIRECT_URI=ihre_app_url/api/platforms/oauth/tiktok/callback
```

### 4. YouTube (Google OAuth)
1. Gehen Sie zu https://console.cloud.google.com/
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
3. Aktivieren Sie die YouTube Data API v3
4. Erstellen Sie OAuth 2.0-Credentials
5. Kopieren Sie Client ID und Client Secret
6. Fügen Sie diese in Ihre `.env`-Datei ein:
```env
YOUTUBE_CLIENT_ID=ihre_youtube_client_id
YOUTUBE_CLIENT_SECRET=ihr_youtube_client_secret
YOUTUBE_REDIRECT_URI=ihre_app_url/api/platforms/oauth/youtube/callback
```

## Lösung 2: Demo-Modus (Testing)

Für Testing-Zwecke können Sie den Demo-Modus verwenden:

1. Setzen Sie die Umgebungsvariable `DEMO_MODE=true` in Ihrer `.env`-Datei
2. Die App simuliert dann OAuth-Verbindungen ohne echte API-Aufrufe
3. Sie können Plattformen "verbinden" und die Funktionalität testen

```env
DEMO_MODE=true
```

## Fehlerbehebung

### "JSON Parse error: Unexpected character: o"
Dies tritt auf, wenn die OAuth-Init-Endpunkte nicht richtig konfiguriert sind. 
Überprüfen Sie, ob:
- Die Umgebungsvariablen korrekt gesetzt sind
- Die Backend-Server läuft
- Die tRPC-Routen korrekt registriert sind

### "Client ID not configured"
Dies bedeutet, dass die OAuth-Credentials nicht gesetzt sind.
Befolgen Sie die Schritte in "Lösung 1" oder aktivieren Sie den Demo-Modus.

### WebBrowser öffnet sich nicht
Stellen Sie sicher, dass:
- Sie auf einem physischen Gerät oder einem Emulator mit Browser-Support testen
- Die Expo-WebBrowser-Integration funktioniert
- Die Redirect-URI korrekt konfiguriert ist

## Funktionsweise

1. Nutzer klickt auf "Verbundene Plattformen" in den Einstellungen
2. Nutzer klickt auf "Connect" bei einer Plattform (z.B. Instagram)
3. Die App ruft die OAuth-Init-API auf, um die Auth-URL zu erhalten
4. Ein Browser-Fenster öffnet sich mit der Plattform-Login-Seite
5. Nutzer meldet sich an und autorisiert die App
6. Die Plattform leitet zurück zur App mit einem Authorization Code
7. Die App tauscht den Code gegen ein Access Token aus
8. Das Token wird verschlüsselt gespeichert
9. Die Plattform wird als "verbunden" markiert
10. Der Nutzer kann jetzt Posts auf dieser Plattform veröffentlichen

## Wichtige Hinweise

- Alle Tokens werden verschlüsselt mit AES-256-CBC gespeichert
- Refresh-Tokens werden automatisch erneuert, wenn sie ablaufen
- Bei Ablauf wird der Nutzer aufgefordert, sich erneut zu authentifizieren
- Die App überprüft regelmäßig den Status der verbundenen Plattformen
