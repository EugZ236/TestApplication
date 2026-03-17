import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Background FCM message:", remoteMessage);
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
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

    // 3. Прослушивание сообщений от Firebase
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
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
    </Tabs>
  );
}
