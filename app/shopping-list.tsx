import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import shoppingListService from "@/src/services/shoppingListService";
import shoppingListSignalRService from "@/src/services/shoppingListSignalRService";
import teamService, { TeamMember } from "@/src/services/teamService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  const [participants, setParticipants] = useState<TeamMember[]>([]);
  const [query, setQuery] = useState("");
  const { user: authUser, token } = useAuth();

  const teamMembers = Array.isArray(team?.members) ? team.members : [];
  const totalCount =
    team?.memberCount ?? Math.max(teamMembers.length, authUser ? 1 : 0);
  const defaultMember = authUser
    ? {
        id: authUser.id ?? "me",
        firstName: authUser.firstName ?? "Ви",
        lastName: authUser.lastName ?? "",
        role: "owner",
      }
    : null;
  const baseMembers =
    teamMembers.length > 0 ? teamMembers : defaultMember ? [defaultMember] : [];
  const missing = Math.max(0, totalCount - baseMembers.length);
  const placeholders = Array.from({ length: missing }, (_, i) => ({
    id: `unknown-${i + 1}`,
    firstName: `Учасник ${baseMembers.length + i + 1}`,
    lastName: "",
    role: "member",
  }));
  const visibleParticipants = [
    ...participants,
    ...baseMembers,
    ...placeholders,
  ];

  const getParticipantFullName = (member: TeamMember) => {
    const parts = [
      member.firstName,
      member.lastName,
      member.fullName,
      member.displayName,
      member.name,
      member.userName,
      member.email,
    ]
      .filter(Boolean)
      .map((part) => String(part).trim())
      .filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" ");
    }

    return "Учасник";
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

        // Attempt to load persisted shopping list for the team (key: shopping_<teamId>)
        // If nothing stored — keep `items` empty (requirement)
        if (found?.id) {
          try {
            const [remote, remoteParticipants] = await Promise.all([
              shoppingListService.getByTeam(Number(found.id)),
              teamService.getParticipants(found.id),
            ]);

            const mapped = (Array.isArray(remote) ? remote : []).map(
              (item: any) => ({
                id: item.id,
                title: item.name ?? "Продукт",
                section: item.category ?? "",
                qty: item.quantity ?? 1,
                unit: item.unit ?? "шт",
                note: item.note ?? "",
                buyerId: item.assignedToUserId ?? null,
              }),
            );
            setItems(mapped);
            setParticipants(
              Array.isArray(remoteParticipants) ? remoteParticipants : [],
            );
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

  // SignalR real-time updates
  useEffect(() => {
    (async () => {
      if (!team?.id || !token) {
        return;
      }

      try {
        shoppingListSignalRService.onItemAdded((newItem) => {
          setItems((prev) => {
            const exists = prev.some((i) => i.id === newItem.id);
            if (exists) return prev;
            return [...prev, newItem];
          });
        });

        shoppingListSignalRService.onItemUpdated((updatedItem) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === updatedItem.id ? updatedItem : item,
            ),
          );
        });

        shoppingListSignalRService.onItemRemoved((itemId) => {
          setItems((prev) => prev.filter((item) => item.id !== itemId));
        });

        await shoppingListSignalRService.connect(token, Number(team.id));
      } catch (error) {
        console.error("Failed to connect SignalR:", error);
      }
    })();

    return () => {
      shoppingListSignalRService.disconnect();
    };
  }, [team?.id, token]);

  // --- modal + form state & persistence handlers
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingIndex] = React.useState<number | null>(null);
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

  async function saveItem() {
    if (!Form.title.trim()) {
      Alert.alert("Помилка", "Вкажіть назву товару");
      return;
    }
    const next = [...items];
    const buyerId = Form.buyerId || (authUser?.id ?? "me");
    const localPayload = {
      id: editingIndex != null ? next[editingIndex].id : Date.now().toString(),
      title: Form.title.trim(),
      section: Form.section,
      qty: parseFloat(Form.qty) || 0,
      unit: Form.unit,
      buyerId,
      price: Form.price ? parseFloat(Form.price) : null,
      comment: Form.comment || "",
    };

    // attach buyer avatar when possible
    const buyerAvatar =
      Form.buyerId === "me"
        ? (authUser?.avatar ?? null)
        : (participants.find((m: any) => String(m.id) === String(Form.buyerId))
            ?.avatar ?? null);
    const payloadWithAvatar = { ...localPayload, buyerAvatar };

    if (editingIndex != null)
      next[editingIndex] = { ...next[editingIndex], ...payloadWithAvatar };
    else next.unshift(payloadWithAvatar);

    setItems(next);
    await persistItems(next);
    setModalVisible(false);
  }

  async function removeItem(idx: number) {
    const item = items[idx];
    if (!item) return;

    if (typeof item.id === "number") {
      try {
        await shoppingListService.deleteItem(item.id);
      } catch (error) {
        console.error("Не вдалося видалити товар з сервера", error);
        Alert.alert(
          "Помилка",
          "Не вдалося видалити товар з сервера. Спробуйте ще раз.",
        );
        return;
      }
    }

    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    await persistItems(next);
    setModalVisible(false);
  }

  function confirmDelete() {
    Alert.alert("Видалити позицію", "Ви впевнені?", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: () => {
          if (editingIndex != null) void removeItem(editingIndex);
        },
      },
    ]);
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

  function showBuyerMenu(idx: number) {
    const options = visibleParticipants.map((m: any) => ({
      text: getParticipantFullName(m),
      onPress: () => {
        const next = [...items];
        next[idx] = { ...next[idx], buyerId: m.id };
        setItems(next);
        persistItems(next);
      },
    }));
    options.unshift({
      text: "Я",
      onPress: () => {
        const next = [...items];
        next[idx] = { ...next[idx], buyerId: "me" };
        setItems(next);
        persistItems(next);
      },
    });
    options.push({
      text: "Скасувати",
      onPress: () => {},
    });
    Alert.alert("Хто купить?", undefined, options);
  }

  function showItemMenu(item: any, idx: number) {
    Alert.alert("Опції товару", undefined, [
      {
        text: "Видалити зі списку",
        style: "destructive",
        onPress: () => {
          void removeItem(idx);
        },
      },
      {
        text: item.checked ? "Позначити як некуплене" : "Позначити як куплене",
        onPress: () => {
          const next = [...items];
          next[idx] = { ...next[idx], checked: !next[idx]?.checked };
          setItems(next);
          persistItems(next);
        },
      },
      {
        text: "Позначити як куплено:",
        onPress: () => {
          const next = [...items];
          next[idx] = { ...next[idx], checked: true };
          setItems(next);
          persistItems(next);
        },
      },
      {
        text: "Змінити хто купить",
        onPress: () => showBuyerMenu(idx),
      },
      { text: "Скасувати", style: "cancel" as const },
    ]);
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
        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText type="title" style={styles.title}>
            Team: {team?.name ?? "Family"}
          </ThemedText>
        </View>
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
      </View>

      <ScrollView
        style={styles.listWrap}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0
          ? renderEmpty()
          : items
              .filter((it) =>
                it.title?.toLowerCase().includes(query.trim().toLowerCase()),
              )
              .map((item, idx) => {
                const member = visibleParticipants.find(
                  (m: any) => String(m.id) === String(item.buyerId),
                );
                const buyerName =
                  item.buyerId === "me" ||
                  String(item.buyerId) === String(authUser?.id)
                    ? getParticipantFullName(authUser ?? { firstName: "Я" })
                    : member
                      ? getParticipantFullName(member)
                      : "Учасник";
                return (
                  <View
                    key={String(item.id ?? idx)}
                    style={styles.productCardNew}
                  >
                    <View style={styles.productTopRow}>
                      <View style={styles.productImage} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <ThemedText
                          style={styles.productTitleNew}
                          numberOfLines={2}
                        >
                          {item.title}
                        </ThemedText>
                        <ThemedText style={styles.productSubNew}>
                          Купити: {buyerName}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.badgeBtn}
                        onPress={() => showItemMenu(item, idx)}
                        accessibilityLabel="Меню товару"
                        accessibilityRole="button"
                      >
                        <Text style={styles.badgeText}>⋮</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.checkboxNew,
                          item.checked ? styles.checked : null,
                        ]}
                        onPress={() => {
                          const next = [...items];
                          next[idx] = {
                            ...next[idx],
                            checked: !next[idx]?.checked,
                          };
                          setItems(next);
                          persistItems(next);
                        }}
                      >
                        {item.checked ? (
                          <Text style={{ color: "#fff" }}>✓</Text>
                        ) : null}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.productBottomRow}>
                      <View style={styles.qtyRowNew}>
                        <TouchableOpacity
                          style={styles.qtyBtnNew}
                          onPress={() => {
                            const next = [...items];
                            const curr = Number(item.qty || 1);
                            next[idx] = {
                              ...next[idx],
                              qty: Math.max(0, curr - 1),
                            };
                            setItems(next);
                            persistItems(next);
                          }}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty ?? 1}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtnNew}
                          onPress={() => {
                            const next = [...items];
                            const curr = Number(item.qty || 1);
                            next[idx] = {
                              ...next[idx],
                              qty: curr + 1,
                            };
                            setItems(next);
                            persistItems(next);
                          }}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                        <Text style={styles.unitText}>{item.unit ?? "шт"}</Text>
                      </View>
                      {item.price != null ? (
                        <ThemedText style={styles.priceText}>
                          {Number(item.price).toFixed(2)} грн
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                );
              })}
      </ScrollView>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.openListBtn} onPress={openCreate}>
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            + Додати продукт
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
                    const options = visibleParticipants.map((m: any) => ({
                      text: getParticipantFullName(m),
                      onPress: () => setFormField("buyerId", m.id),
                    }));
                    options.unshift({
                      text: `Я (${team?.ownerName ?? "Ви"})`,
                      onPress: () => setFormField("buyerId", "me"),
                    });
                    options.push({
                      text: "Скасувати",
                      onPress: () => {},
                    });
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
  listWrap: {
    marginTop: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  listContent: {
    paddingBottom: 140,
  },
  productCardNew: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  productTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F4F7FF",
  },
  productTitleNew: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  productSubNew: { fontSize: 12, color: "#999" },
  checkboxNew: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#2F80ED",
    borderColor: "#2F80ED",
  },
  productBottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qtyRowNew: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtnNew: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E7F0",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontWeight: "700",
  },
  unitText: {
    marginLeft: 6,
    color: "#666",
    fontSize: 12,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  badgeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F6F8FB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "700",
    lineHeight: 20,
  },
  priceText: {
    fontWeight: "700",
    color: "#111",
    fontSize: 13,
  },
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
