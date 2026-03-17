import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

export default function AddProductPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(VIEW_TEAM_KEY);
        const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const found =
          list.find((t: any) => {
            if (t?.id == null || id == null) return false;
            return String(t.id) === String(id);
          }) || null;
        setTeam(found);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("api/categories");
        const data = Array.isArray(res.data) ? res.data : [];
        const mapped = data
          .filter((c: any) => c && c.id != null && c.name)
          .map((c: any) => ({ id: c.id, name: String(c.name) }));
        setCategories(mapped);
        setError(null);
      } catch (e) {
        console.error("fetch categories", e);
        setError("Не вдалося завантажити категорії");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View>
          <ThemedText type="title" style={styles.title}>
            Каталог
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Team: {team?.name ?? "Family"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Пошук (наприклад: Молоко)..."
          style={styles.searchInput}
        />
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionLabel}>ВСІ КАТЕГОРІЇ</ThemedText>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <ThemedText>Завантаження категорій...</ThemedText>
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ThemedText style={{ color: "#d00" }}>{error}</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.grid}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => {
                router.push(
                  `/category/${category.id}?name=${encodeURIComponent(category.name)}`,
                );
              }}
            >
              <View style={styles.categoryIcon} />
              <ThemedText style={styles.categoryName}>
                {category.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <View style={styles.cartBtn}>
          <Text style={{ fontWeight: "700" }}>🛒 У кошик</Text>
          <View style={styles.badge}>
            <Text style={{ color: "#fff", fontSize: 12 }}>2</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/shopping-list")}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            + Додати свій продукт
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 88,
    paddingTop: Platform.OS === "ios" ? 36 : 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F4F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#888", marginTop: 4 },
  searchWrap: { paddingHorizontal: 16, marginTop: 10 },
  searchInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  sectionHeader: { paddingHorizontal: 16, marginTop: 14, marginBottom: 6 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#999" },
  gridScroll: { flex: 1 },
  grid: {
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F4F7FF",
    marginBottom: 8,
  },
  categoryName: { textAlign: "center", fontWeight: "700", fontSize: 14 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#EEF2F7",
    backgroundColor: "#fff",
  },
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1E9FF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#2F80ED",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  titleInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#2F80ED",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
});
