import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { useMpFiltro } from '../useMp';
import { Aviso, Cartao } from '../ui';

export function InicioPage() {
  const { cicloId } = useMpFiltro();
  const health = useQuery({
    queryKey: ['mp-health'],
    queryFn: () => microplanejamentoApi.health(),
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

  return (
    <div className="space-y-4">
      {health.isError && <Aviso tipo="erro">{apiErrorMessage(health.error)}</Aviso>}
      {health.data?.ok && <Aviso tipo="ok">API de microplanejamento disponível para o usuário autenticado.</Aviso>}
      {!cicloId && <Aviso tipo="info">Selecione um ciclo para ver a sala de situação. O cadastro do ciclo fica em Localidades.</Aviso>}
      {painel.isError && <Aviso tipo="erro">{apiErrorMessage(painel.error)}</Aviso>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cartao titulo="Localidades no ciclo">
          <p className="text-3xl font-semibold text-blue-800">{localidades.data?.data.length ?? 0}</p>
        </Cartao>
        {cards.map(([rotulo, valor]) => (
          <Cartao key={String(rotulo)} titulo={String(rotulo)}>
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
    </div>
  );
}
