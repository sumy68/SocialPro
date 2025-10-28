import 'dotenv/config';

export default {
  expo: {
    name: 'SocialPro Content Booster',
    slug: 'socialpro-content-booster',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'socialpro',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.rork.socialpro-content-booster',
      buildNumber: '1.0.0',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
        NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone',
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'app.rork.socialprocontentbooster',
      versionCode: 1,
      permissions: ['INTERNET', 'CAMERA', 'RECORD_AUDIO'],
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      ['expo-router', { origin: 'https://socialpro-fnvo.onrender.com' }],
      [
        'expo-image-picker',
        {
          photosPermission:
            'The app accesses your photos to let you share them with your friends.',
        },
      ],
      ['expo-av', { microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone' }],
      'expo-web-browser',
      'expo-font',
    ],
    experiments: {
      typedRoutes: true,
    },

      extra: {
        EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
        EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE,
        EXPO_PUBLIC_SCHEME: process.env.EXPO_PUBLIC_SCHEME || 'socialpro', // 👈 hinzufügen
      },

  },
};
