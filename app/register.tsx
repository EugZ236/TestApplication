import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toast";
import { isValidEmail, validatePassword } from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#888"
            secureTextEntry
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
          onPress={async () => {
            console.log("BUTTON PRESSED!");
            // clear previous errors
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
              console.log("Before register");
              await register(firstName, lastName, email, password);
              console.log("After register");
              router.replace("/login");
            } catch (error) {
              Alert.alert(
                "Registration Failed",
                error instanceof Error ? error.message : "An error occurred",
              );
            } finally {
              setIsLoading(false);
            }
          }}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerImage: {
    height: 200,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: "flex-start",
    gap: 12,
  },
  form: {
    gap: 12,
    marginVertical: 8,
  },
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
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  ghostButton: {
    marginTop: 8,
    alignItems: "center",
  },
  ghostButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  subtitle: {
    color: "#666",
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  termsText: {
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  link: {
    color: "#007AFF",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "#D9534F",
    marginTop: 4,
    fontSize: 12,
  },
});
