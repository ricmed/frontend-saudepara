import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { numero, useMpFiltro } from '../useMp';
import { Aviso, Botao, Cartao, Celula, inputClass, Linha, Tabela } from '../ui';

export function InsumosPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const vacinas = useQuery({ queryKey: ['mp-cat-vac'], queryFn: () => microplanejamentoApi.catalogo('VACINA') });
  const insumos = useQuery({ queryKey: ['mp-cat-ins'], queryFn: () => microplanejamentoApi.catalogo('INSUMO') });
  const necessidades = useQuery({
    queryKey: ['mp-nec', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.necessidades(cicloId!, estabelecimentoId!),
  });
  const salvarNec = useMutation({
    mutationFn: microplanejamentoApi.salvarNecessidades,
    onSuccess: () => {
      setOk('Necessidade calculada.');
      queryClient.invalidateQueries({ queryKey: ['mp-nec'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function onNec(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOk('');
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    setErro('');
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
