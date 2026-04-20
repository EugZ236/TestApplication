import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require("@/assets/images/login-header.png")}
        contentFit="cover"
        style={styles.background}
      />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <ThemedText type="title" style={styles.greeting}>
          {t("welcome.hello", { name: user?.name ? `, ${user.name}` : "" })}
        </ThemedText>

        <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("welcome.createFamilyTitle")}
            </Text>
            <Text style={styles.cardDesc}>
              {t("welcome.createFamilyDescription")}
            </Text>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={async () => {
                try {
                  await AsyncStorage.setItem("create_context", "post_signup");
                } catch {
                  // ignore
                }
                router.push("/create-team");
              }}
            >
              <Text style={styles.cardButtonText}>
                {t("welcome.createAction")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("welcome.joinByCodeTitle")}</Text>
            <Text style={styles.cardDesc}>
              {t("welcome.joinByCodeDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.cardButton, styles.ghostButton]}
              onPress={() => router.push("/join-team")}
            >
              <Text style={[styles.cardButtonText, styles.ghostButtonText]}>
                {t("welcome.joinAction")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  greeting: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginHorizontal: 20,
  },
  spacer: {
    height: 40,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 360,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 360,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  cardContainer: {
    width: "100%",
    marginTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDesc: {
    color: "#666",
    marginBottom: 12,
  },
  cardButton: {
    alignSelf: "flex-start",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cardButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  ghostButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  ghostButtonText: {
    color: "#007AFF",
  },
});
