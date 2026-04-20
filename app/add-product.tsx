import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/src/services/api";
import productService from "@/src/services/productService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
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
  const [categories, setCategories] = useState<
    { id: number; name: string; imageBase64?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("шт");
  const [newProductImageBase64, setNewProductImageBase64] = useState("");
  const [newProductImageUri, setNewProductImageUri] = useState<string | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [localProductNames, setLocalProductNames] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    let active = true;
    const query = searchQuery.trim();
    const timeout = setTimeout(async () => {
      if (!query) {
        if (active) {
          setSearchResults([]);
          setSearchError(null);
          setSearchLoading(false);
        }
        return;
      }

      if (active) {
        setSearchLoading(true);
        setSearchError(null);
      }

      try {
        const results = await productService.searchGlobalProducts(query);
        if (active) {
          const localMatches = localProductNames.filter((name) =>
            name.toLowerCase().includes(query.toLowerCase()),
          );
          setSearchResults(Array.from(new Set([...localMatches, ...results])));
        }
      } catch (e) {
        console.error("search products failed", e);
        if (active) {
          setSearchError("Не вдалося знайти продукти");
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery, localProductNames]);

  const handleCreateProduct = async () => {
    const name = newProductName.trim();
    if (!name) {
      setCreateError("Введіть назву продукту");
      return;
    }
    if (!selectedCategoryId) {
      setCreateError("Оберіть категорію продукту");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    const createdId = await productService.createProduct({
      name,
      defaultUnit: newProductUnit.trim() || "шт",
      categoryId: selectedCategoryId,
      imageBase64: newProductImageBase64.trim() || undefined,
    });

    setCreateLoading(false);

    if (createdId != null) {
      setLocalProductNames((prev) =>
        prev.includes(name) ? prev : [name, ...prev],
      );
      setCreateSuccess("Продукт успішно створено");
      setShowCreateModal(false);
      setNewProductName("");
      setNewProductUnit("шт");
      setNewProductImageBase64("");
      setNewProductImageUri(null);
      router.push(
        `/category/${selectedCategoryId}?name=${encodeURIComponent(
          categories.find((c) => c.id === selectedCategoryId)?.name ||
            "Категорія",
        )}`,
      );
    } else {
      setCreateError("Не вдалося створити продукт");
    }
  };

  const handlePickProductImage = async () => {
    setCreateError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setCreateError("Потрібен доступ до галереї для вибору картинки");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) {
      return;
    }

    const selected = result.assets?.[0];
    if (!selected?.base64) {
      setCreateError("Не вдалося прочитати обране зображення");
      return;
    }

    const mimeType = selected.mimeType || "image/jpeg";
    const photoBase64 = `data:${mimeType};base64,${selected.base64}`;

    setNewProductImageBase64(photoBase64);
    setNewProductImageUri(selected.uri ?? photoBase64);
  };

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
          .map((c: any) => ({
            id: c.id,
            name: String(c.name),
            imageBase64:
              typeof c.imageBase64 === "string" && c.imageBase64.trim()
                ? c.imageBase64.trim()
                : undefined,
          }));
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
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionLabel}>
          {isSearching ? "Результати пошуку" : "ВСІ КАТЕГОРІЇ"}
        </ThemedText>
      </View>

      {isSearching ? (
        searchLoading ? (
          <View style={{ padding: 16 }}>
            <ThemedText>Пошук...</ThemedText>
          </View>
        ) : searchError ? (
          <View style={{ padding: 16 }}>
            <ThemedText style={{ color: "#d00" }}>{searchError}</ThemedText>
          </View>
        ) : searchResults.length > 0 ? (
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.searchResults}
          >
            {searchResults.map((productName) => (
              <View key={productName} style={styles.searchResultCard}>
                <ThemedText style={styles.searchResultText} numberOfLines={2}>
                  {productName}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ padding: 16 }}>
            <ThemedText style={{ color: "#999" }}>
              Продукти не знайдені
            </ThemedText>
          </View>
        )
      ) : loading ? (
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
              {category.imageBase64 ? (
                <Image
                  source={{
                    uri: category.imageBase64.startsWith("data:")
                      ? category.imageBase64
                      : `data:image/png;base64,${category.imageBase64}`,
                  }}
                  style={styles.categoryIcon}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.categoryIcon} />
              )}
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
          onPress={() => setShowCreateModal(true)}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            + Додати свій продукт
          </ThemedText>
        </TouchableOpacity>
      </View>

      {showCreateModal ? (
        <View style={styles.modalWrapper}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={{ fontSize: 18 }}>←</Text>
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>
                Створити продукт
              </ThemedText>
            </View>
            <View style={{ marginTop: 14 }}>
              <ThemedText style={styles.formLabel}>Назва</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={newProductName}
                onChangeText={setNewProductName}
                placeholder="Введіть назву"
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.formLabel}>Одиниця</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={newProductUnit}
                onChangeText={setNewProductUnit}
                placeholder="шт, г, мл"
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.formLabel}>Категорія</ThemedText>
              <View style={styles.categorySelector}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategoryId === category.id &&
                        styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <ThemedText
                      style={
                        selectedCategoryId === category.id
                          ? styles.categoryOptionTextSelected
                          : styles.categoryOptionText
                      }
                    >
                      {category.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.formLabel}>Картинка</ThemedText>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={handlePickProductImage}
              >
                <ThemedText style={styles.imagePickerBtnText}>
                  Обрати з галереї
                </ThemedText>
              </TouchableOpacity>
              {newProductImageUri ? (
                <Image
                  source={{ uri: newProductImageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : null}
            </View>
            {createError ? (
              <ThemedText style={{ color: "#d00", marginTop: 10 }}>
                {createError}
              </ThemedText>
            ) : null}
            {createSuccess ? (
              <ThemedText style={{ color: "#148A08", marginTop: 10 }}>
                {createSuccess}
              </ThemedText>
            ) : null}
            <TouchableOpacity
              style={[styles.saveBtn, { opacity: createLoading ? 0.7 : 1 }]}
              onPress={handleCreateProduct}
              disabled={createLoading}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                {createLoading ? "Створюємо..." : "Створити продукт"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  searchResults: {
    paddingHorizontal: 12,
    paddingBottom: 120,
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    flex: 1,
    marginLeft: 4,
  },
  formLabel: {
    color: "#444",
    fontSize: 12,
  },
  modalInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    backgroundColor: "#fff",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: "#2F80ED",
    borderColor: "#2F80ED",
  },
  categoryOptionText: {
    color: "#444",
    fontSize: 12,
  },
  categoryOptionTextSelected: {
    color: "#fff",
    fontSize: 12,
  },
  searchResultCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  searchResultText: {
    fontWeight: "700",
    color: "#111",
  },
  imagePickerBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2F80ED",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerBtnText: {
    color: "#2F80ED",
    fontWeight: "700",
  },
  previewImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#F4F7FF",
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#2F80ED",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
});
