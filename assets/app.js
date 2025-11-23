// ======================================
// Supabase-Client laden
// ======================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ======================================
// KONFIGURATION
// ======================================
const MAPTILER_KEY = "CreAh02QGNcepAT2Zcfm"; // optional, aktuell nicht aktiv
const SUPABASE_URL = "https://mubfgqihjdczrsadrhhz.supabase.co";
const SUPABASE_ANON_KEY = "HIER_DEIN_NEUER_ANON_KEY"; // <-- Bitte ersetzen!
const TABLE_NAME = "places";

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// ======================================
// MAP INITIALISIEREN
// ======================================

// 💡 Für Stabilität: erst Demo-Style → später MapTiler aktivieren
const map = new maplibregl.Map({
  container: "map",

  // Sicher funktionierender Demo-Style
  style: "https://demotiles.maplibre.org/style.json",

  // Später kannst du wieder aktivieren:
  // style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,

  center: [14.2858, 48.3069],
  zoom: 3,
  renderWorldCopies: false,
  attributionControl: true,
});

map.setMaxBounds([
  [-180, -85],
  [180, 85],
]);

map.addControl(
  new maplibregl.NavigationControl({ visualizePitch: true }),
  "top-right"
);

// ======================================
// ELEMENTE
// ======================================
const statusText = document.getElementById("status-text");
const coordLatEl = document.getElementById("coord-lat");
const coordLngEl = document.getElementById("coord-lng");
const hiddenLat = document.getElementById("latitude");
const hiddenLng = document.getElementById("longitude");

function setStatus(text) {
  if (statusText) statusText.textContent = text;
}

function updateCoordPills(lat, lng) {
  if (coordLatEl) coordLatEl.textContent = `Lat: ${lat.toFixed(5)}`;
  if (coordLngEl) coordLngEl.textContent = `Lng: ${lng.toFixed(5)}`;
  if (hiddenLat) hiddenLat.value = String(lat);
  if (hiddenLng) hiddenLng.value = String(lng);
}

function createCurrentLocationMarker(lng, lat) {
  const el = document.createElement("div");
  el.className = "current-location-marker";
  new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map);
}

// ======================================
// GEOLOCATION
// ======================================
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setCenter([longitude, latitude]);
      map.setZoom(13);
      createCurrentLocationMarker(longitude, latitude);
      updateCoordPills(latitude, longitude);
      setStatus("GeoPi Karte geladen – Standort erkannt.");
    },
    (err) => {
      console.warn("Geolocation Error", err);
      setStatus("Standort konnte nicht automatisch ermittelt werden.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
} else {
  setStatus("Geolocation wird nicht unterstützt.");
}

// ======================================
// SUPABASE CLIENT
// ======================================
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================================
// MARKER RENDERN
// ======================================
function createPiMarker(place) {
  const el = document.createElement("div");
  el.className = "pi-marker";

  const popupDiv = document.createElement("div");
  popupDiv.className = "geopi-popup";

  const titleEl = document.createElement("h3");
  titleEl.textContent = place.name || "GeoPi Location";
  popupDiv.appendChild(titleEl);

  if (place.city) {
    const p = document.createElement("p");
    p.textContent = place.city;
    popupDiv.appendChild(p);
  }

  if (place.category) {
    const p = document.createElement("p");
    p.textContent = `Kategorie: ${place.category}`;
    popupDiv.appendChild(p);
  }

  if (place.description) {
    const p = document.createElement("p");
    p.textContent = place.description;
    popupDiv.appendChild(p);
  }

  const routeBtn = document.createElement("button");
  routeBtn.type = "button";
  routeBtn.className = "route-btn";
  routeBtn.innerHTML = "🧭 Route anzeigen";
  routeBtn.addEventListener("click", () =>
    openRoute(place.latitude, place.longitude)
  );
  popupDiv.appendChild(routeBtn);

  const popup = new maplibregl.Popup({ offset: 24 }).setDOMContent(popupDiv);

  new maplibregl.Marker(el)
    .setLngLat([place.longitude, place.latitude])
    .setPopup(popup)
    .addTo(map);
}

// ======================================
// ROUTING
// ======================================
function openRoute(lat, lng) {
  const latLng = `${lat},${lng}`;
  let url;

  if (isIOS) {
    url = `https://maps.apple.com/?daddr=${encodeURIComponent(latLng)}`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latLng)}`;
  }

  window.open(url, "_blank");
}

// ======================================
// LOCATIONS LADEN
// ======================================
async function loadPlaces() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .limit(500);

    if (error) throw error;
    if (!data) return;

    data.forEach((p) => {
      if (p.latitude && p.longitude) createPiMarker(p);
    });
  } catch (err) {
    console.error("Fehler beim Laden:", err);
    setStatus("Locations konnten nicht geladen werden.");
  }
}

loadPlaces();

// ======================================
// REGISTRIER-SHEET
// ======================================
const sheetBackdrop = document.getElementById("sheet-backdrop");
const openRegisterBtn = document.getElementById("open-register");
const closeSheetBtn = document.getElementById("close-sheet");
const locationForm = document.getElementById("location-form");
const submitBtn = document.getElementById("submit-location");

function openSheet() {
  sheetBackdrop.style.display = "flex";
}

function closeSheet() {
  sheetBackdrop.style.display = "none";
}

if (openRegisterBtn) openRegisterBtn.addEventListener("click", openSheet);
if (closeSheetBtn) closeSheetBtn.addEventListener("click", closeSheet);

if (sheetBackdrop) {
  sheetBackdrop.addEventListener("click", (e) => {
    if (e.target === sheetBackdrop) closeSheet();
  });
}

if (locationForm) {
  locationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    const formData = new FormData(locationForm);

    const payload = {
      name: formData.get("name")?.toString() || null,
      category: formData.get("category")?.toString() || null,
      city: formData.get("city")?.toString() || null,
      country: formData.get("country")?.toString() || null,
      description: formData.get("description")?.toString() || null,
      latitude: hiddenLat ? Number(hiddenLat.value) : null,
      longitude: hiddenLng ? Number(hiddenLng.value) : null,
    };

    if (!payload.latitude || !payload.longitude) {
      alert("Koordinaten fehlen!");
      return;
    }

    submitBtn.disabled = true;

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      createPiMarker(data);
      locationForm.reset();
      closeSheet();
      setStatus("Location gespeichert und Marker hinzugefügt!");
    } catch (err) {
      console.error(err);
      alert("Speichern fehlgeschlagen.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ======================================
// TESTZAHLUNG (Platzhalter)
// ======================================
const testpayBtn = document.getElementById("testpay-btn");
if (testpayBtn) {
  testpayBtn.addEventListener("click", () =>
    alert("Testzahlung 0.01 Test-Pi — SDK folgt später.")
  );
}
