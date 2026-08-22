import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import { DashboardResponse, UserProfile } from "../api/types";
import { API } from "../api/client";
import { Storage } from "../utils/storage";
import { TrendChart } from "../components/TrendChart";

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const u = await Storage.getUser();
      setUser(u);
      const d = await API.getDashboard();
      setDashboard(d);
    } catch (err: any) {
      console.log("Dashboard load error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const latestHb = dashboard?.latest_hb ?? 12.2;
  const avgHb = dashboard?.average_hb ?? latestHb;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* User Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || "Patient"}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate("ProfileTab")}>
            <Text style={styles.avatarText}>{(user?.name || "P").charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Hero Button */}
        <TouchableOpacity
          style={styles.scanActionCard}
          onPress={() => navigation.navigate("Scanner", { initialStep: "left_eye" })}
          activeOpacity={0.85}
        >
          <View style={styles.scanCardContent}>
            <View style={styles.scanIconBadge}>
              <Text style={styles.scanIcon}>📸</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scanCardTitle}>Start 4-Point Screening</Text>
              <Text style={styles.scanCardDesc}>Scan Left/Right Eye & Thumbs for Hb</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Latest Hemoglobin</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{dashboard?.latest_hb != null ? Number(dashboard.latest_hb).toFixed(1) : "--"}</Text>
              <Text style={styles.metricUnit}>g/dL</Text>
            </View>
            <Text style={styles.metricSub}>{dashboard?.latest_status?.replace("_", " ") || "No records"}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Screenings</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{dashboard?.total_screenings || 0}</Text>
              <Text style={styles.metricUnit}>scans</Text>
            </View>
            <Text style={styles.metricSub}>Avg: {dashboard?.average_hb != null ? Number(dashboard.average_hb).toFixed(1) : "--"} g/dL</Text>
          </View>
        </View>

        {/* Hb Trend Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hemoglobin Progression Trend</Text>
        </View>
        <TrendChart data={dashboard?.hb_trend || []} />

        {/* Recent Screenings */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Checkups</Text>
          <TouchableOpacity onPress={() => navigation.navigate("HistoryTab")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {dashboard?.recent_screenings && dashboard.recent_screenings.length > 0 ? (
          dashboard.recent_screenings.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyDate}>{item.checkup_date}</Text>
                <Text style={styles.historyTime}>{item.checkup_time}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyHb}>{Number(item.estimated_hb).toFixed(1)} g/dL</Text>
                <Text style={styles.historyStatus}>{item.status?.replace("_", " ")}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No previous screening records yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textMain,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  scanActionCard: {
    backgroundColor: Colors.darkBackground,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  scanCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(20, 184, 166, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  scanIcon: {
    fontSize: 22,
  },
  scanCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },
  scanCardDesc: {
    fontSize: 12,
    color: Colors.primaryLight,
  },
  arrowIcon: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "700",
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 6,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textMain,
  },
  metricUnit: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginLeft: 4,
  },
  metricSub: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textMain,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
  },
  historyItem: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  historyLeft: {},
  historyDate: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMain,
  },
  historyTime: {
    fontSize: 11,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyHb: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textMain,
  },
  historyStatus: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
});
