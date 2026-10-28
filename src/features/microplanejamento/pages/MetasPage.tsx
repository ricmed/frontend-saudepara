import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { numero, useMpFiltro } from '../useMp';
import { Aviso, Botao, Cartao, Celula, inputClass, Linha, Tabela } from '../ui';

export function MetasPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const vacinas = useQuery({ queryKey: ['mp-cat-vac'], queryFn: () => microplanejamentoApi.catalogo('VACINA') });
  const insumos = useQuery({ queryKey: ['mp-cat-ins'], queryFn: () => microplanejamentoApi.catalogo('INSUMO') });
  const metas = useQuery({
    queryKey: ['mp-metas', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.metas(cicloId!, estabelecimentoId),
  });
  const necessidades = useQuery({
    queryKey: ['mp-nec', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.necessidades(cicloId!, estabelecimentoId!),
  });
  const salvarMeta = useMutation({
    mutationFn: microplanejamentoApi.salvarMeta,
    onSuccess: () => {
      setOk('Meta gravada. Meses e dias são calculados no servidor.');
      queryClient.invalidateQueries({ queryKey: ['mp-metas'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const salvarNec = useMutation({
    mutationFn: microplanejamentoApi.salvarNecessidades,
    onSuccess: () => {
      setOk('Necessidade calculada.');
      queryClient.invalidateQueries({ queryKey: ['mp-nec'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function onMeta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    const form = new FormData(event.currentTarget);
    salvarMeta.mutate({
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      item_id: numero(form.get('item_id')),
      populacao_alvo: numero(form.get('populacao')),
      doses_por_pessoa: numero(form.get('doses'), 1),
    });
  }

  function onNec(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    const form = new FormData(event.currentTarget);
    const itens = [...(vacinas.data?.itens ?? []), ...(insumos.data?.itens ?? [])];
    salvarNec.mutate({
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      linhas: itens.map((item) => ({
        item_id: item.id,
        meta_doses: numero(form.get(`meta-${item.id}`)),
        perda_informada: numero(form.get(`perda-${item.id}`)),
        perda_modo: String(form.get(`modo-${item.id}`) || 'DOSES'),
        saldo_disponivel: numero(form.get(`saldo-${item.id}`)),
        quantidade_manual: form.get(`manual-${item.id}`) === '' ? null : numero(form.get(`manual-${item.id}`)),
      })),
    });
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Meta da UBS">
        <form className="grid md:grid-cols-4 gap-2" onSubmit={onMeta}>
          <select name="item_id" required className={inputClass}>
            <option value="">Vacina</option>
            {(vacinas.data?.itens ?? []).map((item) => <option key={item.id} value={item.id}>{item.texto}</option>)}
          </select>
          <input name="populacao" type="number" min={1} required placeholder="População-alvo anual" className={inputClass} />
          <input name="doses" type="number" min={1} step="0.01" required placeholder="Doses por pessoa" className={inputClass} />
          <Botao type="submit">Gravar meta</Botao>
        </form>
        {(metas.data?.data ?? []).map((meta) => (
          <div key={meta.id} className="mt-4">
            <p className="font-medium text-sm">{meta.item?.texto} · população {meta.populacao_alvo} · doses/pessoa {meta.doses_por_pessoa}</p>
            <Tabela colunas={['Mês', 'Meta acumulada', 'Doses', 'Saldo', '%']}>
              {(meta.grade?.meses ?? []).map((mes) => (
                <Linha key={mes.mes}>
                  <Celula>{mes.mes}</Celula>
                  <Celula>{mes.meta_doses}</Celula>
                  <Celula>{mes.doses_aplicadas}</Celula>
                  <Celula>{mes.saldo}</Celula>
                  <Celula>{mes.atingimento}</Celula>
                </Linha>
              ))}
            </Tabela>
          </div>
        ))}
      </Cartao>
      <Cartao titulo="Necessidade de vacinas e insumos">
        <form className="space-y-2" onSubmit={onNec}>
          <Tabela colunas={['Item', 'Meta de doses', 'Perda', 'Modo da perda', 'Saldo', 'Necessárias', 'A solicitar', 'Frascos']}>
            {[...(vacinas.data?.itens ?? []), ...(insumos.data?.itens ?? [])].map((item) => {
              const linha = necessidades.data?.data.find((row) => row.item_id === item.id);
              return (
                <Linha key={item.id}>
                  <Celula>{item.texto}</Celula>
                  <Celula>
                    <input
                      name={`meta-${item.id}`}
                      type="number"
                      min={0}
                      defaultValue={linha?.meta_doses ?? 0}
                      className={`${inputClass} w-24`}
                      aria-label={`Meta de doses de ${item.texto}`}
                    />
                  </Celula>
                  <Celula>
                    <input
                      name={`perda-${item.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={linha?.perda_informada ?? 0}
                      className={`${inputClass} w-24`}
                      aria-label={`Perda de ${item.texto}`}
                    />
                  </Celula>
                  <Celula>
                    <select
                      name={`modo-${item.id}`}
                      defaultValue={linha?.perda_modo ?? 'DOSES'}
                      className={inputClass}
                      aria-label={`Modo da perda de ${item.texto}`}
                    >
                      <option>DOSES</option>
                      <option>PERCENTUAL</option>
                    </select>
                  </Celula>
                  <Celula>
                    <input
                      name={`saldo-${item.id}`}
                      type="number"
                      min={0}
                      defaultValue={linha?.saldo_disponivel ?? 0}
                      className={`${inputClass} w-24`}
                      aria-label={`Saldo de ${item.texto}`}
                    />
                  </Celula>
                  <Celula>{linha?.doses_necessarias ?? 0}</Celula>
                  <Celula>{linha?.a_solicitar ?? 0}</Celula>
                  <Celula>
                    {linha?.frascos ?? 0}
                    <input name={`manual-${item.id}`} type="number" min={0} className="hidden" defaultValue={linha?.quantidade_manual ?? ''} />
                  </Celula>
                </Linha>
              );
            })}
          </Tabela>
          <Botao type="submit">Calcular necessidade</Botao>
        </form>
      </Cartao>
    </div>
  );
}
