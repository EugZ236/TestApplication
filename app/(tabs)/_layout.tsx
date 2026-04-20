import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Constants from "expo-constants";

import { Platform } from "react-native";

function isExpoGo() {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

function getNotificationsModule() {
  if (isExpoGo()) {
    return null;
  }

  try {
    return require("expo-notifications");
  } catch {
    return null;
  }
}

function getFirebaseMessaging() {
  try {
    const mod = require("@react-native-firebase/messaging");
    return mod.default ? mod.default : mod;
  } catch {
    return null;
  }
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // 2. Создание канала специально для Android
    async function configureAndroidChannel() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX, // Максимальный приоритет для баннера
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    }
    configureAndroidChannel();

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return;
    }

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log("Background FCM message:", remoteMessage);
    });

    // 3. Прослушивание сообщений от Firebase
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log("FCM Message received in foreground:", remoteMessage);

      // 4. Ручной запуск локального уведомления для показа баннера
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || "Заголовок",
          body: remoteMessage.notification?.body || "Текст сообщения",
          data: remoteMessage.data, // передаем данные для обработки нажатия
        },
        trigger: null, // Показать мгновенно
      });
    });

    return unsubscribe;
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Teams",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.pie" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
