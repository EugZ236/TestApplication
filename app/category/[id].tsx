import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/src/services/api";
import shoppingListService from "@/src/services/shoppingListService";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  useEffect(() => {
    (async () => {
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
    })();
  }, [categoryId]);

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
      await shoppingListService.createItem(payload);
      // Create endpoint already assigns current user on backend.
      // Avoid partial PUT here because it can null-out other item fields.
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
          onPress={() => router.push("/shopping-list")}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            + Додати свій продукт
          </ThemedText>
        </TouchableOpacity>
      </View>

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
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#2F80ED",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});
