import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "@/context/ThemeContext";

const profile = {
  name: "Олександр Петренко",
  handle: "@alex_p",
  avatar: "https://i.pravatar.cc/300?img=13",
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Налаштування</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Image
            source={{ uri: profile.avatar }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileHandle}>{profile.handle}</Text>
          </View>
          <TouchableOpacity style={styles.profileEdit}>
            <Ionicons name="create-outline" size={18} color="#2C64E0" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тема</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[
                styles.themeChip,
                theme === null && styles.themeChipActive,
              ]}
              onPress={() => setTheme(null)}
            >
              <Ionicons
                name="contrast-outline"
                size={16}
                color={theme === null ? "#FFFFFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.themeChipText,
                  theme === null && styles.themeChipTextActive,
                ]}
              >
                Системна
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeChip,
                theme === "light" && styles.themeChipActive,
              ]}
              onPress={() => setTheme("light")}
            >
              <Ionicons
                name="sunny-outline"
                size={16}
                color={theme === "light" ? "#FFFFFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.themeChipText,
                  theme === "light" && styles.themeChipTextActive,
                ]}
              >
                Світла
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeChip,
                theme === "dark" && styles.themeChipActive,
              ]}
              onPress={() => setTheme("dark")}
            >
              <Ionicons
                name="moon-outline"
                size={16}
                color={theme === "dark" ? "#FFFFFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.themeChipText,
                  theme === "dark" && styles.themeChipTextActive,
                ]}
              >
                Темна
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Акаунт</Text>

          <TouchableOpacity style={styles.menuRow}>
            <View style={[styles.menuIcon, styles.menuIconBlue]}>
              <Ionicons name="person-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.menuText}>Редагувати профіль</Text>
            <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <View style={[styles.menuIcon, styles.menuIconPurple]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#7C3AED"
              />
            </View>
            <Text style={styles.menuText}>Безпека</Text>
            <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <View style={[styles.menuIcon, styles.menuIconGreen]}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#16A34A"
              />
            </View>
            <Text style={styles.menuText}>Сповіщення</Text>
            <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сесія</Text>
          <TouchableOpacity
            style={[styles.menuRow, styles.logoutRow]}
            onPress={() => router.push("/logout")}
          >
            <View style={[styles.menuIcon, styles.menuIconRed]}>
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>Вийти з профілю</Text>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 13,
    color: "#94A3B8",
  },
  profileEdit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0FF",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    marginRight: 10,
    marginBottom: 10,
  },
  themeChipActive: {
    backgroundColor: "#2C64E0",
  },
  themeChipText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  themeChipTextActive: {
    color: "#FFFFFF",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDF0F6",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconBlue: {
    backgroundColor: "#E8F0FF",
  },
  menuIconPurple: {
    backgroundColor: "#F2E8FF",
  },
  menuIconGreen: {
    backgroundColor: "#E7F7EE",
  },
  menuIconRed: {
    backgroundColor: "#FEE2E2",
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  logoutRow: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
});
