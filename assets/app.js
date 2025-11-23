import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

    // ============================
    // KONFIGURATION
    // ============================
    const MAPTILER_KEY = "CreAh02QGNcepAT2Zcfm"; // TODO: ersetzen
    const SUPABASE_URL = "https://mubfgqihjdczrsadrhhz.supabase.co"; // TODO
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YmZncmloamRjenJzYWRyaGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3NjI0MDksImV4cCI6MjA0NzMzODQwOX0.KwGieF0kP0xXo7frx1yX9oJXWvLaGybhoVN-d4G8Sho"; // TODO
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
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const statusText = document.getElementById("status-text");
    const coordLatEl = document.getElementById("coord-lat");
    const coordLngEl = document.getElementById("coord-lng");
    const hiddenLat = document.getElementById("latitude");
    const hiddenLng = document.getElementById("longitude");

    function setStatus(text) {
      if (statusText) statusText.textContent = text;
    }

    function createCurrentLocationMarker(lng, lat) {
      const el = document.createElement("div");
      el.className = "current-location-marker";
      new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map);
    }

    function updateCoordPills(lat, lng) {
      if (coordLatEl) coordLatEl.textContent = `Lat: ${lat.toFixed(5)}`;
      if (coordLngEl) coordLngEl.textContent = `Lng: ${lng.toFixed(5)}`;
      if (hiddenLat) hiddenLat.value = String(lat);
      if (hiddenLng) hiddenLng.value = String(lng);
    }

    // Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setCenter([longitude, latitude]);
          map.setZoom(13);
          createCurrentLocationMarker(longitude, latitude);
          updateCoordPills(latitude, longitude);
          setStatus("GeoPi Karte geladen – aktueller Standort erkannt und im Formular vorbelegt.");
        },
        (err) => {
          console.warn("Geolocation Error", err);
          setStatus("GeoPi Karte geladen – Standort konnte nicht automatisch ermittelt werden.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setStatus("GeoPi Karte geladen – Geolocation wird von diesem Gerät nicht unterstützt.");
    }

    // ============================
    // SUPABASE
    // ============================
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    function openRoute(lat, lng) {
      const latLng = `${lat},${lng}`;
      let url;
      if (isIOS) {
        url = `https://maps.apple.com/?daddr=${encodeURIComponent(latLng)}&dirflg=d`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latLng)}`;
      }
      window.open(url, "_blank");
    }

    function createPiMarker(place) {
      const el = document.createElement("div");
      el.className = "pi-marker";

      const name = place.name || "GeoPi Location";
      const city = place.city || "";
      const category = place.category || "";
      const desc = place.description || "";

      const popupDiv = document.createElement("div");
      popupDiv.className = "geopi-popup";

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
          latitude: hiddenLat && hiddenLat.value ? Number(hiddenLat.value) : null,
          longitude: hiddenLng && hiddenLng.value ? Number(hiddenLng.value) : null,
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
            setStatus("Location gespeichert. Marker mit Pi-Logo wurde hinzugefügt.");
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
    // Testzahlung (Platzhalter)
    // ============================
    const testpayBtn = document.getElementById("testpay-btn");
    if (testpayBtn) {
      testpayBtn.addEventListener("click", () => {
        alert("Testzahlung 0.01 Test-Pi – Pi SDK Integration folgt in einem späteren Build.");
      });
    }
