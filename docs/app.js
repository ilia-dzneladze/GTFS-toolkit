// site/app.js
import { $, capitalize, escapeHtml, tierFromGapSec, colorFromTier, formatTimeWindow } from './scripts/utils.js';
import { ensureMap, getMap, clearMarkers, addMarker, fitBounds, invalidateSize } from './scripts/map_manager.js';

let CITIES = [];
const TOOLS = [
  { key: "heatmap", label: "Transit Heatmap" },
  { key: "frequency", label: "Stop Frequency" }
];
const DEFAULT_WINDOWS = ["16_18"];

const state = {
  city: CITIES[0],
  tool: "frequency",
  window: "16_18"
};

const el = {};

function setStatus(msg) {
  el.status.textContent = msg || "";
}

// ===== HASH ROUTING =====
function parseHash() {
  const [path, queryString] = (location.hash || "#/").split("?");
  const parts = path.replace(/^#\/?/, "").split("/").filter(Boolean);

  if (parts[0] && CITIES.includes(parts[0])) state.city = parts[0];
  if (parts[1] && TOOLS.some(t => t.key === parts[1])) state.tool = parts[1];

  const params = new URLSearchParams(queryString || "");
  const window = params.get("window");
  if (window && DEFAULT_WINDOWS.includes(window)) state.window = window;
}

function updateHash() {
  const query = state.tool === "frequency" ? `?window=${state.window}` : "";
  location.hash = `#/${state.city}/${state.tool}${query}`;
}

async function loadCities() {
  try {
    const res = await fetch('data/cities.json', { cache: "no-cache" });
    if (!res.ok) throw new Error("Manifest not found");
    CITIES = await res.json();
  } catch (e) {
    console.error("Could not load city list:", e);
    setStatus("Error loading configuration. Is data/cities.json missing?");
    CITIES = ["kaunas"]; // Fallback to prevent crash
  }
}

// ===== UI SETUP =====
function fillSelectors() {
  el.citySelect.innerHTML = CITIES.map(c => 
    `<option value="${c}">${capitalize(c)}</option>`
  ).join("");

  el.toolSelect.innerHTML = TOOLS.map(t => 
    `<option value="${t.key}">${t.label}</option>`
  ).join("");

  el.timeWindowSelect.innerHTML = DEFAULT_WINDOWS.map(w => 
    `<option value="${w}">${formatTimeWindow(w)}</option>`
  ).join("");
}

function syncSelectors() {
  el.citySelect.value = state.city;
  el.toolSelect.value = state.tool;
  el.timeWindowSelect.value = state.window;
  el.timeWindowWrap.style.display = state.tool === "frequency" ? "block" : "none";
}

// ===== RENDERING =====
async function render() {
  el.view.innerHTML = "";
  setStatus("");

  if (state.tool === "heatmap") {
    renderHeatmap();
  } else if (state.tool === "frequency") {
    await renderFrequency();
  }
}

function renderHeatmap() {
  const imgPath = `data/${state.city}/heatlines.png`;
  setStatus(`Loading heatmap: ${state.city}…`);

  const img = document.createElement("img");
  img.src = imgPath;
  img.alt = `${state.city} heatmap`;
  img.className = "heatmap";
  
  img.onerror = () => setStatus(`Could not load ${imgPath}`);
  img.onload = () => setStatus("");

  el.view.appendChild(img);
}

async function renderFrequency() {
  const jsonPath = `data/${state.city}/frequencies/frequency_${state.window}.json`;
  setStatus(`Loading stop frequency: ${state.city} (${state.window})…`);

  let payload;
  try {
    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    payload = await res.json();
  } catch (e) {
    setStatus(`Could not load ${jsonPath}. (${e.message})`);
    return;
  }

  setStatus("");
  const stops = payload.stops || [];

  // Preserve map container if it exists
  const existingMap = getMap();
  let mapDiv = existingMap ? existingMap.getContainer() : null;
  
  // Detach map from DOM before clearing
  if (mapDiv && mapDiv.parentNode) {
    mapDiv.parentNode.removeChild(mapDiv);
  }

  // Create layout
  el.view.innerHTML = `
    <div class="freq-layout">
      <div id="map" class="map"></div>
      <div class="freq-right">
        <div class="note">Showing all ${stops.length} stops (scroll to view).</div>
        <div class="table-scroll">
          <table class="freq-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Stop</th>
                <th>Avg gap (min)</th>
                <th>Lat</th>
                <th>Lon</th>
              </tr>
            </thead>
            <tbody>
              ${stops.map((s, i) => `
                <tr data-idx="${i}">
                  <td>${i + 1}</td>
                  <td>${escapeHtml(s.name || "")}</td>
                  <td>${(Number(s.avg_gap_sec) / 60).toFixed(1)}</td>
                  <td>${Number(s.lat).toFixed(5)}</td>
                  <td>${Number(s.lon).toFixed(5)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Reattach preserved map or use new container
  const mapContainer = el.view.querySelector("#map");
  if (mapDiv) {
    mapContainer.parentNode.replaceChild(mapDiv, mapContainer);
  }

  // Initialize map
  ensureMap();
  invalidateSize();
  clearMarkers();

  // Add markers
  const bounds = [];
  const markersByIndex = stops.map((s, i) => {
    const lat = Number(s.lat);
    const lon = Number(s.lon);
    const gap = Number(s.avg_gap_sec);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(gap)) {
      return null;
    }

    const tier = tierFromGapSec(gap);
    const color = colorFromTier(tier);
    const popup = `<b>${escapeHtml(s.name || "")}</b><br>Avg gap: ${(gap / 60).toFixed(1)} min`;

    const marker = addMarker(lat, lon, {
      radius: 5,
      color,
      fillColor: color,
      fillOpacity: 0.8,
      weight: 1
    }, popup);

    bounds.push([lat, lon]);
    return marker;
  });

  fitBounds(bounds);

  // Table interactions
  setupTableInteractions(markersByIndex);
}

function setupTableInteractions(markersByIndex) {
  const POP = { radius: 10, weight: 3, fillOpacity: 1.0 };
  const BASE = { radius: 5, weight: 1, fillOpacity: 0.8 };
  let highlighted = null;

  const unhighlight = () => {
    if (!highlighted) return;
    highlighted.setStyle({ weight: BASE.weight, fillOpacity: BASE.fillOpacity });
    highlighted.setRadius(BASE.radius);
    highlighted = null;
  };

  el.view.querySelectorAll("tbody tr").forEach(tr => {
    const idx = Number(tr.dataset.idx);
    const marker = markersByIndex[idx];
    if (!marker) return;

    tr.addEventListener("mouseenter", () => {
      if (highlighted && highlighted !== marker) unhighlight();
      highlighted = marker;
      marker.setStyle({ weight: POP.weight, fillOpacity: POP.fillOpacity });
      marker.setRadius(POP.radius);
      marker.bringToFront?.();
    });

    tr.addEventListener("mouseleave", () => {
      if (highlighted === marker) unhighlight();
    });

    tr.addEventListener("click", () => {
      const map = getMap();
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15));
      marker.openPopup();
    });
  });
}

// ===== EVENT BINDING =====
function bindEvents() {
  el.citySelect.addEventListener("change", () => {
    state.city = el.citySelect.value;
    updateHash();
  });

  el.toolSelect.addEventListener("change", () => {
    state.tool = el.toolSelect.value;
    updateHash();
  });

  el.timeWindowSelect.addEventListener("change", () => {
    state.window = el.timeWindowSelect.value;
    updateHash();
  });

  window.addEventListener("hashchange", () => {
    parseHash();
    syncSelectors();
    render();
  });
}

// ===== INIT =====
async function init() {
  el.citySelect = $("citySelect");
  el.toolSelect = $("toolSelect");
  el.timeWindowWrap = $("timeWindowWrap");
  el.timeWindowSelect = $("timeWindowSelect");
  el.status = $("status");
  el.view = $("view");

  // 1. Load the dynamic list of cities first
  await loadCities();

  // 2. Now fill the UI and parse the URL
  fillSelectors();
  parseHash();
  syncSelectors();
  bindEvents();
  render();
}

init();

init();