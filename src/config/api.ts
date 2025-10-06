// Configuração centralizada da API

const server = import.meta.env.VITE_API_SERVER || '';
const port = import.meta.env.VITE_API_PORT || '';
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Constrói a URL base da API
 * - Se server e port estiverem vazios, usa baseUrl (ex: /api)
 * - Se server estiver definido sem porta, usa server + baseUrl
 * - Se server e porta estiverem definidos, usa server:port + baseUrl
 */
export const getApiBaseUrl = (): string => {
  // Se não há server, usar URL relativa (para proxy nginx)
  if (!server || server.trim() === '') {
    return baseUrl;
  }

  // Se há server mas não porta, ou porta é 80/443 (padrão HTTP/HTTPS)
  if (!port || port.trim() === '' || port === '80' || port === '443') {
    return `${server}${baseUrl}`;
  }

  // Se há server e porta customizada
  return `${server}:${port}${baseUrl}`;
};

/**
 * Constrói URL completa para um endpoint específico
 */
export const getApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  // Remove barra inicial do endpoint se existir
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Garante que há uma barra entre base e endpoint
  return base.endsWith('/') ? `${base}${cleanEndpoint}` : `${base}/${cleanEndpoint}`;
};

// Exportar também como constante para compatibilidade
export const API_BASE_URL = getApiBaseUrl();
