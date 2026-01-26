import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme, toggleTheme } = useAppTheme();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.top}>
        <View style={styles.avatarBox}>
          {/* placeholder avatar */}
          <View style={[styles.avatar, { backgroundColor: "#DCEEFF" }]} />
        </View>
        <ThemedText type="title" style={styles.name}>
          {user?.name || "No name"}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.username}>
          {user?.email ? `@${user.email.split("@")[0]}` : ""}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeButton,
            theme === "dark" ? styles.themeButtonActive : null,
          ]}
          onPress={() => toggleTheme()}
        >
          <ThemedText
            style={
              theme === "dark"
                ? styles.themeButtonTextActive
                : styles.themeButtonText
            }
          >
            {theme === "dark" ? "Темна тема увімкнена" : "Увімкнути темну тему"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 24 },
  top: { alignItems: "center" },
  avatarBox: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  name: { marginTop: 12, fontSize: 18, fontWeight: "700" },
  username: { marginTop: 6, color: "#666" },
  actions: { marginTop: 32, width: "100%", paddingHorizontal: 20 },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700" },
  themeButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EDF6",
  },
  themeButtonActive: { backgroundColor: "#11181C", borderColor: "#11181C" },
  themeButtonText: { color: "#11181C", fontWeight: "700" },
  themeButtonTextActive: { color: "#fff", fontWeight: "700" },
});
