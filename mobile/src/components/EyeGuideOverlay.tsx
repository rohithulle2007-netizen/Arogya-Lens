import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const FRAME_WIDTH = width * 0.78;
const FRAME_HEIGHT = FRAME_WIDTH * 0.65;

export const EyeGuideOverlay: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.overlayFrame}>
        <View style={styles.targetEyelidZone}>
          <Text style={styles.zoneText}>Lower Palpebral Conjunctiva</Text>
        </View>
      </View>
      <View style={styles.hintBadge}>
        <Text style={styles.hintText}>👁️ Gently pull lower eyelid down & align in oval</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderRadius: FRAME_HEIGHT / 2,
    borderWidth: 2.5,
    borderColor: Colors.primaryLight,
    borderStyle: "dashed",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 16,
  },
  targetEyelidZone: {
    width: "70%",
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(244, 63, 94, 0.2)",
    borderWidth: 1,
    borderColor: Colors.roseLight,
    alignItems: "center",
  },
  zoneText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hintBadge: {
    marginTop: 20,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  hintText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
