import OnboardingScreen from "@/components/onboarding-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

const ONBOARDING_SCREENS = [
  {
    title: "Save up to 30% of your budget",
    description:
      "Track your spending and discover ways to save money effortlessly",
    icon: "bar-chart",
  },
  {
    title: "Never forget what you have at home",
    description: "Keep an organized inventory of all your items",
    icon: "list",
  },
  {
    title: "Plan your shopping together",
    description: "Collaborate with family and friends on shopping lists",
    icon: "people",
  },
];

export default function OnboardingPage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const router = useRouter();

  const progress = ((currentScreen + 1) / ONBOARDING_SCREENS.length) * 100;

  const handleNext = async () => {
    if (currentScreen < ONBOARDING_SCREENS.length - 1) {
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

  const screen = ONBOARDING_SCREENS[currentScreen];

  return (
    <View style={styles.container}>
      <OnboardingScreen
        title={screen.title}
        description={screen.description}
        icon={screen.icon}
        progress={progress}
        onNext={handleNext}
        onSkip={handleSkip}
        isLastScreen={currentScreen === ONBOARDING_SCREENS.length - 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
