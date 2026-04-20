import teamService from "@/src/services/teamService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function QrScanPage() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const isPermissionGranted = Boolean(permission?.granted);

  function extractInviteCode(rawData: string): string {
    const raw = String(rawData ?? "").trim();
    if (!raw) return "";

    let decoded = raw;
    if (raw.includes("%")) {
      try {
        decoded = decodeURIComponent(raw);
      } catch {
        decoded = raw;
      }
    }

    try {
      const url = new URL(decoded);
      const fromQuery =
        url.searchParams.get("code") ?? url.searchParams.get("inviteCode");
      if (fromQuery?.trim()) {
        return fromQuery.trim();
      }
    } catch {
      // If not a URL, use raw scanned value as invite code.
    }

    return decoded;
  }

  useEffect(() => {
    if (!isPermissionGranted) {
      requestPermission();
    }
  }, [isPermissionGranted]);

  async function handleBarcodeScanned(data: string) {
    if (isScanned) return;
    setIsScanned(true);

    const inviteCode = extractInviteCode(data);

    if (!inviteCode) {
      Alert.alert("Помилка", "QR-код не містить коду запрошення", [
        {
          text: "Спробувати ще раз",
          onPress: () => setIsScanned(false),
        },
      ]);
      return;
    }

    try {
      const result = await teamService.joinTeam(inviteCode);

      Alert.alert("Успіх", `Ви приєдналися до команди "${result.teamName}"`, [
        {
          text: "Чудово",
          onPress: async () => {
            const nextTeamId = result.teamId ?? result.id;
            if (nextTeamId != null) {
              await AsyncStorage.setItem("view_team_id", String(nextTeamId));
            }
            router.replace("/team");
          },
        },
      ]);
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

      Alert.alert("Помилка", errorMessage, [
        {
          text: "Спробувати ще раз",
          onPress: () => setIsScanned(false),
        },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" ? <StatusBar hidden /> : null}

      {isPermissionGranted ? (
        <>
          <CameraView
            style={styles.camStyle}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={({ data }) => handleBarcodeScanned(data)}
          />

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Наведіть камеру на QR код команди
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>
            Для сканування потрібен доступ до камери
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Надати доступ</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  camStyle: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  hintBox: {
    position: "absolute",
    bottom: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  hintText: {
    color: "#fff",
    fontWeight: "600",
  },
  permissionBox: {
    width: "86%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  permissionText: {
    textAlign: "center",
    color: "#333",
    fontSize: 15,
  },
  permissionButton: {
    marginTop: 6,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
