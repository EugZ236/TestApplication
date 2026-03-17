import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTeamStore } from "@/src/store/useTeamStore";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const getAvatarColor = (name: string) => {
  const colors = ["#7FB3FF", "#FFC37F", "#B6E3B6", "#F7A6D0", "#D0C8FF"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function TeamsScreen() {
  const router = useRouter();
  const { teams, isLoading, fetchTeams, deleteTeam } = useTeamStore();
  const [query, setQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchTeams();
    }, []),
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const copyInviteCode = async (code: string) => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setMenuVisible(false);
    showToast.info("Скопійовано", "Код інвайту вже у вашому буфері 📋");
  };

  const shareInviteCode = async (teamName: string, code: string) => {
    if (!code) return;
    const webLink = `https://rilking1.github.io/smartmeal-link/?code=${code}`;
    try {
      await Share.share({
        title: "Запрошення в SmartMeal",
        message: `Приєднуйся до моєї команди "${teamName}" у SmartMeal!\n\n${webLink}`,
      });
    } catch (error: any) {
      console.error(error);
    }
  };

  function openMenu(team: any, x?: number, y?: number) {
    setSelectedTeam(team);
    setMenuVisible(true);
    if (typeof x === "number" && typeof y === "number") setMenuPos({ x, y });
  }

  function closeMenu() {
    setMenuVisible(false);
    setSelectedTeam(null);
    setMenuPos(null);
  }

  function openInfo() {
    setMenuVisible(false);
    setInfoVisible(true);
  }

  function openEdit() {
    setMenuVisible(false);
    if (selectedTeam) {
      AsyncStorage.setItem("edit_team_id", String(selectedTeam.id));
      router.push("/edit-team");
    }
  }

  async function confirmDelete(id: number) {
    Alert.alert(
      "Видалити команду",
      "Ви впевнені? Тільки творець команди може це зробити.",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTeam(id);
              closeMenu();
              showToast.success("Успішно", "Команду видалено 👋");
            } catch (e: any) {
              const msg =
                e.response?.status === 403
                  ? "У вас немає прав на видалення"
                  : "Не вдалося видалити команду";
              showToast.error("Помилка", msg);
            }
          },
        },
      ],
    );
  }

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Teams</ThemedText>
        <TouchableOpacity
          onPress={() => {
            setShowSearch(!showSearch);
            if (showSearch) setQuery("");
          }}
        >
          <IconSymbol name="magnifyingglass" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search teams"
          style={styles.searchInput}
        />
      )}

      {isLoading && !isRefreshing ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingVertical: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={async () => {
                setIsRefreshing(true);
                await fetchTeams();
                setIsRefreshing(false);
              }}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.teamRow}
              onPress={async () => {
                try {
                  await AsyncStorage.setItem("teams_v1", JSON.stringify(teams));
                } catch (e) {
                  console.error("Не вдалося зберегти teams_v1", e);
                }
                await AsyncStorage.setItem("view_team_id", String(item.id));
                router.push("/team");
              }}
            >
              <View
                style={[
                  styles.teamIcon,
                  { backgroundColor: getAvatarColor(item.name) },
                ]}
              >
                <Text style={styles.teamIconText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.memberCount}>
                  {item.memberCount} members
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPressIn={(e) =>
                  openMenu(item, e.nativeEvent.pageX, e.nativeEvent.pageY)
                }
              >
                <IconSymbol name="ellipsis" size={18} color="#333" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing here. For now.</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push("/create-team")}
              >
                <Text style={styles.createButtonText}>Create team</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={async () => {
          await AsyncStorage.setItem("create_context", "fab");
          router.push("/create-team");
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={closeMenu}
        >
          {menuPos && (
            <View
              style={[
                styles.popoverContainer,
                {
                  top: Math.round(menuPos.y - 24),
                  left: Math.max(8, Math.min(menuPos.x - 170, 200)), // Трохи збільшив ширину
                },
              ]}
            >
              <View style={styles.popoverCard}>
                <Text style={styles.popoverTitle} numberOfLines={1}>
                  {selectedTeam?.name}
                </Text>

                <TouchableOpacity style={styles.popoverRow} onPress={openInfo}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#444"
                  />
                  <Text style={styles.popoverText}>Інформація</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.popoverRow}
                  onPress={() => copyInviteCode(selectedTeam?.inviteCode)}
                >
                  <Ionicons name="copy-outline" size={18} color="#007AFF" />
                  <Text style={[styles.popoverText, { color: "#007AFF" }]}>
                    Копіювати код
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.popoverRow}
                  onPress={() =>
                    shareInviteCode(
                      selectedTeam?.name,
                      selectedTeam?.inviteCode,
                    )
                  }
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="#28A745"
                  />
                  <Text style={[styles.popoverText, { color: "#28A745" }]}>
                    Поділитися
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.popoverRow} onPress={openEdit}>
                  <Ionicons name="create-outline" size={18} color="#444" />
                  <Text style={styles.popoverText}>Редагувати</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.popoverRow,
                    { borderTopWidth: 1, borderTopColor: "#eee", marginTop: 4 },
                  ]}
                  onPress={() => confirmDelete(selectedTeam?.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#D9534F" />
                  <Text style={[styles.popoverText, { color: "#D9534F" }]}>
                    Видалити
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={infoVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setInfoVisible(false)}
      >
        <ThemedView style={{ flex: 1, padding: 20 }}>
          <View style={styles.infoModalHeader}>
            <ThemedText type="title">Команда</ThemedText>
            <TouchableOpacity onPress={() => setInfoVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View
              style={[
                styles.largeIcon,
                { backgroundColor: getAvatarColor(selectedTeam?.name || "") },
              ]}
            >
              <Text style={styles.largeIconText}>
                {selectedTeam?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.infoTeamName}>{selectedTeam?.name}</Text>

            <View style={styles.infoDetailRow}>
              <Text style={styles.infoLabel}>Invite Code:</Text>
              <Text style={styles.infoValue}>{selectedTeam?.inviteCode}</Text>
            </View>

            {/* QR for invite link */}
            {selectedTeam
              ? (() => {
                  const code =
                    selectedTeam.inviteCode ?? String(selectedTeam.id ?? "");
                  const link = `https://rilking1.github.io/smartmeal-link/?code=${code}`;
                  return (
                    <View style={{ marginTop: 18, alignItems: "center" }}>
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                            link,
                          )}`,
                        }}
                        style={{ width: 160, height: 160, borderRadius: 8 }}
                      />
                      <Text style={{ color: "#666", marginTop: 8 }}>
                        Скануйте, щоб приєднатися
                      </Text>
                    </View>
                  );
                })()
              : null}

            <View style={styles.infoDetailRow}>
              <Text style={styles.infoLabel}>Ваша роль:</Text>
              <Text style={styles.infoValue}>{selectedTeam?.role}</Text>
            </View>

            <View style={styles.infoDetailRow}>
              <Text style={styles.infoLabel}>Учасників:</Text>
              <Text style={styles.infoValue}>{selectedTeam?.memberCount}</Text>
            </View>

            <View style={styles.infoActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#007AFF" }]}
                onPress={() => copyInviteCode(selectedTeam?.inviteCode)}
              >
                <Ionicons name="copy" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Копіювати</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#28A745" }]}
                onPress={() =>
                  shareInviteCode(selectedTeam?.name, selectedTeam?.inviteCode)
                }
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Поділитися</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setInfoVisible(false)}
          >
            <Text style={styles.backButtonText}>Закрити</Text>
          </TouchableOpacity>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#E6EDF6",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F7FB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  teamIconText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  teamName: { fontSize: 16, fontWeight: "700" },
  memberCount: { fontSize: 13, color: "#666", marginTop: 2 },
  moreButton: { padding: 8 },
  emptyContainer: { alignItems: "center", paddingTop: 40 },
  emptyTitle: { fontWeight: "700", fontSize: 18, marginBottom: 6 },
  emptySubtitle: { color: "#666", marginBottom: 16 },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  createButtonText: { color: "#fff", fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.05)" },
  popoverContainer: { position: "absolute", width: 180 },
  popoverCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  popoverTitle: {
    fontWeight: "800",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#333",
  },
  popoverRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 10,
  },
  popoverText: { fontSize: 14, fontWeight: "500" },

  // Info Modal Styles
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  largeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  largeIconText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  infoTeamName: { fontSize: 24, fontWeight: "800", marginBottom: 20 },
  infoDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  infoLabel: { color: "#666", fontWeight: "600" },
  infoValue: { fontWeight: "700", color: "#333" },
  infoActions: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%" },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: { color: "#fff", fontWeight: "700" },
  backButton: { marginTop: 20, alignItems: "center", padding: 16 },
  backButtonText: { color: "#007AFF", fontWeight: "700", fontSize: 16 },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabText: { color: "#fff", fontSize: 28 },
});
