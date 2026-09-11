import { HOMOLOGACAO_MIN_AGGREGATE_COUNT } from './aggregateCountDefaults';

export type ModoLocalidadeEvento = 'NAO_USA' | 'OPCIONAL' | 'OBRIGATORIA';

export interface DashboardEventOption {
  idtipo_evento: number;
  descricao: string;
  ativo: string | boolean | number;
  modo_localidade_evento?: ModoLocalidadeEvento;
}

export type EventLocalitySpecialCode = 'NORMAL' | 'OUTRO' | 'NAO_INFORMADO';

export interface EventLocalityDTO {
  id: number;
  nome: string;
  tipo: 'BAIRRO' | 'COMUNIDADE' | 'RAMAL' | 'ALDEIA_INDIGENA' | null;
  especial: EventLocalitySpecialCode;
  ribeirinha: boolean;
  latitude: number | string | null;
  longitude: number | string | null;
  exibir_mapa: boolean;
  ativo: boolean;
  ordem: number | null;
}

export interface EventLocalityAggregate {
  id: number;
  label: string;
  count: number;
  suppressed: boolean;
  tipo: EventLocalityDTO['tipo'];
  especial: EventLocalitySpecialCode | null;
  ribeirinha: boolean;
  latitude: number | null;
  longitude: number | null;
  exibirMapa: boolean;
  ordem: number | null;
}

export interface AggregateCountPolicy {
  enabled: boolean;
  minimumCount: number | null;
  source: 'environment' | 'development-fallback' | 'disabled';
}

const DEVELOPMENT_MODES = new Set(['development', 'homologacao']);
const DEVELOPMENT_FALLBACK_MINIMUM = HOMOLOGACAO_MIN_AGGREGATE_COUNT;

const toPositiveInteger = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toFiniteCoordinate = (
  value: number | string | null | undefined,
  minimum: number,
  maximum: number
): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
};

export const isDashboardEventActive = (event: DashboardEventOption): boolean =>
  event.ativo === true ||
  event.ativo === 1 ||
  event.ativo === '1' ||
  event.ativo === 'S';

export const eventUsesLocalidadeOperacional = (
  modo: ModoLocalidadeEvento | null | undefined
): boolean => modo === 'OPCIONAL' || modo === 'OBRIGATORIA';

export const getNotificationEventId = (notification: unknown): number | null => {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  const item = notification as Record<string, any>;
  const original = item.original && typeof item.original === 'object'
    ? item.original
    : item;
  const rawId =
    original.tipo_evento?.idtipo_evento ??
    original.tipo_evento_idtipo_evento ??
    original.evento_idevento ??
    item.idtipo_evento ??
    item.tipo_evento?.idtipo_evento;
  const parsed = Number(rawId);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getNotificationEventLocalityId = (notification: unknown): number | null => {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  const item = notification as Record<string, any>;
  const original = item.original && typeof item.original === 'object'
    ? item.original
    : item;
  const rawId =
    original.localidade_evento_id ??
    item.localidade_evento_id ??
    original.localidade_evento?.id ??
    item.localidade_evento?.id;
  const parsed = Number(rawId);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getNotificationEventLocality = (
  notification: unknown
): Partial<EventLocalityDTO> | null => {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  const item = notification as Record<string, any>;
  const original = item.original && typeof item.original === 'object'
    ? item.original
    : item;
  const locality = original.localidade_evento ?? item.localidade_evento;

  return locality && typeof locality === 'object'
    ? locality as Partial<EventLocalityDTO>
    : null;
};

export const resolveAggregateCountPolicy = (
  configuredValue: unknown,
  mode: string
): AggregateCountPolicy => {
  const configuredMinimum = toPositiveInteger(configuredValue);

  if (configuredMinimum !== null) {
    return {
      enabled: true,
      minimumCount: configuredMinimum,
      source: 'environment'
    };
  }

  if (DEVELOPMENT_MODES.has(mode.toLowerCase())) {
    return {
      enabled: true,
      minimumCount: DEVELOPMENT_FALLBACK_MINIMUM,
      source: 'development-fallback'
    };
  }

  // Esta é apenas uma supressão visual. Autorização e escopo continuam sendo
  // responsabilidades do backend; sem limiar aprovado, a granularidade fecha.
  return {
    enabled: false,
    minimumCount: null,
    source: 'disabled'
  };
};

export const aggregateEventLocalities = (
  notifications: unknown[],
  policy: AggregateCountPolicy
): EventLocalityAggregate[] => {
  const grouped = new Map<number, Omit<EventLocalityAggregate, 'suppressed'>>();

  notifications.forEach((notification) => {
    const id = getNotificationEventLocalityId(notification);
    const locality = getNotificationEventLocality(notification);

    if (id === null || !locality) {
      return;
    }

    const current = grouped.get(id);
    if (current) {
      current.count += 1;
      return;
    }

    const label = typeof locality.nome === 'string' && locality.nome.trim()
      ? locality.nome.trim()
      : 'Localidade sem descrição';
    const especial =
      locality.especial === 'NORMAL' ||
      locality.especial === 'OUTRO' ||
      locality.especial === 'NAO_INFORMADO'
        ? locality.especial
        : null;

    grouped.set(id, {
      id,
      label,
      count: 1,
      tipo:
        locality.tipo === 'BAIRRO' ||
        locality.tipo === 'COMUNIDADE' ||
        locality.tipo === 'RAMAL' ||
        locality.tipo === 'ALDEIA_INDIGENA'
          ? locality.tipo
          : null,
      especial,
      ribeirinha: locality.ribeirinha === true,
      latitude: toFiniteCoordinate(locality.latitude, -90, 90),
      longitude: toFiniteCoordinate(locality.longitude, -180, 180),
      exibirMapa: locality.exibir_mapa === true,
      ordem: typeof locality.ordem === 'number' ? locality.ordem : null
    });
  });

  const minimumCount = policy.minimumCount;

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      suppressed:
        !policy.enabled ||
        minimumCount === null ||
        item.count < minimumCount
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      const leftOrder = left.ordem ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.ordem ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label, 'pt-BR');
    });
};

export const EVENT_LOCALITY_CHART_TOP_COUNT = 10;

export const getRankedEventLocalities = (
  data: EventLocalityAggregate[]
): EventLocalityAggregate[] =>
  [...data].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.label.localeCompare(right.label, 'pt-BR');
  });

export const getTopEventLocalitiesForChart = (
  data: EventLocalityAggregate[],
  limit = EVENT_LOCALITY_CHART_TOP_COUNT
): EventLocalityAggregate[] => getRankedEventLocalities(data).slice(0, limit);

export const getMappableEventLocalities = (
  data: EventLocalityAggregate[]
): EventLocalityAggregate[] =>
  data.filter((item) =>
    item.especial === 'NORMAL' &&
    item.exibirMapa &&
    item.latitude !== null &&
    item.longitude !== null
  );

export const getEventLocalityMarkerRadius = (
  count: number,
  maximumCount: number
): number => {
  if (count <= 0 || maximumCount <= 0) {
    return 0;
  }

  const proportionalRadius = 8 + Math.sqrt(count / maximumCount) * 18;
  return Math.min(26, Math.max(8, proportionalRadius));
};
