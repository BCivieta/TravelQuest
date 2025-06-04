import "dotenv/config";
import { ImageBackground } from "react-native-web";

export default {
  expo: {
    name: "TravelQuest",
    //owner: "blancaciv",
    slug: "travelquest", // Changed from "myApp" to "travelquest" to match EAS project
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo_oscuro.png",
    scheme: "travelquest", // Updated to match slug
    deepLinking: true,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    // Add the EAS project ID here
    extra: {
      eas: {
        projectId: "1bcf855d-e55d-4bac-a4c1-6f1ce15a1a5b"
      }
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Esta app necesita acceder a la cámara para tomar fotos de las misiones.",
        NSPhotoLibraryUsageDescription: "Esta app necesita acceder a tu galería para seleccionar imágenes.",
      }
    },
    android: {
      permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION"],
      package: "com.travelquest.app", // Make sure this is a unique package name
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      versionCode: 1 // Increment this for each new release
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png", // Changed from logo.png to icon.png which already exists
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-secure-store"
    ],
    experiments: {
      typedRoutes: true
    },
  }
}
