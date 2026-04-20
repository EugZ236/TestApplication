import OnboardingScreen from "@/components/onboarding-screen";
import { useI18n } from "@/context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function OnboardingPage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const router = useRouter();
  const { t } = useI18n();

  const onboardingScreens = useMemo(
    () => [
      {
        title: t("onboarding.slide1.title"),
        description: t("onboarding.slide1.description"),
        icon: "bar-chart",
      },
      {
        title: t("onboarding.slide2.title"),
        description: t("onboarding.slide2.description"),
        icon: "list",
      },
      {
        title: t("onboarding.slide3.title"),
        description: t("onboarding.slide3.description"),
        icon: "people",
      },
    ],
    [t],
  );

  const progress = ((currentScreen + 1) / onboardingScreens.length) * 100;

  const handleNext = async () => {
    if (currentScreen < onboardingScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      await AsyncStorage.setItem("onboarding_completed", "true");
      router.replace("register" as any);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("register" as any);
  };

  const screen = onboardingScreens[currentScreen];

  return (
    <View style={styles.container}>
      <OnboardingScreen
        title={screen.title}
        description={screen.description}
        icon={screen.icon}
        progress={progress}
        onNext={handleNext}
        onSkip={handleSkip}
        isLastScreen={currentScreen === onboardingScreens.length - 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
