import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const profile = {
  name: "Олександр Петренко",
  handle: "@alex_p",
  plan: "Premium Plan",
  stats: [
    { label: "ЧЕКІВ/МІС", value: "12", tone: "blue" },
    { label: "ЗБЕРЕЖЕНО", value: "₴4k", tone: "green" },
    { label: "КОМАНДИ", value: "3", tone: "purple" },
  ],
  preferences: ["Без глютену", "Кето", "Люблю гостре"],
  teams: [
    { name: "Сім'я", role: "Адміністратор", tone: "purple" },
    { name: "Офіс IT", role: "Учасник", tone: "orange" },
  ],
};

export default function ProfilePage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIcon, styles.headerIconLower]}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <Image
                source={{ uri: "https://i.pravatar.cc/300?img=13" }}
                style={styles.avatar}
              />
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={18} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileBlock}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.planLine}>
            <Text style={styles.handle}>{profile.handle}</Text>
            <Text style={styles.dot}> • </Text>
            <Text style={styles.plan}>{profile.plan}</Text>
            <Text style={styles.sparkle}> ✨</Text>
          </Text>
        </View>

        <View style={styles.statsRow}>
          {profile.stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, styles[`stat_${stat.tone}`]]}
            >
              <Text
                style={[styles.statValue, styles[`statValue_${stat.tone}`]]}
              >
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Мої вподобання</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Змінити</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🚫</Text>
              <Text style={styles.chipText}>{profile.preferences[0]}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🥑</Text>
              <Text style={styles.chipText}>{profile.preferences[1]}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipIcon}>🌶️</Text>
              <Text style={styles.chipText}>{profile.preferences[2]}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мої команди</Text>
          <View style={styles.teamCard}>
            <View style={[styles.teamIcon, styles.teamIconPurple]}>
              <Ionicons name="home" size={18} color="#8B5CF6" />
            </View>
            <View style={styles.teamText}>
              <Text style={styles.teamName}>{profile.teams[0].name}</Text>
              <Text style={styles.teamRole}>{profile.teams[0].role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
          </View>

          <View style={styles.teamCard}>
            <View style={[styles.teamIcon, styles.teamIconOrange]}>
              <Ionicons name="briefcase" size={18} color="#F97316" />
            </View>
            <View style={styles.teamText}>
              <Text style={styles.teamName}>{profile.teams[1].name}</Text>
              <Text style={styles.teamRole}>{profile.teams[1].role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B8C2D1" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#2C64E0",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconLower: {
    marginTop: 8,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: 22,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  cameraButton: {
    position: "absolute",
    bottom: 6,
    right: 120 / 2 - 6,
    transform: [{ translateX: 36 }],
    backgroundColor: "#FFFFFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF1F6",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  profileBlock: {
    alignItems: "center",
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1B1F2A",
  },
  planLine: {
    marginTop: 6,
    fontSize: 14,
    color: "#98A2B3",
  },
  handle: {
    color: "#9AA4B2",
  },
  dot: {
    color: "#C0C6D4",
  },
  plan: {
    color: "#9AA4B2",
    fontWeight: "600",
  },
  sparkle: {
    color: "#9AA4B2",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  stat_blue: {
    backgroundColor: "#EEF4FF",
  },
  stat_green: {
    backgroundColor: "#ECFDF3",
  },
  stat_purple: {
    backgroundColor: "#F6F2FF",
  },
  statValue_blue: {
    color: "#3366FF",
  },
  statValue_green: {
    color: "#16A34A",
  },
  statValue_purple: {
    color: "#8B5CF6",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#94A3B8",
    letterSpacing: 0.6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionAction: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F4F6FA",
    marginRight: 12,
    marginBottom: 12,
  },
  chipIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF0F6",
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  teamIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  teamIconPurple: {
    backgroundColor: "#F1E8FF",
  },
  teamIconOrange: {
    backgroundColor: "#FFEAD5",
  },
  teamText: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  teamRole: {
    marginTop: 4,
    fontSize: 13,
    color: "#9AA4B2",
  },
});
