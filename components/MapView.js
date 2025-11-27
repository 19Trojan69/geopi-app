import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { supabase } from '@/lib/supabaseClient';

export default function MapView() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    if (!MAPTILER_KEY) {
      console.warn('MapTiler key missing. Set NEXT_PUBLIC_MAPTILER_KEY.');
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [0, 20],
      zoom: 2
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
          mapRef.current.setCenter([longitude, latitude]);
          mapRef.current.setZoom(11);

          new maplibregl.Marker({ color: '#ffd86b' })
            .setLngLat([longitude, latitude])
            .setPopup(new maplibregl.Popup().setText('Your location'))
            .addTo(mapRef.current);
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }

    async function loadPlaces() {
      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .limit(500);

        if (error) {
          console.error('Supabase error:', error);
          return;
        }

        if (!data) return;

        data.forEach((place) => {
          if (!place.longitude || !place.latitude) return;

          new maplibregl.Marker({ color: '#8c62ff' })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(
              new maplibregl.Popup().setHTML(
                `<strong>${place.name ?? 'GeoPi place'}</strong><br/>
                 ${place.city ?? ''} ${place.country ?? ''}<br/>
                 <small>${place.category ?? ''}</small>`
              )
            )
            .addTo(mapRef.current);
        });
      } catch (e) {
        console.error('Error loading places:', e);
      }
    }

    loadPlaces();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return <div ref={mapContainerRef} className="map-container" />;
}
