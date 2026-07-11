import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import { matchesDaeDashboardFilter } from '@/features/comunicacao-dae/comunicacaoDaeAgravoUtils';
import { ActiveFilters } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeDashboardFilters';
import { calcularSemanaEpidemiologica } from '@/utils/timezoneUtils';

export function getSemanaEpidemiologicaKey(dateString: string): string | null {
  const se = calcularSemanaEpidemiologica(dateString);
  if (!se) return null;
  return `${se.ano}-${se.semana.toString().padStart(2, '0')}`;
}

export function formatSemanaEpidemiologicaFilterLabel(key: string): string {
  const [ano, semana] = key.split('-');
  return `SE ${semana} / ${ano}`;
}

export function matchesDashboardFilter(value: unknown, filterValue: unknown): boolean {
  if (!filterValue) return true;
  if (Array.isArray(filterValue)) {
    return filterValue.includes(value);
  }
  return value === filterValue;
}

export function applyDashboardCrossFilters(
  comunicacoes: ComunicacaoDae[],
  activeFilters: ActiveFilters,
  except?: keyof ActiveFilters,
): ComunicacaoDae[] {
  let filtered = [...comunicacoes];

  if (except !== 'origem_tipo' && activeFilters.origem_tipo) {
    filtered = filtered.filter((c) =>
      matchesDashboardFilter(c.origem_tipo, activeFilters.origem_tipo),
    );
  }

  if (except !== 'origem_id' && activeFilters.origem_id) {
    filtered = filtered.filter((c) =>
      matchesDashboardFilter(c.origem_id, activeFilters.origem_id),
    );
  }

  if (except !== 'dae_id' && activeFilters.dae_id) {
    filtered = filtered.filter((c) => matchesDaeDashboardFilter(c, activeFilters.dae_id));
  }

  if (except !== 'municipio_id' && activeFilters.municipio_id) {
    filtered = filtered.filter((c) =>
      matchesDashboardFilter(c.id_municipio_ocorrencia, activeFilters.municipio_id),
    );
  }

  if (except !== 'municipio_residencia_id' && activeFilters.municipio_residencia_id) {
    filtered = filtered.filter((c) =>
      matchesDashboardFilter(c.id_municipio_residencia, activeFilters.municipio_residencia_id),
    );
  }

  if (except !== 'semana_epidemiologica' && activeFilters.semana_epidemiologica) {
    filtered = filtered.filter((c) => {
      const key = getSemanaEpidemiologicaKey(c.data_comunicacao);
      return key !== null && matchesDashboardFilter(key, activeFilters.semana_epidemiologica);
    });
  }

  return filtered;
}
