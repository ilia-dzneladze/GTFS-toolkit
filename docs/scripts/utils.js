// site/scripts/utils.js - Helper utilities

export function $(id) {
  return document.getElementById(id);
}

export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function tierFromGapSec(gapSec) {
  const min = gapSec / 60;
  if (min <= 15) return "high";
  if (min <= 30) return "medium";
  return "low";
}

export function colorFromTier(tier) {
  const colors = {
    high: "#2ecc71",    // green
    medium: "#f1c40f",  // yellow
    low: "#e74c3c"      // red
  };
  return colors[tier] || colors.low;
}

export function formatTimeWindow(window) {
  return window.replace("_", ":00-") + ":00";
}

// 0..1 -> Color from ["#00BFFF", "#00FF00", "#FFFF00", "#FF4500", "#FF0000"]
export function getHeatmapColor(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    [0.00, [0, 191, 255]], // #00BFFF
    [0.25, [0, 255, 0]], // #00FF00
    [0.50, [255, 255, 0]], // #FFFF00
    [0.75, [255, 69, 0]], // #FF4500
    [1.00, [255, 0, 0]]  // #FF0000
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const [t1, c1] = stops[i];
    const [t2, c2] = stops[i + 1];
    if (t >= t1 && t <= t2) {
      const f = (t - t1) / (t2 - t1);
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);
      return `rgb(${r},${g},${b})`;
    }
  }
  return "rgb(255,0,0)";
}