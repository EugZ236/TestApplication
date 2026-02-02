import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import teamService from "@/src/services/teamService";
import { showToast } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7FB3FF");
  const [isSaving, setIsSaving] = useState(false);
  const [createContext, setCreateContext] = useState<
    "post_signup" | "fab" | null
  >(null);

  const presetColors = ["#7FB3FF", "#FFC37F", "#B6E3B6", "#F7A6D0", "#D0C8FF"];

  async function saveTeam() {
    if (!name.trim()) {
      showToast.error("Помилка", "Будь ласка, введіть назву команди");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Виклик API через сервіс
      // Передаємо тільки name, оскільки ваш бекенд (згідно зі Swagger) очікує лише його
      await teamService.createTeam(name.trim());

      // 2. Очищення тимчасового контексту створення (якщо він був)
      try {
        await AsyncStorage.removeItem("create_context");
      } catch (e) {
        console.warn("Не вдалося очистити create_context");
      }

      // 3. Перехід на головний екран
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Помилка при створенні команди:", e);

      // Виводимо детальну помилку від сервера, якщо вона є
      const serverMessage =
        e.response?.data?.message || "Не вдалося зберегти команду на сервері";
      showToast.error("Помилка", serverMessage);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Визначення контексту (чи ми щойно зареєструвалися, чи натиснули кнопку "+" на головній)
   */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ctx = await AsyncStorage.getItem("create_context");
        if (!mounted) return;
        if (ctx === "post_signup") setCreateContext("post_signup");
        else setCreateContext("fab");
      } catch (e) {
        if (!mounted) return;
        setCreateContext("fab");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Create teams</ThemedText>

      <View style={styles.form}>
        <Text style={styles.label}>Team photo</Text>
        <View style={styles.avatarPlaceholder}>
          <View style={[styles.avatar, { backgroundColor: color }]} />
        </View>

        <Text style={styles.label}>Team name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Family"
          style={styles.input}
          editable={!isSaving}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Icon color</Text>
        <View style={styles.colorRow}>
          {presetColors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                c === color && styles.selectedSwatch,
              ]}
              onPress={() => setColor(c)}
              disabled={isSaving}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.disabledButton]}
            onPress={saveTeam}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem("create_context");
              } catch (e) {}
              if (createContext === "post_signup") {
                router.replace("/(tabs)");
              } else {
                router.back();
              }
            }}
            disabled={isSaving}
          >
            <Text style={styles.ghostButtonText}>
              {createContext === "post_signup" ? "Skip" : "Back"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  form: { marginTop: 16 },
  label: { color: "#222", marginBottom: 8 },
  avatarPlaceholder: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D7E6",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  colorRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0,
  },
  selectedSwatch: {
    borderWidth: 3,
    borderColor: "#000",
  },
  actions: { marginTop: 24, gap: 12 },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  ghostButton: { marginTop: 8, alignItems: "center" },
  ghostButtonText: { color: "#007AFF", fontWeight: "600" },
});
