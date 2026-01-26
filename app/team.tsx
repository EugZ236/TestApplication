import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import teamService from "@/src/services/teamService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

export default function TeamPage() {
  const router = useRouter();
  const auth = useAuth();
  const [team, setTeam] = useState<any | null>(null);
  const COLLAPSED_WIDTH = 48;
  const EXPANDED_WIDTH = 260;
  const animatedWidth = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;
  const [isOpen, setIsOpen] = useState(false);

  const [qrLink, setQrLink] = useState<string | null>(null);

  function toggleSidebar() {
    const toValue = isOpen ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
    Animated.timing(animatedWidth, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  }

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(VIEW_TEAM_KEY);
        // const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
        const list = await teamService.getTeams();
        const found = list.find((t: any) => t.id === Number(id)) || null;
        if (found) {
          setQrLink(
            `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${found.id}`,
          );
          setTeam(found);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    console.log(`QR-link: ${qrLink}`);
  }, [qrLink]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ThemedText>←</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {team?.name ?? "Команда"}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="subtitle">Інформація про команду</ThemedText>
        {team ? (
          <View style={{ marginTop: 12 }}>
            <ThemedText style={{ fontWeight: "700", fontSize: 18 }}>
              {team.name}
            </ThemedText>
            <ThemedText style={{ color: "#666", marginTop: 8 }}>
              ID: {team.id}
            </ThemedText>
            <ThemedText style={{ color: "#666", marginTop: 8 }}>
              Колір: {team.color}
            </ThemedText>
            {qrLink ? (
              <Image
                source={{ uri: qrLink }}
                style={{ width: 150, height: 150 }}
              />
            ) : (
              "No image!"
            )}
          </View>
        ) : (
          <ThemedText style={{ marginTop: 12, color: "#666" }}>
            Команда не знайдена.
          </ThemedText>
        )}
      </View>

      {/* Sidebar Drawer (right side) */}
      <Animated.View
        style={[styles.sidebar, { width: animatedWidth }] as any}
        pointerEvents="box-none"
      >
        <View style={styles.sidebarInner}>
          {isOpen ? (
            <>
              <TouchableOpacity
                style={styles.collapseTop}
                onPress={toggleSidebar}
              >
                <ThemedText>{">"}</ThemedText>
              </TouchableOpacity>
              <View style={styles.collapseDivider} />

              <View style={styles.sidebarContent}>
                {/* Current user (always first) */}
                <SidebarUserItem user={auth.user} label="Керівник" />

                {/* Other team members (if any) */}
                {Array.isArray(team?.members) && team.members.length > 0
                  ? team.members.map((m: any) => (
                      <SidebarUserItem key={m.id} user={m} />
                    ))
                  : null}

                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => {}}
                >
                  <ThemedText style={{ color: "#007AFF", fontWeight: "700" }}>
                    + Додати користувача
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.sidebarToggle}
              onPress={toggleSidebar}
            >
              <ThemedText>{"<"}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </ThemedView>
  );
}

function SidebarUserItem({ user, label }: { user: any; label?: string }) {
  let displayName = user
    ? `${user.firstName ?? ""}${user.lastName ? " " + user.lastName : ""}`.trim()
    : "Користувач";
  if (label === "Керівник" && user?.firstName)
    displayName = `Ви (${user.firstName})`;
  const initials = displayName
    ? displayName
        .split(" ")
        .map((p: string) => p.charAt(0))
        .slice(0, 2)
        .join("")
    : "?";
  return (
    <View style={sideStyles.row}>
      <View style={[sideStyles.avatar, { backgroundColor: "#D8E9FF" }]}>
        <ThemedText style={{ fontWeight: "700" }}>{initials}</ThemedText>
      </View>
      <View style={sideStyles.info}>
        <ThemedText style={{ fontWeight: "700" }}>
          {displayName || "Ви"}
        </ThemedText>
        {label ? (
          <ThemedText style={{ color: "#666", fontSize: 12 }}>
            {label}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const sideStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  header: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    position: "relative",
  },
  title: { textAlign: "center" },
  back: { position: "absolute", left: 12, top: 12 },
  content: { padding: 20 },

  // Sidebar styles
  sidebar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#F0F2F5",
    borderLeftWidth: 1,
    borderLeftColor: "#EEE",
    zIndex: 50,
  },
  sidebarInner: { flex: 1, paddingTop: 12 },
  sidebarToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F7FB",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  sidebarContent: { marginTop: 8, paddingHorizontal: 12 },
  sidebarRow: { paddingVertical: 12 },
  collapseTop: { position: "absolute", left: 12, top: 12, zIndex: 10 },
  collapseDivider: { height: 1, backgroundColor: "#E6EDF6", marginTop: 64 },
  addUserButton: { marginTop: 20, paddingVertical: 12, alignItems: "center" },
});
