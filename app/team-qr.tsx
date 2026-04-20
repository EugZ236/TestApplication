import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTeamStore } from "@/src/store/useTeamStore";
import { buildTeamInviteQrUri } from "@/utils/teamInviteQr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

export default function TeamQrPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(VIEW_TEAM_KEY);

        // Try to find team in app store first (fetched from API)
        const { teams, fetchTeams } = useTeamStore.getState();
        let found = teams.find((t: any) => String(t.id) === String(id)) || null;

        if (!found) {
          // attempt to refresh teams from API
          try {
            await fetchTeams();
            const refreshed = useTeamStore.getState().teams;
            found =
              refreshed.find((t: any) => String(t.id) === String(id)) || null;
          } catch (e) {
            // ignore and fallback to local storage below
          }
        }

        // fallback to local storage if store has no data
        if (!found) {
          const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
          const list = raw ? JSON.parse(raw) : [];
          found = list.find((t: any) => String(t.id) === String(id)) || null;
        }

        setTeam(found);
        if (found) {
          const inviteCode = String(found.inviteCode ?? "").trim();
          setQrUri(inviteCode ? buildTeamInviteQrUri(inviteCode, 360) : null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
          accessibilityLabel="Назад"
        >
          <ThemedText style={{ fontSize: 20 }}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          QR код команди
        </ThemedText>
        <View style={styles.right} />
      </View>

      <View style={styles.content}>
        {qrUri ? (
          <View style={styles.qrBox}>
            <Image source={{ uri: qrUri }} style={styles.qrImage as any} />
            <ThemedText style={{ marginTop: 12 }}>
              {team?.inviteCode}
            </ThemedText>
            <ThemedText style={{ color: "#666", marginTop: 8 }}>
              Скануйте код, щоб приєднатись
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={{ color: "#666" }}>Запрошення відсутнє</ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 72,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 36 : 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    position: "absolute",
    left: 12,
    top: Platform.OS === "ios" ? 36 : 18,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  title: { textAlign: "center" },
  right: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 36 : 18,
    width: 56,
    height: 56,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  qrBox: {
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F4F8",
  },
  qrImage: { width: 220, height: 220, borderRadius: 8 },
});
