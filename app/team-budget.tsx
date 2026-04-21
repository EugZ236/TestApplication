import budgetService from "@/src/services/budgetService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TEAM_STORAGE_KEY = "teams_v1";
const VIEW_TEAM_KEY = "view_team_id";

// Sample/mock data removed — use server-provided budget for rendering

// (previous chart data helpers retained) - maxBarValue removed as chart is simplified

export default function TeamBudgetPage() {
  const router = useRouter();
  const [budgetLimitState, setBudgetLimitState] = useState<number | null>(null);
  const [currentBudget, setCurrentBudget] = useState<any>(null);

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
        if (found?.id) {
          try {
            const budgets = await budgetService.getBudgetsByTeam(
              Number(found.id),
            );
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const current = budgets.find((b: any) => {
              const bMonth = b.month ?? b.Month;
              const bYear = b.year ?? b.Year;
              return (
                Number(bMonth) === Number(month) &&
                Number(bYear) === Number(year)
              );
            });
            // If no budget is found or limit is missing treat it as 0
            const rawLimit = current
              ? (current.limitAmount ?? current.LimitAmount ?? 0)
              : 0;
            const limit = Number(rawLimit ?? 0);
            setBudgetLimitState(Number.isFinite(limit) ? limit : 0);
            setCurrentBudget(current ?? null);
          } catch (err) {
            console.warn("Failed to load budgets", err);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const totalSpent = currentBudget
    ? Number(currentBudget.currentSpent ?? currentBudget.CurrentSpent ?? 0)
    : 0;
  const pieData = currentBudget?.categories ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={styles.pieContainer}>
          <PieChart
            data={pieData}
            total={totalSpent}
            limit={budgetLimitState}
          />
        </View>
      </View>
    </View>
  );
}

function PieChart({
  data,
  total,
  limit,
}: {
  data: { name: string; percent: number; color: string }[];
  total: number;
  limit?: number | null;
}) {
  // render pieces directly below

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
            <Text style={styles.pieTotalValue}>
              {`₴${total.toLocaleString("uk-UA")} / ₴${(Number.isFinite(
                limit as number,
              )
                ? (limit as number)
                : 0
              ).toLocaleString("uk-UA")}`}
            </Text>
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
