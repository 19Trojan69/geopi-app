import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div className="app-root">
      <Component {...pageProps} />
    </div>
  );
}
