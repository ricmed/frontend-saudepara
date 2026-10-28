import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Checklist } from '../api';
import { numero, useMpFiltro } from '../useMp';
import { enfileirar } from '../offlineQueue';
import { Aviso, Botao, Cartao, Celula, inputClass, Linha, Tabela } from '../ui';

const OPCOES = ['SIM', 'PARCIAL', 'NAO', 'NA'] as const;

export function PreparacaoPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const queryClient = useQueryClient();
  const inventario = useQuery({
    queryKey: ['mp-inv', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.inventario(cicloId!, estabelecimentoId!),
  });
  const abrir = useMutation({
    mutationFn: microplanejamentoApi.abrirChecklist,
    onSuccess: (data) => {
      setChecklist(data);
      setOk('Checklist aberto.');
      setErro('');
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const salvar = useMutation({
    mutationFn: (vars: { id: number; body: unknown }) => microplanejamentoApi.salvarRespostas(vars.id, vars.body),
    onSuccess: (data) => {
      setChecklist(data);
      setOk(`Índice ${data.indice?.toFixed?.(2) ?? data.indice} · ${data.classificacao ?? ''}`);
      setErro('');
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const salvarInv = useMutation({
    mutationFn: microplanejamentoApi.salvarInventario,
    onSuccess: () => {
      setOk('Inventário gravado.');
      queryClient.invalidateQueries({ queryKey: ['mp-inv'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  async function onRespostas(event: FormEvent<HTMLFormElement>, status?: string) {
    event.preventDefault();
    if (!checklist) return;
    const form = new FormData(event.currentTarget);
    const respostas = checklist.catalogo.itens.map((item) => ({
      item_id: item.id,
      status: (String(form.get(`st-${item.id}`) || '') || null) as 'SIM' | 'PARCIAL' | 'NAO' | 'NA' | null,
      observacao: String(form.get(`obs-${item.id}`) || '') || null,
    }));
    if (checklist.catalogo.tipo === 'CHECKLIST_UBS' && !navigator.onLine) {
      for (const resposta of respostas) {
        if (!resposta.status) continue;
        await enfileirar('resposta', { checklist_id: checklist.id, item_id: resposta.item_id, status: resposta.status, observacao: resposta.observacao });
      }
      setOk('Respostas da UBS ficaram na fila offline.');
      return;
    }
    salvar.mutate({ id: checklist.id, body: { respostas, status } });
  }

  function onInventario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    const form = new FormData(event.currentTarget);
    const linhas = (inventario.data?.itens ?? []).map((item) => ({
      item_id: item.id,
      quantidade: numero(form.get(`q-${item.id}`)),
      necessidade_adicional: numero(form.get(`n-${item.id}`)),
      observacoes: String(form.get(`o-${item.id}`) || '') || null,
    }));
    salvarInv.mutate({ ciclo_id: cicloId, estabelecimento_id: estabelecimentoId, linhas });
  }

  const grupos = new Map<string, Checklist['catalogo']['itens']>();
  for (const item of checklist?.catalogo.itens ?? []) {
    const chave = item.componente || 'Geral';
    grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Checklists" acoes={
        <div className="flex gap-2">
          <Botao onClick={() => cicloId && abrir.mutate({ ciclo_id: cicloId, nivel: 'MUNICIPIO', tipo: 'CHECKLIST_MUNICIPAL' })}>Municipal</Botao>
          <Botao onClick={() => cicloId && estabelecimentoId && abrir.mutate({ ciclo_id: cicloId, nivel: 'UBS', tipo: 'CHECKLIST_UBS', estabelecimento_id: estabelecimentoId })}>UBS</Botao>
        </div>
      }>
        {checklist && (
          <form id="checklist-mp" className="space-y-4" onSubmit={(event) => onRespostas(event)}>
            <p className="text-sm">Índice {checklist.indice ?? '—'} · {checklist.classificacao ?? checklist.status}</p>
            {[...grupos.entries()].map(([componente, itens]) => (
              <div key={componente}>
                <h3 className="font-medium text-sm mb-2">{componente}</h3>
                {itens.map((item) => {
                  const resposta = checklist.respostas.find((row) => row.item_id === item.id);
                  return (
                    <div key={item.id} className="grid md:grid-cols-[1fr_160px_1fr] gap-2 mb-2 text-sm">
                      <span>{item.texto}</span>
                      <select name={`st-${item.id}`} defaultValue={resposta?.status ?? ''} className={inputClass}>
                        <option value="">—</option>
                        {OPCOES.map((opcao) => <option key={opcao}>{opcao}</option>)}
                      </select>
                      <input name={`obs-${item.id}`} defaultValue={resposta?.observacao ?? ''} placeholder="Observação" className={inputClass} />
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex gap-2">
              <Botao type="submit">Salvar rascunho</Botao>
              <Botao type="button" onClick={() => {
                const form = document.getElementById('checklist-mp');
                if (form instanceof HTMLFormElement) onRespostas({ preventDefault() {}, currentTarget: form } as FormEvent<HTMLFormElement>, 'COMPLETA');
              }}>Marcar completa</Botao>
            </div>
          </form>
        )}
      </Cartao>
      <Cartao titulo="Inventário de rede de frio">
        <form className="space-y-2" onSubmit={onInventario}>
          {(inventario.data?.itens.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">Selecione ciclo e UBS.</p>
          ) : (
            <Tabela colunas={['Item', 'Quantidade', 'Necessidade adicional', 'Observação']}>
              {(inventario.data?.itens ?? []).map((item) => {
                const registro = inventario.data?.registros.find((row) => row.item_id === item.id);
                return (
                  <Linha key={item.id}>
                    <Celula>{item.texto}</Celula>
                    <Celula>
                      <input
                        name={`q-${item.id}`}
                        type="number"
                        min={0}
                        defaultValue={registro?.quantidade ?? 0}
                        className={`${inputClass} w-24`}
                        aria-label={`Quantidade de ${item.texto}`}
                      />
                    </Celula>
                    <Celula>
                      <input
                        name={`n-${item.id}`}
                        type="number"
                        min={0}
                        defaultValue={registro?.necessidade_adicional ?? 0}
                        className={`${inputClass} w-28`}
                        aria-label={`Necessidade adicional de ${item.texto}`}
                      />
                    </Celula>
                    <Celula>
                      <input
                        name={`o-${item.id}`}
                        defaultValue={registro?.observacoes ?? ''}
                        className={inputClass}
                        aria-label={`Observação de ${item.texto}`}
                      />
                    </Celula>
                  </Linha>
                );
              })}
            </Tabela>
          )}
          <Botao type="submit">Gravar inventário</Botao>
        </form>
      </Cartao>
    </div>
  );
}
