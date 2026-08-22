import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors } from "../theme/colors";

interface DataPoint {
  date: string;
  estimated_hb: number;
}

interface Props {
  data: DataPoint[];
}

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 140;
const PADDING = 24;

export const TrendChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No historical screening data to plot.</Text>
      </View>
    );
  }

  const values = data.map((d) => d.estimated_hb);
  const minVal = Math.min(...values, 8.0) - 0.5;
  const maxVal = Math.max(...values, 16.0) + 0.5;

  const points = data.map((d, idx) => {
    const x = PADDING + (idx / Math.max(1, data.length - 1)) * (CHART_WIDTH - PADDING * 2);
    const y = CHART_HEIGHT - PADDING - ((d.estimated_hb - minVal) / (maxVal - minVal)) * (CHART_HEIGHT - PADDING * 2);
    return { x, y, hb: d.estimated_hb, date: d.date };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT - PADDING} L ${points[0].x} ${CHART_HEIGHT - PADDING} Z`;

  // Normal threshold line (12.0 g/dL)
  const normalY = CHART_HEIGHT - PADDING - ((12.0 - minVal) / (maxVal - minVal)) * (CHART_HEIGHT - PADDING * 2);

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.35" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Normal Reference Guideline */}
        <Line
          x1={PADDING}
          y1={normalY}
          x2={CHART_WIDTH - PADDING}
          y2={normalY}
          stroke={Colors.statusNormal}
          strokeWidth="1"
          strokeDasharray="4, 4"
        />

        {/* Area fill */}
        <Path d={areaD} fill="url(#gradient)" />

        {/* Trend Line */}
        <Path d={pathD} fill="none" stroke={Colors.primary} strokeWidth="3" />

        {/* Dots */}
        {points.map((p, idx) => (
          <Circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="#ffffff"
            stroke={Colors.primaryDark}
            strokeWidth={2.5}
          />
        ))}
      </Svg>
      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>{data[0]?.date}</Text>
        <View style={styles.refBadge}>
          <Text style={styles.refText}>--- 12.0 g/dL (Normal Baseline)</Text>
        </View>
        <Text style={styles.labelText}>{data[data.length - 1]?.date}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  emptyContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
  labelsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 8,
  },
  labelText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  refBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.statusNormalBg,
  },
  refText: {
    color: Colors.statusNormal,
    fontSize: 10,
    fontWeight: "600",
  },
});
