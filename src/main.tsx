import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import "./index.css";
import App from "../App.tsx";
import { registerServiceWorker } from "./registerSW";
import { runIndexedDbCachePolicyIfNewBuild } from "./services/appBuildCachePolicy";
import { AuthProvider } from './keycloak/AuthProvider';
import { RetryNotification } from './components/RetryNotification';
import { useRetryNotification } from './hooks/useRetryNotification';
import './utils/axiosRetry'; // Importar para configurar interceptors

// Componente wrapper para a notificação
function AppWithNotifications() {
  const retryState = useRetryNotification();
  
  return (
    <>
      <App />
      <RetryNotification 
        show={retryState.isRetrying}
        message={retryState.message}
        delay={retryState.delay}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

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
        <AppWithNotifications />
      </StrictMode>
    </QueryClientProvider>
  </AuthProvider>
);

void runIndexedDbCachePolicyIfNewBuild();
registerServiceWorker();