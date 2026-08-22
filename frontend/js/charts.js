/**
 * Arogya Lens — Interactive Pure SVG Hemoglobin Trend Chart
 * Zero-dependency interactive vector charts with adult reference bands (12.0 - 16.5 g/dL)
 */

class ChartRenderer {
  renderHbTrendChart(containerId, dataPoints = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!dataPoints || dataPoints.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-subtle); font-size: 0.85rem;">
          No screening history recorded yet. Complete your first eye scan to see your Hb progression.
        </div>
      `;
      return;
    }

    const width = 420;
    const height = 180;
    const padding = { top: 20, right: 25, bottom: 35, left: 38 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minHb = 7.0;
    const maxHb = 18.0;

    const getY = (val) => {
      const clamped = Math.max(minHb, Math.min(maxHb, val));
      return padding.top + chartH - ((clamped - minHb) / (maxHb - minHb)) * chartH;
    };

    const getX = (idx) => {
      if (dataPoints.length === 1) return padding.left + chartW / 2;
      return padding.left + (idx / (dataPoints.length - 1)) * chartW;
    };

    // Calculate Normal Band (12.0 - 16.5 g/dL)
    const normalTopY = getY(16.5);
    const normalBottomY = getY(12.0);
    const normalBandHeight = normalBottomY - normalTopY;

    // Generate Path Points
    let pathD = "";
    let areaD = "";
    const circles = [];

    dataPoints.forEach((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.estimated_hb || 12.0);

      if (idx === 0) {
        pathD += `M ${x} ${y}`;
        areaD += `M ${x} ${padding.top + chartH} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }

      if (idx === dataPoints.length - 1) {
        areaD += ` L ${x} ${padding.top + chartH} Z`;
      }

      const hbVal = Number(pt.estimated_hb).toFixed(1);
      const dateLabel = pt.checkup_date || pt.date || `Scan ${idx + 1}`;
      circles.push(`
        <g class="chart-point" data-hb="${hbVal}" data-date="${dateLabel}">
          <circle cx="${x}" cy="${y}" r="5" fill="#0d4a46" stroke="#ffffff" stroke-width="2" />
          <text x="${x}" y="${y - 9}" font-family="Fraunces, Georgia, serif" font-size="10" font-weight="600" fill="#0d4a46" text-anchor="middle">${hbVal}</text>
        </g>
      `);
    });

    const svg = `
      <svg class="hb-trend-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hbGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0d4a46" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0d4a46" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Normal Adult Reference Band -->
        <rect x="${padding.left}" y="${normalTopY}" width="${chartW}" height="${normalBandHeight}" fill="rgba(31, 138, 112, 0.08)" rx="4" />
        <line x1="${padding.left}" y1="${normalBottomY}" x2="${width - padding.right}" y2="${normalBottomY}" stroke="rgba(31, 138, 112, 0.3)" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${normalTopY}" x2="${width - padding.right}" y2="${normalTopY}" stroke="rgba(31, 138, 112, 0.3)" stroke-dasharray="3,3" />
        <text x="${width - padding.right - 4}" y="${normalBottomY - 4}" font-size="8" fill="#1f8a70" text-anchor="end" font-weight="600">Normal Range (12.0 - 16.5)</text>

        <!-- Y-Axis Labels -->
        <text x="${padding.left - 6}" y="${getY(16)}" font-size="9" fill="#899694" text-anchor="end">16</text>
        <text x="${padding.left - 6}" y="${getY(12)}" font-size="9" fill="#899694" text-anchor="end">12</text>
        <text x="${padding.left - 6}" y="${getY(8)}" font-size="9" fill="#899694" text-anchor="end">8</text>

        <!-- Area & Progression Line -->
        ${dataPoints.length > 1 ? `<path d="${areaD}" fill="url(#hbGradient)" />` : ''}
        ${dataPoints.length > 1 ? `<path d="${pathD}" fill="none" stroke="#0d4a46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}

        <!-- Data Point Nodes -->
        ${circles.join("")}
      </svg>
    `;

    container.innerHTML = svg;
  }
}

window.Charts = new ChartRenderer();
