import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiErrorMessage, microplanejamentoApi, type Painel, type ResumoCiclos } from './api';
import {
  FAIXA_PRIORIDADE_ROTULO,
  SEVERIDADE_ROTULO,
  STATUS_ALERTA_ROTULO,
  STATUS_PLANO_ROTULO,
  formatarDataIso,
  formatarNumero,
  formatarPercentual,
  rotuloMapa,
} from './rotulos';
import { Aviso, Cartao, Celula, Linha, Tabela } from './ui';
import { STATUS_CICLO_ROTULO } from './FormularioCiclo';

function Kpi({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{rotulo}</p>
      <p className="text-lg font-semibold text-gray-900">{valor}</p>
    </div>
  );
}

function GraficoBarras({ data, vazio }: { data: { name: string; valor: number }[]; vazio: string }) {
  if (data.length === 0) return <p className="text-sm text-gray-500">{vazio}</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="valor" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function kpisPainel(painel: Painel) {
  return [
    { rotulo: 'População alvo', valor: formatarNumero(painel.populacao_alvo) },
    { rotulo: 'Doses aplicadas', valor: formatarNumero(painel.doses_aplicadas) },
    { rotulo: 'Não vacinados', valor: formatarNumero(painel.nao_vacinados) },
    { rotulo: 'Cobertura', valor: formatarPercentual(painel.cobertura) },
    { rotulo: 'Localidades prioritárias', valor: formatarNumero(painel.localidades_prioritarias) },
    { rotulo: 'Alertas abertos', valor: formatarNumero(painel.alertas_abertos) },
    { rotulo: 'Custo de comunicação', valor: formatarNumero(painel.custo_comunicacao) },
  ];
}

export function PainelAcompanhamento({ cicloId, estabelecimentoId }: { cicloId: number; estabelecimentoId?: number }) {
  const painel = useQuery({
    queryKey: ['mp-painel', cicloId, estabelecimentoId],
    queryFn: () => microplanejamentoApi.painel(cicloId, estabelecimentoId),
  });

  if (painel.isLoading) return <p className="text-sm text-gray-500">Carregando acompanhamento…</p>;
  if (painel.isError) return <Aviso tipo="erro">{apiErrorMessage(painel.error)}</Aviso>;
  if (!painel.data) return null;

  const dados = painel.data;
  const acoes = (dados.acoes ?? []).map((item) => ({
    name: rotuloMapa(STATUS_PLANO_ROTULO, item.status),
    valor: item.total,
  }));
  const tendencia = (dados.doses_por_dia ?? []).map((item) => ({
    name: formatarDataIso(item.data),
    valor: item.doses,
  }));
  const prioridades = (dados.prioridades ?? []).map((item) => ({
    name: item.localidade.nome,
    valor: item.total,
  }));
  const alertas = dados.alertas ?? [];

  return (
    <div className="space-y-4">
      <Cartao titulo="Andamento do ciclo">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {kpisPainel(dados).map((item) => <Kpi key={item.rotulo} rotulo={item.rotulo} valor={item.valor} />)}
        </div>
      </Cartao>
      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Ações por status">
          <GraficoBarras data={acoes} vazio="Nenhuma ação neste ciclo." />
        </Cartao>
        <Cartao titulo="Tendência de doses">
          <GraficoBarras data={tendencia} vazio="Nenhuma execução lançada ainda." />
        </Cartao>
      </div>
      <Cartao titulo="Prioridade composta">
        {prioridades.length === 0 ? (
          <p className="text-sm text-gray-500">O índice aparece depois que o ciclo tem localidades e dados de execução.</p>
        ) : (
          <>
            <GraficoBarras data={prioridades} vazio="" />
            <Tabela colunas={['Localidade', 'Faixa', 'Índice']}>
              {(dados.prioridades ?? []).map((item) => (
                <Linha key={`${item.localidade.nome}-${item.total}`}>
                  <Celula>{item.localidade.nome}</Celula>
                  <Celula>{rotuloMapa(FAIXA_PRIORIDADE_ROTULO, item.faixa)}</Celula>
                  <Celula>{formatarNumero(item.total)}</Celula>
                </Linha>
              ))}
            </Tabela>
          </>
        )}
      </Cartao>
      <Cartao titulo="Alertas abertos">
        {alertas.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum alerta aberto neste recorte.</p>
        ) : (
          <Tabela colunas={['Código', 'Texto', 'Severidade', 'Status']}>
            {alertas.map((alerta) => (
              <Linha key={alerta.id}>
                <Celula>{alerta.codigo}</Celula>
                <Celula>{alerta.texto}</Celula>
                <Celula>{rotuloMapa(SEVERIDADE_ROTULO, alerta.severidade)}</Celula>
                <Celula>{rotuloMapa(STATUS_ALERTA_ROTULO, alerta.status)}</Celula>
              </Linha>
            ))}
          </Tabela>
        )}
        <p className="text-sm text-gray-500">Para tratar um alerta, use Avaliação e alertas.</p>
      </Cartao>
    </div>
  );
}

export function ResumoCiclosPainel({ resumo, carregando, erro }: {
  resumo?: ResumoCiclos;
  carregando?: boolean;
  erro?: unknown;
}) {
  if (carregando) return <p className="text-sm text-gray-500">Carregando resumo dos ciclos…</p>;
  if (erro) return <Aviso tipo="erro">{apiErrorMessage(erro)}</Aviso>;
  if (!resumo) return null;
  const totais = resumo.totais;
  const porStatus = resumo.por_status.map((item) => ({
    name: rotuloMapa(STATUS_CICLO_ROTULO, item.status),
    valor: item.total,
  }));
  return (
    <div className="space-y-4">
      <Cartao titulo="Visão geral dos ciclos">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi rotulo="Ciclos" valor={formatarNumero(totais.ciclos)} />
          <Kpi rotulo="População alvo" valor={formatarNumero(totais.populacao_alvo)} />
          <Kpi rotulo="Doses aplicadas" valor={formatarNumero(totais.doses_aplicadas)} />
          <Kpi rotulo="Não vacinados" valor={formatarNumero(totais.nao_vacinados)} />
          <Kpi rotulo="Cobertura" valor={formatarPercentual(totais.cobertura)} />
          <Kpi rotulo="Alertas abertos" valor={formatarNumero(totais.alertas_abertos)} />
        </div>
      </Cartao>
      <Cartao titulo="Ciclos por status">
        <GraficoBarras data={porStatus} vazio="Nenhum ciclo nos filtros selecionados." />
      </Cartao>
    </div>
  );
}
