import { useMemo } from 'react';
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import { Crs } from '@/services/CrsService';
import { Nhe } from '@/services/NheService';
import { Cievs } from '@/services/CievsService';
import { getComunicacaoDaeAgravoIds } from '@/features/comunicacao-dae/comunicacaoDaeAgravoUtils';
import { buildOrigemStats, getOrigemSeriesKey } from '@/features/comunicacao-dae/utils/origemPresentation';
import { ActiveFilters } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeDashboardFilters';
import { applyDashboardCrossFilters, getSemanaEpidemiologicaKey } from '@/features/comunicacao-dae/utils/comunicacaoDaeDashboardFilterUtils';
import { calcularSemanaEpidemiologica } from '@/utils/timezoneUtils';

interface ChartDataItem {
  name: string;
  value: number;
  id?: number | string;
  ano?: number;
}

type OrigemTipo = 'CRS' | 'NHE' | 'CIEVS';

interface DashboardStats {
  total: number;
  crs: number;
  nhe: number;
  cievs: number;
}

type UseComunicacaoDaeDashboardChartsArgs = {
  comunicacoes: ComunicacaoDae[];
  comunicacoesFiltradas: ComunicacaoDae[];
  dadosFiltrados: ComunicacaoDae[];
  activeFilters: ActiveFilters;
  isRestrictedOriginView: boolean;
  crsList: Crs[];
  nheList: Nhe[];
  cievsList: Cievs[];
};

function getCrossFilterSource(
  comunicacoesFiltradas: ComunicacaoDae[],
  dadosFiltrados: ComunicacaoDae[],
  activeFilters: ActiveFilters,
  except?: keyof ActiveFilters,
) {
  return except && activeFilters[except]
    ? applyDashboardCrossFilters(comunicacoesFiltradas, activeFilters, except)
    : dadosFiltrados;
}

