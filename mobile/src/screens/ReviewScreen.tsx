import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import { MultiScanPayload, ScanStep } from "../api/types";
import { API } from "../api/client";

const SITES: { key: ScanStep; label: string; icon: string }[] = [
  { key: "left_eye", label: "Left Eye", icon: "👁️" },
  { key: "right_eye", label: "Right Eye", icon: "👁️" },
  { key: "left_thumb", label: "Left Thumb", icon: "👍" },
  { key: "right_thumb", label: "Right Thumb", icon: "👍" },
];

export const ReviewScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const scans: MultiScanPayload = route.params?.scans || {};
  const [analyzing, setAnalyzing] = useState(false);

  const handleRetake = (step: ScanStep) => {
    navigation.navigate("Scanner", {
      initialStep: step,
      existingScans: scans,
    });
  };

  const handleAnalyze = async () => {
    // Check if all 4 scans are present
    const missing = SITES.filter((s) => !scans[s.key]?.uri);
    if (missing.length > 0) {
      Alert.alert(
        "Incomplete Screening",
        `Please capture all 4 anatomical sites. Missing: ${missing.map((m) => m.label).join(", ")}`
      );
      return;
    }

    setAnalyzing(true);
    try {
      const result = await API.analyzeMultiSite(scans);
      navigation.navigate("Result", { result });
    } catch (err: any) {
      Alert.alert("Analysis Failed", err.message || "Failed to process scans with AI engine.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Review 4-Point Scans</Text>
          <Text style={styles.subtitle}>Verify anatomical clarity before running AI Hemoglobin inference</Text>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.grid}>
          {SITES.map((site) => {
            const item = scans[site.key];
            return (
              <View key={site.key} style={styles.card}>
                <View style={styles.imageWrapper}>
                  {item?.uri ? (
                    <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholder}>
                      <Text style={styles.placeholderIcon}>{site.icon}</Text>
                      <Text style={styles.placeholderText}>Not Captured</Text>
                    </View>
                  )}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {site.icon} {site.label}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => handleRetake(site.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Model Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔬 Multi-site optical fusion analyzes bilateral conjunctiva erythema and bilateral thumb vascularity with trained ensemble regression.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.analyzeBtn}
          onPress={handleAnalyze}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={styles.analyzeBtnText}>Analyzing Biomarkers...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBtnText}>Analyze All 4 Scans ⚡</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textMain,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageWrapper: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.borderLight,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 11,
    color: Colors.textSubtle,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  retakeBtn: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
  },
  retakeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  infoBox: {
    backgroundColor: Colors.primarySurface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginVertical: 18,
  },
  infoText: {
    color: Colors.primaryDark,
    fontSize: 12,
    lineHeight: 17,
  },
  analyzeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  analyzeBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
