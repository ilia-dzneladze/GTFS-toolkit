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
  tool: "heatmap",
  window: DEFAULT_WINDOWS[0]
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
      ${stops.map((s, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(s.name || "")}</td>
          <td>${(Number(s.avg_gap_sec) / 60).toFixed(1)}</td>
          <td>${Number(s.lat).toFixed(5)}</td>
          <td>${Number(s.lon).toFixed(5)}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  const note = document.createElement("div");
  note.className = "note";
  note.textContent = `Showing all ${stops.length} stops (scroll to view).`;

  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";
  wrapper.appendChild(table);

  el.view.appendChild(note);
  el.view.appendChild(wrapper);
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
