// app.config.js
import "dotenv/config";

export default {
  expo: {
    name: "SocialPro Content Booster",
    slug: "socialpro-content-booster",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",

    // Deep Link Scheme (iOS & Android)
    scheme: process.env.EXPO_PUBLIC_SCHEME || "socialpro",

    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.rork.socialmedia-mastermind-content-planning-analytics",
      buildNumber: "1.0.1",
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Allow $(PRODUCT_NAME) to access your photos",
        NSCameraUsageDescription:
          "Allow $(PRODUCT_NAME) to access your camera",
        NSMicrophoneUsageDescription:
          "Allow $(PRODUCT_NAME) to access your microphone",
        UIBackgroundModes: ["audio"],
        // safety: ensure scheme is registered (Expo does this automatically,
        // but we keep it explicit so Safari deep links always resolve)
        CFBundleURLTypes: [{ CFBundleURLSchemes: ["socialpro"] }],
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "app.rork.socialprocontentbooster",
      versionCode: 1,
      permissions: ["INTERNET", "CAMERA", "RECORD_AUDIO"],
      // optional: handle deep links on Android too
      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: "socialpro" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    web: { favicon: "./assets/images/favicon.png" },

    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app accesses your photos to let you share them with your friends.",
        },
      ],
      [
        "expo-av",
        { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone" },
      ],
      "expo-web-browser",
      "expo-font",
    ],

    experiments: { typedRoutes: true },

    extra: {
      // 👇 EAS Project-Verknüpfung
      eas: {
        projectId: "6b80b470-21d3-446d-9478-e7922ef93ba5",
      },

      EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
      EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE,
      EXPO_PUBLIC_SCHEME: process.env.EXPO_PUBLIC_SCHEME || "socialpro",
    },
  },
};
