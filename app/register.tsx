import { PasswordInput } from "@/components/password-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toast";
import { isValidEmail, validatePassword } from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async () => {
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!firstName || !lastName || !email || !password) {
      showToast.error("Error", "Please fill all required fields");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      setPasswordError(pwdValidation.message || "Invalid password");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const deviceToken = (await getFcmToken()) || "";
      await register(firstName, lastName, email, password, deviceToken);
      showToast.success("Success", "Welcome to SmartMeal! 👋");
      router.replace("/welcome");
    } catch (error: any) {
      const msg =
        error.response?.data || "An error occurred during registration";
      showToast.error(
        "Registration Failed",
        typeof msg === "string" ? msg : "Check your data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.headerImage} activeOpacity={0.8}>
        <Ionicons name="image-outline" size={36} color="#9BBCE0" />
      </TouchableOpacity>

      <View style={styles.content}>
        <ThemedText type="title">Sign up</ThemedText>
        <Text style={styles.subtitle}>Create an account to get started</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
          <PasswordInput
            placeholder="Create a password"
            placeholderTextColor="#888"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
          <PasswordInput
            placeholder="Confirm password"
            placeholderTextColor="#888"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
          />
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
            <Text style={styles.primaryButtonText}>Sign up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.ghostButtonText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
