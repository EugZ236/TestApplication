import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";

export default function EditTeamPage() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7FB3FF");
  const [isSaving, setIsSaving] = useState(false);

  const presetColors = ["#7FB3FF", "#FFC37F", "#B6E3B6", "#F7A6D0", "#D0C8FF"];

  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem("edit_team_id");
      if (!storedId) {
        alert("Команду не знайдено");
        router.replace("/(tabs)");
        return;
      }
      setId(storedId);
      const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const team = list.find((t: any) => t.id === storedId);
      if (!team) {
        alert("Команду не знайдено");
        router.replace("/(tabs)");
        return;
      }
      setName(team.name || "");
      setColor(team.color || "#7FB3FF");
    })();
  }, []);

  async function saveTeam() {
    if (!name.trim()) {
      alert("Будь ласка, введіть назву команди");
      return;
    }
    setIsSaving(true);
    try {
      const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const newList = list.map((t: any) =>
        t.id === id ? { ...t, name: name.trim(), color } : t,
      );
      // clear transient edit id
      await AsyncStorage.removeItem("edit_team_id");
      await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(newList));
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      alert("Не вдалося зберегти зміни");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Edit team</ThemedText>

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
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Icon color</Text>
        <View style={styles.colorRow}>
          {presetColors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: c, borderWidth: c === color ? 2 : 0 },
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && { opacity: 0.6 }]}
            onPress={saveTeam}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.ghostButtonText}>Back</Text>
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
  },
  colorRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20 },
  actions: { marginTop: 24, gap: 12 },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  ghostButton: { marginTop: 8, alignItems: "center" },
  ghostButtonText: { color: "#007AFF", fontWeight: "600" },
});
