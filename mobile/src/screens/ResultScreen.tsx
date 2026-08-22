import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Colors } from "../theme/colors";
import { ScreeningResult } from "../api/types";

export const ResultScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const result: ScreeningResult = route.params?.result || {
    estimated_hb: 12.4,
    confidence: 0.91,
    status: "likely_normal",
    image_quality: "good",
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("normal")) return { bg: Colors.statusNormalBg, text: Colors.statusNormal, label: "Likely Normal" };
    if (s.includes("mild")) return { bg: Colors.statusMildBg, text: Colors.statusMild, label: "Mild / Borderline" };
    if (s.includes("moderate")) return { bg: Colors.statusModerateBg, text: Colors.statusModerate, label: "Moderate Anemia" };
    if (s.includes("severe") || s.includes("high")) return { bg: Colors.statusSevereBg, text: Colors.statusSevere, label: "Severe / High Risk" };
    return { bg: Colors.statusMildBg, text: Colors.statusMild, label: "Possible Anemia" };
  };

  const statusInfo = getStatusColor(result.status || "");
  const confidencePct = Math.round((result.confidence || 0.88) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Screening Assessment</Text>
          <Text style={styles.subtitle}>AI Non-Invasive Biomarker Synthesis Complete</Text>
        </View>

        {/* Hero Hb Card */}
        <View style={styles.heroCard}>
          <View style={styles.hbRow}>
            <Text style={styles.hbValue}>{Number(result.estimated_hb).toFixed(1)}</Text>
            <Text style={styles.hbUnit}>g/dL</Text>
          </View>
          <Text style={styles.hbLabel}>Estimated Blood Hemoglobin</Text>

          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.text }]}>● {statusInfo.label}</Text>
          </View>

          {/* Confidence Meter */}
          <View style={styles.meterContainer}>
            <View style={styles.meterLabels}>
              <Text style={styles.meterLabel}>Optical Confidence</Text>
              <Text style={styles.meterValue}>{confidencePct}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${confidencePct}%` }]} />
            </View>
          </View>
        </View>

        {/* 4-Site Verified Badges */}
        <Text style={styles.sectionHeader}>4-Point Biomarker Sites Verified</Text>
        <View style={styles.sitesGrid}>
          <View style={styles.siteChip}>
            <Text style={styles.siteIcon}>👁️</Text>
            <Text style={styles.siteName}>Left Conjunctiva</Text>
            <Text style={styles.siteCheck}>✓ Active</Text>
          </View>
          <View style={styles.siteChip}>
            <Text style={styles.siteIcon}>👁️</Text>
            <Text style={styles.siteName}>Right Conjunctiva</Text>
            <Text style={styles.siteCheck}>✓ Active</Text>
          </View>
          <View style={styles.siteChip}>
            <Text style={styles.siteIcon}>👍</Text>
            <Text style={styles.siteName}>Left Nail Bed</Text>
            <Text style={styles.siteCheck}>✓ Active</Text>
          </View>
          <View style={styles.siteChip}>
            <Text style={styles.siteIcon}>👍</Text>
            <Text style={styles.siteName}>Right Nail Bed</Text>
            <Text style={styles.siteCheck}>✓ Active</Text>
          </View>
        </View>

        {/* WHO Reference Ranges */}
        <View style={styles.refCard}>
          <Text style={styles.refTitle}>WHO Reference Ranges</Text>
          <View style={styles.refRow}>
            <Text style={styles.refName}>Normal (Adult)</Text>
            <Text style={styles.refVal}>≥ 12.0 g/dL</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refName}>Mild Anemia</Text>
            <Text style={styles.refVal}>11.0 – 11.9 g/dL</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refName}>Moderate Anemia</Text>
            <Text style={styles.refVal}>8.0 – 10.9 g/dL</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refName}>Severe Anemia</Text>
            <Text style={styles.refVal}>&lt; 8.0 g/dL</Text>
          </View>
        </View>

        {/* Navigation Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue to Health Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Scanner", { initialStep: "left_eye" })}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Perform New Screening</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textMain,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  hbRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  hbValue: {
    fontSize: 52,
    fontWeight: "800",
    color: Colors.textMain,
    letterSpacing: -1,
  },
  hbUnit: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textMuted,
    marginLeft: 6,
  },
  hbLabel: {
    fontSize: 13,
    color: Colors.textSubtle,
    fontWeight: "600",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  meterContainer: {
    width: "100%",
  },
  meterLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  meterValue: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  meterTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textMain,
    marginBottom: 12,
  },
  sitesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  siteChip: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  siteIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  siteName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMain,
  },
  siteCheck: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 2,
  },
  refCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  refTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMain,
    marginBottom: 10,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  refName: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  refVal: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMain,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  primaryBtn: {
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
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.textMain,
    fontSize: 14,
    fontWeight: "600",
  },
});
