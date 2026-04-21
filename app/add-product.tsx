import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/src/services/api";
import productService from "@/src/services/productService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { showToast } from "@/utils/toast";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameUA, setNameUA] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const openModal = () => {
    setName("");
    setNameUA("");
    setDefaultUnit("");
    setSelectedCategoryId(categories.length > 0 ? categories[0].id : null);
    setImageBase64(null);
    setPreviewUri(null);
    setIsModalOpen(true);
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        showToast.error("Потрібен доступ до медіа бібліотеки");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.8,
      });

      const anyRes = result as any;
      if (anyRes.cancelled === true || anyRes.canceled === true) return;

      const base64 = anyRes.base64 ?? (anyRes.assets && anyRes.assets[0]?.base64) ?? null;
      const uri = anyRes.uri ?? (anyRes.assets && anyRes.assets[0]?.uri) ?? null;

      if (base64) {
        setImageBase64(base64);
        setPreviewUri(uri ? (uri.startsWith("data:") ? uri : `data:image/jpeg;base64,${base64}`) : `data:image/jpeg;base64,${base64}`);
      } else if (uri) {
        setPreviewUri(uri);
        showToast.info("Зображення вибране. Воно буде відправлене як URI, якщо сервер дозволяє.");
      }
    } catch (e) {
      console.error("pickImage", e);
      showToast.error("Не вдалось вибрати зображення");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return showToast.error("Введіть назву англійською");
    if (!nameUA.trim()) return showToast.error("Введіть назву українською");
    if (!defaultUnit) return showToast.error("Оберіть одиницю виміру");
    if (!imageBase64) return showToast.error("Додайте зображення продукту");
    if (!selectedCategoryId) return showToast.error("Оберіть категорію");

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        nameUA: nameUA.trim(),
        defaultUnit,
        categoryId: selectedCategoryId,
        imageBase64,
      } as any;

      const id = await productService.createProduct(payload);
      showToast.success("Продукт створено");
      setIsModalOpen(false);
      router.push(`/category/${selectedCategoryId}?name=${encodeURIComponent(categories.find(c=>c.id===selectedCategoryId)?.name ?? "")}`);
    } catch (e) {
      console.error("create product", e);
      showToast.error("Помилка", "Не вдалося створити продукт");
    } finally {
      setSubmitting(false);
    }
  };

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
          onPress={openModal}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            + Додати свій продукт
          </ThemedText>
        </TouchableOpacity>
      </View>
      {isModalOpen && (
        <View style={styles.modalWrapper}>
          <View style={styles.modalCard}>
            <ScrollView>
              <ThemedText type="title">Додати свій продукт</ThemedText>

              <ThemedText style={{ marginTop: 10 }}>Назва (англійською)</ThemedText>
              <TextInput value={name} onChangeText={setName} style={styles.titleInput} placeholder="e.g. Milk" />

              <ThemedText style={{ marginTop: 10 }}>Назва (українською)</ThemedText>
              <TextInput value={nameUA} onChangeText={setNameUA} style={styles.titleInput} placeholder="наприклад: Молоко" />

              <ThemedText style={{ marginTop: 10 }}>Одиниця виміру</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {['g','kg','l','ml'].map(u => (
                  <TouchableOpacity key={u} onPress={() => setDefaultUnit(u)} style={[styles.unitBtn, defaultUnit===u && styles.unitBtnActive]}>
                    <Text style={{ fontWeight: defaultUnit===u ? '700' : '500' }}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={{ marginTop: 12 }}>Категорія</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {categories.map(c => (
                  <TouchableOpacity key={c.id} onPress={() => setSelectedCategoryId(c.id)} style={[styles.categoryCard, selectedCategoryId===c.id && { borderColor: '#2F80ED' }]}>
                    {c.imageBase64 ? (
                      <Image source={{ uri: c.imageBase64.startsWith('data:') ? c.imageBase64 : `data:image/png;base64,${c.imageBase64}` }} style={{ width:40, height:40, borderRadius:8 }} />
                    ) : (
                      <View style={{ width:40, height:40, borderRadius:8, backgroundColor:'#F4F7FF' }} />
                    )}
                    <Text style={{ marginTop:6 }}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ThemedText style={{ marginTop: 12 }}>Зображення</ThemedText>
              <TouchableOpacity onPress={pickImage} style={{ marginTop: 8, alignItems: 'center' }}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={{ width: 140, height: 140, borderRadius: 10 }} />
                ) : (
                  <View style={{ width: 140, height: 140, borderRadius: 10, backgroundColor: '#F4F7FF', justifyContent:'center', alignItems:'center' }}>
                    <Text>Вибрати фото</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Зберегти</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={[styles.saveBtn, { backgroundColor: '#ccc' }]}> 
                <ThemedText style={{ color: '#000', fontWeight: '700' }}>Скасувати</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
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
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  unitBtnActive: {
    backgroundColor: '#E8F0FF',
    borderColor: '#2F80ED'
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
