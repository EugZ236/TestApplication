import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import api from "@/src/services/api";
import productService from "@/src/services/productService";
import shoppingListService from "@/src/services/shoppingListService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

export default function CategoryProductsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const params = useLocalSearchParams();
  const categoryId = Number(params.id);
  const categoryName = String(params.name ?? "Категорія");

  const [team, setTeam] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productQty, setProductQty] = useState("1");
  const [productUnit, setProductUnit] = useState("шт");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("шт");
  const [newProductImageBase64, setNewProductImageBase64] = useState("");
  const [newProductImageUri, setNewProductImageUri] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

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
      } catch (e) {
        console.error(e);
        setTeamError("Не знайдено команду");
      }
    })();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("api/products");
      const data = Array.isArray(res.data) ? res.data : [];
      const filtered = data.filter((p: any) => {
        if (typeof p.categoryId !== "undefined" && p.categoryId !== null) {
          return Number(p.categoryId) === categoryId;
        }
        if (p.category?.id) {
          return Number(p.category.id) === categoryId;
        }
        return true;
      });
      setProducts(filtered);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити продукти");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryId]);

  const handleCreateProduct = async () => {
    const name = newProductName.trim();
    if (!name) {
      setCreateError("Введіть назву продукту");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    const createdId = await productService.createProduct({
      name,
      defaultUnit: newProductUnit.trim() || "шт",
      categoryId,
      imageBase64: newProductImageBase64.trim() || undefined,
    });

    setCreateLoading(false);

    if (createdId != null) {
      setCreateSuccess("Продукт успішно створено");
      setShowCreateModal(false);
      setNewProductName("");
      setNewProductUnit("шт");
      setNewProductImageBase64("");
      setNewProductImageUri(null);
      loadProducts();
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

  const addProductToShopping = async (
    product: any,
    qty: number,
    unit: string,
  ) => {
    if (!team?.id) {
      setError("Не знайдено команду");
      return;
    }

    try {
      const payload = {
        teamId: Number(team.id),
        productId: product.id ?? null,
        name:
          (product.name || product.title || product.productName || "").trim() ||
          "Продукт",
        quantity: qty,
        unit,
        category: categoryName,
        note: "",
      };
      const createdId = await shoppingListService.createItem(payload);
      if (createdId != null && authUser?.id != null) {
        await shoppingListService.updateItem(createdId, {
          assignedToUserId: authUser.id,
        });
      }
      setError(null);
      setSelectedProduct(null);
      router.push("/shopping-list");
    } catch (e) {
      console.error("add product to shopping list", e);
      setError("Не вдалося додати продукт до списку");
    } finally {
      // no-op
    }
  };

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setProductQty("1");
    setProductUnit(product.defaultUnit || "шт");
  };

  const filtered = products.filter((p) => {
    const text = (p.name || p.title || p.productName || "").toLowerCase();
    return text.includes(q.toLowerCase());
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            {categoryName}
          </ThemedText>
          <ThemedText style={{ color: "#666", marginTop: 4 }}>
            {team?.name ?? "Команда"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Пошук продуктів..."
          value={q}
          onChangeText={setQ}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ThemedText>Завантаження...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.loadingRow}>
          <ThemedText style={{ color: "#d00" }}>{error}</ThemedText>
        </View>
      ) : teamError ? (
        <View style={styles.loadingRow}>
          <ThemedText style={{ color: "#d00" }}>{teamError}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) =>
            String(item.id ?? item.productId ?? Math.random())
          }
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const name =
              item.name ?? item.title ?? item.productName ?? "Продукт";
            const imageBase64 =
              typeof item.imageBase64 === "string" && item.imageBase64.trim()
                ? item.imageBase64.trim()
                : undefined;
            const imageUri = imageBase64
              ? imageBase64.startsWith("data:")
                ? imageBase64
                : `data:image/png;base64,${imageBase64}`
              : undefined;

            return (
              <TouchableOpacity
                style={styles.productTile}
                onPress={() => openProduct(item)}
              >
                <View style={styles.tileImageWrap}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.tileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.tileImage} />
                  )}
                </View>
                <ThemedText style={styles.tileName} numberOfLines={2}>
                  {name}
                </ThemedText>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ padding: 16 }}>
              <ThemedText style={{ color: "#999" }}>
                Продукти не знайдені
              </ThemedText>
            </View>
          )}
        />
      )}

      <View style={styles.bottom}>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={{ fontSize: 18 }}>←</Text>
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>
                Новий продукт
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

      {selectedProduct ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Text style={{ fontSize: 18 }}>←</Text>
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>
                {selectedProduct.name ?? selectedProduct.title ?? "Продукт"}
              </ThemedText>
            </View>
            <ThemedText style={{ marginTop: 8, color: "#444" }}>
              Категорія: {categoryName}
            </ThemedText>
            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.formLabel}>Кількість</ThemedText>
              <TextInput
                style={styles.qtyInput}
                value={productQty}
                keyboardType="numeric"
                onChangeText={setProductQty}
              />
            </View>
            <View style={{ marginTop: 8 }}>
              <ThemedText style={styles.formLabel}>Одиниця</ThemedText>
              <TextInput
                style={styles.qtyInput}
                value={productUnit}
                onChangeText={setProductUnit}
              />
            </View>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                const qty = Number(productQty) || 1;
                addProductToShopping(selectedProduct, qty, productUnit || "шт");
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                Додати до кошику
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
    height: 90,
    paddingTop: Platform.OS === "ios" ? 36 : 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
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
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  loadingRow: { padding: 16 },
  modalBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderColor: "#EEF2F7",
    borderWidth: 1,
  },
  modalHeader: { flexDirection: "row", alignItems: "center" },
  modalTitle: { flex: 1, marginLeft: 4 },
  formLabel: { color: "#444", fontSize: 12 },
  qtyInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
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
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  productTile: {
    flex: 1,
    minWidth: 150,
    maxWidth: "48%",
    backgroundColor: "#F9FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 10,
    margin: 2,
    alignItems: "center",
  },
  tileImageWrap: {
    width: 95,
    height: 95,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EEFF",
    marginBottom: 8,
    overflow: "hidden",
  },
  tileImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: "#E6F0FF",
  },
  tileName: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
    color: "#111",
  },
  productCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#F4F7FF",
    marginRight: 12,
  },
  productTitle: { fontWeight: "700", marginBottom: 4 },
  productSub: { color: "#888", fontSize: 12 },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderColor: "#EEF2F7",
    backgroundColor: "#fff",
    padding: 14,
  },
  addBtn: {
    backgroundColor: "#2F80ED",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },  imagePickerBtn: {
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
  },  saveBtn: {
    marginTop: 12,
    backgroundColor: "#2F80ED",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});
