import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

export default function TeamPage() {
  const router = useRouter();
  const auth = useAuth();
  const [team, setTeam] = useState<any | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [quickText, setQuickText] = useState("");
  const [shoppingItems, setShoppingItems] = useState<any[]>([]); // initially empty per requirement
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(VIEW_TEAM_KEY);
        const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find((t: any) => t.id === id) || null;
        setQrLink(
          found
            ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${found.id}`
            : null,
        );
        setTeam(found);

        // Load budget from the same key that BudgetPage uses. If absent -> 0
        try {
          const budgetRaw = await AsyncStorage.getItem("budget_v1");
          if (budgetRaw) {
            const parsed = JSON.parse(budgetRaw) as { amount?: number } | null;
            setBudgetAmount(
              parsed && typeof parsed.amount === "number" ? parsed.amount : 0,
            );
          } else {
            setBudgetAmount(0);
          }
        } catch (e) {
          console.error("load budget:", e);
          setBudgetAmount(0);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // reload shopping items whenever screen is focused (keeps small preview in sync)
  const loadShopping = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem(VIEW_TEAM_KEY);
      const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const found = list.find((t: any) => t.id === id) || null;
      if (!found?.id) return;
      const shoppingRaw = await AsyncStorage.getItem(`shopping_${found.id}`);
      if (shoppingRaw) {
        const parsed = JSON.parse(shoppingRaw);
        setShoppingItems(Array.isArray(parsed) ? parsed : []);
      } else setShoppingItems([]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadShopping();
    }, [loadShopping]),
  );

  const createdLabel = (() => {
    const d = team?.joinedAt ? new Date(team.joinedAt) : new Date();
    return `Створено: ${d.toLocaleString("uk", { month: "short" })} ${d.getFullYear()}`;
  })();

  const shoppingCount = shoppingItems.length;
  const spent = 0; // no spent tracking on team page yet
  const limit = budgetAmount; // treat stored budget as the limit/remaining source
  const budgetPct = limit > 0 ? Math.min(1, spent / limit) : 0;

  return (
    <ThemedView style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Назад"
          >
            <ThemedText style={{ fontSize: 18 }}>←</ThemedText>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.settings}
              onPress={() => setSidebarOpen(true)}
              accessibilityLabel="Відкрити налаштування"
              accessibilityRole="button"
            >
              <ThemedText style={{ fontSize: 18 }}>⚙️</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Team avatar + title */}
        <View style={styles.teamHeader}>
          <View
            style={[
              styles.teamAvatar,
              { backgroundColor: team?.color ?? "#F3F6FF" },
            ]}
          >
            <ThemedText style={styles.teamAvatarEmoji}>🏠</ThemedText>
          </View>

          <View style={styles.teamInfo}>
            <ThemedText type="title" style={styles.teamName}>
              {team?.name ?? "Команда"}
            </ThemedText>
            <ThemedText style={styles.created}>{createdLabel}</ThemedText>
          </View>
        </View>

        {/* Members row removed per request */}

        {/* Quick add input */}
        <View style={styles.section}>
          <View style={styles.quickAddRow}>
            <TextInput
              placeholder="Що треба купити? (напp. Молоко)"
              style={styles.quickInput}
              value={quickText}
              onChangeText={setQuickText}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => {
                setQuickText("");
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                +
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View style={styles.iconBox}>
                  <ThemedText>📋</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">Список покупок</ThemedText>
              </View>

              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {shoppingCount}
                </ThemedText>
              </View>
            </View>

            <View style={styles.cardBody}>
              {shoppingItems.length === 0 ? (
                <View style={{ paddingVertical: 18, alignItems: "center" }}>
                  <ThemedText style={{ color: "#999" }}>
                    Список покупок порожній
                  </ThemedText>
                  <ThemedText style={{ color: "#999", marginTop: 8 }}>
                    Щоб додати — використайте поле вище
                  </ThemedText>
                </View>
              ) : (
                shoppingItems.slice(0, 4).map((it, idx) => {
                  const parts: string[] = [];
                  if (it.qty) parts.push(`${it.qty} ${it.unit ?? "шт"}`);
                  if (it.buyerId) {
                    const member = Array.isArray(team?.members)
                      ? team.members.find((m: any) => m.id === it.buyerId)
                      : null;
                    parts.push(
                      `Купує ${member ? `${member.firstName ?? ""}` : it.buyerId === "me" ? "Ви" : "Користувач"}`,
                    );
                  }
                  if (it.comment) parts.push(it.comment);
                  const subtitle = parts.join(" • ");
                  return (
                    <ListItem
                      key={String(it.id ?? idx)}
                      title={it.title}
                      subtitle={subtitle}
                      small
                    />
                  );
                })
              )}

              <TouchableOpacity
                style={styles.openListBtn}
                onPress={() => router.push("/shopping-list")}
              >
                <ThemedText style={{ color: "#007AFF", fontWeight: "700" }}>
                  Відкрити повний список
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { marginTop: 14 }]}>
            <View style={styles.cardHeaderSmall}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View style={styles.iconBoxGreen}>
                  <ThemedText>💵</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">Бюджет команди</ThemedText>
              </View>
              <ThemedText style={{ color: "#666" }}>›</ThemedText>
            </View>

            <View style={{ paddingTop: 12 }}>
              <ThemedText style={{ color: "#666", marginBottom: 8 }}>
                Залишок на Дотий
              </ThemedText>
              <View style={styles.budgetRow}>
                <ThemedText type="title">{`₴${budgetAmount.toLocaleString()}`}</ThemedText>
                {limit > 0 ? (
                  <View style={styles.limitPill}>
                    <ThemedText style={{ color: "#AA5A00", fontSize: 12 }}>
                      ⚠️ Ліміт близько
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(budgetPct * 100)}%` },
                  ]}
                />
              </View>

              <View style={styles.budgetMetaRow}>
                <ThemedText
                  style={{ color: "#999" }}
                >{`Витрачено: ₴${spent.toLocaleString()}`}</ThemedText>
                <ThemedText
                  style={{ color: "#999" }}
                >{`Ліміт: ₴${limit.toLocaleString()}`}</ThemedText>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.card, { marginTop: 14 }]}
            onPress={() => {}}
          >
            <View style={styles.cardHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View style={styles.iconBox}>
                  <ThemedText>📦</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">Комора</ThemedText>
              </View>
              <ThemedText style={{ color: "#666" }}>›</ThemedText>
            </View>

            <ThemedText style={{ color: "#666", marginTop: 12 }}>
              Перевірити запаси вдома
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sidebar overlay */}
      {sidebarOpen ? (
        <View style={styles.sidebarOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.sidebarBackdrop} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sidebarPanel}>
            <ThemedText type="title" style={{ marginBottom: 12 }}>
              Налаштування
            </ThemedText>

            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                setSidebarOpen(false);
                setTimeout(() => router.push('/edit-team'), 120);
              }}
              accessibilityRole="button"
            >
              <ThemedText>Редагувати команду</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                setSidebarOpen(false);
                setTimeout(() => router.push('/team-qr'), 120);
              }}
              accessibilityRole="button"
            >
              <ThemedText>QR код команди</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setSidebarOpen(false); /* future: open advanced settings */ }}>
              <ThemedText>Додаткові налаштування</ThemedText>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.sidebarItem, { marginTop: 8 }]} onPress={() => setSidebarOpen(false)}>
              <ThemedText style={{ color: '#007AFF', fontWeight: '700' }}>Закрити</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

