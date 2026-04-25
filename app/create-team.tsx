import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useI18n } from "@/context/LanguageContext";
import budgetService from "@/src/services/budgetService";
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
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createContext, setCreateContext] = useState<
    "post_signup" | "fab" | null
  >(null);

  async function saveTeam() {
    if (!name.trim()) {
      showToast.error(
        t("createTeam.missingNameTitle"),
        t("createTeam.missingNameText"),
      );
      return;
    }

    const parsedLimit = Number(String(limitAmount).replace(/[^0-9.]/g, ""));
    if (!limitAmount || !Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      showToast.error(
        t("createTeam.invalidBudgetTitle"),
        t("createTeam.invalidBudgetText"),
      );
      return;
    }

    setIsSaving(true);
    try {
      // 1. Виклик API через сервіс: створюємо команду
      const created = await teamService.createTeam(name.trim());

      // 2. Створюємо початковий бюджет для поточного місяця з вказаним лімітом
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        await budgetService.createBudget({
          teamId: Number(created.id),
          month,
          year,
          limitAmount: parsedLimit,
          currentSpent: 0,
        });
      } catch (err: any) {
        // Якщо бекенд повернув конфлікт або іншу помилку, логують, але не блокуємо створення команди
        console.warn("Не вдалося створити бюджет для команди", err);
      }

      // 2. Очищення тимчасового контексту створення (якщо він був)
      try {
        await AsyncStorage.removeItem("create_context");
      } catch {
        console.warn("Не вдалося очистити create_context");
      }

      // 3. Перехід на головний екран
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Помилка при створенні команди:", e);

      // Виводимо детальну помилку від сервера, якщо вона є
      const serverMessage =
        e.response?.data?.message || t("createTeam.saveFailedText");
      showToast.error(t("createTeam.saveFailedTitle"), serverMessage);
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
      } catch {
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
      <ThemedText type="title">{t("createTeam.title")}</ThemedText>

      <View style={styles.form}>
        <Text style={styles.label}>{t("createTeam.teamPhoto")}</Text>
        <View style={styles.avatarPlaceholder}>
          <View style={[styles.avatar, { backgroundColor: "#7FB3FF" }]} />
        </View>

        <Text style={styles.label}>{t("createTeam.teamName")}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("createTeam.teamNamePlaceholder")}
          style={styles.input}
          editable={!isSaving}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>
          {t("createTeam.budgetLimitLabel")}
        </Text>
        <TextInput
          value={limitAmount}
          onChangeText={setLimitAmount}
          placeholder={t("createTeam.budgetLimitPlaceholder")}
          style={styles.input}
          keyboardType="numeric"
          editable={!isSaving}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.disabledButton]}
            onPress={saveTeam}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t("createTeam.createButton")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem("create_context");
              } catch {}
              if (createContext === "post_signup") {
                router.replace("/(tabs)");
              } else {
                router.back();
              }
            }}
            disabled={isSaving}
          >
            <Text style={styles.ghostButtonText}>
              {createContext === "post_signup"
                ? t("createTeam.skipButton")
                : t("createTeam.backButton")}
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
