import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// After a deploy, vite-plugin-pwa activates a new SW while this tab may still run an
// old JS bundle whose dynamic import() URLs no longer exist on the server. Vercel then
// serves index.html for those missing /assets/*.js requests (wrong MIME). Reload once a
// new worker is installed while we already had a controller (update path, not first visit).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Avoid top-level await: Vite's production target (es2020) does not emit it.
  void (async () => {
    const registration = await navigator.serviceWorker.ready;
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          globalThis.location.reload();
        }
      });
    });
  })();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