export const useComunicacaoDaeDashboardCharts = ({
  comunicacoes,
  comunicacoesFiltradas,
  dadosFiltrados,
  activeFilters,
  isRestrictedOriginView,
  crsList,
  nheList,
  cievsList,
}: UseComunicacaoDaeDashboardChartsArgs) => {
  const stats: DashboardStats = useMemo(() => {
    const calculatedStats = buildOrigemStats(dadosFiltrados);
    console.log('📊 Stats calculados:', calculatedStats);
    return calculatedStats;
  }, [dadosFiltrados]);

  const visibleOrigemCards = useMemo<OrigemTipo[]>(() => {
    const allTypes: OrigemTipo[] = ['CRS', 'NHE', 'CIEVS'];
    if (!isRestrictedOriginView) return allTypes;

    const availableTypes = new Set(
      comunicacoes
        .map(c => c.origem_tipo)
        .filter((tipo): tipo is OrigemTipo => tipo === 'CRS' || tipo === 'NHE' || tipo === 'CIEVS')
    );

    const restrictedTypes = allTypes.filter(tipo => availableTypes.has(tipo));
    return restrictedTypes.length > 0 ? restrictedTypes : allTypes;
  }, [isRestrictedOriginView, comunicacoes]);

  const dadosSerieTemporalData = useMemo(() => {
    const dateMap = new Map<string, { CRS: number; NHE: number; CIEVS: number; total: number }>();

    dadosFiltrados.forEach(c => {
      const date = new Date(c.data_comunicacao);
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Belem' });

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { CRS: 0, NHE: 0, CIEVS: 0, total: 0 });
      }

      const data = dateMap.get(dateStr)!;
      data.total++;

      const origemSeriesKey = getOrigemSeriesKey(c.origem_tipo);
      if (origemSeriesKey) {
        data[origemSeriesKey]++;
      }
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, data]) => ({
        date: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
        ...data
      }));
  }, [dadosFiltrados]);

  const dadosSemanaEpidemiologica = useMemo(() => {
    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      'semana_epidemiologica',
    );
    const seMap = new Map<string, { semana: number; ano: number; value: number }>();

    source.forEach((c) => {
      const key = getSemanaEpidemiologicaKey(c.data_comunicacao);
      const se = calcularSemanaEpidemiologica(c.data_comunicacao);
      if (!key || !se) return;

      if (!seMap.has(key)) {
        seMap.set(key, { semana: se.semana, ano: se.ano, value: 0 });
      }
      seMap.get(key)!.value++;
    });

    return Array.from(seMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => ({
        id: key,
        name: `SE ${d.semana.toString().padStart(2, '0')}`,
        ano: d.ano,
        value: d.value,
      }));
  }, [comunicacoesFiltradas, dadosFiltrados, activeFilters]);

  const dadosMunicipios = useMemo(() => {
    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      'municipio_id',
    );

    const counts = source.reduce((acc, com) => {
      const municipio = com.tipo_municipio?.descricao || 'Não informado';
      const id = com.id_municipio_ocorrencia;
      const key = `${id}_${municipio}`;
      if (!acc[key]) {
        acc[key] = { name: municipio, value: 0, id };
      }
      acc[key].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados]);

  const dadosMunicipiosResidencia = useMemo(() => {
    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      'municipio_residencia_id',
    );

    const counts = source.reduce((acc, com) => {
      const municipio = com.tipo_municipio_residencia?.descricao || 'Não informado';
      const id = com.id_municipio_residencia;
      const key = `${id}_${municipio}`;
      if (!acc[key]) {
        acc[key] = { name: municipio, value: 0, id };
      }
      acc[key].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados]);

  const dadosDae = useMemo(() => {
    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      'dae_id',
    );

    const counts = source.reduce((acc, com) => {
      const ids = getComunicacaoDaeAgravoIds(com);
      for (const agravoId of ids) {
        const nome =
          com.daes?.find((d) => d.id_dae === agravoId)?.nome ||
          (agravoId === com.id_dae ? com.dae?.nome : undefined) ||
          'Não informado';
        const key = `dae_${agravoId}`;
        if (!acc[key]) {
          acc[key] = { name: nome, value: 0, id: agravoId };
        }
        acc[key].value++;
      }
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados]);

  const crsMap = useMemo(() => {
    const map = new Map<number, string>();
    crsList.forEach(crs => map.set(crs.id_crs, crs.nome));
    return map;
  }, [crsList]);

  const nheMap = useMemo(() => {
    const map = new Map<number, string>();
    nheList.forEach(nhe => map.set(nhe.id_nhe, nhe.nome));
    return map;
  }, [nheList]);

  const cievsMap = useMemo(() => {
    const map = new Map<number, string>();
    cievsList.forEach(cievs => map.set(cievs.id_cievs, cievs.nome));
    return map;
  }, [cievsList]);

  const dadosCrs = useMemo(() => {
    if (activeFilters.origem_tipo && activeFilters.origem_tipo !== 'CRS') {
      return [];
    }

    if (activeFilters.origem_id) {
      const origemIds = Array.isArray(activeFilters.origem_id) ? activeFilters.origem_id : [activeFilters.origem_id];
      const temCrsNaSelecao = comunicacoesFiltradas.some(c =>
        c.origem_tipo === 'CRS' && origemIds.includes(c.origem_id)
      );
      if (!temCrsNaSelecao) {
        return [];
      }
    }

    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      activeFilters.origem_id ? 'origem_id' : undefined,
    ).filter(c => c.origem_tipo === 'CRS');

    const counts = source.reduce((acc, com) => {
      const crsName = crsMap.get(com.origem_id) || `CRS ${com.origem_id}`;
      if (!acc[crsName]) {
        acc[crsName] = { name: crsName, value: 0, id: com.origem_id };
      }
      acc[crsName].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados, crsMap]);

  const dadosNhe = useMemo(() => {
    if (activeFilters.origem_tipo && activeFilters.origem_tipo !== 'NHE') {
      return [];
    }

    if (activeFilters.origem_id) {
      const origemIds = Array.isArray(activeFilters.origem_id) ? activeFilters.origem_id : [activeFilters.origem_id];
      const temNheNaSelecao = comunicacoesFiltradas.some(c =>
        c.origem_tipo === 'NHE' && origemIds.includes(c.origem_id)
      );
      if (!temNheNaSelecao) {
        return [];
      }
    }

    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      activeFilters.origem_id ? 'origem_id' : undefined,
    ).filter(c => c.origem_tipo === 'NHE');

    const counts = source.reduce((acc, com) => {
      const nheName = nheMap.get(com.origem_id) || `NHE ${com.origem_id}`;
      if (!acc[nheName]) {
        acc[nheName] = { name: nheName, value: 0, id: com.origem_id };
      }
      acc[nheName].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados, nheMap]);

  const dadosCievs = useMemo(() => {
    if (activeFilters.origem_tipo && activeFilters.origem_tipo !== 'CIEVS') {
      return [];
    }

    if (activeFilters.origem_id) {
      const origemIds = Array.isArray(activeFilters.origem_id) ? activeFilters.origem_id : [activeFilters.origem_id];
      const temCievsNaSelecao = comunicacoesFiltradas.some(c =>
        c.origem_tipo === 'CIEVS' && origemIds.includes(c.origem_id)
      );
      if (!temCievsNaSelecao) {
        return [];
      }
    }

    const source = getCrossFilterSource(
      comunicacoesFiltradas,
      dadosFiltrados,
      activeFilters,
      activeFilters.origem_id ? 'origem_id' : undefined,
    ).filter(c => c.origem_tipo === 'CIEVS');

    const counts = source.reduce((acc, com) => {
      const cievsName = cievsMap.get(com.origem_id) || `CIEVS ${com.origem_id}`;
      if (!acc[cievsName]) {
        acc[cievsName] = { name: cievsName, value: 0, id: com.origem_id };
      }
      acc[cievsName].value++;
      return acc;
    }, {} as Record<string, ChartDataItem>);

    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [comunicacoesFiltradas, activeFilters, dadosFiltrados, cievsMap]);

  return {
    stats,
    visibleOrigemCards,
    dadosSerieTemporalData,
    dadosSemanaEpidemiologica,
    dadosMunicipios,
    dadosMunicipiosResidencia,
    dadosDae,
    dadosCrs,
    dadosNhe,
    dadosCievs,
  };
};
