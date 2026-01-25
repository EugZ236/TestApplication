import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import teamService from "@/src/services/teamService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
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
  const [teams, setTeams] = useState<Array<any>>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
    }, []),
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  async function loadTeams() {
    setIsLoading(true);
    try {
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (e: any) {
      console.error("Помилка завантаження:", e);
      if (e.response?.status === 401) {
        Alert.alert("Сесія завершена", "Будь ласка, увійдіть знову");
        router.replace("/login");
      } else {
        Alert.alert("Помилка", "Не вдалося завантажити список команд");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

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
      "Ви впевнені, що хочете видалити команду?",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              setTeams(teams.filter((t) => t.id !== id));
              closeMenu();
            } catch (e) {
              Alert.alert("Помилка", "Не вдалося видалити команду");
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
            setShowSearch((prev) => {
              const next = !prev;
              if (prev) setQuery("");
              return next;
            });
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
              onRefresh={() => {
                setIsRefreshing(true);
                loadTeams();
              }}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.teamRow}
              onPress={async () => {
                await AsyncStorage.setItem("view_team_id", String(item.id));
                router.push("/team");
              }}
              activeOpacity={0.8}
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
                onPressIn={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  openMenu(item, pageX, pageY);
                }}
              >
                <IconSymbol name="ellipsis" size={18} color="#333" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing here. For now.</Text>
              <Text style={styles.emptySubtitle}>
                This is where you’ll find your teams.
              </Text>
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

      {/* Menu Modal */}
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
                  left: Math.max(8, Math.min(menuPos.x - 152, 200)),
                },
              ]}
            >
              <View style={styles.popoverCard}>
                <Text style={styles.popoverTitle}>{selectedTeam?.name}</Text>
                <TouchableOpacity style={styles.popoverRow} onPress={openInfo}>
                  <Text style={styles.popoverText}>Інформація</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popoverRow} onPress={openEdit}>
                  <Text style={styles.popoverText}>Редагувати</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.popoverRow}
                  onPress={() => confirmDelete(selectedTeam?.id)}
                >
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
          <ThemedText type="title">Інформація про команду</ThemedText>
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: "700", fontSize: 18 }}>
              {selectedTeam?.name}
            </Text>
            <Text style={{ color: "#666", marginTop: 8 }}>
              Invite Code: {selectedTeam?.inviteCode}
            </Text>
            <Text style={{ color: "#666", marginTop: 8 }}>
              Роль: {selectedTeam?.role}
            </Text>
            <Text style={{ color: "#666", marginTop: 8 }}>
              Учасників: {selectedTeam?.memberCount}
            </Text>
          </View>
          <View style={{ marginTop: 24 }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.primaryButtonText}>Назад</Text>
            </TouchableOpacity>
          </View>
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
  popoverContainer: { position: "absolute", width: 160 },
  popoverCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  popoverTitle: {
    fontWeight: "700",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 4,
  },
  popoverRow: { paddingVertical: 10 },
  popoverText: { fontSize: 15 },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
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
  },
  fabText: { color: "#fff", fontSize: 28 },
});
