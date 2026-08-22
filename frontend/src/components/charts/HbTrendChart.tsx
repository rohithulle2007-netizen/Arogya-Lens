import React, { useState, useMemo } from 'react';
import { TrendPoint, getConfidenceMeta, getStatusMeta } from '../../types/health';
import { TrendingUp, Info, HelpCircle } from 'lucide-react';

interface HbTrendChartProps {
  data: TrendPoint[];
  height?: number;
  showReferenceBand?: boolean;
  onPointSelect?: (point: TrendPoint) => void;
  className?: string;
}

export const HbTrendChart: React.FC<HbTrendChartProps> = ({
  data,
  height = 240,
  showReferenceBand = true,
  onPointSelect,
  className = '',
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null
  );

  // SVG Coordinate Box
  const svgWidth = 600;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 45, left: 45 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis bounds (Haemoglobin scale: typically 8.0 to 16.0 g/dL)
  const minY = 8.0;
  const maxY = 16.0;

  // Scale functions
  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padding.top + plotHeight - ((clamped - minY) / (maxY - minY)) * plotHeight;
  };

  const getX = (index: number) => {
    if (data.length <= 1) {
      return padding.left + plotWidth / 2;
    }
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  // Y-axis reference levels
  const yTicks = [8.0, 10.0, 12.0, 14.0, 16.0];

  // Calculate curve points
  const points = useMemo(() => {
    return data.map((d, i) => ({
      x: getX(i),
      y: getY(d.estimated_hb),
      raw: d,
    }));
  }, [data, plotWidth, plotHeight]);

  // Construct smooth SVG path (cubic Bezier curve)
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  // Construct area fill path
  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = getY(minY);
    if (points.length === 1) {
      return `M ${points[0].x - 10} ${bottomY} L ${points[0].x - 10} ${points[0].y} L ${points[0].x + 10} ${points[0].y} L ${points[0].x + 10} ${bottomY} Z`;
    }
    return `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [pathD, points]);

  // Selected item data
  const activePoint = selectedPointIndex !== null && data[selectedPointIndex] ? data[selectedPointIndex] : null;
  const activeConf = activePoint?.confidence ? getConfidenceMeta(activePoint.confidence) : null;
  const activeStatus = activePoint ? getStatusMeta(activePoint.status || 'possible_anemia', activePoint.estimated_hb) : null;

  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center ${className}`}>
        <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-600">No screening history available</p>
        <p className="text-xs text-slate-400 mt-0.5">Complete a screening to start tracking your estimated Hb trend.</p>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      {/* Active Data Point Callout Banner */}
      {activePoint && (
        <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between shadow-sm transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">{activePoint.date}</span>
                {activeStatus && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${activeStatus.bgColor} ${activeStatus.textColor}`}>
                    {activeStatus.label}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{activePoint.estimated_hb.toFixed(1)}</span>
                <span className="text-xs font-semibold text-teal-300">g/dL Estimated Hb</span>
              </div>
            </div>
          </div>

          {activeConf && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Confidence</span>
              <span className="text-xs font-bold text-teal-400">{activeConf.percentage}%</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2 sm:p-3 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible touch-manipulation"
          style={{ maxHeight: `${height}px` }}
        >
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="hbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient for reference band */}
            <linearGradient id="normalBandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* NORMAL REFERENCE RANGE BAND (12.0 - 16.0 g/dL) */}
          {showReferenceBand && (
            <g className="transition-opacity duration-300">
              <rect
                x={padding.left}
                y={getY(16.0)}
                width={plotWidth}
                height={getY(12.0) - getY(16.0)}
                fill="url(#normalBandGradient)"
                stroke="#10b981"
                strokeWidth="0.5"
                strokeDasharray="3 3"
                strokeOpacity="0.4"
                rx="4"
              />
              <text
                x={svgWidth - padding.right - 6}
                y={getY(16.0) + 13}
                textAnchor="end"
                className="text-[9px] fill-emerald-600 font-semibold tracking-wide"
              >
                Normal Reference Range (12 – 16 g/dL)
              </text>
            </g>
          )}

          {/* HORIZONTAL GRID LINES & Y-AXIS LABELS */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={tick === 12.0 ? '0' : '2 2'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-medium"
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Y-AXIS UNIT LABEL */}
          <text
            x={padding.left - 28}
            y={padding.top - 10}
            className="text-[9px] fill-slate-400 font-bold uppercase tracking-wider"
          >
            g/dL
          </text>

          {/* AREA FILL UNDER TREND LINE */}
          <path d={areaD} fill="url(#hbGradient)" />

          {/* MAIN TREND LINE */}
          <path
            d={pathD}
            fill="none"
            stroke="#0d9488"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* DATA POINTS & X-AXIS LABELS */}
          {points.map((p, index) => {
            const isSelected = selectedPointIndex === index;
            const displayLabel = p.raw.displayDate || p.raw.date;

            return (
              <g
                key={index}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedPointIndex(index);
                  if (onPointSelect) onPointSelect(p.raw);
                }}
              >
                {/* Invisible large touch target */}
                <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                {/* Selected point halo */}
                {isSelected && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill="#0d9488"
                    fillOpacity="0.2"
                    className="animate-pulse"
                  />
                )}

                {/* Outer Ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? '6.5' : '4.5'}
                  fill="#ffffff"
                  stroke="#0d9488"
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                  className="transition-all duration-200"
                />

                {/* Point Value label above dot */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className={`text-[10px] font-bold transition-all duration-150 ${
                    isSelected ? 'fill-teal-800 text-[11px]' : 'fill-slate-600'
                  }`}
                >
                  {p.raw.estimated_hb.toFixed(1)}
                </text>

                {/* X-axis Date label */}
                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isSelected ? 'fill-teal-700 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {displayLabel}
                </text>

                {/* Subtle vertical guideline for active point */}
                {isSelected && (
                  <line
                    x1={p.x}
                    y1={p.y + 7}
                    x2={p.x}
                    y2={svgHeight - 26}
                    stroke="#0d9488"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    strokeOpacity="0.6"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend & Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-teal-600 rounded-full inline-block" />
              <span>Estimated Hb</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-emerald-100 border border-emerald-300 rounded inline-block" />
              <span>Reference Range</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 italic">Tap any point to inspect</span>
        </div>
      </div>
    </div>
  );
};
