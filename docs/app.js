// site/app.js

const CITIES = ["kaunas", "vilnius"]; // later: auto-discover via meta.json
const TOOLS = [
  { key: "heatmap", label: "Transit Heatmap" },
  { key: "frequency", label: "Stop Frequency" }
];

// Default windows (until you add meta.json)
const DEFAULT_WINDOWS = ["16_18"];

const state = {
  page: "app",     // "app" | "about"
  city: CITIES[0],
  tool: "frequency",
  window: "16_18"
};

const el = {
  citySelect: null,
  toolSelect: null,
  timeWindowWrap: null,
  timeWindowSelect: null,
  status: null,
  view: null
};

function $(id) { return document.getElementById(id); }

function setStatus(msg) {
  el.status.textContent = msg || "";
}

let resizeTimer = null;

window.addEventListener("resize", () => {
  if (!map) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    map.invalidateSize();
  }, 150);
});


function parseHash() {
  // Hash patterns:
  // #/ -> app default
  // #/about
  // #/kaunas/heatmap
  // #/kaunas/frequency?window=16_18
  const raw = location.hash || "#/";
  const [path, queryString] = raw.split("?");
  const parts = path.replace(/^#\/?/, "").split("/").filter(Boolean);

  if (parts[0] === "about") {
    state.page = "about";
    return;
  }

  state.page = "app";

  if (parts.length >= 1) state.city = parts[0];
  if (parts.length >= 2) state.tool = parts[1];

  const params = new URLSearchParams(queryString || "");
  if (params.get("window")) state.window = params.get("window");

  // Validate
  if (!CITIES.includes(state.city)) state.city = CITIES[0];
  if (!TOOLS.some(t => t.key === state.tool)) state.tool = "heatmap";
  if (!DEFAULT_WINDOWS.includes(state.window)) state.window = DEFAULT_WINDOWS[0];
}

function updateHashFromState() {
  if (state.page === "about") {
    location.hash = "#/about";
    return;
  }
  const q = state.tool === "frequency" ? `?window=${encodeURIComponent(state.window)}` : "";
  location.hash = `#/${state.city}/${state.tool}${q}`;
}

function fillSelectors() {
  // Cities
  el.citySelect.innerHTML = CITIES.map(c => `<option value="${c}">${capitalize(c)}</option>`).join("");

  // Tools
  el.toolSelect.innerHTML = TOOLS.map(t => `<option value="${t.key}">${t.label}</option>`).join("");

  // Windows (only for frequency)
  el.timeWindowSelect.innerHTML = DEFAULT_WINDOWS.map(w => `<option value="${w}">${w.replace("_", ":00-")}:00</option>`).join("");
}

function syncSelectorsToState() {
  el.citySelect.value = state.city;
  el.toolSelect.value = state.tool;
  el.timeWindowSelect.value = state.window;

  el.timeWindowWrap.style.display = (state.tool === "frequency") ? "block" : "none";
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

async function render() {
  el.view.innerHTML = "";
  setStatus("");

  if (state.page === "about") {
    el.view.innerHTML = `
      <div class="card">
        <h2>About</h2>
        <p>This is a static GTFS analysis demo: Python generates PNG/JSON into <code>site/data/</code>,
        and this frontend loads it directly.</p>
      </div>
    `;
    return;
  }

  if (state.tool === "heatmap") {
    await renderHeatmap();
  } else if (state.tool === "frequency") {
    await renderFrequency();
  }
}

async function renderHeatmap() {
  const imgPath = `data/${state.city}/heatlines.png`;

  setStatus(`Loading heatmap: ${state.city}…`);

  // Render as an <img>. If it 404s, onerror will show message.
  const img = document.createElement("img");
  img.src = imgPath;
  img.alt = `${state.city} heatmap`;
  img.className = "heatmap";

  img.onerror = () => {
    setStatus(`Could not load ${imgPath}. Did you generate it into site/data/${state.city}/heatlines.png?`);
  };

  img.onload = () => {
    setStatus("");
  };

  el.view.appendChild(img);
}

// map helpers
function tierFromGapSec(gapSec) {
  const min = gapSec / 60;
  if (min <= 15) return "high";
  if (min <= 30) return "medium";
  return "low";
}

function colorFromTier(tier) {
  if (tier === "high") return "#2ecc71";   // green
  if (tier === "medium") return "#f1c40f"; // yellow
  return "#e74c3c";                         // red
}

let mapResizeObserver = null;

function hookMapResize() {
  const mapEl = document.getElementById("map");
  if (!mapEl || !map || mapResizeObserver) return;

  mapResizeObserver = new ResizeObserver(() => {
    // Leaflet needs a tick after layout changes
    requestAnimationFrame(() => {
      map.invalidateSize(true);
    });
  });

  mapResizeObserver.observe(mapEl);
}


// map logic
let map = null;
let markerLayer = null;

function ensureMap() {
  if (map) return;

  map = L.map("map");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  hookMapResize();
}

function clearMapMarkers() {
  if (markerLayer) markerLayer.clearLayers();
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
    setStatus(`Could not load ${jsonPath}. Did you generate it? (${e.message})`);
    return;
  }

  setStatus("");

  const stops = payload.stops || [];

  // --- Preserve Leaflet's container BEFORE clearing the view ---
  // If map exists, always reuse Leaflet's owned container
  let mapDiv = map ? map.getContainer() : document.getElementById("map");

  // Detach from DOM so innerHTML wipe doesn't delete it
  if (mapDiv && mapDiv.parentNode) {
    mapDiv.parentNode.removeChild(mapDiv);
  }

  // Clear view
  el.view.innerHTML = "";

  // If there was no mapDiv yet, create it
  if (!mapDiv) {
    mapDiv = document.createElement("div");
    mapDiv.id = "map";
  }
  mapDiv.className = "map";

  // Build layout container: [MAP] [RIGHT(note+table)]
  const layout = document.createElement("div");
  layout.className = "freq-layout";

  // Left: map
  layout.appendChild(mapDiv);

  // Right: note + table
  const right = document.createElement("div");
  right.className = "freq-right";
  layout.appendChild(right);

  el.view.appendChild(layout);

  // Ensure Leaflet map exists and is bound to #map
  // (If map already exists, ensureMap() will just return)
  ensureMap();

  // IMPORTANT: Leaflet needs resize invalidation after DOM/layout changes
  requestAnimationFrame(() => {
    map.invalidateSize(true);
  });

  // Clear old markers + add new ones
  clearMapMarkers();

  const bounds = [];
  const markersByIndex = new Array(stops.length).fill(null);

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];

    const lat = Number(s.lat);
    const lon = Number(s.lon);
    const gap = Number(s.avg_gap_sec);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(gap)) continue;

    const tier = tierFromGapSec(gap);
    const col = colorFromTier(tier);

    const marker = L.circleMarker([lat, lon], {
      radius: 5,
      color: col,
      fillColor: col,
      fillOpacity: 0.8,
      weight: 1
    }).bindPopup(
      `<b>${escapeHtml(s.name || "")}</b><br>Avg gap: ${(gap / 60).toFixed(1)} min`
    );

    marker.addTo(markerLayer);
    markersByIndex[i] = marker;
    bounds.push([lat, lon]);
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [30, 30] });
    // after fitBounds, sometimes Leaflet still needs a final invalidate
    requestAnimationFrame(() => map.invalidateSize(true));
  }

  // NOTE
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = `Showing all ${stops.length} stops (scroll to view).`;
  right.appendChild(note);

  // TABLE
  const table = document.createElement("table");
  table.className = "freq-table";

  table.innerHTML = `
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
      ${stops
        .map(
          (s, i) => `
        <tr data-idx="${i}">
          <td>${i + 1}</td>
          <td>${escapeHtml(s.name || "")}</td>
          <td>${(Number(s.avg_gap_sec) / 60).toFixed(1)}</td>
          <td>${Number(s.lat).toFixed(5)}</td>
          <td>${Number(s.lon).toFixed(5)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";
  wrapper.appendChild(table);
  right.appendChild(wrapper);

  // Hover + click behavior: pop markers
  const POP_STYLE = { radius: 10, weight: 3, fillOpacity: 1.0 };
  const BASE_STYLE = { radius: 5, weight: 1, fillOpacity: 0.8 };

  let highlighted = null;

  function unhighlight() {
    if (!highlighted) return;
    highlighted.setStyle({ weight: BASE_STYLE.weight, fillOpacity: BASE_STYLE.fillOpacity });
    highlighted.setRadius(BASE_STYLE.radius);
    highlighted = null;
  }

  wrapper.querySelectorAll("tbody tr").forEach((tr) => {
    const idx = Number(tr.dataset.idx);
    const marker = markersByIndex[idx];

    tr.addEventListener("mouseenter", () => {
      if (!marker) return;

      if (highlighted && highlighted !== marker) unhighlight();

      highlighted = marker;
      marker.setStyle({ weight: POP_STYLE.weight, fillOpacity: POP_STYLE.fillOpacity });
      marker.setRadius(POP_STYLE.radius);
      if (marker.bringToFront) marker.bringToFront();
    });

    tr.addEventListener("mouseleave", () => {
      if (highlighted === marker) unhighlight();
    });

    tr.addEventListener("click", () => {
      if (!marker) return;
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15));
      marker.openPopup();
    });
  });
}



function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  el.citySelect.addEventListener("change", () => {
    state.city = el.citySelect.value;
    updateHashFromState();
  });

  el.toolSelect.addEventListener("change", () => {
    state.tool = el.toolSelect.value;
    updateHashFromState();
  });

  el.timeWindowSelect.addEventListener("change", () => {
    state.window = el.timeWindowSelect.value;
    updateHashFromState();
  });

  window.addEventListener("hashchange", () => {
    parseHash();
    syncSelectorsToState();
    render();
  });
}

function init() {
  el.citySelect = $("citySelect");
  el.toolSelect = $("toolSelect");
  el.timeWindowWrap = $("timeWindowWrap");
  el.timeWindowSelect = $("timeWindowSelect");
  el.status = $("status");
  el.view = $("view");

  fillSelectors();
  parseHash();
  syncSelectorsToState();
  bindEvents();
  render();
}

init();
