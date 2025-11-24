// ===========================================
// GeoPi – App-Logik (bereinigte Version)
// ===========================================

// Supabase-Client EINMAL importieren
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ============================
// KONFIGURATION
// ============================
const MAPTILER_KEY = "CreAh02QGNcepAT2Zcfm";
const SUPABASE_URL = "https://mubfgqihjdczrsadrhhz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YmZncWloamRjenJzYWRyaGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDczMTAsImV4cCI6MjA3ODc4MzMxMH0.0i2S0o4rOB4I2Np-tPnvMjYfIsB_CZZdZ5w_I83UAk4";
const TABLE_NAME = "places";

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// ============================
// MAP INITIALISIEREN
// ============================

const map = new maplibregl.Map({
  container: "map",
  style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
  center: [14.2858, 48.3069],
  zoom: 11,
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

// ============================
// STATUS & KOORDINATEN
// ============================

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

// ============================
// GEOLOCATION
// ============================

function createCurrentLocationMarker(lng, lat) {
  const el = document.createElement("div");
  el.className = "current-location-marker";
  new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map);
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setCenter([longitude, latitude]);
      map.setZoom(13);
      createCurrentLocationMarker(longitude, latitude);
      updateCoordPills(latitude, longitude);
      setStatus(
        "GeoPi Karte geladen – aktueller Standort erkannt und im Formular vorbelegt."
      );
    },
    (err) => {
      console.warn("Geolocation Error", err);
      setStatus(
        "GeoPi Karte geladen – Standort konnte nicht automatisch ermittelt werden."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
} else {
  setStatus(
    "GeoPi Karte geladen – Geolocation wird von diesem Gerät nicht unterstützt."
  );
}

// ============================
// SUPABASE INITIALISIEREN
// ============================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================
// MARKER & Routen-Logik
// ============================

function openRoute(lat, lng) {
  const latLng = `${lat},${lng}`;
  const url = isIOS
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(latLng)}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        latLng
      )}`;
  window.open(url, "_blank");
}

function createPiMarker(place) {
  const el = document.createElement("div");
  el.className = "pi-marker";

  const popupDiv = document.createElement("div");
  popupDiv.className = "geopi-popup";

  const name = place.name || "GeoPi Location";
  const city = place.city || "";
  const category = place.category || "";
  const desc = place.description || "";

  const titleEl = document.createElement("h3");
  titleEl.textContent = name;
  popupDiv.appendChild(titleEl);

  if (city) {
    const cityP = document.createElement("p");
    cityP.textContent = city;
    popupDiv.appendChild(cityP);
  }

  if (category) {
    const catP = document.createElement("p");
    catP.textContent = `Kategorie: ${category}`;
    popupDiv.appendChild(catP);
  }

  if (desc) {
    const descP = document.createElement("p");
    descP.textContent = desc;
    popupDiv.appendChild(descP);
  }

  const routeBtn = document.createElement("button");
  routeBtn.type = "button";
  routeBtn.className = "route-btn";
  routeBtn.innerHTML = '<span>🧭</span><span>Route anzeigen</span>';
  routeBtn.addEventListener("click", () => {
    openRoute(place.latitude, place.longitude);
  });
  popupDiv.appendChild(routeBtn);

  const popup = new maplibregl.Popup({ offset: 24 }).setDOMContent(popupDiv);

  new maplibregl.Marker(el)
    .setLngLat([place.longitude, place.latitude])
    .setPopup(popup)
    .addTo(map);
}

// ============================
// LOCATIONS AUS SUPABASE LADEN
// ============================

async function loadPlaces() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .limit(500);

    if (error) throw error;
    if (!data) return;

    data.forEach((place) => {
      if (place.longitude && place.latitude) {
        createPiMarker(place);
      }
    });
  } catch (err) {
    console.error("Fehler beim Laden der Locations:", err);
    setStatus("Locations konnten nicht geladen werden (Supabase-Fehler).");
  }
}

loadPlaces();

// ============================
// REGISTRIER-SHEET
// ============================

const sheetBackdrop = document.getElementById("sheet-backdrop");
const openRegisterBtn = document.getElementById("open-register");
const closeSheetBtn = document.getElementById("close-sheet");
const locationForm = document.getElementById("location-form");
const submitBtn = document.getElementById("submit-location");

function openSheet() {
  if (sheetBackdrop) sheetBackdrop.style.display = "flex";
}

function closeSheet() {
  if (sheetBackdrop) sheetBackdrop.style.display = "none";
}

if (openRegisterBtn) {
  openRegisterBtn.addEventListener("click", openSheet);
}
if (closeSheetBtn) {
  closeSheetBtn.addEventListener("click", closeSheet);
}
if (sheetBackdrop) {
  sheetBackdrop.addEventListener("click", (e) => {
    if (e.target === sheetBackdrop) {
      closeSheet();
    }
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
      latitude:
        hiddenLat && hiddenLat.value ? Number(hiddenLat.value) : null,
      longitude:
        hiddenLng && hiddenLng.value ? Number(hiddenLng.value) : null,
    };

    if (!payload.latitude || !payload.longitude) {
      alert("Koordinaten fehlen. Bitte Standortfreigabe prüfen.");
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
      if (data) {
        createPiMarker(data);
        locationForm.reset();
        updateCoordPills(payload.latitude, payload.longitude);
        closeSheet();
        setStatus(
          "Location gespeichert. Marker mit Pi-Logo wurde hinzugefügt."
        );
      }
    } catch (err) {
      console.error("Fehler beim Speichern der Location:", err);
      alert("Speichern fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ============================
// Pi SDK initialisieren
// ============================

function initPiSdk() {
  if (!window.Pi) {
    console.warn("Pi SDK nicht gefunden – bitte im Pi Browser öffnen.");
    return;
  }

  try {
    window.Pi.init({
      version: "2.0",
      sandbox: true, // GeoPi läuft im Testnet
      onIncompletePaymentFound: (payment) => {
        console.log("Unvollständige Zahlung gefunden:", payment);
      },
    });
    console.log("Pi SDK initialisiert.");
  } catch (err) {
    console.error("Fehler bei Pi.init:", err);
  }
}

// Beim Laden der Seite direkt initialisieren
initPiSdk();

// ============================
// TESTZAHLUNG 0.01 Test-Pi
// ============================

async function handleGeoPiTestPayment() {
  try {
    if (!window.Pi) {
      alert("Pi SDK nicht verfügbar. Bitte im Pi Browser öffnen.");
      return;
    }

    const paymentData = {
      amount: 0.01,
      memo: "GeoPi Testzahlung 0.01 Test-Pi",
      metadata: {
        app: "GeoPi",
        purpose: "test-payment",
        version: "1.0.1",
      },
    };

    const callbacks = {
      onReadyForServerApproval: (paymentId) => {
        console.log("onReadyForServerApproval:", paymentId);
        // aktuell kein Backend – in der Sandbox reicht das Logging
      },
      onReadyForServerCompletion: (paymentId, txid) => {
        console.log("onReadyForServerCompletion:", paymentId, txid);
        alert("Testzahlung erfolgreich abgeschlossen 🎉");
      },
      onCancel: (paymentId) => {
        console.log("Payment abgebrochen:", paymentId);
        alert("Zahlung wurde abgebrochen.");
      },
      onError: (error, paymentId) => {
        console.error("Pi Payment Error:", error, paymentId);
        alert("Fehler beim Payment: " + (error?.message || error));
      },
    };

    console.log("Starte GeoPi Testzahlung…", paymentData);

    const payment = await window.Pi.createPayment(paymentData, callbacks);
    console.log("Payment erzeugt:", payment);
  } catch (err) {
    console.error("Unerwarteter Fehler beim Payment:", err);
    alert("Unerwarteter Fehler beim Payment.");
  }
}

// Button mit Handler verbinden
const testpayBtn = document.getElementById("testpay-btn");
if (testpayBtn) {
  testpayBtn.addEventListener("click", handleGeoPiTestPayment);
}

