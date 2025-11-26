import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
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
                <Text style={styles.subtitle}>
                    Create an account to get started
                </Text>

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
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor="#888"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor="#888"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        isLoading && styles.primaryButtonDisabled,
                    ]}
                    onPress={async () => {
                        console.log("BUTTON PRESSED!");
                        if (!firstName || !lastName || !email || !password) {
                            Alert.alert(
                                "Error",
                                "Please fill all required fields"
                            );
                            return;
                        }

                        if (password.length < 6) {
                            Alert.alert(
                                "Error",
                                "Password must be at least 6 characters"
                            );
                            return;
                        }

                        if (password !== confirmPassword) {
                            Alert.alert("Error", "Passwords do not match");
                            return;
                        }

                        setIsLoading(true);
                        try {
                            console.log("Before register");
                            await register(
                                firstName,
                                lastName,
                                email,
                                password
                            );
                            console.log("After register");
                            router.replace("/login");
                        } catch (error) {
                            Alert.alert(
                                "Registration Failed",
                                error instanceof Error
                                    ? error.message
                                    : "An error occurred"
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
});
