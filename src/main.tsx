import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "../App.tsx";
import { registerServiceWorker } from "./registerSW";
import { AuthProvider } from './keycloak/AuthProvider';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
  <StrictMode>
    <App />
  </StrictMode>
  </AuthProvider>
);

// Registra o service worker
registerServiceWorker();