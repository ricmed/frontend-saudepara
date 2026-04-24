import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// 🍪 Configuração global para enviar cookies automaticamente
axios.defaults.withCredentials = true;

// Estado global para controlar notificações de retry
let isRetryNotificationActive = false;

const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
const refreshEndpoint = USE_INTERNAL_AUTH ? '/api/auth/refresh' : '/api-auth/auth/refresh';

let refreshPromise: Promise<void> | null = null;

// Configurar interceptor global para retry em caso de erro 429
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Se for 401, tentar renovar sessão uma vez e repetir a requisição.
    // Isso evita "deslogar" quando o access token expira, usando o refresh cookie.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(refreshEndpoint, {}, { withCredentials: true }).then(() => {});
          refreshPromise.finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return axios(originalRequest);
      } catch (e) {
        return Promise.reject(error);
      }
    }

    // Se for erro 429 e ainda não foi feito retry
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Pegar o tempo de retry do header Retry-After (se disponível) ou usar 30 segundos
      const retryAfter = error.response.headers['retry-after'];
      const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 30000;
      
      console.log(`⚠️ Rate limit atingido (429). Aguardando ${delayMs/1000}s antes de tentar novamente...`);
      
      // Mostrar notificação visual se não estiver ativa
      if (!isRetryNotificationActive) {
        isRetryNotificationActive = true;
        
        // Disparar evento customizado para componentes React escutarem
        window.dispatchEvent(new CustomEvent('retry429', {
          detail: {
            message: 'Muitas requisições. Aguardando antes de tentar novamente...',
            delay: delayMs / 1000
          }
        }));
      }
      
      // Aguardar o tempo especificado
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      console.log(`🔄 Fazendo nova tentativa da requisição...`);
      isRetryNotificationActive = false;
      
      // Fazer nova tentativa
      return axios(originalRequest);
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
      
      if (error.response?.status === 429 && attempt < maxRetries) {
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
