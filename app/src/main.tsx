import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Cuando el service worker nuevo toma el control (nueva versión desplegada),
// recarga automáticamente para que nadie se quede con la UI vieja cacheada.
let reloadedForNewVersion = false;
function reloadOnce() {
  if (reloadedForNewVersion) return;
  reloadedForNewVersion = true;
  window.location.reload();
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
}

// Si el navegador tenía cacheado un index.html viejo, puede intentar cargar un
// trozo de código (ej. la pantalla de "crear jugadores") cuyo archivo ya no
// existe porque se publicó una versión nueva. Sin esto, tocar un botón no
// hacía nada. Cualquier fallo de carga de un "chunk" -> recarga automática.
window.addEventListener("vite:preloadError", reloadOnce);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
