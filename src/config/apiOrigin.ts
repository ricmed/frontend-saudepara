/**
 * Origem da API (protocolo + host [+ porta]).
 * Em app oficial (prod e HML) usa o mesmo host da página — mesmo racional de prod:
 * nginx expõe `/api` no mesmo site; evita bundle com `VITE_*` errado (ex. localhost:443).
 * Em dev (ex. localhost:5173) segue `VITE_API_SERVER` / `VITE_API_PORT` do .env.
 */
export function getApiOrigin(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'app.saude.pa.gov.br' || h === 'app.hml.saude.pa.gov.br') {
      return `${window.location.protocol}//${window.location.host}`;
    }
  }
  const server = import.meta.env.VITE_API_SERVER as string | undefined;
  const port = import.meta.env.VITE_API_PORT as string | undefined;
  if (server && port) {
    return `${server}:${port}`;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return `${server ?? 'http://localhost'}:${port ?? '3000'}`;
}

/** Base `…/api` para chamadas REST no mesmo padrão de `getApiOrigin`. */
export function getApiRoot(): string {
  return `${getApiOrigin()}/api`;
}
