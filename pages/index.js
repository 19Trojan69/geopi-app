import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false
});

export default function Home() {
  return (
    <>
      <header className="top-bar">
        <div>
          <div className="top-bar-title">GeoPi – Pi Merchant Map</div>
          <div className="top-bar-sub">
            Discover real-world businesses and services that accept Pi.
          </div>
        </div>
        <div className="top-bar-sub">
          Powered by Pi Network • Supabase • MapLibre
        </div>
      </header>

      <main className="main-layout">
        <section className="map-wrapper">
          <MapView />
        </section>
        <section className="status-panel">
          <span className="status-highlight">Status:</span>{' '}
          GeoPi map loaded. Your browser location is used only locally to center the map.
        </section>
      </main>
    </>
  );
}
