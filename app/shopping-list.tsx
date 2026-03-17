import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import productService from "@/src/services/productService";
import shoppingListService from "@/src/services/shoppingListService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

export default function ShoppingListPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]); // initially empty per spec
  const [query, setQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [loadingSearchSuggestions, setLoadingSearchSuggestions] =
    useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user: authUser } = useAuth();

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

        // Attempt to load persisted shopping list for the team (key: shopping_<teamId>)
        // If nothing stored — keep `items` empty (requirement)
        if (found?.id) {
          try {
            const remote = await shoppingListService.getByTeam(
              Number(found.id),
            );
            const mapped = (Array.isArray(remote) ? remote : []).map(
              (item: any) => ({
                id: item.id,
                title: item.name ?? "Продукт",
                section: item.category ?? "",
                qty: item.quantity ?? 1,
                unit: item.unit ?? "шт",
                note: item.note ?? "",
              }),
            );
            setItems(mapped);
          } catch (err) {
            console.warn("Не вдалося завантажити список із сервера", err);
            const shoppingRaw = await AsyncStorage.getItem(
              `shopping_${found.id}`,
            );
            if (shoppingRaw) {
              try {
                const parsed = JSON.parse(shoppingRaw);
                setItems(Array.isArray(parsed) ? parsed : []);
              } catch {
                setItems([]);
              }
            } else {
              setItems([]);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (q.length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      setLoadingSearchSuggestions(false);
      return;
    }
    setLoadingSearchSuggestions(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const list = await productService.searchGlobalProducts(q);
        setSearchSuggestions(list);
        setShowSearchSuggestions(list.length > 0);
      } catch (e) {
        console.error("search products:", e);
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
      } finally {
        setLoadingSearchSuggestions(false);
      }
    }, 180);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [query]);

  // --- modal + form state & persistence handlers
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const categories = [
    "Овочі та фрукти",
    "Молочні продукти",
    "Мʼясо",
    "Риба",
    "Напої",
  ];
  const units = ["шт", "кг", "мл"];
  const [Form, setForm] = React.useState({
    title: "",
    section: categories[0],
    qty: "1",
    unit: units[0],
    buyerId: "",
    price: "",
    comment: "",
  });

  const persistItems = async (nextItems: any[]) => {
    try {
      const key = team?.id ? `shopping_${team.id}` : "shopping_default";
      await AsyncStorage.setItem(key, JSON.stringify(nextItems));
    } catch (e) {
      console.error("persistItems:", e);
    }
  };

  function openCreate() {
    router.push("/add-product");
  }

  function openEdit(idx: number) {
    const it = items[idx];
    if (!it) return;
    setEditingIndex(idx);
    setForm({
      title: it.title ?? "",
      section: it.section ?? categories[0],
      qty: String(it.qty ?? "1"),
      unit: it.unit ?? units[0],
      buyerId: it.buyerId ?? "",
      price: it.price ? String(it.price) : "",
      comment: it.comment ?? "",
    });
    setModalVisible(true);
  }

  async function saveItem() {
    if (!Form.title.trim()) {
      Alert.alert("Помилка", "Вкажіть назву товару");
      return;
    }
    const next = [...items];
    const payload = {
      id: editingIndex != null ? next[editingIndex].id : Date.now(),
      title: Form.title.trim(),
      section: Form.section,
      qty: parseFloat(Form.qty) || 0,
      unit: Form.unit,
      buyerId: Form.buyerId || null,
      price: Form.price ? parseFloat(Form.price) : null,
      comment: Form.comment || "",
    };

    // attach buyer avatar when possible
    const buyerAvatar =
      Form.buyerId === "me"
        ? (authUser?.avatar ?? null)
        : ((team?.members || []).find((m: any) => m.id === Form.buyerId)
            ?.avatar ?? null);
    const payloadWithAvatar = { ...payload, buyerAvatar };

    if (editingIndex != null)
      next[editingIndex] = { ...next[editingIndex], ...payloadWithAvatar };
    else next.unshift(payloadWithAvatar);

    setItems(next);
    await persistItems(next);
    setModalVisible(false);
  }

  function confirmDelete() {
    Alert.alert("Видалити позицію", "Ви впевнені?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: deleteItem },
    ]);
  }

  async function deleteItem() {
    if (editingIndex == null) return;
    const next = items.filter((_, i) => i !== editingIndex);
    setItems(next);
    await persistItems(next);
    setModalVisible(false);
  }

  function incQty() {
    setForm((f) => ({
      ...f,
      qty: String(Math.max(0, parseFloat(f.qty || "0") + 0.5)),
    }));
  }
  function decQty() {
    setForm((f) => ({
      ...f,
      qty: String(Math.max(0, parseFloat(f.qty || "0") - 0.5)),
    }));
  }

  function setFormField<K extends keyof typeof Form>(
    k: K,
    v: (typeof Form)[K],
  ) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyWrap}>
        <ThemedText style={{ color: "#999" }}>
          Поки що нічого не додано
        </ThemedText>
        <ThemedText style={{ color: "#999", marginTop: 8 }}>
          Натисніть +, щоб створити перший елемент
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          accessibilityLabel="Назад"
          accessibilityRole="button"
        >
          <ThemedText style={{ fontSize: 20 }}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Список покупок
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.metaRow}>
        <ThemedText style={styles.metaText}>
          {team?.name ?? "Команда"}
        </ThemedText>
        <ThemedText style={styles.metaText}>
          {" "}
          • {items.length} товарів
        </ThemedText>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Знайти у списку..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {loadingSearchSuggestions ? (
          <ThemedText style={{ color: "#888", marginTop: 6, marginLeft: 4 }}>
            Завантаження...
          </ThemedText>
        ) : null}
        {showSearchSuggestions && searchSuggestions.length > 0 ? (
          <View style={styles.autocompleteBox}>
            {searchSuggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.autocompleteItem}
                onPress={() => {
                  setQuery(s);
                  setShowSearchSuggestions(false);
                }}
              >
                <ThemedText>{s}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.gridWrap}>
        {items.length === 0
          ? renderEmpty()
          : items
              .filter((it) =>
                it.title?.toLowerCase().includes(query.trim().toLowerCase()),
              )
              .map((item, idx) => (
                <TouchableOpacity
                  key={String(item.id ?? idx)}
                  style={styles.productCard}
                  onPress={() => openEdit(idx)}
                >
                  <View style={styles.productPreview} />
                  <ThemedText style={styles.productTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.productMeta}>
                    {item.qty ? `${item.qty} ${item.unit ?? "шт"}` : ""}
                  </ThemedText>
                </TouchableOpacity>
              ))}
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.openListBtn} onPress={openCreate}>
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            Add my product
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Edit / create bottom sheet */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText type="title">
                {Form.title || "Нова позиція"}
              </ThemedText>
              <Pressable onPress={confirmDelete} style={styles.trashBtn}>
                <Text style={{ color: "#FF6B6B", fontSize: 18 }}>🗑️</Text>
              </Pressable>
            </View>

            {/* title input (was missing) */}
            <TextInput
              placeholder="Назва товару"
              value={Form.title}
              onChangeText={(v) => setFormField("title", v)}
              style={styles.titleInput}
              autoFocus={true}
              returnKeyType="next"
            />

            {/* categories toggle */}
            <View
              style={{
                marginTop: 12,
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setFormField("section", c)}
                  style={[
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                    },
                    Form.section === c
                      ? { backgroundColor: "#F1F6FF", borderColor: "#2F80ED" }
                      : { backgroundColor: "#fff", borderColor: "#EEF2F7" },
                  ]}
                >
                  <ThemedText
                    style={
                      Form.section === c
                        ? { color: "#2F80ED", fontWeight: "700" }
                        : { color: "#666" }
                    }
                  >
                    {c}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.formLabel}>КІЛЬКІСТЬ</ThemedText>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={decQty}>
                  <ThemedText>-</ThemedText>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={Form.qty}
                  onChangeText={(v) => setFormField("qty", v)}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.qtyBtn} onPress={incQty}>
                  <ThemedText>+</ThemedText>
                </TouchableOpacity>

                {/* unit toggle */}
                <View style={{ flexDirection: "row", marginLeft: 8, gap: 8 }}>
                  {units.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setFormField("unit", u)}
                      style={[
                        {
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 10,
                        },
                        Form.unit === u
                          ? {
                              backgroundColor: "#F1F6FF",
                              borderWidth: 1,
                              borderColor: "#E6F0FF",
                            }
                          : { backgroundColor: "#F6F8FB" },
                      ]}
                    >
                      <ThemedText
                        style={
                          Form.unit === u
                            ? { color: "#2F80ED", fontWeight: "700" }
                            : { color: "#666" }
                        }
                      >
                        {u}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formRowTwo}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.formLabel}>ХТО КУПИТЬ</ThemedText>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => {
                    // show simple chooser using Alert with team members
                    const options = (team?.members || []).map((m: any) => ({
                      text: `${m.firstName ?? ""} ${m.lastName ?? ""}`,
                      onPress: () => setFormField("buyerId", m.id),
                    }));
                    options.unshift({
                      text: `Я (${team?.ownerName ?? "Ви"})`,
                      onPress: () => setFormField("buyerId", "me"),
                    });
                    options.push({
                      text: "Скасувати",
                      style: "cancel" as const,
                    });
                    // @ts-ignore - Alert.alert overload accepts third param
                    Alert.alert("Хто купить?", undefined, options);
                  }}
                >
                  <ThemedText>
                    {Form.buyerId ? String(Form.buyerId) : `Я`}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <ThemedText style={styles.formLabel}>ЦІНА (ОРІЄНТ.)</ThemedText>
                <TextInput
                  style={styles.selectInput}
                  value={Form.price}
                  onChangeText={(v) => setFormField("price", v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <ThemedText style={[styles.formLabel, { marginTop: 12 }]}>
              КОМЕНТАР
            </ThemedText>
            <TextInput
              style={styles.commentInput}
              placeholder="Напр: Тільки свіжу, не миту..."
              value={Form.comment}
              onChangeText={(v) => setFormField("comment", v)}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                {editingIndex == null ? "Додати продукт" : "Зберегти зміни"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 36 : 18,
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
  headerRight: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 36 : 18,
    width: 56,
    height: 56,
  },
  title: { textAlign: "center" },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 6,
    alignItems: "center",
  },
  metaText: { color: "#666" },
  content: { flex: 1, paddingHorizontal: 20 },
  searchWrap: { paddingHorizontal: 20, marginTop: 18 },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  gridWrap: {
    marginTop: 14,
    paddingHorizontal: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 10,
    marginBottom: 10,
  },
  productPreview: {
    width: "100%",
    height: 70,
    borderRadius: 10,
    backgroundColor: "#F4F7FF",
    marginBottom: 8,
  },
  productTitle: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  productMeta: { color: "#666", fontSize: 12 },
  bottomRow: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#EDF2FF",
    backgroundColor: "#fff",
  },
  openListBtn: {
    backgroundColor: "#2F80ED",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  autocompleteBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E6EDF6",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  autocompleteItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomColor: "#F1F4F8",
    borderBottomWidth: 1,
  },
  sectionTitle: {
    marginTop: 20,
    color: "#999",
    fontSize: 12,
    marginBottom: 12,
  },
  emptyWrap: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F1F4F8",
    alignItems: "flex-start",
  },
  itemCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F4F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  itemRightPlaceholder: { width: 40 },
  memberImage: { width: 48, height: 48, borderRadius: 24 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E6EDF6",
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2F80ED",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  /* sheet */
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    backgroundColor: "#F1F4F8",
    borderRadius: 6,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF6F6",
  },
  formRow: { marginTop: 18 },
  formLabel: { color: "#999", fontSize: 12, marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F6F8FB",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyInput: {
    width: 72,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    textAlign: "center",
    marginHorizontal: 6,
    backgroundColor: "#fff",
  },
  unitSelect: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F6F8FB",
  },
  formRowTwo: { flexDirection: "row", marginTop: 12 },
  selectInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  titleInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    marginTop: 12,
  },
  commentInput: {
    marginTop: 8,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 12,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: "#2F80ED",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
