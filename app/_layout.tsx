import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppThemeProvider } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "onboarding",
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated } = useAuth();

  React.useEffect(() => {
    const initNotifications = async () => {
      try {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          const res = await Notifications.requestPermissionsAsync();
          console.log("Notification permission result", res.status);
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log("[BG] FCM message", remoteMessage);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification?.title ?? "SmartMeal",
              body: remoteMessage.notification?.body ?? "New notification",
              data: remoteMessage.data ?? {},
            },
            trigger: null,
          });
        });
      } catch (error) {
        console.error("Notification init error", error);
      }
    };

    initNotifications();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="login" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
        <Stack.Screen name="register" />
        <Stack.Screen name="welcome" />
      </Stack>

      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootLayoutContent />
      </AppThemeProvider>
    </AuthProvider>
  );
}
