import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import "./index.css";
import App from "../App.tsx";
import { registerServiceWorker } from "./registerSW";
import { AuthProvider } from './keycloak/AuthProvider';

// Cria o cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </StrictMode>
    </QueryClientProvider>
  </AuthProvider>
);

// Registra o service worker
registerServiceWorker();