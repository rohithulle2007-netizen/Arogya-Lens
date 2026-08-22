import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Colors } from "../theme/colors";
import { ScreeningResult } from "../api/types";
import { API } from "../api/client";

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<ScreeningResult[]>([]);
  const [filter, setFilter] = useState<"all" | "normal" | "anemia">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<ScreeningResult | null>(null);

  const loadHistory = async () => {
    try {
      const data = await API.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log("History error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const filteredHistory = history.filter((item) => {
    if (filter === "normal") return (item.status || "").toLowerCase().includes("normal");
    if (filter === "anemia") return !(item.status || "").toLowerCase().includes("normal");
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Screening History</Text>
        <Text style={styles.subtitle}>Audit past optical hemoglobin checkups</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "normal", "anemia"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "All Records" : f === "normal" ? "Normal" : "Anemia"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No screening records match the filter.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedScreening(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardDate}>{item.checkup_date}</Text>
                <Text style={styles.cardTime}>{item.checkup_time}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status?.replace("_", " ")}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardHb}>{Number(item.estimated_hb).toFixed(1)} <Text style={styles.cardUnit}>g/dL</Text></Text>
                <Text style={styles.cardConfidence}>Confidence: {Math.round((item.confidence || 0.85) * 100)}%</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedScreening} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkup Details</Text>
              <TouchableOpacity onPress={() => setSelectedScreening(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedScreening && (
              <View style={styles.modalBody}>
                <View style={styles.modalHero}>
                  <Text style={styles.modalHb}>{Number(selectedScreening.estimated_hb).toFixed(1)}</Text>
                  <Text style={styles.modalHbUnit}>g/dL Hemoglobin</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Checkup Date</Text>
                  <Text style={styles.modalVal}>{selectedScreening.checkup_date} at {selectedScreening.checkup_time}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Classification</Text>
                  <Text style={[styles.modalVal, { color: Colors.primary, fontWeight: "700" }]}>
                    {selectedScreening.status?.replace("_", " ")}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Optical Confidence</Text>
                  <Text style={styles.modalVal}>{Math.round((selectedScreening.confidence || 0.85) * 100)}%</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Image Quality</Text>
                  <Text style={styles.modalVal}>{selectedScreening.image_quality || "Good"}</Text>
                </View>

                <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSelectedScreening(null)}>
                  <Text style={styles.modalDoneText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textMain,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  cardLeft: {},
  cardDate: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textMain,
  },
  cardTime: {
    fontSize: 11,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primaryDark,
    textTransform: "capitalize",
  },
  cardRight: {
    alignItems: "flex-end",
  },
  cardHb: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textMain,
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: "normal",
    color: Colors.textMuted,
  },
  cardConfidence: {
    fontSize: 11,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textMain,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  modalBody: {},
  modalHero: {
    alignItems: "center",
    backgroundColor: Colors.primarySurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  modalHb: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  modalHbUnit: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  modalVal: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMain,
    textTransform: "capitalize",
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  modalDoneText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
