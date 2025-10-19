# OAuth System - Quick Reference

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy example env
cp .env.example .env

# Generate encryption key
openssl rand -hex 32

# Add to .env
ENCRYPTION_KEY=your_generated_key_here

# Configure at least one platform in .env
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
```

### 2. Import Hooks
```tsx
import { usePublishPost } from '@/hooks/usePublishPost';
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';
import { usePlatformTokens } from '@/hooks/usePlatformTokens';
```

## 📚 Common Tasks

### Connect Platform
```tsx
import { trpcClient } from '@/lib/trpc';
import * as WebBrowser from 'expo-web-browser';

const connectPlatform = async (platform: 'instagram' | 'linkedin' | 'tiktok' | 'youtube') => {
  const { authUrl } = await trpcClient.platforms.oauth[platform].init.query();
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  const code = new URL(result.url).searchParams.get('code');
  const tokens = await trpcClient.platforms.oauth[platform].callback.mutate({ code });
  await trpcClient.platforms.saveToken.mutate({ platform, ...tokens });
};
```

### Publish Post
```tsx
const { publishToMultiplePlatforms } = usePublishPost();

await publishToMultiplePlatforms(['instagram', 'linkedin'], {
  caption: 'Hello World!',
  mediaUrls: ['https://example.com/image.jpg'],
  mediaType: 'image',
});
```

### Check Status
```tsx
const { statusMap, checkAllPlatforms } = usePlatformConnection();

useEffect(() => {
  checkAllPlatforms();
}, []);

const isInstagramConnected = statusMap.instagram.connected;
const isTokenExpired = statusMap.instagram.isExpired;
```

### Refresh Token
```tsx
const { refreshPlatformToken } = usePlatformConnection();

const handleRefresh = async () => {
  const result = await refreshPlatformToken('instagram');
  if (result.success) {
    Alert.alert('Success', 'Token refreshed!');
  }
};
```

## 🔑 API Reference

### Backend tRPC Endpoints

```typescript
// OAuth
platforms.oauth.instagram.init.query()
platforms.oauth.instagram.callback.mutate({ code })

// Token Management
platforms.saveToken.mutate({ platform, accessToken, ... })
platforms.getToken.query({ platform })
platforms.refreshToken.mutate({ platform })
platforms.disconnect.mutate({ platform })

// Publishing
platforms.publish.mutate({
  platform,
  caption,
  mediaUrls,
  mediaType,
  accessToken,
  userId,
})
```

### React Hooks

```typescript
// usePlatformConnection
const {
  statusMap,              // Current status of all platforms
  checking,               // Boolean: is checking status
  connectedPlatformsList, // Array of connected platforms
  checkPlatformStatus,    // (platform) => Promise<void>
  checkAllPlatforms,      // () => Promise<void>
  refreshPlatformToken,   // (platform) => Promise<Result>
  getPublishToken,        // (platform) => Promise<TokenData>
} = usePlatformConnection();

// usePublishPost
const {
  publishToSinglePlatform,     // (input) => Promise<Result>
  publishToMultiplePlatforms,  // (platforms, input) => Promise<Results>
  isPublishing,                // (platform?) => boolean
  publishing,                  // Platform[] currently publishing
  errors,                      // Record<Platform, string | null>
} = usePublishPost();

// usePlatformTokens
const {
  refreshing,           // Platform | null currently refreshing
  errors,               // Record<Platform, string | null>
  checkTokenExpiry,     // (platform) => Promise<Status>
  refreshToken,         // (platform) => Promise<Result>
  getValidToken,        // (platform) => Promise<TokenData>
  checkAllConnectedPlatforms, // () => Promise<Results>
} = usePlatformTokens();
```

## 🎨 UI Components

### Platform Status Badge
```tsx
{statusMap.instagram.connected ? (
  statusMap.instagram.isExpired ? (
    <AlertCircle size={12} color="#F59E0B" />
  ) : (
    <CheckCircle size={12} color="#10B981" />
  )
) : (
  <View style={styles.disconnectedDot} />
)}
```

### Connection Button
```tsx
<Button
  onPress={() => isConnected ? handleDisconnect() : handleConnect()}
  disabled={isConnecting}
