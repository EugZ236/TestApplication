import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { getDietaryPreferenceOption } from "@/src/constants/dietaryPreferences";
import userService from "@/src/services/userService";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  const [firstName, setFirstName] = useState(t("common.user"));
  const [lastName, setLastName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const fallbackFirstName = useMemo(
    () => user?.firstName?.trim() || t("common.user"),
    [t, user?.firstName],
  );

  const fallbackLastName = useMemo(
    () => user?.lastName?.trim() || "",
    [user?.lastName],
  );

  const displayName = useMemo(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || t("common.user");
  }, [firstName, lastName, t]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nameData, photoData, preferencesData] = await Promise.all([
        userService.getName(),
        userService.getPhoto(),
        userService.getPreferences(),
      ]);

      setFirstName((nameData?.firstName ?? "").trim() || fallbackFirstName);
      setLastName((nameData?.lastName ?? "").trim() || fallbackLastName);
      setHandle(user?.email ? `@${user.email}` : t("common.profileFallback"));
      setAvatar(photoData || null);
      setPreferences(Array.isArray(preferencesData) ? preferencesData : []);
    } catch (error: any) {
      console.error("[Profile] Помилка завантаження:", error?.message);
      setFirstName(fallbackFirstName);
      setLastName(fallbackLastName);
      setHandle(user?.email ? `@${user.email}` : t("common.profileFallback"));
      setAvatar(null);
      setPreferences([]);
      Alert.alert(t("profile.profileLoadFailedTitle"), t("profile.profileLoadFailedText"));
    } finally {
      setIsLoading(false);
    }
  }, [fallbackFirstName, fallbackLastName, t, user?.email]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast.info(
        t("profile.permissionDeniedTitle"),
        t("profile.permissionDeniedText"),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) {
      return;
    }

    const selected = result.assets?.[0];
    if (!selected?.base64) {
      showToast.error(
        t("profile.invalidPhotoTitle"),
        t("profile.invalidPhotoText"),
      );
      return;
    }

    const mimeType = selected.mimeType || "image/jpeg";
    const photoBase64 = `data:${mimeType};base64,${selected.base64}`;

    setIsSavingPhoto(true);
    try {
      await userService.savePhoto(photoBase64);
      setAvatar(photoBase64);
      showToast.success(t("profile.photoSavedTitle"), t("profile.photoSavedText"));
    } catch (error: any) {
      console.error("[Profile] Не вдалося зберегти фото:", error?.message);
      showToast.error(t("profile.photoSaveFailedTitle"), t("profile.photoSaveFailedText"));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.headerIcon, styles.headerIconLower]}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {initials || "?"}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={onPickPhoto}
              disabled={isSavingPhoto}
            >
              <Ionicons
                name={isSavingPhoto ? "sync" : "camera"}
                size={18}
                color="#1A1A1A"
              />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2C64E0" />
            <Text style={styles.loadingText}>{t("profile.loading")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.profileBlock}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.handle}>{handle}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t("profile.sectionTitle")}</Text>
                <TouchableOpacity onPress={() => router.push("/settings")}>
                  <Text style={styles.sectionAction}>{t("profile.change")}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {preferences.length === 0 ? (
                  <Text style={styles.emptyText}>{t("profile.emptyPreferences")}</Text>
                ) : (
                  preferences.map((id) => {
                    const option = getDietaryPreferenceOption(id);
                    const translatedLabel = t(`dietaryPreferences.${id}`);
                    return (
                      <View style={styles.chip} key={id}>
                        <Text style={styles.chipIcon}>{option.emoji}</Text>
                        <Text style={styles.chipText}>{translatedLabel}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#2C64E0",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconLower: {
    marginTop: 8,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: 22,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0FF",
  },
  avatarFallbackText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  cameraButton: {
    position: "absolute",
    bottom: 6,
    right: 120 / 2 - 6,
    transform: [{ translateX: 36 }],
    backgroundColor: "#FFFFFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF1F6",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  profileBlock: {
    alignItems: "center",
    marginTop: 16,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748B",
  },
  name: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1B1F2A",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  handle: {
    marginTop: 8,
    color: "#9AA4B2",
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionAction: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F4F6FA",
    marginRight: 12,
    marginBottom: 12,
  },
  chipIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
