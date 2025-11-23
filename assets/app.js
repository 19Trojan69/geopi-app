// ===============================
// Minimal GeoPi Map (Nur Karte)
// ===============================

// Map initialisieren – DEMO-STYLE (ohne API-Key)
const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [14.2858, 48.3069], // Linz als Start
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

// Optional: Geolocation + Marker, aber ohne Supabase
const statusEl = document.createElement("div");

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setCenter([longitude, latitude]);
      map.setZoom(12);

      const el = document.createElement("div");
      el.className = "current-location-marker";
      new maplibregl.Marker(el).setLngLat([longitude, latitude]).addTo(map);
    },
    () => {
      // ignorieren, Karte läuft trotzdem
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

// Testzahlung-Button (damit nichts kaputt geht)
const testpayBtn = document.getElementById("testpay-btn");
if (testpayBtn) {
  testpayBtn.addEventListener("click", () => {
    alert("Testzahlung 0.01 Test-Pi – Pi SDK folgt später.");
  });
}

