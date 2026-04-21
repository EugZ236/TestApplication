import { PasswordInput } from "@/components/password-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { showToast } from "@/utils/toast";
import { isValidEmail, validatePassword } from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function isExpoGo() {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

function getNotificationsModule() {
  if (isExpoGo()) {
    return null;
  }

  try {
    return require("expo-notifications");
  } catch {
    return null;
  }
}

async function getFcmToken() {
  try {
    const mod = require("@react-native-firebase/messaging");
    const messaging = mod.default ? mod.default : mod;
    const token = await messaging().getToken();
    if (token) {
      console.log("FCM Token:", token);
      return token;
    }
  } catch (error) {
    console.warn("FCM token unavailable, fallback to Expo token", error);
  }

  try {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", expoToken);
    return expoToken;
  } catch (error) {
    console.error("Push token error:", error);
    return null;
  }
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldYRef = useRef({
    firstName: 0,
    lastName: 0,
    email: 0,
    password: 0,
    confirmPassword: 0,
  });
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useI18n();

  const scrollToField = (y: number) => {
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  };

  const handleRegister = async () => {
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!firstName || !lastName || !email || !password) {
      showToast.error(
        t("register.toastMissingFieldsTitle"),
        t("register.toastMissingFieldsText"),
      );
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError(t("register.invalidEmail"));
      return;
    }

    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      setPasswordError(pwdValidation.message || t("register.invalidPassword"));
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(t("register.passwordsMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const deviceToken = (await getFcmToken()) || "";
      await register(firstName, lastName, email, password, deviceToken);
      showToast.success(
        t("register.registerSuccessTitle"),
        t("register.registerSuccessText"),
      );
      router.replace("/welcome");
    } catch (error: any) {
      const msg = error.response?.data || t("register.registerFailedDefault");
      showToast.error(
        t("register.registerFailedTitle"),
        typeof msg === "string" ? msg : t("register.registerFailedCheckData"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.headerImage} activeOpacity={0.8}>
            <Image
              source={require("@/app/Images/LOGO.jpg")}
              contentFit="contain"
              style={{ width: 140, height: 140 }}
            />
          </TouchableOpacity>

          <View style={styles.content}>
            <ThemedText type="title">{t("register.title")}</ThemedText>
            <Text style={styles.subtitle}>{t("register.subtitle")}</Text>

            <View style={styles.form}>
              <View
                onLayout={(e) => {
                  fieldYRef.current.firstName = e.nativeEvent.layout.y;
                }}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("register.firstName")}
                  placeholderTextColor="#888"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isLoading}
                  onFocus={() => scrollToField(fieldYRef.current.firstName)}
                />
              </View>
              <View
                onLayout={(e) => {
                  fieldYRef.current.lastName = e.nativeEvent.layout.y;
                }}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("register.lastName")}
                  placeholderTextColor="#888"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isLoading}
                  onFocus={() => scrollToField(fieldYRef.current.lastName)}
                />
              </View>
              <View
                onLayout={(e) => {
                  fieldYRef.current.email = e.nativeEvent.layout.y;
                }}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("register.email")}
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  onFocus={() => scrollToField(fieldYRef.current.email)}
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
              <View
                onLayout={(e) => {
                  fieldYRef.current.password = e.nativeEvent.layout.y;
                }}
              >
                <PasswordInput
                  placeholder={t("register.password")}
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  onFocus={() => scrollToField(fieldYRef.current.password)}
                />
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
              <View
                onLayout={(e) => {
                  fieldYRef.current.confirmPassword = e.nativeEvent.layout.y;
                }}
              >
                <PasswordInput
                  placeholder={t("register.confirmPassword")}
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  onFocus={() =>
                    scrollToField(fieldYRef.current.confirmPassword)
                  }
                />
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isLoading && styles.primaryButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {t("register.submit")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.ghostButtonText}>
                {t("register.hasAccount")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoiding: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerImage: {
    height: 200,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 20, flex: 1, justifyContent: "flex-start", gap: 12 },
  form: { gap: 12, marginVertical: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  ghostButton: { marginTop: 8, alignItems: "center" },
  ghostButtonText: { color: "#007AFF", fontWeight: "600" },
  subtitle: { color: "#666", marginBottom: 8 },
  primaryButtonDisabled: { opacity: 0.6 },
  errorText: { color: "#D9534F", marginTop: 4, fontSize: 12 },
});
