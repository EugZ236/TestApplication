import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail, validatePassword } from "@/utils/validation";
import { Image } from "expo-image";
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

export default function LoginPage() {
  const [email, setEmail] = useState("Test@gmail.com");
  const [password, setPassword] = useState("Test12345!");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  return (
    <ThemedView style={styles.container}>
      {/* Top image placeholder area */}
      <TouchableOpacity style={styles.headerImage} activeOpacity={0.8}>
        <Image
          source={require("@/assets/images/login-header.png")}
          style={styles.headerImageImage}
          contentFit="cover"
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <ThemedText type="title">Welcome!</ThemedText>

        <View style={styles.form}>
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
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={{ alignSelf: "flex-start", marginBottom: 8 }}
          onPress={() => {}}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            isLoading && styles.primaryButtonDisabled,
          ]}
          onPress={async () => {
            // clear previous errors
            setEmailError("");
            setPasswordError("");

            if (!email || !password) {
              Alert.alert("Error", "Please fill both email and password");
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

            setIsLoading(true);
            try {
              await login(email, password);
              router.replace("/welcome");
            } catch (error) {
              Alert.alert(
                "Login Failed",
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
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerRow}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.notMember}>Not a member? </Text>
          <Text style={styles.registerLink}>Register now</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.orText}>Or continue with</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: "#DB4437" }]}
            onPress={() => {}}
          >
            <Text style={styles.socialText}>G</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: "#111" }]}
            onPress={() => {}}
          >
            <Text style={styles.socialText}></Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: "#1877F2" }]}
            onPress={() => {}}
          >
            <Text style={styles.socialText}>f</Text>
          </TouchableOpacity>
        </View>
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
    height: 220,
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerImageImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 20,
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
  forgotText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  notMember: {
    color: "#666",
  },
  registerLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#EFEFEF",
    marginVertical: 16,
  },
  orText: {
    textAlign: "center",
    color: "#888",
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  socialText: {
    color: "#fff",
    fontWeight: "700",
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
