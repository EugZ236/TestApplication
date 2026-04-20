import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useI18n } from "@/context/LanguageContext";
import teamService from "@/src/services/teamService";
import { showToast } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Функція генерації кольору (така ж, як в index.tsx)
const getAvatarColor = (name: string) => {
  const colors = ["#7FB3FF", "#FFC37F", "#B6E3B6", "#F7A6D0", "#D0C8FF"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function EditTeamPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTeamData = useCallback(async () => {
    try {
      const storedId = await AsyncStorage.getItem("edit_team_id");
      if (!storedId) {
        showToast.error(
          t("editTeam.missingTeamIdTitle"),
          t("editTeam.missingTeamIdText"),
        );

        router.replace("/(tabs)");
        return;
      }

      const teamId = Number(storedId);
      setId(teamId);

      const teams = await teamService.getTeams();
      const team = teams.find((t: any) => t.id === teamId);

      if (!team) {
        showToast.error(
          t("editTeam.teamNotFoundTitle"),
          t("editTeam.teamNotFoundText"),
        );
        router.replace("/(tabs)");
        return;
      }

      setName(team.name || "");
    } catch {
      showToast.error(
        t("editTeam.loadFailedTitle"),
        t("editTeam.loadFailedText"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  async function saveTeam() {
    if (!name.trim() || !id) {
      showToast.error(
        t("editTeam.emptyNameTitle"),
        t("editTeam.emptyNameText"),
      );
      return;
    }

    setIsSaving(true);
    try {
      await teamService.updateTeam(id, name.trim());
      await AsyncStorage.removeItem("edit_team_id");

      Alert.alert(
        t("editTeam.saveSuccessTitle"),
        t("editTeam.saveSuccessText"),
        [{ text: t("common.done"), onPress: () => router.replace("/(tabs)") }],
      );
    } catch (e: any) {
      const msg =
        e.response?.status === 403
          ? t("editTeam.saveFailedNotOwner")
          : t("editTeam.saveFailedDefault");
      showToast.error(t("common.error"), msg);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  // Обчислюємо колір на основі поточної назви в інпуті
  const currentColor = getAvatarColor(name);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t("editTeam.title")}</ThemedText>

      <View style={styles.form}>
        <Text style={styles.label}>{t("editTeam.previewLabel")}</Text>
        <View style={styles.avatarPlaceholder}>
          <View style={[styles.avatar, { backgroundColor: currentColor }]}>
            <Text style={styles.avatarLetter}>
              {name ? name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
          <Text style={styles.hint}>{t("editTeam.autoColorHint")}</Text>
        </View>

        <Text style={styles.label}>{t("editTeam.teamNameLabel")}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("editTeam.teamNamePlaceholder")}
          style={styles.input}
          maxLength={30}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && { opacity: 0.6 }]}
            onPress={saveTeam}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t("editTeam.saveButton")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.ghostButtonText}>
              {t("editTeam.cancelButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  form: { marginTop: 24 },
  label: { color: "#666", marginBottom: 8, fontWeight: "600" },
  avatarPlaceholder: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarLetter: { color: "#fff", fontSize: 40, fontWeight: "800" },
  hint: { fontSize: 12, color: "#999", marginTop: 8 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#D0D7E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    backgroundColor: "#fff",
    color: "#000",
  },
  actions: { marginTop: 32, gap: 12 },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ghostButton: { marginTop: 8, alignItems: "center", padding: 12 },
  ghostButtonText: { color: "#D9534F", fontWeight: "600" },
});
