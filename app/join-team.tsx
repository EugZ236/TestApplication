import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useI18n } from "@/context/LanguageContext";
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
  const { t } = useI18n();
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
      showToast.error(t("joinTeam.missingCodeTitle"), t("joinTeam.missingCodeText"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await teamService.joinTeam(trimmedCode);

      notificationService.sendGroupNotification({
        title: t("joinTeam.newMemberTitle"),
        body: t("joinTeam.newMemberBody", { teamName: result.teamName }),
        teamId: result.teamId.toString(),
      });

      Alert.alert(
        t("joinTeam.successTitle"),
        t("joinTeam.successText", { teamName: result.teamName }),
        [{ text: t("joinTeam.successAction"), onPress: () => router.replace("/(tabs)") }],
      );
    } catch (e: any) {
      console.error(e);

      const status = e.response?.status;
      let errorMessage = t("joinTeam.genericError");

      if (status === 404) {
        errorMessage = t("joinTeam.notFoundError");
      } else if (status === 409) {
        errorMessage = t("joinTeam.conflictError");
      } else if (status === 400) {
        errorMessage = t("joinTeam.badRequestError");
      } else if (e.response?.data) {
        errorMessage =
          typeof e.response.data === "string"
            ? e.response.data
            : e.response.data.message;
      }

      showToast.error(t("common.error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t("joinTeam.title")}</ThemedText>

      <Text style={styles.instruction}>{t("joinTeam.instruction")}</Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder={t("joinTeam.placeholder")}
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
          <Text style={styles.primaryButtonText}>{t("joinTeam.joinButton")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.ghostButton, { marginTop: 16 }]}
        onPress={() => router.push("/qr-scan")}
        disabled={isLoading}
      >
        <Text style={styles.ghostButtonText}>{t("joinTeam.joinByQrButton")}</Text>
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
