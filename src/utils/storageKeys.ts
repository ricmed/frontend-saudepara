export const STORAGE_KEYS = {
  ui: {
    language: 'sp.ui.language.v1',
    dashboardActiveTab: 'sp.ui.dashboard.active-tab.v1',
    alertsShowDismissed: 'sp.ui.alerts.show-dismissed.v1',
    alertsDismissedIds: 'sp.ui.alerts.dismissed-ids.v1',
    alertsFilterTypes: 'sp.ui.alerts.filter-types.v1',
  },
  ai: {
    globalConfig: 'sp.ui.ai.global-config.v1',
    chatConfig: 'sp.ui.ai.chat-config.v1',
  },
  map: {
    provider: 'sp.ui.map.provider.v1',
    mapboxApiKey: 'sp.ui.map.mapbox-api-key.v1',
  },
  admin: {
    preferences: 'sp.ui.admin.preferences.v1',
    tableFiltersPrefix: 'sp.ui.admin.table-filters.v1',
  },
  auth: {
    userAccessPrefix: 'sp.auth.user-access.v1',
    lastKnownSession: 'sp.auth.last-known.session.v1',
  },
} as const;

export function readStringWithLegacy(
  key: string,
  legacyKeys: string[] = [],
  storage: Storage = localStorage
): string | null {
  const current = storage.getItem(key);
  if (current !== null) return current;

  for (const legacyKey of legacyKeys) {
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue !== null) {
      storage.setItem(key, legacyValue);
      storage.removeItem(legacyKey);
      return legacyValue;
    }
  }

  return null;
}

export function readJsonWithLegacy<T>(
  key: string,
  fallback: T,
  legacyKeys: string[] = [],
  storage: Storage = localStorage
): T {
  const raw = readStringWithLegacy(key, legacyKeys, storage);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function removeWithLegacy(
  key: string,
  legacyKeys: string[] = [],
  storage: Storage = localStorage
): void {
  storage.removeItem(key);
  legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
}
