import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import { UserProfile } from "../api/types";
import { API } from "../api/client";
import { Storage, DEFAULT_API_URL } from "../utils/storage";

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("28");
  const [sex, setSex] = useState("female");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await Storage.getUser();
      if (u) {
        setUser(u);
        setName(u.name || "");
        setAge(String(u.age || 28));
        setSex(u.sex || "female");
      }
      const url = await Storage.getApiUrl();
      setApiUrl(url);
    })();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your name.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age.");
      return;
    }

    setLoading(true);
    try {
      const updated = await API.updateProfile(name.trim(), ageNum, sex);
      setUser(updated);
      Alert.alert("Saved", "Profile information updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim().startsWith("http")) {
      Alert.alert("Invalid URL", "Server URL must start with http:// or https://");
      return;
    }
    await Storage.setApiUrl(apiUrl.trim());
    Alert.alert("Server Configured", `Backend server URL set to:\n${apiUrl.trim()}`);
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to sign out of Arogya Lens?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await Storage.clearAll();
          navigation.reset({
            index: 0,
            routes: [{ name: "Onboarding" }],
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Profile</Text>
          <Text style={styles.subtitle}>Manage baseline demographics & server connection</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || "P").charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{name || "Patient"}</Text>
            <Text style={styles.userPhone}>+91 {user?.mobile_number || "9876543210"}</Text>
          </View>
        </View>

        {/* Demographic Information Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Demographics (Calibrates AI Inference)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age (Years)</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="28"
            />
          </View>

          <View style={styles.inputContainer}>
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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Save Demographics</Text>}
          </TouchableOpacity>
        </View>

        {/* Server Connection URL Configuration */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Backend Server Connection</Text>
          <Text style={styles.sectionDesc}>
            Connect to local WiFi development server (e.g. http://192.168.x.x:8000) or production URL.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>API Base URL</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://127.0.0.1:8000"
            />
          </View>

          <TouchableOpacity style={styles.urlSaveBtn} onPress={handleSaveApiUrl}>
            <Text style={styles.urlSaveText}>Update Server URL</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out of Arogya Lens</Text>
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
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textMain,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textMain,
  },
  userPhone: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textMain,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
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
    height: 46,
    fontSize: 14,
    color: Colors.textMain,
  },
  sexRow: {
    flexDirection: "row",
    gap: 6,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 10,
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
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  sexTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  urlSaveBtn: {
    backgroundColor: Colors.borderLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urlSaveText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },
  logoutBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.roseLight,
    backgroundColor: Colors.roseSurface,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutText: {
    color: Colors.roseDark,
    fontSize: 14,
    fontWeight: "700",
  },
});
