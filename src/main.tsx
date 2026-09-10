import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./index.css";
import App from "../App.tsx";
import { registerServiceWorker } from "./registerSW";
import { runIndexedDbCachePolicyIfNewBuild } from "./services/appBuildCachePolicy";
import { AuthProvider } from './keycloak/AuthProvider';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import { RetryNotification } from './components/RetryNotification';
import { useRetryNotification } from './hooks/useRetryNotification';
import './utils/axiosRetry'; // Importar para configurar interceptors

// Componente wrapper para a notificação
function AppWithNotifications() {
  const retryState = useRetryNotification();
  
  return (
    <>
      <App />
      <PwaUpdateBanner />
      <RetryNotification 
        show={retryState.isRetrying}
        message={retryState.message}
        delay={retryState.delay}
      />
      <ReactQueryDevtools initialIsOpen={false} />
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        limit={6}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

function SyncQueryInvalidationBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCacheUpdated = () => {
      queryClient.invalidateQueries();
    };

    window.addEventListener('cache-updated', handleCacheUpdated);
    return () => window.removeEventListener('cache-updated', handleCacheUpdated);
  }, [queryClient]);

  return null;
}

// Cria o cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: (failureCount) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
})

async function bootstrapApp() {
  try {
    // Executa política de cache antes do primeiro render para evitar janela de dados stale na UI.
    await runIndexedDbCachePolicyIfNewBuild();
  } catch (error) {
    console.warn('Falha ao aplicar política de cache no bootstrap:', error);
  }

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <SyncQueryInvalidationBridge />
        <StrictMode>
          <AppWithNotifications />
        </StrictMode>
      </QueryClientProvider>
    </AuthProvider>
  );

  registerServiceWorker();
}

void bootstrapApp();