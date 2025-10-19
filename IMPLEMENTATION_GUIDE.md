# OAuth Implementation Guide

## Overview

This project includes a complete OAuth authentication system for social media platforms with:
- ✅ Secure token storage with AES-256 encryption
- ✅ Automatic token refresh when expired
- ✅ Re-authentication flow for invalid tokens
- ✅ Connection status UI with visual indicators
- ✅ Platform-agnostic publish functionality
- ✅ Error handling and recovery

## Architecture

### Backend (tRPC)

**Token Storage (`backend/trpc/routes/platforms/connect/route.ts`)**
- Encrypts access/refresh tokens using AES-256-CBC
- Stores tokens in memory (replace with database in production)
- Provides token retrieval with expiry checking
- Implements token refresh for all platforms

**OAuth Routes (`backend/trpc/routes/platforms/oauth/*/route.ts`)**
- Initialize OAuth flow (returns auth URL)
- Handle OAuth callback (exchanges code for tokens)
- Platform-specific implementation for Instagram, LinkedIn, TikTok, YouTube

**Publishing Route (`backend/trpc/routes/platforms/publish/route.ts`)**
- Publishes content to connected platforms
- Handles platform-specific API differences
- Supports images, videos, and reels

### Frontend

**Context Providers**

1. **AppContext** (`contexts/AppContext.tsx`)
   - Manages app-level state
   - Stores connected platform metadata
   - Persists data to AsyncStorage

2. **PlatformConnectionContext** (`contexts/PlatformConnectionContext.tsx`)
   - Manages platform connection status
   - Checks token expiry automatically
   - Provides methods for token refresh
   - Exposes connection state to components

**Hooks**

1. **usePlatformTokens** (`hooks/usePlatformTokens.ts`)
   - Lower-level token management
   - Checks token expiry
   - Refreshes tokens
   - Validates tokens before use

2. **usePublishPost** (`hooks/usePublishPost.ts`)
   - High-level publishing functionality
   - Automatic token refresh on publish
   - Multi-platform publishing support
   - Error handling with re-auth prompts

## Usage Examples

### 1. Connecting a Platform

```tsx
import { trpc, trpcClient } from '@/lib/trpc';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '@/contexts/AppContext';

const { connectPlatform } = useApp();

const handleConnect = async (platform: 'instagram' | 'linkedin' | 'tiktok' | 'youtube') => {
  try {
    // 1. Get OAuth URL
    const { authUrl } = await trpcClient.platforms.oauth[platform].init.query();
    
    // 2. Open OAuth flow
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      `${process.env.EXPO_PUBLIC_APP_URL}/api/platforms/oauth/${platform}/callback`
    );
    
    if (result.type === 'success' && result.url) {
      // 3. Extract authorization code
      const code = new URL(result.url).searchParams.get('code');
      
      // 4. Exchange code for tokens
      const tokenData = await trpcClient.platforms.oauth[platform].callback.mutate({ code });
      
      // 5. Save encrypted tokens
      await trpcClient.platforms.saveToken.mutate({
        platform,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        userId: tokenData.userId,
        username: tokenData.username,
        expiresAt: tokenData.expiresAt,
      });
      
      // 6. Update app state
      await connectPlatform(
        platform,
        tokenData.username,
        tokenData.userId,
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.expiresAt
      );
      
      Alert.alert('Success', 'Platform connected!');
    }
  } catch (error) {
    console.error('Connection error:', error);
    Alert.alert('Error', 'Failed to connect platform');
  }
};
```

### 2. Publishing to Multiple Platforms

```tsx
import { usePublishPost } from '@/hooks/usePublishPost';
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';

function CreatePostScreen() {
  const { publishToMultiplePlatforms, isPublishing } = usePublishPost();
  const { connectedPlatformsList } = usePlatformConnection();
  
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  const handlePublish = async () => {
    const result = await publishToMultiplePlatforms(selectedPlatforms, {
      caption,
      mediaUrls: ['https://example.com/image.jpg'],
      mediaType: 'image',
    });
    
    if (result.successfulPlatforms.length > 0) {
      Alert.alert(
        'Published!',
        `Successfully published to: ${result.successfulPlatforms.join(', ')}`
      );
    }
    
    if (result.failedPlatforms.length > 0) {
      Alert.alert(
        'Partial Failure',
        `Failed to publish to: ${result.failedPlatforms.join(', ')}`
      );
    }
    
    if (result.requiresReauth.length > 0) {
      Alert.alert(
        'Reconnection Required',
        `Please reconnect: ${result.requiresReauth.join(', ')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reconnect', onPress: () => router.push('/onboarding/connect-platforms') }
        ]
      );
    }
  };

  return (
    <View>
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Write your post..."
      />
      
      {connectedPlatformsList.map(platform => (
        <Checkbox
          key={platform.platform}
          value={selectedPlatforms.includes(platform.platform)}
          onValueChange={() => togglePlatform(platform.platform)}
          label={platform.accountName}
        />
      ))}
      
      <Button
        onPress={handlePublish}
        disabled={isPublishing() || selectedPlatforms.length === 0}
      >
        {isPublishing() ? 'Publishing...' : 'Publish'}
      </Button>
    </View>
  );
}
```

### 3. Checking Platform Status

```tsx
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';
import { useEffect } from 'react';

