import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import notificationService from "@/src/services/notificationService";
import teamService from "@/src/services/teamService";
import { showToast } from "@/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function JoinTeamPage() {
  const { code: urlCode } = useLocalSearchParams();

  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode as string);
    }
  }, [urlCode]);
  async function handleJoin() {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      showToast.error("Помилка", "Будь ласка, введіть код інвайту");
      return;
    }

    setIsLoading(true);
    try {
      const result = await teamService.joinTeam(trimmedCode);

      notificationService.sendGroupNotification({
        title: "Новий учасник",
        body: `Користувач приєднався до команди "${result.teamName}"`,
        teamId: result.teamId.toString(),
      });

      Alert.alert("Успіх", `Ви приєдналися до команди "${result.teamName}"`, [
        { text: "Чудово", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e: any) {
      console.error(e);

      const status = e.response?.status;
      let errorMessage = "Щось пішло не так. Спробуйте пізніше.";

      if (status === 404) {
        errorMessage =
          "Команду з таким кодом не знайдено. Перевірте правильність вводу.";
      } else if (status === 409) {
        errorMessage = "Ви вже є учасником цієї команди.";
      } else if (status === 400) {
        errorMessage = "Невірний код інвайту.";
      } else if (e.response?.data) {
        errorMessage =
          typeof e.response.data === "string"
            ? e.response.data
            : e.response.data.message;
      }

      showToast.error("Помилка", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Приєднатися за кодом</ThemedText>

      <Text style={styles.instruction}>Введіть код інвайту нижче</Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Наприклад: IVQKUI0M"
        style={styles.input}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
        onPress={handleJoin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Приєднатися</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.ghostButton, { marginTop: 16 }]}
        onPress={() =>
          showToast.info(
            "Інфо",
            "Функція сканування QR-коду буде доступна в наступних оновленнях.",
          )
        }
        disabled={isLoading}
      >
        <Text style={styles.ghostButtonText}>Приєднатися за QR</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  instruction: { color: "#666", marginTop: 12, marginBottom: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D7E6",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    minHeight: 50,
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  ghostButton: { alignItems: "center", padding: 10 },
  ghostButtonText: { color: "#007AFF", fontWeight: "600" },
});
