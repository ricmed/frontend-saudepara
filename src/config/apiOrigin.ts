/**
 * Origem da API (protocolo + host [+ porta]).
 * Em app.saude.pa.gov.br usa sempre o mesmo host da página — evita bundle gerado
 * com npm run build (HML) continuar chamando app.hml após deploy em produção.
 */
export function getApiOrigin(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'app.saude.pa.gov.br') {
    return `${window.location.protocol}//${window.location.host}`;
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
