// site/scripts/mapManager.js - Leaflet map management

let map = null;
let markerLayer = null;
let resizeObserver = null;

export function ensureMap() {
  if (map) return map;

  const mapEl = document.getElementById("map");
  if (!mapEl) return null;

  map = L.map(mapEl);

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
