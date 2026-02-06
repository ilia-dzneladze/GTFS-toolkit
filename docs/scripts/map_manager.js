// site/scripts/mapManager.js - Leaflet map management

let map = null;
let markerLayer = null;
let geoJsonLayer = null;
let resizeObserver = null;

export function ensureMap() {
  if (map) return map;

  const mapEl = document.getElementById("map");
  if (!mapEl) return null;

  map = L.map(mapEl, {
    preferCanvas: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  // Handle resize
  resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => map.invalidateSize(true));
  });
  resizeObserver.observe(mapEl);

  return map;
}

export function getMap() {
  return map;
}


export function clearMarkers() {
  if (markerLayer) markerLayer.clearLayers();
  if (geoJsonLayer) geoJsonLayer.clearLayers();
}

export function removeMap() {
  if (map) {
    map.remove();
    map = null;
    markerLayer = null;
    geoJsonLayer = null;
  }
}

export function addMarker(lat, lon, options, popupContent) {
  if (!markerLayer) return null;

  const marker = L.circleMarker([lat, lon], options);

  if (popupContent) {
    marker.bindPopup(popupContent);
  }

  marker.addTo(markerLayer);
  return marker;
}

export function addGeoJsonLayer(data, styleCallback) {
  if (!map) return;

  // Ensure layer group exists
  if (!geoJsonLayer) {
    geoJsonLayer = L.layerGroup().addTo(map);
  } else {
    geoJsonLayer.clearLayers();
  }

  const layer = L.geoJSON(data, {
    style: styleCallback
  });

  layer.addTo(geoJsonLayer);

  // Fit map to data
  if (data.features.length > 0) {
    map.fitBounds(layer.getBounds());
  }
}

export function fitBounds(bounds, options = { padding: [30, 30] }) {
  if (map && bounds.length > 0) {
    map.fitBounds(bounds, options);
    requestAnimationFrame(() => map.invalidateSize(true));
  }
}

export function invalidateSize() {
  if (map) {
    requestAnimationFrame(() => map.invalidateSize(true));
  }
}