function PlatformStatusScreen() {
  const { statusMap, checking, checkAllPlatforms, refreshPlatformToken } = usePlatformConnection();
  
  useEffect(() => {
    checkAllPlatforms();
  }, []);
  
  return (
    <View>
      {checking && <ActivityIndicator />}
      
      {Object.values(statusMap).map(platform => (
        <View key={platform.platform}>
          <Text>{platform.platform}</Text>
          <Text>Status: {platform.connected ? 'Connected' : 'Disconnected'}</Text>
          {platform.connected && (
            <>
              <Text>Account: {platform.accountName}</Text>
              {platform.isExpired && (
                <View>
                  <Text>Token expired!</Text>
                  <Button onPress={() => refreshPlatformToken(platform.platform)}>
                    Refresh
                  </Button>
                </View>
              )}
            </>
          )}
        </View>
      ))}
    </View>
  );
}
```

### 4. Manual Token Refresh

```tsx
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';

const { refreshPlatformToken } = usePlatformConnection();

const handleRefresh = async (platform: Platform) => {
  const result = await refreshPlatformToken(platform);
  
  if (result.success) {
    Alert.alert('Success', 'Token refreshed successfully');
  } else if (result.requiresReauth) {
    Alert.alert(
      'Reconnection Required',
      'Please reconnect your account',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reconnect', onPress: () => router.push('/onboarding/connect-platforms') }
      ]
    );
  } else {
    Alert.alert('Error', result.error || 'Failed to refresh token');
  }
};
```

### 5. Getting Valid Token for Custom API Call

```tsx
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';

const { getPublishToken } = usePlatformConnection();

const customApiCall = async (platform: Platform) => {
  try {
    // Automatically refreshes token if expired
    const { accessToken, userId } = await getPublishToken(platform);
    
    // Use token for custom API call
    const response = await fetch(`https://api.${platform}.com/endpoint`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.json();
  } catch (error) {
    if (error.message.includes('not connected')) {
      Alert.alert('Error', `Please connect ${platform} first`);
    } else if (error.message.includes('expired')) {
      Alert.alert('Error', `Token expired. Please reconnect ${platform}`);
    }
  }
};
```

## Error Handling

The system handles various error scenarios:

### 1. Token Expired
- Automatically attempts to refresh token
- If refresh succeeds, operation continues
- If refresh fails, prompts user to reconnect

### 2. Invalid Credentials
- Shows error message
- Prompts user to reconnect platform

### 3. Network Errors
- Shows user-friendly error message
- Logs error for debugging

### 4. Platform API Errors
- Parses platform-specific error messages
- Shows relevant error to user
- Logs full error details

## Testing

### Local Testing

1. Set up OAuth credentials for at least one platform
2. Start the development server: `npx expo start`
3. Navigate to Settings → Connected Platforms
4. Connect a platform
5. Try publishing a test post

### Testing Token Refresh

1. Manually set a short expiry time in token data
2. Wait for token to expire
3. Attempt to publish a post
4. Verify automatic token refresh

### Testing Re-authentication

1. Manually delete refresh token from backend
2. Attempt to publish a post
3. Verify re-authentication prompt appears

## Production Checklist

- [ ] Replace in-memory token storage with database
- [ ] Set up proper encryption key management
- [ ] Implement rate limiting on OAuth endpoints
- [ ] Add comprehensive error logging
- [ ] Set up monitoring for token refresh failures
- [ ] Configure proper CORS settings
- [ ] Use HTTPS for all OAuth redirect URIs
- [ ] Implement token rotation policy
- [ ] Add webhook handlers for platform events
- [ ] Set up automated token refresh job
- [ ] Implement proper session management
- [ ] Add user-level token isolation
- [ ] Configure platform API quota monitoring

## Security Considerations

1. **Token Encryption**: All tokens are encrypted at rest using AES-256
2. **Secure Storage**: Use secure database with encryption in production
3. **HTTPS Only**: All OAuth flows must use HTTPS in production
4. **Token Rotation**: Implement regular token rotation
5. **Access Control**: Ensure proper user-level token isolation
6. **Audit Logging**: Log all token operations for security audits
7. **Rate Limiting**: Prevent abuse of OAuth endpoints
8. **PKCE**: Consider implementing PKCE for mobile apps

## Troubleshooting

### Common Issues

**"OAuth redirect URI mismatch"**
- Check `.env` redirect URI matches developer console exactly
- Ensure no trailing slashes or extra spaces

**"Token refresh failed"**
- Verify refresh token is valid
- Check platform API credentials
- Ensure refresh endpoint is correct

**"Platform not connected"**
- User needs to connect platform in settings
- Check AsyncStorage for connection data

**"Invalid token format"**
- Verify encryption/decryption is working correctly
- Check encryption key is set properly

## Support

For issues or questions:
1. Check OAUTH_SETUP.md for platform-specific setup
2. Review error logs in console
3. Verify all environment variables are set correctly
4. Check platform developer documentation for API changes
