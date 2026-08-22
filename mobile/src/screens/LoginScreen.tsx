import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors } from "../theme/colors";
import { API } from "../api/client";

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [mobile, setMobile] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      await API.sendOtp(mobile.trim());
      setStep("otp");
      Alert.alert("OTP Sent", "Default development OTP is 123456.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send OTP. Check backend connection in settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the 6-digit OTP (123456).");
      return;
    }
    setLoading(true);
    try {
      await API.verifyOtp(mobile.trim(), otp.trim());
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => (step === "otp" ? setStep("phone") : navigation.goBack())}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Mobile Login</Text>
          <Text style={styles.subtitle}>
            {step === "phone" ? "Enter your registered mobile number to receive OTP" : `Enter the 6-digit code sent to +91 ${mobile}`}
          </Text>
        </View>

        <View style={styles.form}>
          {step === "phone" ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>10-Digit Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor={Colors.textSubtle}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter 6-Digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor={Colors.textSubtle}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={step === "phone" ? handleSendOtp : handleVerifyOtp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{step === "phone" ? "Send OTP Code" : "Verify & Sign In"}</Text>
            )}
          </TouchableOpacity>

          {step === "phone" && (
            <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate("Register")}>
              <Text style={styles.switchText}>
                Don't have an account? <Text style={styles.switchHighlight}>Register here</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 8,
  },
  backText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textMain,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMain,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textMuted,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.textMain,
  },
  otpInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  switchBtn: {
    marginTop: 18,
    alignItems: "center",
  },
  switchText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  switchHighlight: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
