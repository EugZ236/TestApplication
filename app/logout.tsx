import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Вихід</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="log-out-outline" size={28} color="#DC2626" />
        </View>
        <Text style={styles.title}>Вийти з профілю?</Text>
        <Text style={styles.subtitle}>
          Ви втратите доступ до команд, доки не ввійдете знову.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
          <Text style={styles.primaryButtonText}>Вийти</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Скасувати</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
  },
  header: {
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
  card: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    color: "#94A3B8",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
