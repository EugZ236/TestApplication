import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import productService from "@/src/services/productService";
import shoppingListService from "@/src/services/shoppingListService";
import shoppingListSignalRService from "@/src/services/shoppingListSignalRService";
import teamService, { TeamMember } from "@/src/services/teamService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";
const DEFAULT_PRODUCT_IMAGE = require("../assets/images/icon.png");

type ShoppingListItem = {
  id: number;
  teamId?: number;
  productId?: number | null;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  note?: string;
  price?: number | null;
  productImage?: string | null;
  isBought?: boolean;
  assignedToUserId?: number | string | null;
  assignedToAvatar?: string | null;
  buyerAvatar?: string | null;
};

export default function ShoppingListPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [team, setTeam] = useState<any | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [participants, setParticipants] = useState<TeamMember[]>([]);
  const [assigneePickerVisible, setAssigneePickerVisible] = useState(false);
  const [assigneePickerItemId, setAssigneePickerItemId] = useState<
    number | null
  >(null);
  const [assigneePickerForForm, setAssigneePickerForForm] = useState(false);
  const [query, setQuery] = useState("");
  const { user: authUser, token } = useAuth();

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

  const normalizeImageUri = (image?: string | null) => {
    if (!image) return null;
    if (image.startsWith("data:") || image.startsWith("http")) {
      return image;
    }
    return `data:image/jpeg;base64,${image}`;
  };

  const extractProductImage = (item: any): string | null => {
    const direct =
      item?.productPhoto ??
      item?.productImage ??
      item?.image ??
      item?.imageUrl ??
      item?.photo ??
      item?.photoUrl ??
      item?.picture ??
      item?.pictureUrl ??
      item?.thumbnail ??
      item?.thumbnailUrl ??
      item?.base64Image;

    const nested =
      item?.product?.photo ??
      item?.product?.image ??
      item?.product?.imageUrl ??
      item?.product?.photoUrl ??
      item?.product?.productPhoto;

    return (direct ?? nested ?? null) as string | null;
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: categories[0],
      quantity: "1",
      unit: units[0],
      assignedToUserId: "",
      price: "",
      note: "",
    });
    setEditingId(null);
  };

  const enrichWithProductImages = React.useCallback(
    async (sourceItems: ShoppingListItem[]) => {
      const idsToLoad = Array.from(
        new Set(
          sourceItems
            .filter((item) => item.productId && !item.productImage)
            .map((item) => Number(item.productId)),
        ),
      );

      if (idsToLoad.length === 0) {
        return sourceItems;
      }

      const productImagePairs = await Promise.all(
        idsToLoad.map(async (id) => {
          try {
            const product = await productService.getProductById(id);
            return [id, product?.imageBase64 ?? null] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );

      const imageMap = new Map<number, string | null>(productImagePairs);

      return sourceItems.map((item) => {
        if (!item.productId || item.productImage) {
          return item;
        }
        return {
          ...item,
          productImage: imageMap.get(Number(item.productId)) ?? null,
        };
      });
    },
    [],
  );

  const loadData = React.useCallback(
    async (teamId: number) => {
      const [remoteItems, remoteParticipants] = await Promise.all([
        shoppingListService.getByTeam(teamId),
        teamService.getParticipants(teamId),
      ]);

      const mappedItems: ShoppingListItem[] = (
        Array.isArray(remoteItems) ? remoteItems : []
      ).map((item: any) => ({
        id: Number(item.id),
        teamId,
        productId: item.productId ?? item.globalProductId ?? null,
        name: item.name ?? item.customName ?? item.productName ?? "Продукт",
        quantity: Number(item.quantity ?? 1),
        unit: item.unit ?? "шт",
        category: item.category ?? "",
        note: item.note ?? "",
        price: item.price ?? item.pricePerUnit ?? null,
        productImage: extractProductImage(item),
        isBought: Boolean(item.isBought),
        assignedToUserId: item.assignedToUserId ?? null,
        assignedToAvatar: item.assignedToAvatar ?? item.buyerAvatar ?? null,
        buyerAvatar: item.buyerAvatar ?? null,
      }));

      const itemsWithImages = await enrichWithProductImages(mappedItems);
      setItems(itemsWithImages);
      setParticipants(
        Array.isArray(remoteParticipants) ? remoteParticipants : [],
      );
    },
    [enrichWithProductImages],
  );

  const buildUpdatePayload = (
    currentItem: ShoppingListItem,
    patch: Partial<ShoppingListItem> = {},
  ) => {
    const merged = { ...currentItem, ...patch };
    return {
      teamId: Number(team?.id),
      productId: merged.productId ?? null,
      name: merged.name ?? "Продукт",
      quantity: Number(merged.quantity ?? 1),
      unit: merged.unit ?? "шт",
      category: merged.category ?? "",
      note: merged.note ?? null,
      isBought: Boolean(merged.isBought),
      assignedToUserId: merged.assignedToUserId ?? null,
    };
  };

  const updateItemOnServer = async (
    itemId: number,
    patch: Partial<ShoppingListItem>,
  ) => {
    const current = items.find((item) => item.id === itemId);
    if (!current || !team?.id) {
      return;
    }

    await shoppingListService.updateItem(
      itemId,
      buildUpdatePayload(current, patch),
    );
    await loadData(Number(team.id));
  };

  const updateAssignee = async (
    itemId: number,
    userId: number | string | null,
  ) => {
    const current = items.find((item) => item.id === itemId);
    if (!current || !team?.id) {
      return;
    }

    try {
      await shoppingListService.updateItem(
        itemId,
        buildUpdatePayload(current, { assignedToUserId: userId }),
      );
      await loadData(Number(team.id));
    } catch (error) {
      console.error("Не вдалося оновити відповідального", error);
      Alert.alert("Помилка", "Не вдалося змінити відповідального");
    }
  };

  const handleEditItem = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name ?? "",
      category: item.category || categories[0],
      quantity: String(item.quantity ?? 1),
      unit: item.unit || units[0],
      assignedToUserId:
        item.assignedToUserId != null ? String(item.assignedToUserId) : "",
      price: "",
      note: item.note ?? "",
    });
    setModalVisible(true);
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
        if (found?.id) {
          try {
            await loadData(Number(found.id));
          } catch (err) {
            console.warn("Не вдалося завантажити список із сервера", err);
            setItems([]);
            setParticipants([]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [loadData]);

  // SignalR real-time updates
  useEffect(() => {
    (async () => {
      if (!team?.id || !token) {
        return;
      }

      try {
        shoppingListSignalRService.onItemAdded((newItem: any) => {
          // SignalR payload can be partial for catalog items; reload authoritative data.
          void loadData(Number(team.id));
        });

        shoppingListSignalRService.onItemUpdated((updatedItem: any) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === Number(updatedItem.id)
                ? {
                    ...item,
                    productId:
                      updatedItem.productId ??
                      updatedItem.globalProductId ??
                      item.productId,
                    name: updatedItem.name ?? item.name,
                    quantity: Number(updatedItem.quantity ?? item.quantity),
                    unit: updatedItem.unit ?? item.unit,
                    category: updatedItem.category ?? item.category,
                    note: updatedItem.note ?? item.note,
                    price:
                      updatedItem.price ??
                      updatedItem.pricePerUnit ??
                      item.price ??
                      null,
                    productImage:
                      extractProductImage(updatedItem) ?? item.productImage,
                    isBought: Boolean(
                      updatedItem.isBought ?? item.isBought ?? false,
                    ),
                    assignedToUserId:
                      updatedItem.assignedToUserId ?? item.assignedToUserId,
                    assignedToAvatar:
                      updatedItem.assignedToAvatar ??
                      updatedItem.buyerAvatar ??
                      item.assignedToAvatar,
                    buyerAvatar: updatedItem.buyerAvatar ?? item.buyerAvatar,
                  }
                : item,
            ),
          );
          void loadData(Number(team.id));
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
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const categories = [
    "Овочі та фрукти",
    "Молочні продукти",
    "Мʼясо",
    "Риба",
    "Напої",
  ];
  const units = ["шт", "кг", "мл"];
  const [Form, setForm] = React.useState({
    name: "",
    category: categories[0],
    quantity: "1",
    unit: units[0],
    assignedToUserId: "",
    price: "",
    note: "",
  });

  function openCatalog() {
    router.push("/add-product");
  }

  function openCreate() {
    resetForm();
    setModalVisible(true);
  }

  async function saveItem() {
    if (!Form.name.trim()) {
      Alert.alert("Помилка", "Вкажіть назву товару");
      return;
    }
    if (!team?.id) {
      Alert.alert("Помилка", "Не вдалося визначити команду");
      return;
    }

    const selectedAssignee =
      Form.assignedToUserId ||
      (authUser?.id != null ? String(authUser.id) : null);
    const payload = {
      teamId: Number(team.id),
      name: Form.name.trim(),
      quantity: Number(Form.quantity) || 1,
      unit: Form.unit,
      category: Form.category,
      note: Form.note?.trim() || null,
      assignedToUserId: selectedAssignee ?? null,
    };

    try {
      if (editingId != null) {
        await shoppingListService.updateItem(editingId, payload);
      } else {
        const createdId = await shoppingListService.createItem(payload);
        if (payload.assignedToUserId != null) {
          await shoppingListService.updateItem(createdId, {
            ...payload,
            isBought: false,
          });
        }
      }

      await loadData(Number(team.id));
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error("Не вдалося зберегти товар", error);
      Alert.alert("Помилка", "Не вдалося зберегти товар");
    }
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

    if (team?.id) {
      await loadData(Number(team.id));
    }
    setModalVisible(false);
  }

  function confirmDelete() {
    Alert.alert("Видалити позицію", "Ви впевнені?", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: () => {
          if (editingId != null) {
            const indexToRemove = items.findIndex((i) => i.id === editingId);
            if (indexToRemove >= 0) {
              void removeItem(indexToRemove);
            }
          }
        },
      },
    ]);
  }

  function incQty() {
    setForm((f) => ({
      ...f,
      quantity: String(Math.max(0, parseFloat(f.quantity || "0") + 0.5)),
    }));
  }
  function decQty() {
    setForm((f) => ({
      ...f,
      quantity: String(Math.max(0, parseFloat(f.quantity || "0") - 0.5)),
    }));
  }

  function setFormField<K extends keyof typeof Form>(
    k: K,
    v: (typeof Form)[K],
  ) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function showBuyerMenu(idx: number) {
    const item = items[idx];
    if (!item) return;

    setAssigneePickerForForm(false);
    setAssigneePickerItemId(item.id);
    setAssigneePickerVisible(true);
  }

  function openAssigneePickerForForm() {
    setAssigneePickerForForm(true);
    setAssigneePickerItemId(null);
    setAssigneePickerVisible(true);
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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 140 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0
          ? renderEmpty()
          : items
              .filter((it) =>
                it.name?.toLowerCase().includes(query.trim().toLowerCase()),
              )
              .map((item, idx) => {
                const hasAssignee =
                  item.assignedToUserId != null &&
                  String(item.assignedToUserId).trim().length > 0;
                const member = participants.find(
                  (m: any) => String(m.id) === String(item.assignedToUserId),
                );
                const isAssignedToMe =
                  hasAssignee &&
                  authUser?.id != null &&
                  String(item.assignedToUserId) === String(authUser.id);
                const buyerName = !hasAssignee
                  ? "Не призначено"
                  : member?.id != null
                    ? getParticipantFullName(member)
                    : isAssignedToMe
                      ? getParticipantFullName(authUser as TeamMember)
                      : "Учасник";
                const assigneeAvatar = normalizeImageUri(
                  member?.avatar ?? item.assignedToAvatar ?? item.buyerAvatar,
                );
                const assigneeInitial = (buyerName || "У")
                  .charAt(0)
                  .toUpperCase();
                const productImageSource = normalizeImageUri(item.productImage);
                return (
                  <TouchableOpacity
                    key={String(item.id ?? idx)}
                    style={styles.productCardNew}
                    onPress={() => handleEditItem(item)}
                    activeOpacity={0.95}
                  >
                    <View style={styles.productTopRow}>
                      <Image
                        source={
                          productImageSource
                            ? { uri: productImageSource }
                            : DEFAULT_PRODUCT_IMAGE
                        }
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <ThemedText
                          style={styles.productTitleNew}
                          numberOfLines={2}
                        >
                          {item.name}
                        </ThemedText>
                        <ThemedText style={styles.productSubNew}>
                          Купити: {buyerName}
                        </ThemedText>
                        {item.note?.trim() ? (
                          <View style={styles.commentRow}>
                            <Text style={styles.commentIcon}>💬</Text>
                            <ThemedText
                              style={styles.productComment}
                              numberOfLines={2}
                            >
                              {item.note}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.rightControls}>
                        <View style={styles.topActionsRow}>
                          <TouchableOpacity
                            style={styles.assigneeCircle}
                            onPress={() => showBuyerMenu(idx)}
                            accessibilityLabel="Відповідальний за покупку"
                            accessibilityRole="button"
                          >
                            {assigneeAvatar ? (
                              <Image
                                source={{ uri: assigneeAvatar }}
                                style={styles.assigneeAvatar}
                              />
                            ) : (
                              <Text style={styles.assigneeInitial}>
                                {assigneeInitial}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.checkboxNew,
                            item.isBought ? styles.checked : null,
                          ]}
                          onPress={() => {
                            void updateItemOnServer(item.id, {
                              isBought: !item.isBought,
                            });
                          }}
                        >
                          {item.isBought ? (
                            <Text style={{ color: "#fff" }}>✓</Text>
                          ) : null}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.productBottomRow}>
                      <View style={styles.qtyRowNew}>
                        <TouchableOpacity
                          style={styles.qtyBtnNew}
                          onPress={() => {
                            const curr = Number(item.quantity || 1);
                            void updateItemOnServer(item.id, {
                              quantity: Math.max(0, curr - 1),
                            });
                          }}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity ?? 1}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtnNew}
                          onPress={() => {
                            const curr = Number(item.quantity || 1);
                            void updateItemOnServer(item.id, {
                              quantity: curr + 1,
                            });
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
                  </TouchableOpacity>
                );
              })}
      </ScrollView>

      <View
        style={[
          styles.bottomRow,
          { paddingBottom: Math.max(20, insets.bottom + 10) },
        ]}
      >
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.catalogBtn} onPress={openCatalog}>
            <ThemedText style={{ color: "#2F80ED", fontWeight: "700" }}>
              Каталог
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.openListBtn} onPress={openCreate}>
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              + Додати свій продукт
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit / create bottom sheet */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.sheet}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <ThemedText type="title">
                  {Form.name || "Нова позиція"}
                </ThemedText>
                <Pressable onPress={confirmDelete} style={styles.trashBtn}>
                  <Text style={{ color: "#FF6B6B", fontSize: 18 }}>🗑️</Text>
                </Pressable>
              </View>

              {/* title input (was missing) */}
              <TextInput
                placeholder="Назва товару"
                value={Form.name}
                onChangeText={(v) => setFormField("name", v)}
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
                    onPress={() => setFormField("category", c)}
                    style={[
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                      },
                      Form.category === c
                        ? { backgroundColor: "#F1F6FF", borderColor: "#2F80ED" }
                        : { backgroundColor: "#fff", borderColor: "#EEF2F7" },
                    ]}
                  >
                    <ThemedText
                      style={
                        Form.category === c
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
                    value={Form.quantity}
                    onChangeText={(v) => setFormField("quantity", v)}
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
                    onPress={openAssigneePickerForForm}
                  >
                    <ThemedText>
                      {Form.assignedToUserId
                        ? authUser?.id != null &&
                          String(Form.assignedToUserId) === String(authUser.id)
                          ? "Я"
                          : getParticipantFullName(
                              participants.find(
                                (p) =>
                                  String(p.id) ===
                                  String(Form.assignedToUserId),
                              ) ?? ({ firstName: "Учасник" } as TeamMember),
                            )
                        : "Не призначено"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={{ width: 12 }} />

                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.formLabel}>
                    ЦІНА (ОРІЄНТ.)
                  </ThemedText>
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
                value={Form.note}
                onChangeText={(v) => setFormField("note", v)}
                multiline
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
                <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                  {editingId == null ? "Додати продукт" : "Зберегти зміни"}
                </ThemedText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={assigneePickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAssigneePickerVisible(false)}
      >
        <Pressable
          style={styles.assigneeModalOverlay}
          onPress={() => setAssigneePickerVisible(false)}
        >
          <Pressable
            style={styles.assigneeModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.assigneeModalHeader}>
              <ThemedText type="title">Хто купить?</ThemedText>
              <TouchableOpacity
                style={styles.assigneeCloseBtn}
                onPress={() => setAssigneePickerVisible(false)}
              >
                <Text style={styles.assigneeCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.assigneeList}
              contentContainerStyle={styles.assigneeListContent}
              keyboardShouldPersistTaps="handled"
            >
              {participants.map((member: TeamMember) => {
                const memberName = getParticipantFullName(member);
                const avatarUri = normalizeImageUri(member.avatar);
                const initial = (memberName || "У").charAt(0).toUpperCase();
                const isSelected = assigneePickerForForm
                  ? String(Form.assignedToUserId || "") ===
                    String(member.id || "")
                  : String(
                      items.find((i) => i.id === assigneePickerItemId)
                        ?.assignedToUserId || "",
                    ) === String(member.id || "");

                return (
                  <TouchableOpacity
                    key={String(member.id)}
                    style={[
                      styles.assigneeOption,
                      isSelected ? styles.assigneeOptionSelected : null,
                    ]}
                    onPress={() => {
                      if (assigneePickerForForm) {
                        setFormField("assignedToUserId", String(member.id));
                      } else if (assigneePickerItemId != null) {
                        void updateAssignee(
                          assigneePickerItemId,
                          member.id ?? null,
                        );
                      }
                      setAssigneePickerVisible(false);
                    }}
                  >
                    <View style={styles.assigneeOptionAvatarWrap}>
                      {avatarUri ? (
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.assigneeOptionAvatar}
                        />
                      ) : (
                        <Text style={styles.assigneeOptionInitial}>
                          {initial}
                        </Text>
                      )}
                    </View>
                    <ThemedText style={styles.assigneeOptionName}>
                      {memberName}
                    </ThemedText>
                    {isSelected ? (
                      <Text style={styles.assigneeOptionCheck}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
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
    alignItems: "flex-start",
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F4F7FF",
  },
  productTitleNew: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  productSubNew: { fontSize: 12, color: "#999" },
  commentRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E8",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  commentIcon: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 1,
  },
  productComment: {
    fontSize: 12,
    color: "#C2410C",
    flex: 1,
  },
  checkboxNew: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
  rightControls: {
    marginLeft: 10,
    alignItems: "center",
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assigneeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  assigneeAvatar: {
    width: "100%",
    height: "100%",
  },
  assigneeInitial: {
    color: "#35528A",
    fontSize: 12,
    fontWeight: "700",
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
  bottomButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  catalogBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2F80ED",
    backgroundColor: "#F4F8FF",
  },
  openListBtn: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  assigneeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  assigneeModalCard: {
    maxHeight: "68%",
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  assigneeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F4F8",
    marginBottom: 8,
  },
  assigneeCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F8FB",
  },
  assigneeCloseBtnText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  assigneeList: {
    flexGrow: 0,
  },
  assigneeListContent: {
    paddingBottom: 4,
  },
  assigneeOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  assigneeOptionSelected: {
    backgroundColor: "#EEF5FF",
  },
  assigneeOptionAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF1FF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  assigneeOptionAvatar: {
    width: "100%",
    height: "100%",
  },
  assigneeOptionInitial: {
    color: "#35528A",
    fontSize: 13,
    fontWeight: "700",
  },
  assigneeOptionName: {
    flex: 1,
    fontSize: 15,
  },
  assigneeOptionCheck: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
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
