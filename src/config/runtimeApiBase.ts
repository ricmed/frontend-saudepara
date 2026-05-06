/**
 * Base URL da aplicação/backend em runtime.
 *
 * Objetivo: evitar "vazamento" de PROD/HML por bundle cacheado (PWA),
 * garantindo que em domínios oficiais (`app.saude...` / `app.hml...`)
 * a origem usada seja sempre `window.location.origin`.
 *
 * Em dev/ambientes alternativos, usa `VITE_API_SERVER`/`VITE_API_PORT`.
 */
export function getRuntimeApiBaseOrigin(): string {
  // Domínios oficiais: sempre seguir o host onde o app está aberto.
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase();
    if (h === 'app.saude.pa.gov.br' || h === 'app.hml.saude.pa.gov.br') {
      return window.location.origin;
    }
  }

  const rawServer = import.meta.env.VITE_API_SERVER as string | undefined;
  const rawPort = import.meta.env.VITE_API_PORT as string | undefined;

  // Quando `VITE_API_SERVER` está ausente, caímos para origin do browser.
  if (!rawServer) {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:3000';
  }

  // Normaliza `VITE_API_SERVER` + `VITE_API_PORT` para um origin.
  try {
    const u = new URL(rawServer);
    // Se veio sem porta explícita e temos VITE_API_PORT, aplica.
    if (!u.port && rawPort) u.port = String(rawPort);
    return u.origin;
  } catch {
    // Caso `rawServer` venha sem protocolo (ex.: "localhost"), monta URL válida.
    const proto =
      typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const host = rawServer.replace(/\/+$/, '');
    const port = rawPort ? `:${rawPort}` : '';
    return `${proto}//${host}${port}`;
  }
}

export function getRuntimeApiRoot(): string {
  const basePath = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';
  const base = getRuntimeApiBaseOrigin();
  return `${base}${basePath.startsWith('/') ? '' : '/'}${basePath}`;
}

