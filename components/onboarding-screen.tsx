import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { useI18n } from "@/context/LanguageContext";

interface OnboardingScreenProps {
  title: string;
  description: string;
  icon: string;
  progress: number;
  onNext: () => void;
  onSkip: () => void;
  isLastScreen: boolean;
}

export default function OnboardingScreen({
  title,
  description,
  icon,
  progress,
  onNext,
  onSkip,
  isLastScreen,
}: OnboardingScreenProps) {
  const { t } = useI18n();

  return (
    <ThemedView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Top info */}
      <View style={styles.topSection}>
        <Text style={styles.progressText}>
          {t("onboarding.progress", { percent: Math.round(progress) })}
        </Text>
      </View>

      {/* Icon/Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon as any} size={80} color="#007AFF" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>
            {isLastScreen ? t("onboarding.getStarted") : t("onboarding.next")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>{t("onboarding.skip")}</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#999",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.7,
  },
  buttonsContainer: {
    gap: 12,
  },
  nextButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
