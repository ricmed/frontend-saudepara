import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// 🍪 Configuração global para enviar cookies automaticamente
axios.defaults.withCredentials = true;

// Estado global para controlar notificações de retry
let isRetryNotificationActive = false;
let lastRetryEventAt = 0;
const endpoint429WaitMap = new Map<string, Promise<void>>();

const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
const refreshEndpoint = USE_INTERNAL_AUTH ? '/api/auth/refresh' : '/api-auth/auth/refresh';

let refreshPromise: Promise<void> | null = null;

const RETRY_EVENT_COOLDOWN_MS = 1500;

const getEndpointKey = (config?: AxiosRequestConfig) => {
  const method = String(config?.method ?? 'get').toUpperCase();
  const url = String(config?.url ?? '');
  return `${method}:${url}`;
};

const cloneRequestConfig = (config: AxiosRequestConfig) => ({
  ...config,
  headers: {
    ...(config.headers || {}),
  },
});

const isPublicFormRoute = () => {
  try {
    return typeof window !== 'undefined' && window.location?.pathname?.startsWith('/f/');
  } catch {
    return false;
  }
};

const isProfileRequest = (url?: string) => {
  const u = String(url ?? '');
  return u.includes('/api/auth/profile') || u.includes('/api-auth/protected/profile');
};

// Configurar interceptor global para retry em caso de erro 429
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Se for 401, tentar renovar sessão uma vez e repetir a requisição.
    // Isso evita "deslogar" quando o access token expira, usando o refresh cookie.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== refreshEndpoint &&
      !isProfileRequest(originalRequest.url) &&
      !isPublicFormRoute()
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(refreshEndpoint, {}, { withCredentials: true }).then(() => {});
          refreshPromise.finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        // Clona a config para evitar reutilização de referência stale em concorrência.
        return axios(cloneRequestConfig(originalRequest));
      } catch (e) {
        return Promise.reject(error);
      }
    }

    // Se for erro 429 e ainda não foi feito retry
    if (error.response?.status === 429 && !originalRequest._retry) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      
      // Pegar o tempo de retry do header Retry-After (se disponível) ou usar 30 segundos
      const retryAfter = error.response.headers['retry-after'];
      const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 30000;
      const endpointKey = getEndpointKey(originalRequest);
      
      console.log(`⚠️ Rate limit atingido (429). Aguardando ${delayMs/1000}s antes de tentar novamente...`);
      
      const now = Date.now();
      if (!isRetryNotificationActive && now - lastRetryEventAt > RETRY_EVENT_COOLDOWN_MS) {
        isRetryNotificationActive = true;
        lastRetryEventAt = now;
        
        // Disparar evento customizado para componentes React escutarem
        window.dispatchEvent(new CustomEvent('retry429', {
          detail: {
            message: 'Muitas requisições. Aguardando antes de tentar novamente...',
            delay: delayMs / 1000
          }
        }));
      }

      let waitPromise = endpoint429WaitMap.get(endpointKey);
      if (!waitPromise) {
        waitPromise = new Promise<void>((resolve) => {
          setTimeout(() => resolve(), delayMs);
        }).finally(() => {
          endpoint429WaitMap.delete(endpointKey);
          isRetryNotificationActive = false;
        });
        endpoint429WaitMap.set(endpointKey, waitPromise);
      }

      await waitPromise;
      console.log(`🔄 Fazendo nova tentativa da requisição...`);
      
      // Fazer nova tentativa
      return axios(cloneRequestConfig(originalRequest));
    }
    
    // Se não for 429 ou já foi feito retry, rejeitar normalmente
    return Promise.reject(error);
  }
);

// Função utilitária para fazer retry manual quando necessário
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 30000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const interceptorAlreadyRetried = Boolean((error?.config as any)?._retry);
      
      // Evita dobrar retry quando o interceptor já tratou 429 para essa request.
      if (status === 429 && !interceptorAlreadyRetried && attempt < maxRetries) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️ Retry ${attempt + 1}/${maxRetries + 1} - Aguardando ${delay/1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

export default axios;
