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
  ScrollView,
} from "react-native";
import { Colors } from "../theme/colors";
import { API } from "../api/client";

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("28");
  const [sex, setSex] = useState<"female" | "male" | "other">("female");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !mobile.trim() || !age.trim()) {
      Alert.alert("Missing Fields", "Please complete all registration fields.");
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert("Invalid Number", "Please provide a valid 10-digit mobile number.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age between 1 and 120.");
      return;
    }

    setLoading(true);
    try {
      await API.register(name.trim(), mobile.trim(), sex, ageNum);
      Alert.alert("Success", "Account created successfully! Please log in with OTP.", [
        { text: "Continue to Login", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Could not register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Patient Account</Text>
          <Text style={styles.subtitle}>Register your baseline demographics for calibrated Hb screening</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor={Colors.textSubtle}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number (10 Digits)</Text>
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

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age (Years)</Text>
              <TextInput
                style={styles.input}
                placeholder="28"
                placeholderTextColor={Colors.textSubtle}
                keyboardType="number-pad"
                maxLength={3}
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 2, marginLeft: 8 }]}>
              <Text style={styles.label}>Biological Sex</Text>
              <View style={styles.sexRow}>
                {(["female", "male", "other"] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sexChip, sex === s && styles.sexChipActive]}
                    onPress={() => setSex(s)}
                  >
                    <Text style={[styles.sexText, sex === s && styles.sexTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Complete Registration</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.switchText}>
              Already registered? <Text style={styles.switchHighlight}>Log in</Text>
            </Text>
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
    padding: 24,
    justifyContent: "center",
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textMain,
    marginBottom: 6,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMain,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: Colors.textMain,
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
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textMuted,
    marginRight: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  sexRow: {
    flexDirection: "row",
    gap: 4,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  sexChipActive: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
  },
  sexText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  sexTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  switchBtn: {
    marginTop: 16,
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
