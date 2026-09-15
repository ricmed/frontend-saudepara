export const UI_PALETTE_VALUES = ['default', 'saire'] as const;
export type UiPalette = (typeof UI_PALETTE_VALUES)[number];

export const SAIRE_EVENT_NAME_RE = /sair[eé]/i;
export const SAIRE_NOTIFICADORAS_CACHE_KEY_PREFIX = 'saire-notificadoras-evento-';

/** Usuários que recebem a paleta Rosa/Cinza por padrão (além das notificadoras Sairé). */
export const SAIRE_PALETTE_USERNAMES = ['crs9', 'cievsoestedopara'] as const;

/** Município Santarém (PA) — força Rosa/Cinza no nível municipal. */
export const SAIRE_PALETTE_MUNICIPIO_IDS = [265] as const;

/** Municípios do Festival do Sairé: nível municipal opera a ficha do evento. */
export const SAIRE_MUNICIPIO_IDS = SAIRE_PALETTE_MUNICIPIO_IDS;

export function isUiPalette(value: unknown): value is UiPalette {
  return value === 'default' || value === 'saire';
}

export function normalizeUiPalette(value: unknown): UiPalette {
  return value === 'saire' ? 'saire' : 'default';
}

export function isAdminMasterRoles(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((role) => role === 'admin' || role === 'administrator');
}

/** Admin master ou CIEVS/escopo estadual (`admin.estado`) podem escolher a paleta. */
export function canChooseUiPaletteRoles(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some(
    (role) => role === 'admin' || role === 'administrator' || role === 'admin.estado',
  );
}

/**
 * Quem vê o CTA do golfinho/Sairé além das unidades notificadoras:
 * admin master e escopo estadual (`admin.estado` — CIEVS estadual / oeste etc.).
 */
export function canAccessSaireCaseCtaRoles(roles: unknown): boolean {
  return canChooseUiPaletteRoles(roles);
}

export function isForcedSairePaletteUsername(username: unknown): boolean {
  const normalized = String(username || '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return (SAIRE_PALETTE_USERNAMES as readonly string[]).includes(normalized);
}

export function isForcedSairePaletteMunicipio(municipioId: unknown): boolean {
  const id = Number(municipioId);
  if (!Number.isInteger(id) || id <= 0) return false;
  return (SAIRE_PALETTE_MUNICIPIO_IDS as readonly number[]).includes(id);
}

/**
 * Nível municipal do Sairé (Santarém) vê o CTA do golfinho sem precisar de
 * unidade notificadora nem de role de escopo estadual/master.
 */
export function canAccessSaireCaseCtaMunicipio(municipioId: unknown): boolean {
  const id = Number(municipioId);
  if (!Number.isInteger(id) || id <= 0) return false;
  return (SAIRE_MUNICIPIO_IDS as readonly number[]).includes(id);
}

export function isActiveEventFlag(value: unknown): boolean {
  return value === 'S' || value === '1' || value === 1 || value === true;
}

/** Lê token CSS atual (útil para charts/canvas que precisam de hex). */
export function readThemeCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getThemeAccentHex(): string {
  return readThemeCssVar('--sp-accent', '#3B5FFF');
}

export function getThemeAccentHoverHex(): string {
  return readThemeCssVar('--sp-accent-hover', '#4D6FFF');
}

export function getThemeBrandHex(): string {
  return readThemeCssVar('--sp-brand', '#3b5bdb');
}

export function applyDocumentPalette(palette: UiPalette) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.palette = palette;
}
