import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { ScanStep } from "../api/types";

interface Props {
  currentStep: ScanStep;
}

const STEPS: { key: ScanStep; label: string; icon: string }[] = [
  { key: "left_eye", label: "Left Eye", icon: "👁️" },
  { key: "right_eye", label: "Right Eye", icon: "👁️" },
  { key: "left_thumb", label: "Left Thumb", icon: "👍" },
  { key: "right_thumb", label: "Right Thumb", icon: "👍" },
];

export const StepProgressIndicator: React.FC<Props> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;

          return (
            <React.Fragment key={step.key}>
              <View style={[styles.dot, isActive && styles.dotActive, isDone && styles.dotDone]}>
                <Text style={[styles.dotText, (isActive || isDone) && styles.dotTextActive]}>
                  {isDone ? "✓" : idx + 1}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.connector, idx < currentIndex && styles.connectorDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.stepTitle}>
        Step {currentIndex + 1} of 4: {STEPS[currentIndex]?.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: "center",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  dotActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: "#ffffff",
    transform: [{ scale: 1.1 }],
  },
  dotDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  dotText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  dotTextActive: {
    color: "#ffffff",
  },
  connector: {
    width: 24,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 4,
  },
  connectorDone: {
    backgroundColor: Colors.primaryLight,
  },
  stepTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
