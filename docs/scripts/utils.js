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