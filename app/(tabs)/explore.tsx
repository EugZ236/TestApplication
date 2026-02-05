import teamService from "@/src/services/teamService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function qrScan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    if (!isPermissionGranted) {
      requestPermission();
    }
  }, [isPermissionGranted]);

  return (
    <SafeAreaView style={styleSheet.container}>
      {Platform.OS === "android" ? <StatusBar hidden /> : null}

      {isPermissionGranted && (
        <CameraView
          style={styleSheet.camStyle}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={async ({ data }) => {
            if (isScanned) return;
            setIsScanned(true);
            try {
              const result = await teamService.joinTeam(data);

              Alert.alert(
                "Успіх",
                `Ви приєдналися до команди "${result.teamName}"`,
                [{ text: "Чудово", onPress: async () => {
                  await AsyncStorage.setItem("view_team_id", String(result.id));
                  router.replace("/team");
                } }],
              );
            } catch (e: any) {
              console.error(e);

              const status = e.response?.status;
              let errorMessage = "Щось пішло не так. Спробуйте пізніше.";

              if (status === 404) {
                errorMessage =
                  "Команду з таким кодом не знайдено. Перевірте правильність вводу.";
              } else if (status === 409) {
                errorMessage = "Ви вже є учасником цієї команди.";
              } else if (status === 400) {
                errorMessage = "Невірний код інвайту.";
              } else if (e.response?.data) {
                errorMessage =
                  typeof e.response.data === "string"
                    ? e.response.data
                    : e.response.data.message;
              }

              Alert.alert("Помилка", errorMessage);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 20,
  },
  camStyle: {
    position: "absolute",
    width: 300,
    height: 300,
  },
});
