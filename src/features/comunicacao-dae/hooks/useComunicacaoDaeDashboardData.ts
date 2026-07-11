import { useCallback, useEffect, useState } from 'react';
import ComunicacaoDaeService, {
  ComunicacaoDae,
  VisibilidadeArquivamentoFiltro,
  getComunicacaoDaeApiErrorMessage,
  isComunicacaoDaeForbiddenError,
} from '@/services/ComunicacaoDaeService';
import CrsService, { Crs } from '@/services/CrsService';
import NheService, { Nhe } from '@/services/NheService';
import CievsService, { Cievs } from '@/services/CievsService';
import { LocalizacaoMapa, LocalizacaoTipo } from '@/features/dashboard/components/MapaDashboardDAE';

export const useComunicacaoDaeDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoDae[]>([]);
  const [visibilidade, setVisibilidade] = useState<VisibilidadeArquivamentoFiltro>('ativas');
  const [error, setError] = useState<string | null>(null);
  const isRestrictedOriginView = false;
  const [crsList, setCrsList] = useState<Crs[]>([]);
  const [nheList, setNheList] = useState<Nhe[]>([]);
  const [cievsList, setCievsList] = useState<Cievs[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoMapa[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString('pt-BR'));

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [comunicacoesRes, crsRes, nheRes, cievsRes] = await Promise.all([
        ComunicacaoDaeService.getAll(1, 9999, {
          visibilidade: visibilidade === 'todas' ? 'todas' : undefined,
        }),
        CrsService.getAll(1, 9999),
        NheService.getAll(1, 9999),
        CievsService.getAll(1, 9999)
      ]);

      setComunicacoes(comunicacoesRes.data || []);
      setCrsList(crsRes.data || []);
      setNheList(nheRes.data || []);
      setCievsList(cievsRes.data || []);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    } catch (err) {
      setError(
        isComunicacaoDaeForbiddenError(err)
          ? getComunicacaoDaeApiErrorMessage(
              err,
              'Acesso negado aos dados do dashboard DAE para o usuário autenticado.',
            )
          : getComunicacaoDaeApiErrorMessage(err, 'Erro ao carregar dados do dashboard'),
      );
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [visibilidade]);

  const loadLocalizacoes = useCallback(
    async (comunicacoesData: ComunicacaoDae[], filteredComunicacoes?: ComunicacaoDae[]) => {
      try {
        const comunicacoesParaContar = filteredComunicacoes || comunicacoesData;

        const [nheWithLocation, cievsWithLocation, crsWithLocation] = await Promise.all([
          NheService.getAllWithLocation(),
          CievsService.getAllWithLocation(),
          CrsService.getAllWithLocation()
        ]);

        const localizacoesData: LocalizacaoMapa[] = [];

        nheWithLocation.forEach((nhe: any) => {
          if (nhe.estabelecimento && nhe.estabelecimento.latitude && nhe.estabelecimento.longitude) {
            const fichasCount = comunicacoesParaContar.filter(
              (c) => c.origem_tipo === 'NHE' && c.origem_id === nhe.id_nhe
            ).length;

            localizacoesData.push({
              id: `nhe-${nhe.id_nhe}`,
              nome: nhe.nome,
              tipo: 'NHE' as LocalizacaoTipo,
              lat: parseFloat(nhe.estabelecimento.latitude),
              lng: parseFloat(nhe.estabelecimento.longitude),
              endereco: `${nhe.estabelecimento.logradouro || ''}, ${nhe.estabelecimento.numero || 's/n'} - ${nhe.estabelecimento.bairro || ''}, ${nhe.estabelecimento.cidade || ''}`.trim(),
              fichasCount
            });
          }
        });

        cievsWithLocation.forEach((cievs: any) => {
          if (cievs.estabelecimento && cievs.estabelecimento.latitude && cievs.estabelecimento.longitude) {
            const fichasCount = comunicacoesParaContar.filter(
              (c) => c.origem_tipo === 'CIEVS' && c.origem_id === cievs.id_cievs
            ).length;

            localizacoesData.push({
              id: `cievs-${cievs.id_cievs}`,
              nome: cievs.nome,
              tipo: 'CIEVS' as LocalizacaoTipo,
              lat: parseFloat(cievs.estabelecimento.latitude),
              lng: parseFloat(cievs.estabelecimento.longitude),
              endereco: `${cievs.estabelecimento.logradouro || ''}, ${cievs.estabelecimento.numero || 's/n'} - ${cievs.estabelecimento.bairro || ''}, ${cievs.estabelecimento.cidade || ''}`.trim(),
              fichasCount
            });
          }
        });

        crsWithLocation.forEach((crs: any) => {
          if (crs.estabelecimento && crs.estabelecimento.latitude && crs.estabelecimento.longitude) {
            const fichasCount = comunicacoesParaContar.filter(
              (c) => c.origem_tipo === 'CRS' && c.origem_id === crs.id_crs
            ).length;

            localizacoesData.push({
              id: `crs-${crs.id_crs}`,
              nome: crs.nome,
              tipo: 'CRS' as LocalizacaoTipo,
              lat: parseFloat(crs.estabelecimento.latitude),
              lng: parseFloat(crs.estabelecimento.longitude),
              endereco: `${crs.estabelecimento.logradouro || ''}, ${crs.estabelecimento.numero || 's/n'} - ${crs.estabelecimento.bairro || ''}, ${crs.estabelecimento.cidade || ''}`.trim(),
              fichasCount
            });
          }
        });

        setLocalizacoes(localizacoesData);
      } catch (err) {
        console.error('Erro ao carregar localizações:', err);
      }
    },
    []
  );

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    loading,
    comunicacoes,
    visibilidade,
    setVisibilidade,
    error,
    isRestrictedOriginView,
    crsList,
    nheList,
    cievsList,
    localizacoes,
    lastUpdate,
    loadAllData,
    loadLocalizacoes
  };
};
