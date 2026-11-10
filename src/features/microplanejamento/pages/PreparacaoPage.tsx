import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Checklist, type ItemInventario } from '../api';
import { numero, useMpFiltro } from '../useMp';
import { enfileirar } from '../offlineQueue';
import { Aviso, Botao, BotaoSecundario, Cartao, Celula, inputClass, Linha, Modal, Tabela } from '../ui';

const OPCOES = ['SIM', 'PARCIAL', 'NAO', 'NA'] as const;

function FormularioChecklist({ checklist, offlineUbs }: { checklist: Checklist; offlineUbs?: boolean }) {
  const queryClient = useQueryClient();
  const [atual, setAtual] = useState(checklist);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const salvar = useMutation({
    mutationFn: (vars: { id: number; body: unknown }) => microplanejamentoApi.salvarRespostas(vars.id, vars.body),
    onSuccess: (data) => {
      setAtual(data);
      queryClient.invalidateQueries({ queryKey: ['mp-checklist'] });
      setOk(`Índice ${data.indice?.toFixed?.(2) ?? data.indice} · ${data.classificacao ?? ''}`);
      setErro('');
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  async function onRespostas(event: FormEvent<HTMLFormElement>, status?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const respostas = atual.catalogo.itens.map((item) => ({
      item_id: item.id,
      status: (String(form.get(`st-${item.id}`) || '') || null) as 'SIM' | 'PARCIAL' | 'NAO' | 'NA' | null,
      observacao: String(form.get(`obs-${item.id}`) || '') || null,
    }));
    if (offlineUbs && !navigator.onLine) {
      for (const resposta of respostas) {
        if (!resposta.status) continue;
        await enfileirar('resposta', { checklist_id: atual.id, item_id: resposta.item_id, status: resposta.status, observacao: resposta.observacao });
      }
      setOk('Respostas da UBS ficaram na fila offline.');
      return;
    }
    salvar.mutate({ id: atual.id, body: { respostas, status } });
  }

  const grupos = new Map<string, Checklist['catalogo']['itens']>();
  for (const item of atual.catalogo.itens) {
    const chave = item.componente || 'Geral';
    grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
  }
  const formId = `checklist-${atual.id}`;

  return (
    <>
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <form id={formId} className="space-y-4" onSubmit={(event) => onRespostas(event)}>
        <p className="text-sm">Índice {atual.indice ?? '—'} · {atual.classificacao ?? atual.status}</p>
        {[...grupos.entries()].map(([componente, itens]) => (
          <div key={componente}>
            <h3 className="mb-2 text-sm font-medium">{componente}</h3>
            {itens.map((item) => {
              const resposta = atual.respostas.find((row) => row.item_id === item.id);
              return (
                <div key={item.id} className="mb-2 grid gap-2 text-sm md:grid-cols-[1fr_160px_1fr]">
                  <span>{item.texto}</span>
                  <select name={`st-${item.id}`} defaultValue={resposta?.status ?? ''} className={inputClass} aria-label={`Situação de ${item.texto}`}>
                    <option value="">—</option>
                    {OPCOES.map((opcao) => <option key={opcao}>{opcao}</option>)}
                  </select>
                  <input name={`obs-${item.id}`} defaultValue={resposta?.observacao ?? ''} placeholder="Observação" className={inputClass} aria-label={`Observação de ${item.texto}`} />
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex gap-2">
          <Botao type="submit" disabled={salvar.isPending}>Salvar rascunho</Botao>
          <Botao type="button" disabled={salvar.isPending} onClick={() => {
            const form = document.getElementById(formId);
            if (form instanceof HTMLFormElement) onRespostas({ preventDefault() {}, currentTarget: form } as FormEvent<HTMLFormElement>, 'COMPLETA');
          }}>Marcar completa</Botao>
        </div>
      </form>
    </>
  );
}

export function ChecklistUbsPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const pronto = Boolean(cicloId && estabelecimentoId);
  const checklist = useQuery({
    queryKey: ['mp-checklist', 'UBS', cicloId, estabelecimentoId],
    enabled: pronto,
    queryFn: () => microplanejamentoApi.abrirChecklist({
      ciclo_id: cicloId,
      nivel: 'UBS',
      tipo: 'CHECKLIST_UBS',
      estabelecimento_id: estabelecimentoId,
    }),
  });

  return (
    <div className="space-y-4">
      {checklist.isError && <Aviso tipo="erro">{apiErrorMessage(checklist.error)}</Aviso>}
      <Cartao titulo="Checklist da UBS">
        {!pronto ? (
          <p className="text-sm text-gray-500">Selecione a UBS do ciclo.</p>
        ) : checklist.isLoading ? (
          <p className="text-sm text-gray-500">Carregando checklist.</p>
        ) : checklist.data ? (
          <FormularioChecklist key={checklist.data.id} checklist={checklist.data} offlineUbs />
        ) : null}
      </Cartao>
    </div>
  );
}

export function ChecklistMunicipioPage() {
  const { cicloId } = useMpFiltro();
  const checklist = useQuery({
    queryKey: ['mp-checklist', 'MUNICIPIO', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.abrirChecklist({
      ciclo_id: cicloId,
      nivel: 'MUNICIPIO',
      tipo: 'CHECKLIST_MUNICIPAL',
    }),
  });

  return (
    <div className="space-y-4">
      {checklist.isError && <Aviso tipo="erro">{apiErrorMessage(checklist.error)}</Aviso>}
      <Cartao titulo="Checklist do município">
        {checklist.isLoading ? (
          <p className="text-sm text-gray-500">Carregando checklist.</p>
        ) : checklist.data ? (
          <FormularioChecklist key={checklist.data.id} checklist={checklist.data} />
        ) : null}
      </Cartao>
    </div>
  );
}

export function PreparacaoPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState<'incluir' | 'gerenciar' | null>(null);
  const queryClient = useQueryClient();
  const pronto = Boolean(cicloId && estabelecimentoId);
  const inventario = useQuery({
    queryKey: ['mp-inv', cicloId, estabelecimentoId],
    enabled: pronto,
    queryFn: () => microplanejamentoApi.inventario(cicloId!, estabelecimentoId!),
  });
  const salvarInv = useMutation({
    mutationFn: microplanejamentoApi.salvarInventario,
    onSuccess: () => {
      setOk('Inventário gravado.');
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-inv'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const excluirItem = useMutation({
    mutationFn: (itemId: number) => microplanejamentoApi.excluirItemInventario(cicloId!, estabelecimentoId!, itemId),
    onSuccess: () => {
      setOk('Item retirado do inventário desta UBS.');
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-inv'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

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

  function retirarDaUbs(item: ItemInventario) {
    if (!window.confirm(`Retirar "${item.texto}" do inventário desta UBS?`)) return;
    excluirItem.mutate(item.id);
  }

  const itens = inventario.data?.itens ?? [];

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Inventário de rede de frio">
        <div className="mb-3 flex flex-wrap gap-2">
          <BotaoSecundario disabled={!pronto} onClick={() => setModal('incluir')}>Incluir item</BotaoSecundario>
          <BotaoSecundario disabled={!pronto} onClick={() => setModal('gerenciar')}>Gerenciar itens</BotaoSecundario>
        </div>
        <form className="space-y-2" onSubmit={onInventario} key={inventario.dataUpdatedAt}>
          {!pronto || inventario.isLoading ? (
            <p className="text-sm text-gray-500">Selecione ciclo e UBS.</p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum item neste inventário. Inclua um item para começar.</p>
          ) : (
            <Tabela colunas={['Item', 'Quantidade', 'Necessidade adicional', 'Observação', '']}>
              {itens.map((item) => {
                const registro = inventario.data?.registros.find((row) => row.item_id === item.id);
                return (
                  <Linha key={item.id}>
                    <Celula>
                      {item.texto}
                      {!item.ativo && <span className="ml-2 text-xs text-gray-500">indisponível</span>}
                    </Celula>
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
                    <Celula>
                      <BotaoSecundario onClick={() => retirarDaUbs(item)}>Excluir</BotaoSecundario>
                    </Celula>
                  </Linha>
                );
              })}
            </Tabela>
          )}
          <Botao type="submit" disabled={!pronto || itens.length === 0}>Gravar inventário</Botao>
        </form>
      </Cartao>
      {modal === 'incluir' && cicloId && estabelecimentoId && (
        <ModalIncluir
          cicloId={cicloId}
          estabelecimentoId={estabelecimentoId}
          disponiveis={inventario.data?.disponiveis ?? []}
          onFechar={() => setModal(null)}
          onOk={setOk}
          onErro={setErro}
        />
      )}
      {modal === 'gerenciar' && (
        <ModalGerenciar
          itens={inventario.data?.catalogo ?? []}
          onFechar={() => setModal(null)}
          onOk={setOk}
          onErro={setErro}
        />
      )}
    </div>
  );
}

function ModalIncluir({
  cicloId,
  estabelecimentoId,
  disponiveis,
  onFechar,
  onOk,
  onErro,
}: {
  cicloId: number;
  estabelecimentoId: number;
  disponiveis: ItemInventario[];
  onFechar: () => void;
  onOk: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}) {
  const queryClient = useQueryClient();
  const incluir = useMutation({
    mutationFn: (itemId: number) => microplanejamentoApi.incluirItemInventario({
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      item_id: itemId,
    }),
    onSuccess: () => {
      onOk('Item incluído no inventário desta UBS.');
      onErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-inv'] });
    },
    onError: (error) => onErro(apiErrorMessage(error)),
  });
  const criar = useMutation({
    mutationFn: microplanejamentoApi.criarItemInventario,
    onSuccess: () => {
      onOk('Item cadastrado e incluído nesta UBS.');
      onErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-inv'] });
    },
    onError: (error) => onErro(apiErrorMessage(error)),
  });

  function onCriar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    criar.mutate({
      texto: String(form.get('texto') || ''),
      padrao: form.get('padrao') === 'on',
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
    });
  }

  return (
    <Modal titulo="Incluir item" onFechar={onFechar}>
      <div className="space-y-4">
        {disponiveis.length === 0 ? (
          <p className="text-sm text-gray-500">Não há outros itens disponíveis no catálogo.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {disponiveis.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-gray-100 py-2">
                <span className="text-sm text-gray-800">
                  {item.texto}
                  {item.padrao && <span className="ml-2 text-xs text-gray-500">padrão</span>}
                </span>
                <Botao type="button" disabled={incluir.isPending} onClick={() => incluir.mutate(item.id)}>Incluir</Botao>
              </li>
            ))}
          </ul>
        )}
        <form className="space-y-3 border-t border-gray-200 pt-3" onSubmit={onCriar}>
          <p className="text-sm font-medium text-gray-800">Cadastrar item que ainda não existe</p>
          <input name="texto" required maxLength={500} className={inputClass} placeholder="Nome do item" aria-label="Nome do item" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input name="padrao" type="checkbox" />
            Padrão
          </label>
          <Botao type="submit" disabled={criar.isPending}>Cadastrar e incluir</Botao>
        </form>
      </div>
    </Modal>
  );
}

function ModalGerenciar({
  itens,
  onFechar,
  onOk,
  onErro,
}: {
  itens: ItemInventario[];
  onFechar: () => void;
  onOk: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<number | null>(null);
  const atualizar = () => queryClient.invalidateQueries({ queryKey: ['mp-inv'] });
  const editar = useMutation({
    mutationFn: (vars: { id: number; texto: string; padrao: boolean }) =>
      microplanejamentoApi.editarItemInventario(vars.id, { texto: vars.texto, padrao: vars.padrao }),
    onSuccess: () => {
      setEditando(null);
      onOk('Item atualizado.');
      onErro('');
      atualizar();
    },
    onError: (error) => onErro(apiErrorMessage(error)),
  });
  const retirar = useMutation({
    mutationFn: microplanejamentoApi.retirarItemInventario,
    onSuccess: (data) => {
      onOk(data.acao === 'DESABILITAR' ? 'Item desabilitado. Ele deixa de entrar em inventários novos.' : 'Item excluído do catálogo.');
      onErro('');
      atualizar();
    },
    onError: (error) => onErro(apiErrorMessage(error)),
  });

  function onEditar(event: FormEvent<HTMLFormElement>, item: ItemInventario) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    editar.mutate({ id: item.id, texto: String(form.get('texto') || ''), padrao: form.get('padrao') === 'on' });
  }

  function onRetirar(item: ItemInventario) {
    const verbo = item.usado ? 'desabilitar' : 'excluir';
    if (!window.confirm(`Confirma ${verbo} "${item.texto}"?`)) return;
    retirar.mutate(item.id);
  }

  return (
    <Modal titulo="Gerenciar itens" onFechar={onFechar}>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum item ativo no catálogo.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((item) => (
            <li key={item.id} className="border-b border-gray-100 pb-3">
              {editando === item.id ? (
                <form className="space-y-2" onSubmit={(event) => onEditar(event, item)}>
                  <input name="texto" required maxLength={500} defaultValue={item.texto} className={inputClass} aria-label={`Nome de ${item.texto}`} />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input name="padrao" type="checkbox" defaultChecked={item.padrao} />
                    Padrão
                  </label>
                  <div className="flex gap-2">
                    <Botao type="submit" disabled={editar.isPending}>Salvar</Botao>
                    <BotaoSecundario onClick={() => setEditando(null)}>Cancelar</BotaoSecundario>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-gray-800">
                    {item.texto}
                    {item.padrao && <span className="ml-2 text-xs text-gray-500">padrão</span>}
                  </span>
                  <div className="flex gap-2">
                    <BotaoSecundario onClick={() => setEditando(item.id)}>Editar</BotaoSecundario>
                    <BotaoSecundario disabled={retirar.isPending} onClick={() => onRetirar(item)}>
                      {item.usado ? 'Desabilitar' : 'Excluir'}
                    </BotaoSecundario>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