>
  {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
</Button>
```

### Publish Button
```tsx
<Button
  onPress={handlePublish}
  disabled={isPublishing() || selectedPlatforms.length === 0}
>
  {isPublishing() ? 'Publishing...' : 'Publish'}
</Button>
```

## ⚠️ Error Handling

### Token Expired
```tsx
if (error.message.includes('Token expired')) {
  const result = await refreshPlatformToken(platform);
  if (result.success) {
    // Retry operation
  } else if (result.requiresReauth) {
    // Prompt user to reconnect
  }
}
```

### Publishing Errors
```tsx
const result = await publishToMultiplePlatforms(platforms, data);

if (result.successfulPlatforms.length > 0) {
  // Handle success
}

if (result.failedPlatforms.length > 0) {
  // Handle partial failure
}

if (result.requiresReauth.length > 0) {
  // Prompt reconnection
}
```

## 🔒 Security Checklist

- [ ] Set ENCRYPTION_KEY in production
- [ ] Use HTTPS for redirect URIs
- [ ] Never commit .env to git
- [ ] Rotate encryption keys regularly
- [ ] Use database instead of in-memory storage
- [ ] Implement user-level token isolation
- [ ] Enable rate limiting on OAuth endpoints
- [ ] Set up error monitoring
- [ ] Configure proper CORS

## 📊 Status Indicators

| Status | Badge | Meaning |
|--------|-------|---------|
| Connected & Valid | 🟢 Green checkmark | Ready to publish |
| Connected & Expired | 🟡 Yellow warning | Needs token refresh |
| Disconnected | ⚫ Gray dot | Not connected |

## 🎯 Common Patterns

### 1. Connect Before Publish
```tsx
const handlePublish = async () => {
  const status = statusMap[platform];
  
  if (!status.connected) {
    Alert.alert('Not Connected', 'Please connect platform first');
    router.push('/onboarding/connect-platforms');
    return;
  }
  
  if (status.isExpired) {
    const result = await refreshPlatformToken(platform);
    if (!result.success) return;
  }
  
  await publishToSinglePlatform({ platform, ...data });
};
```

### 2. Check Status on Mount
```tsx
useEffect(() => {
  checkAllPlatforms();
}, []);
```

### 3. Handle Multi-Platform Results
```tsx
const result = await publishToMultiplePlatforms(platforms, data);

const message = [
  result.successfulPlatforms.length > 0 &&
    `✅ Success: ${result.successfulPlatforms.join(', ')}`,
  result.failedPlatforms.length > 0 &&
    `❌ Failed: ${result.failedPlatforms.join(', ')}`,
].filter(Boolean).join('\n');

Alert.alert('Results', message);
```

## 🐛 Debugging

### Enable Verbose Logging
All operations log to console with `[OAuth]`, `[TokenManager]`, or `[PublishPost]` prefix.

### Common Issues

**"OAuth redirect URI mismatch"**
→ Check .env redirect URI matches developer console

**"Token refresh failed"**
→ Verify refresh token exists and is valid

**"Platform not connected"**
→ User needs to connect in settings first

**"Invalid token format"**
→ Check ENCRYPTION_KEY is set correctly

## 📖 Documentation Files

- **OAUTH_SETUP.md** - Platform OAuth configuration
- **IMPLEMENTATION_GUIDE.md** - Detailed usage examples
- **OAUTH_FEATURES.md** - Complete feature overview
- **QUICK_REFERENCE.md** - This file

## 🆘 Getting Help

1. Check console logs for detailed error messages
2. Review documentation files
3. Verify environment variables are set
4. Check platform developer console for API status
5. Test with one platform before adding more

## 💡 Pro Tips

1. **Always check connection status before publishing**
2. **Use `getPublishToken()` for custom API calls** - it handles refresh automatically
3. **Monitor `statusMap` for real-time connection state**
4. **Show connection status in UI** - users need visual feedback
5. **Handle partial failures gracefully** - some platforms may succeed while others fail
6. **Implement retry logic** - network issues are common
7. **Test token refresh before production** - simulate expired tokens
8. **Keep encryption keys secure** - never commit to version control
9. **Use TypeScript** - catch errors at compile time
10. **Read platform documentation** - each has unique requirements

## 🔄 Workflow

```
1. User connects platform
   ↓
2. Tokens encrypted & stored
   ↓
3. Connection status updated
   ↓
4. User creates post
   ↓
5. System checks token validity
   ↓
6. Auto-refresh if needed
   ↓
7. Publish to platform(s)
   ↓
8. Show success/failure
```

## 🎓 Learning Path

1. Start with **OAUTH_SETUP.md** to configure one platform
2. Read **IMPLEMENTATION_GUIDE.md** for usage patterns
3. Test connection flow in UI
4. Try publishing a test post
5. Simulate token expiry and test refresh
6. Review **OAUTH_FEATURES.md** for advanced features
7. Implement in your screens
8. Plan production deployment

## ⚡ Quick Commands

```bash
# Start development
npx expo start

# Check TypeScript
npx tsc --noEmit

# Generate encryption key
openssl rand -hex 32

# View logs
# Look for [OAuth], [TokenManager], [PublishPost] prefixes
```

---

**Ready to integrate?** Start with connecting one platform and publishing a test post!
