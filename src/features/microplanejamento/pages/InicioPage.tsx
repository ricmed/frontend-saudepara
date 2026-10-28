import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiErrorMessage, microplanejamentoApi, type Ciclo } from '../api';
import { useMpFiltro } from '../useMp';
import { Aviso, BotaoSecundario, Cartao, Celula, Linha, Tabela } from '../ui';

const LIMITE = 50;

const ESTRATEGIA: Record<string, string> = {
  ROTINA: 'Rotina',
  INTENSIFICACAO: 'Intensificação',
  CAMPANHA: 'Campanha',
  MULTIVACINACAO: 'Multivacinação',
  BLOQUEIO: 'Bloqueio',
};

const STATUS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_VALIDACAO: 'Em validação',
  APROVADO: 'Aprovado',
  EM_EXECUCAO: 'Em execução',
  ENCERRADO: 'Encerrado',
};

function rotulo(mapa: Record<string, string>, valor: string) {
  return mapa[valor] ?? valor;
}

function dataBr(valor?: string | null) {
  if (!valor) return '—';
  const iso = String(valor).slice(0, 10);
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function InicioPage() {
  const { cicloId, estabelecimentoId, municipioId, setFiltro } = useMpFiltro();
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    setPagina(1);
  }, [municipioId, estabelecimentoId, cicloId]);

  const health = useQuery({
    queryKey: ['mp-health'],
    queryFn: () => microplanejamentoApi.health(),
  });
  const ciclos = useQuery({
    queryKey: ['mp-ciclos', municipioId, estabelecimentoId, cicloId, pagina],
    queryFn: () =>
      microplanejamentoApi.ciclos({
        municipioId,
        estabelecimentoId,
        cicloId,
        page: pagina,
        limit: LIMITE,
      }),
  });
  const painel = useQuery({
    queryKey: ['mp-painel', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.painel(cicloId!),
  });
  const localidades = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!),
  });

  const lista = ciclos.data?.data ?? [];
  const paginacao = ciclos.data?.pagination;
  const total = paginacao?.total ?? lista.length;
  const paginas = paginacao?.pages ?? 1;

  const cards = painel.data
    ? [
        ['População-alvo', painel.data.populacao_alvo],
        ['Doses aplicadas', painel.data.doses_aplicadas],
        ['Não vacinados', painel.data.nao_vacinados],
        ['Cobertura %', painel.data.cobertura],
        ['Prioridade 1', painel.data.localidades_prioritarias],
        ['Alertas abertos', painel.data.alertas_abertos],
      ]
    : [];

  function selecionar(ciclo: Ciclo) {
    setFiltro('cicloId', String(ciclo.id));
  }

  return (
    <div className="space-y-4">
      {health.isError && <Aviso tipo="erro">{apiErrorMessage(health.error)}</Aviso>}
      {ciclos.isError && <Aviso tipo="erro">{apiErrorMessage(ciclos.error)}</Aviso>}

      <Cartao titulo="Ciclos cadastrados" acoes={<span className="text-sm text-gray-500">{total} registro{total === 1 ? '' : 's'}</span>}>
        {ciclos.isLoading ? (
          <p className="text-sm text-gray-500">Carregando ciclos…</p>
        ) : lista.length === 0 ? (
          <Aviso tipo="info">Nenhum ciclo encontrado para os filtros selecionados. O cadastro fica em Localidades.</Aviso>
        ) : (
          <>
            <Tabela colunas={['Ano', 'Nome', 'Estratégia', 'Município', 'Status', 'Início', 'Fim', 'Dias']}>
              {lista.map((ciclo) => (
                <Linha key={ciclo.id} selecionada={ciclo.id === cicloId} onClick={() => selecionar(ciclo)}>
                  <Celula>{ciclo.ano}</Celula>
                  <Celula>{ciclo.nome}</Celula>
                  <Celula>{rotulo(ESTRATEGIA, ciclo.estrategia)}</Celula>
                  <Celula>{ciclo.tipo_municipio?.descricao ?? '—'}</Celula>
                  <Celula>{rotulo(STATUS, ciclo.status)}</Celula>
                  <Celula>{dataBr(ciclo.data_inicio)}</Celula>
                  <Celula>{dataBr(ciclo.data_fim)}</Celula>
                  <Celula>{ciclo.dias_operacionais}</Celula>
                </Linha>
              ))}
            </Tabela>
            {paginas > 1 && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-sm text-gray-500">Página {pagina} de {paginas}</p>
                <div className="flex gap-2">
                  <BotaoSecundario disabled={pagina <= 1} onClick={() => setPagina((atual) => Math.max(1, atual - 1))}>
                    Anterior
                  </BotaoSecundario>
                  <BotaoSecundario disabled={pagina >= paginas} onClick={() => setPagina((atual) => atual + 1)}>
                    Próxima
                  </BotaoSecundario>
                </div>
              </div>
            )}
          </>
        )}
      </Cartao>

      {cicloId && (
        <>
          {painel.isError && <Aviso tipo="erro">{apiErrorMessage(painel.error)}</Aviso>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Cartao titulo="Localidades no ciclo">
              <p className="text-3xl font-semibold text-blue-800">{localidades.data?.data.length ?? 0}</p>
            </Cartao>
            {cards.map(([rotuloCard, valor]) => (
              <Cartao key={String(rotuloCard)} titulo={String(rotuloCard)}>
                <p className="text-3xl font-semibold text-blue-800">{valor}</p>
              </Cartao>
            ))}
          </div>
          {painel.data && (
            <Cartao titulo="Ações por status">
              {painel.data.acoes.length === 0 ? <p className="text-sm text-gray-500">Nenhuma ação neste ciclo.</p> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={painel.data.acoes}>
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#1d4ed8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="text-sm text-gray-700 space-y-1">
                {painel.data.prioridades.slice(0, 8).map((item, index) => (
                  <li key={`${item.localidade.nome}-${index}`}>{item.localidade.nome}: {item.faixa}</li>
                ))}
              </ul>
            </Cartao>
          )}
        </>
      )}
    </div>
  );
}
