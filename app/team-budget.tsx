import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

const budgetData = {
  monthDays: [
    { day: "Пн", value: 450 },
    { day: "Вт", value: 320 },
    { day: "Ср", value: 680 },
    { day: "Чт", value: 240 },
    { day: "Пт", value: 520 },
    { day: "Сб", value: 380 },
    { day: "Нд", value: 0 },
  ],
  categories: [
    { name: "Продукти", percent: 55, color: "#2563EB" },
    { name: "Кафе", percent: 20, color: "#F59E0B" },
    { name: "Дім", percent: 10, color: "#10B981" },
    { name: "Залишок", percent: 15, color: "#E5E7EB" },
  ],
  members: [
    { name: "Олена К.", amount: 4150, percent: 53 },
    { name: "Андрій М.", amount: 2800, percent: 36 },
    { name: "Інші", amount: 600, percent: 8 },
  ],
};

const maxBarValue = Math.max(...budgetData.monthDays.map((d) => d.value || 0));

export default function TeamBudgetPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);

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
      }
    })();
  }, []);

  const totalSpent = budgetData.members.reduce((sum, m) => sum + m.amount, 0);
  const budgetLimit = 10000;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Бюджет</Text>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.teamSection}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>FAMILY TEAM</Text>
          </View>
          <Text style={styles.monthLabel}>Лютий 2026</Text>
        </View>

        <View style={styles.timeSwitch}>
          <TouchableOpacity
            style={[styles.timeSwitchBtn, styles.timeSwitchActive]}
          >
            <Text style={styles.timeSwitchText}>Тиждень</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeSwitchBtn}>
            <Text style={styles.timeSwitchTextInactive}>Місяць</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeSwitchBtn}>
            <Text style={styles.timeSwitchTextInactive}>Рік</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spentSection}>
          <Text style={styles.spentLabel}>Витрачено у Лютому</Text>
          <View style={styles.spentRow}>
            <Text style={styles.spentAmount}>
              ₴{totalSpent.toLocaleString()}
            </Text>
            <Text style={styles.spentLimit}>
              / {`₴${budgetLimit.toLocaleString()}`}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((totalSpent / budgetLimit) * 100, 100)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabel}>
            <Text style={styles.progressLabelText}>Залишилось 25%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Динаміка витрат</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {budgetData.monthDays.map((day, idx) => (
                <View key={idx} style={styles.barWrapper}>
                  <View style={styles.barLabelContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height:
                            maxBarValue > 0
                              ? (Math.max(day.value || 0, 50) /
                                  (maxBarValue * 1.2)) *
                                140
                              : 30,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Розподіл за категоріями</Text>
          <View style={styles.pieContainer}>
            <PieChart data={budgetData.categories} total={totalSpent} />
          </View>

          <View style={styles.legendContainer}>
            {budgetData.categories.map((cat, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: cat.color }]}
                />
                <Text style={styles.legendLabel}>{cat.name}</Text>
                <Text style={styles.legendPercent}>{cat.percent}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.memberHeaderRow}>
            <Text style={styles.sectionTitle}>Вклад учасників</Text>
            <TouchableOpacity>
              <Ionicons name="help-circle-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {budgetData.members.map((member, idx) => (
            <View key={idx} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={styles.memberBarContainer}>
                  <View
                    style={[styles.memberBar, { width: `${member.percent}%` }]}
                  />
                </View>
              </View>
              <Text style={styles.memberAmount}>
                {`₴${member.amount.toLocaleString()}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.trendSection}>
          <View style={styles.trendIcon}>
            <Ionicons name="trending-down-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.trendText}>
            <Text style={styles.trendTitle}>Тренди витрат</Text>
            <Text style={styles.trendDesc}>
              Ви витрачаєте на 12% менше, ніж минулого місяця в цей час. Так
              тримати!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PieChart({
  data,
  total,
}: {
  data: { name: string; percent: number; color: string }[];
  total: number;
}) {
  let cumulativePercent = 0;
  const paths = data.map((item) => {
    const startAngle = (cumulativePercent / 100) * 360;
    const endAngle = ((cumulativePercent + item.percent) / 100) * 360;
    cumulativePercent += item.percent;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 80 + 70 * Math.cos(startRad);
    const y1 = 80 + 70 * Math.sin(startRad);
    const x2 = 80 + 70 * Math.cos(endRad);
    const y2 = 80 + 70 * Math.sin(endRad);

    const largeArc = item.percent > 50 ? 1 : 0;

    return {
      color: item.color,
      path: `M 80 80 L ${x1.toFixed(0)} ${y1.toFixed(0)} A 70 70 0 ${largeArc} 1 ${x2.toFixed(0)} ${y2.toFixed(0)} Z`,
    };
  });

  return (
    <View style={styles.pieChartWrapper}>
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChartInner}>
          {data.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.piePiece,
                {
                  backgroundColor: item.color,
                  transform: [{ rotate: `${(item.percent / 100) * 360}deg` }],
                  borderRadius: 70,
                },
              ]}
            />
          ))}
          <View style={styles.pieChartCenter}>
            <Text style={styles.pieTotalLabel}>Всього</Text>
            <Text style={styles.pieTotalValue}>₴{total.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  teamSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  teamBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E9D5FF",
  },
  teamBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B21A8",
    letterSpacing: 0.5,
  },
  monthLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
  },
  timeSwitch: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  timeSwitchBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  timeSwitchActive: {
    backgroundColor: "#FFFFFF",
  },
  timeSwitchText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  timeSwitchTextInactive: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
  },
  spentSection: {
    marginBottom: 24,
  },
  spentLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  spentRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  spentLimit: {
    marginLeft: 6,
    fontSize: 14,
    color: "#9CA3AF",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  progressLabelText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  chartContainer: {
    height: 200,
    justifyContent: "flex-end",
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 160,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  barLabelContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
    height: 140,
  },
  bar: {
    width: 24,
    backgroundColor: "#BFDBFE",
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  pieContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  pieChartWrapper: {
    alignItems: "center",
  },
  pieChartContainer: {
    width: 200,
    height: 200,
    position: "relative",
  },
  pieChartInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 20,
  },
  piePiece: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  pieChartCenter: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    top: "50%",
    left: "50%",
    marginTop: -60,
    marginLeft: -60,
    justifyContent: "center",
    alignItems: "center",
  },
  pieTotalLabel: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  pieTotalValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  legendContainer: {
    flexDirection: "column",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  legendPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  memberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  memberBarContainer: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  memberBar: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  memberAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 12,
  },
  trendSection: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    marginBottom: 20,
  },
  trendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  trendText: {
    flex: 1,
  },
  trendTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
  },
  trendDesc: {
    fontSize: 12,
    color: "#1E40AF",
    marginTop: 4,
    lineHeight: 16,
  },
});
