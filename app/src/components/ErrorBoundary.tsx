import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

const RELOAD_KEY = 'beep_chunk_reload_ts';

function isChunkLoadError(error: Error): boolean {
  const m = (error?.message || '').toLowerCase();
  return m.includes('dynamically imported module') || m.includes('failed to fetch') || m.includes('loading chunk') || m.includes('importing a module script failed');
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);

    // Fallo típico tras publicar una versión nueva: el navegador tenía en caché
    // una versión vieja de la app y pide un trozo de código que ya no existe.
    // En vez de enseñar la pantalla de error, recargamos una vez sola.
    if (isChunkLoadError(error)) {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
        if (Date.now() - last > 10000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
        }
      } catch { /* ignore */ }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 16, maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ups… algo ha fallado 😅</h1>
        <p style={{ opacity: 0.85, marginBottom: 12 }}>
          Prueba a recargar. Si acabamos de actualizar la app, tu móvil puede tener guardada una versión vieja:
          cierra esta pestaña/la app y vuelve a abrirla.
        </p>
        <details style={{ whiteSpace: 'pre-wrap', opacity: 0.8 }}>
          <summary>Ver detalle técnico</summary>
          {String(this.state.error)}
        </details>
        <button
          style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}
          onClick={() => window.location.reload()}
        >
          Recargar
        </button>
      </div>
    );
  }
}
