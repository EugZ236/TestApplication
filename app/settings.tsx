import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { useAppTheme } from "@/context/ThemeContext";
import {
  DietaryPreferenceId,
  dietaryPreferenceOptions,
} from "@/src/constants/dietaryPreferences";
import userService from "@/src/services/userService";
import { showToast } from "@/utils/toast";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useAppTheme();
  const { language, setLanguage, t } = useI18n();
  const { user } = useAuth();

  const [profileName, setProfileName] = useState(t("common.user"));
  const [profileHandle, setProfileHandle] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<DietaryPreferenceId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);

  const userFallbackName = useMemo(() => {
    const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
    return fullName || t("common.user");
  }, [t, user?.firstName, user?.lastName]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nameData, photoData, preferencesData] = await Promise.all([
        userService.getName(),
        userService.getPhoto(),
        userService.getPreferences(),
      ]);

      const fullName =
        `${nameData?.firstName ?? ""} ${nameData?.lastName ?? ""}`.trim();
      setProfileName(fullName || userFallbackName);
      setProfileHandle(user?.email ? `@${user.email}` : t("common.profileFallback"));
      setAvatar(photoData || null);
      setPreferences(Array.isArray(preferencesData) ? preferencesData : []);
    } catch (error: any) {
      console.error(
        "[Settings] Не вдалося завантажити профіль:",
        error?.message,
      );
      setProfileName(userFallbackName);
      setProfileHandle(user?.email ? `@${user.email}` : t("common.profileFallback"));
      Alert.alert(
        t("settings.profileLoadFailedTitle"),
        t("settings.profileLoadFailedText"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t, user?.email, userFallbackName]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const onTogglePreference = (preferenceId: DietaryPreferenceId) => {
    setPreferences((prev) => {
      if (prev.includes(preferenceId)) {
        return prev.filter((id) => id !== preferenceId);
      }
      return [...prev, preferenceId];
    });
  };

  const onSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const sortedPreferences = [...preferences].sort((a, b) => a - b);
      await userService.replacePreferences(sortedPreferences);
      showToast.success(
        t("settings.preferencesSavedTitle"),
        t("settings.preferencesSavedText"),
      );
    } catch (error: any) {
      console.error(
        "[Settings] Не вдалося зберегти вподобання:",
        error?.message,
      );
      showToast.error(
        t("settings.preferencesSaveFailedTitle"),
        t("settings.preferencesSaveFailedText"),
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const onOpenPhotoModal = () => {
    setIsPhotoModalVisible(true);
  };

  const savePhotoValue = async (photoValue: string, closeModal = true) => {
    setIsSavingPhoto(true);
    try {
      await userService.savePhoto(photoValue);
      setAvatar(photoValue);
      if (closeModal) {
        setIsPhotoModalVisible(false);
      }
      showToast.success(t("settings.photoUpdatedTitle"), t("settings.photoUpdatedText"));
    } catch (error: any) {
      console.error("[Settings] Не вдалося зберегти фото:", error?.message);
      showToast.error(t("settings.photoUpdateFailedTitle"), t("settings.photoUpdateFailedText"));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const onPickPhotoFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast.info(
        t("settings.permissionDeniedTitle"),
        t("settings.permissionDeniedText"),
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
        t("settings.invalidPhotoTitle"),
        t("settings.invalidPhotoText"),
      );
      return;
    }

    const mimeType = selected.mimeType || "image/jpeg";
    const photoBase64 = `data:${mimeType};base64,${selected.base64}`;
    await savePhotoValue(photoBase64);
  };

  const onDeletePhoto = async () => {
    setIsSavingPhoto(true);
    try {
      await userService.deletePhoto();
      setAvatar(null);
      setIsPhotoModalVisible(false);
      showToast.success(t("settings.photoDeletedTitle"), t("settings.photoDeletedText"));
    } catch (error: any) {
      console.error("[Settings] Не вдалося видалити фото:", error?.message);
      showToast.error(t("settings.photoDeleteFailedTitle"), t("settings.photoDeleteFailedText"));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const initials = useMemo(() => {
    return profileName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profileName]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2C64E0" />
            <Text style={styles.loadingText}>{t("settings.loadingProfile")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.profileAvatar} />
              ) : (
                <View
                  style={[styles.profileAvatar, styles.profileAvatarFallback]}
                >
                  <Text style={styles.profileAvatarFallbackText}>
                    {initials || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileName}</Text>
                <Text style={styles.profileHandle}>
                  {profileHandle || t("common.profileFallback")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileEdit}
                onPress={onOpenPhotoModal}
              >
                <Ionicons name="create-outline" size={18} color="#2C64E0" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("settings.sectionTheme")}</Text>
              <View style={styles.themeRow}>
                <TouchableOpacity
                  style={[
                    styles.themeChip,
                    theme === null && styles.themeChipActive,
                  ]}
                  onPress={() => setTheme(null)}
                >
                  <Ionicons
                    name="contrast-outline"
                    size={16}
                    color={theme === null ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      theme === null && styles.themeChipTextActive,
                    ]}
                  >
                    {t("settings.themeSystem")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeChip,
                    theme === "light" && styles.themeChipActive,
                  ]}
                  onPress={() => setTheme("light")}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={16}
                    color={theme === "light" ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      theme === "light" && styles.themeChipTextActive,
                    ]}
                  >
                    {t("settings.themeLight")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeChip,
                    theme === "dark" && styles.themeChipActive,
                  ]}
                  onPress={() => setTheme("dark")}
                >
                  <Ionicons
                    name="moon-outline"
                    size={16}
                    color={theme === "dark" ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      theme === "dark" && styles.themeChipTextActive,
                    ]}
                  >
                    {t("settings.themeDark")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("settings.sectionLanguage")}</Text>
              <Text style={styles.languageHint}>{t("settings.languageSystemHint")}</Text>
              <View style={styles.themeRow}>
                <TouchableOpacity
                  style={[
                    styles.themeChip,
                    language === "uk" && styles.themeChipActive,
                  ]}
                  onPress={() => {
                    void setLanguage("uk");
                  }}
                >
                  <Ionicons
                    name="language-outline"
                    size={16}
                    color={language === "uk" ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      language === "uk" && styles.themeChipTextActive,
                    ]}
                  >
                    {t("settings.languageUkrainian")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeChip,
                    language === "en" && styles.themeChipActive,
                  ]}
                  onPress={() => {
                    void setLanguage("en");
                  }}
                >
                  <Ionicons
                    name="language-outline"
                    size={16}
                    color={language === "en" ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      language === "en" && styles.themeChipTextActive,
                    ]}
                  >
                    {t("settings.languageEnglish")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t("settings.sectionPreferences")}</Text>
                <TouchableOpacity
                  style={styles.savePreferencesBtn}
                  onPress={onSavePreferences}
                  disabled={isSavingPreferences}
                >
                  <Text style={styles.savePreferencesBtnText}>
                    {isSavingPreferences
                      ? t("settings.savePreferencesLoading")
                      : t("settings.savePreferences")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.preferencesWrap}>
                {dietaryPreferenceOptions.map((option) => {
                  const selected = preferences.includes(option.id);
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.preferenceChip,
                        selected && styles.preferenceChipSelected,
                      ]}
                      onPress={() => onTogglePreference(option.id)}
                    >
                      <Text style={styles.preferenceEmoji}>{option.emoji}</Text>
                      <Text
                        style={[
                          styles.preferenceLabel,
                          selected && styles.preferenceLabelSelected,
                        ]}
                      >
                        {t(`dietaryPreferences.${option.id}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("settings.sectionAccount")}</Text>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={onOpenPhotoModal}
              >
                <View style={[styles.menuIcon, styles.menuIconBlue]}>
                  <Ionicons name="person-outline" size={18} color="#2563EB" />
                </View>
                <Text style={styles.menuText}>{t("settings.updatePhoto")}</Text>
                <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuRow}>
                <View style={[styles.menuIcon, styles.menuIconPurple]}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#7C3AED"
                  />
                </View>
                <Text style={styles.menuText}>{t("settings.security")}</Text>
                <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuRow}>
                <View style={[styles.menuIcon, styles.menuIconGreen]}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#16A34A"
                  />
                </View>
                <Text style={styles.menuText}>{t("settings.notifications")}</Text>
                <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("settings.sectionSession")}</Text>
              <TouchableOpacity
                style={[styles.menuRow, styles.logoutRow]}
                onPress={() => router.push("/logout")}
              >
                <View style={[styles.menuIcon, styles.menuIconRed]}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                </View>
                <Text style={styles.logoutText}>{t("settings.logout")}</Text>
                <Ionicons name="chevron-forward" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={isPhotoModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("settings.photoModalTitle")}</Text>
            <Text style={styles.modalCaption}>{t("settings.photoModalCaption")}</Text>

            <TouchableOpacity
              style={styles.pickImageBtn}
              onPress={onPickPhotoFromGallery}
              disabled={isSavingPhoto}
            >
              <Ionicons name="images-outline" size={16} color="#1D4ED8" />
              <Text style={styles.pickImageBtnText}>{t("settings.pickFromGallery")}</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnLight]}
                onPress={() => setIsPhotoModalVisible(false)}
              >
                <Text style={styles.modalBtnLightText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deletePhotoBtn}
              onPress={onDeletePhoto}
              disabled={isSavingPhoto}
            >
              <Text style={styles.deletePhotoText}>{t("settings.deletePhoto")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 16,
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  profileAvatarFallback: {
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarFallbackText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 13,
    color: "#94A3B8",
  },
  profileEdit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0FF",
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  languageHint: {
    marginTop: 6,
    marginBottom: 10,
    color: "#64748B",
    fontSize: 12,
  },
  savePreferencesBtn: {
    backgroundColor: "#2C64E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  savePreferencesBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  preferencesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  preferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  preferenceChipSelected: {
    backgroundColor: "#E8F0FF",
    borderColor: "#2C64E0",
  },
  preferenceEmoji: {
    marginRight: 6,
    fontSize: 14,
  },
  preferenceLabel: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  preferenceLabelSelected: {
    color: "#1D4ED8",
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    marginRight: 10,
    marginBottom: 10,
  },
  themeChipActive: {
    backgroundColor: "#2C64E0",
  },
  themeChipText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  themeChipTextActive: {
    color: "#FFFFFF",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDF0F6",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconBlue: {
    backgroundColor: "#E8F0FF",
  },
  menuIconPurple: {
    backgroundColor: "#F2E8FF",
  },
  menuIconGreen: {
    backgroundColor: "#E7F7EE",
  },
  menuIconRed: {
    backgroundColor: "#FEE2E2",
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  logoutRow: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.48)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCaption: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  pickImageBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pickImageBtnText: {
    marginLeft: 8,
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 13,
  },
  photoInput: {
    marginTop: 12,
    minHeight: 120,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    color: "#0F172A",
    textAlignVertical: "top",
    fontSize: 12,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  modalBtnLight: {
    backgroundColor: "#F1F5F9",
    marginRight: 0,
  },
  modalBtnLightText: {
    color: "#334155",
    fontWeight: "700",
  },
  deletePhotoBtn: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  deletePhotoText: {
    color: "#DC2626",
    fontWeight: "700",
  },
});
