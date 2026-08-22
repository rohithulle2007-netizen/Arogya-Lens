import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const FRAME_WIDTH = width * 0.55;
const FRAME_HEIGHT = FRAME_WIDTH * 1.5;

export const ThumbGuideOverlay: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.overlayFrame}>
        <View style={styles.nailBedTarget}>
          <Text style={styles.zoneText}>Nail Bed Zone</Text>
        </View>
      </View>
      <View style={styles.hintBadge}>
        <Text style={styles.hintText}>👍 Place thumb vertically with nail bed in target</Text>
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
    borderRadius: FRAME_WIDTH / 2,
    borderWidth: 2.5,
    borderColor: Colors.primaryLight,
    borderStyle: "dashed",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 24,
  },
  nailBedTarget: {
    width: "75%",
    height: FRAME_WIDTH * 0.5,
    borderRadius: 16,
    backgroundColor: "rgba(244, 63, 94, 0.2)",
    borderWidth: 1.5,
    borderColor: Colors.roseLight,
    alignItems: "center",
    justifyContent: "center",
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
