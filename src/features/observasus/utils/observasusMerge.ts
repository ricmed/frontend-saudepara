import type {
  ObservaSusDataSystem,
  ObservaSusPanel,
  ObservaSusResource,
  ObservaSusSystem,
} from '../types/observasus';
import { SYSTEM_SLUG_BY_ENUM } from '../types/observasus';
import { OBSERVASUS_DATA_SYSTEMS, OBSERVASUS_PANELS } from '../constants/observasusContent';

const SYSTEM_ICON: Record<ObservaSusSystem, ObservaSusPanel['icon']> = {
  SIM: 'heart-pulse',
  SINASC: 'baby',
  SINAN: 'activity',
  ESUS_NOTIFICA: 'activity',
  COVID_19: 'virus',
  DEMOGRAFICO: 'users',
  PQAVS: 'award',
  GERAL: 'activity',
};

export function mergeDataStorageSystems(
  apiItems: ObservaSusResource[]
): ObservaSusDataSystem[] {
  return OBSERVASUS_DATA_SYSTEMS.map((system) => {
    const items = apiItems.filter(
      (item) =>
        item.system === system.system ||
        SYSTEM_SLUG_BY_ENUM[item.system] === system.slug
    );
    const latest = items
      .map((item) => item.updatedAt)
      .sort()
      .reverse()[0];

    return {
      ...system,
      fileCount: items.length > 0 ? items.length : system.fileCount,
      lastUpdated: latest ?? system.lastUpdated,
      status:
        items.some((item) => item.status === 'AVAILABLE' && item.hasFile)
          ? 'AVAILABLE'
          : items.length > 0
            ? items.every((item) => item.status === 'MIGRATING')
              ? 'MIGRATING'
              : items[0].status
            : system.status,
    };
  });
}

/**
 * Converte painéis da API (já filtrados por visibility/role no backend)
 * para o formato do card. Sem fallback para a lista estática: se a API
 * respondeu vazia, o usuário não deve ver cards que não tem permissão.
 */
export function mapApiResourcesToPanels(apiPanels: ObservaSusResource[]): ObservaSusPanel[] {
  return apiPanels
    .filter((item) => item.type === 'PANEL')
    .map((resource) => {
      const catalog = OBSERVASUS_PANELS.find(
        (panel) =>
          panel.system === resource.system ||
          panel.slug === resource.slug ||
          panel.slug === SYSTEM_SLUG_BY_ENUM[resource.system]
      );

      const systemSlug = SYSTEM_SLUG_BY_ENUM[resource.system] ?? resource.slug;
      const hasEmbed = Boolean(resource.externalUrl);
      const isHubRoute =
        Boolean(resource.route) &&
        resource.route!.startsWith('/observasus/paineis') &&
        !hasEmbed;
      const href = hasEmbed
        ? `/observasus/paineis/${resource.slug}`
        : isHubRoute
          ? resource.route!
          : resource.route || `/observasus/dados/${systemSlug}`;

      return {
        id: String(resource.id),
        slug: resource.slug,
        system: resource.system,
        title: resource.title,
        subtitle: resource.subtitle || catalog?.subtitle || resource.system,
        description:
          resource.description ||
          catalog?.description ||
          'Painel de indicadores do ObservaSUS.PA.',
        status: resource.status,
        icon: catalog?.icon || SYSTEM_ICON[resource.system] || 'activity',
        resourceId: resource.id,
        visibility: resource.visibility,
        href,
        isExternal: false,
        hasFile: resource.hasFile,
      };
    });
}