function MemberAvatar({
  name,
  image,
  badge,
}: {
  name: string;
  image?: string;
  badge?: string;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
    : "?";
  return (
    <View style={{ alignItems: "center", marginRight: 12 }}>
      <View style={styles.memberAvatar}>
        {image ? (
          <Image source={{ uri: image }} style={styles.memberImage as any} />
        ) : (
          <ThemedText style={{ fontWeight: "700" }}>{initials}</ThemedText>
        )}
      </View>
      {badge ? <ThemedText style={styles.youBadge}>{badge}</ThemedText> : null}
    </View>
  );
}

function ListItem({
  title,
  subtitle,
  avatarInitials,
  small,
  checked,
  loading,
}: any) {
  return (
    <View style={[styles.listItem, small && { paddingVertical: 8 }] as any}>
      <View style={styles.checkbox} />
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: small ? "600" : "700" }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            style={{ color: "#888", marginTop: 6, fontSize: small ? 12 : 13 }}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {avatarInitials ? (
        <View style={styles.smallAvatar}>
          <ThemedText>{avatarInitials}</ThemedText>
        </View>
      ) : loading ? (
        <View style={styles.placeholderCircle} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    height: 72,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 36 : 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  settings: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
  },
  teamAvatar: {
    width: 76,
    height: 76,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  teamAvatarEmoji: { fontSize: 28 },
  teamInfo: { flex: 1 },
  teamName: { fontSize: 20, fontWeight: "700" },
  created: { color: "#666", marginTop: 6 },

  section: { marginTop: 18 },
  membersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  membersList: { flexDirection: "row", alignItems: "center" },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  memberImage: { width: 48, height: 48, borderRadius: 24 },
  youBadge: { marginTop: 6, fontSize: 12, color: "#007AFF", fontWeight: "700" },
  addCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6EEF9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  manageLink: { color: "#007AFF", fontWeight: "700" },

  /* sidebar */
  sidebarOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" },
  sidebarBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)" },
  sidebarPanel: { width: 280, backgroundColor: "#FFF", padding: 18, borderLeftWidth: 1, borderColor: "#F1F4F8" },
  sidebarItem: { paddingVertical: 12 },

  quickAddRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  quickInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 14,
    backgroundColor: "#FFF",
  },
  quickAddBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderSmall: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxGreen: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF9F3",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#FF5B5B",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#FFF", fontWeight: "700" },
  cardBody: { marginTop: 12 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E6EDF6",
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF6EE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1E7DD",
  },
  placeholderCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EDF6",
  },
  openListBtn: {
    marginTop: 10,
    backgroundColor: "#F6FBFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  limitPill: {
    backgroundColor: "#FFF6EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#EEF6F0",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: { height: 8, backgroundColor: "#3CB371" },
  budgetMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
