import { supabase } from "../lib/supabaseClient.js";

// Optional: Pi SDK initialisieren, falls wir im Pi Browser sind
function initPiSDK() {
  if (window.Pi) {
    try {
      Pi.init({ version: "2.0", sandbox: false });
      console.log("Pi SDK initialisiert");
    } catch (err) {
      console.error("Fehler beim Initialisieren des Pi SDK:", err);
    }
  } else {
    console.log("Pi SDK nicht verfügbar (normaler Browser) – kein Problem.");
  }
}

// Beispiel: Orte aus Supabase laden
async function loadPlaces() {
  try {
    const { data, error } = await supabase.from("places").select("*");

    if (error) {
      console.error("Fehler beim Laden der Orte:", error);
      return;
    }

    console.log("Geladene Orte:", data);

    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = "";

    if (!data || data.length === 0) {
      resultsContainer.textContent = "Keine Orte gefunden.";
      return;
    }

    data.forEach((place) => {
      const div = document.createElement("div");
      div.className = "place-item";
      div.textContent = place.name || "Unbenannter Ort";
      resultsContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Unerwarteter Fehler beim Laden der Orte:", err);
  }
}

// Später: hier Map initialisieren (MapLibre etc.)
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("#map nicht gefunden");
    return;
  }

  // Platzhalter – hier kommt später deine echte Kartenlogik rein
  mapElement.innerHTML =
    "<p style='padding:1rem;'>Karte wird später initialisiert…</p>";
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("GeoPi App gestartet");

  initPiSDK();
  initMap();
  loadPlaces();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const value = event.target.value;
      console.log("Suche:", value);
      // Später: Filter-Logik anpassen
    });
  }
});
