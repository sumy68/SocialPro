// app.config.js
import "dotenv/config";

export default {
  expo: {
    name: "SocialPro Content Booster",
    slug: "socialpro-content-booster",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",

    scheme: process.env.EXPO_PUBLIC_SCHEME || "socialpro",

    userInterfaceStyle: "automatic",

    // ⛔ New Architecture AUS (passt zu Podfile, verhindert iOS Crash)
    newArchEnabled: false,

    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.rork.socialmedia-mastermind-content-planning-analytics",

      // ✅ WICHTIG: Build Number hochgezählt
      buildNumber: "9",

      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Allow $(PRODUCT_NAME) to access your photos",
        NSCameraUsageDescription:
          "Allow $(PRODUCT_NAME) to access your camera",
        NSMicrophoneUsageDescription:
          "Allow $(PRODUCT_NAME) to access your microphone",
        UIBackgroundModes: ["audio"],
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
      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: "socialpro" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

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
        {
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
        },
      ],
      "expo-web-browser",
      "expo-font",
    ],

    experiments: { typedRoutes: true },

    extra: {
      eas: {
        projectId: "6b80b470-21d3-446d-9478-e7922ef93ba5",
      },
      EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
      EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE,
      EXPO_PUBLIC_SCHEME: process.env.EXPO_PUBLIC_SCHEME || "socialpro",
    },
  },
};
