import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Colors } from "../theme/colors";

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {/* Brand Icon Header */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🩺</Text>
        </View>

        <Text style={styles.title}>Arogya Lens</Text>
        <Text style={styles.tagline}>AI-Powered Non-Invasive Anaemia Screening</Text>

        <View style={styles.card}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>👁️</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Bilateral Eye Conjunctiva</Text>
              <Text style={styles.featureDesc}>Scans palpebral vascular pallor & erythema index</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>👍</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Bilateral Thumb Nail Bed</Text>
              <Text style={styles.featureDesc}>Extracts peripheral subungual capillary redness</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Instant 4-Site ML Ensemble</Text>
              <Text style={styles.featureDesc}>High precision hemoglobin assessment in seconds</Text>
            </View>
          </View>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            🔒 For triage and screening assistance. Always consult healthcare professionals for clinical diagnosis.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Get Started with Mobile OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Create New Patient Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  logoIcon: {
    fontSize: 34,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.darkSurface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  disclaimerBox: {
    width: "100%",
    backgroundColor: "rgba(13, 148, 136, 0.15)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#e2e8f0",
    lineHeight: 16,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
