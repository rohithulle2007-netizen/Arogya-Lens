import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../theme/colors";
import { ScanItem, ScanStep } from "../api/types";
import { StepProgressIndicator } from "../components/StepProgressIndicator";
import { EyeGuideOverlay } from "../components/EyeGuideOverlay";
import { ThumbGuideOverlay } from "../components/ThumbGuideOverlay";

const { width, height } = Dimensions.get("window");

export const ScannerScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);
  const [currentStep, setCurrentStep] = useState<ScanStep>(route.params?.initialStep || "left_eye");
  const [capturedScans, setCapturedScans] = useState<Partial<Record<ScanStep, ScanItem>>>(
    route.params?.existingScans || {}
  );
  const cameraRef = useRef<any>(null);

  const isEyeStep = currentStep === "left_eye" || currentStep === "right_eye";

  const getNextStep = (step: ScanStep): ScanStep | "review" => {
    switch (step) {
      case "left_eye":
        return "right_eye";
      case "right_eye":
        return "left_thumb";
      case "left_thumb":
        return "right_thumb";
      case "right_thumb":
        return "review";
    }
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });

      if (photo?.uri) {
        processCapturedUri(photo.uri);
      }
    } catch (err: any) {
      Alert.alert("Capture Error", err.message || "Failed to capture photo.");
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        processCapturedUri(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Gallery Error", err.message || "Failed to select image.");
    }
  };

  const processCapturedUri = (uri: string) => {
    const item: ScanItem = {
      uri,
      type: "image/jpeg",
      name: `${currentStep}.jpg`,
    };

    const updated = {
      ...capturedScans,
      [currentStep]: item,
    };
    setCapturedScans(updated);

    const next = getNextStep(currentStep);
    if (next === "review") {
      navigation.navigate("Review", { scans: updated });
    } else {
      setCurrentStep(next);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Arogya Lens requires camera access to perform optical conjunctival and nail bed hemoglobin screening.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryFallbackBtn} onPress={handlePickFromGallery}>
          <Text style={styles.galleryFallbackText}>Upload Image from Gallery Instead</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <StepProgressIndicator currentStep={currentStep} />
        <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
          <Text style={styles.torchText}>{torch ? "⚡" : "💡"}</Text>
        </TouchableOpacity>
      </View>

      {/* Camera Live Viewfinder */}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={torch}
        >
          {isEyeStep ? <EyeGuideOverlay /> : <ThumbGuideOverlay />}
        </CameraView>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.toolBtn} onPress={handlePickFromGallery}>
          <Text style={styles.toolIcon}>🖼️</Text>
          <Text style={styles.toolLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter Button */}
        <TouchableOpacity
          style={styles.shutterBtn}
          onPress={handleCapturePhoto}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
        >
          <Text style={styles.toolIcon}>🔄</Text>
          <Text style={styles.toolLabel}>Flip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  torchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchText: {
    fontSize: 16,
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: 12,
    marginVertical: 8,
  },
  camera: {
    flex: 1,
  },
  footer: {
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    backgroundColor: "#000000",
  },
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  toolIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  toolLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.rose,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  permissionBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  galleryFallbackBtn: {
    padding: 12,
  },
  galleryFallbackText: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: "600",
  },
});
