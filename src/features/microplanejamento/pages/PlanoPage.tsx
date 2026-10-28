import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type LocalidadeCiclo } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, Cartao, Celula, Formulario, inputClass, Linha, Modal, Tabela } from '../ui';

const STATUS = [
  ['RASCUNHO', 'Rascunho'],
  ['EM_VALIDACAO', 'Em validação'],
  ['APROVADO', 'Aprovado'],
  ['EM_EXECUCAO', 'Em execução'],
  ['CONCLUIDA', 'Concluída'],
  ['REPROGRAMADA', 'Reprogramada'],
  ['CANCELADA', 'Cancelada'],
  ['ENCERRADO', 'Encerrado'],
] as const;

const STATUS_ROTULO: Record<string, string> = Object.fromEntries(STATUS);

type PlanoLocal = {
  id?: number;
  localidade_id?: number | null;
  estabelecimento_id?: number | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  responsavel_nome?: string | null;
  resultado?: string | null;
  localidade?: { id: number; nome: string } | null;
};

type PlanoAcao = {
  id: number;
  ciclo_id: number;
  acao: string;
  objetivo?: string | null;
  publico?: string | null;
  periodo?: string | null;
  status: string;
  locais?: PlanoLocal[];
};

type ModalPlano = { modo: 'criar' } | { modo: 'ver' | 'editar'; plano: PlanoAcao };

function isoDate(valor?: string | null) {
  return valor ? String(valor).slice(0, 10) : '';
}

function primeiroLocal(plano?: PlanoAcao) {
  return plano?.locais?.[0];
}

function nomeLocalidade(plano: PlanoAcao) {
  const local = primeiroLocal(plano);
  return local?.localidade?.nome ?? '—';
}

function FormularioPlano({
  modo,
  plano,
  locaisCiclo,
  onSubmit,
  onEditar,
  pending,
}: {
  modo: 'criar' | 'editar' | 'ver';
  plano?: PlanoAcao;
  locaisCiclo: LocalidadeCiclo[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditar?: () => void;
  pending?: boolean;
}) {
  const leitura = modo === 'ver';
  const primeiro = primeiroLocal(plano);
  const [localidadeId, setLocalidadeId] = useState<number | ''>(primeiro?.localidade_id ?? '');

  function usarPrioritaria() {
    const linha = locaisCiclo.find((item) => item.prioridade === 1);
    if (linha) setLocalidadeId(linha.localidade_id);
  }

  return (
    <Formulario onSubmit={leitura ? (event) => event.preventDefault() : onSubmit}>
      <Campo label="Ação"><input name="acao" required className={inputClass} defaultValue={plano?.acao ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Objetivo"><input name="objetivo" className={inputClass} defaultValue={plano?.objetivo ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Público"><input name="publico" className={inputClass} defaultValue={plano?.publico ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Período"><input name="periodo" className={inputClass} defaultValue={plano?.periodo ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Status">
        <select name="status" className={inputClass} defaultValue={plano?.status ?? 'RASCUNHO'} disabled={leitura}>
          {STATUS.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
      </Campo>
      <Campo label="Localidade">
        <div className="space-y-1">
          <select
            name="localidade_id"
            className={inputClass}
            value={localidadeId}
            disabled={leitura}
            onChange={(event) => setLocalidadeId(event.target.value ? Number(event.target.value) : '')}
          >
            <option value="">Selecione</option>
            {locaisCiclo.map((item) => (
              <option key={item.localidade_id} value={item.localidade_id}>
                {item.localidade.nome} · prioridade {item.prioridade ?? '—'}
              </option>
            ))}
          </select>
          {!leitura && (
            <button type="button" className="text-sm text-blue-700" onClick={usarPrioritaria}>
              Usar localidade prioritária
            </button>
          )}
        </div>
      </Campo>
      <Campo label="Responsável"><input name="responsavel" className={inputClass} defaultValue={primeiro?.responsavel_nome ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Início do local"><input name="inicio" type="date" className={inputClass} defaultValue={isoDate(primeiro?.data_inicio)} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Fim do local"><input name="fim" type="date" className={inputClass} defaultValue={isoDate(primeiro?.data_fim)} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Resultado mínimo"><input name="resultado" className={inputClass} defaultValue={primeiro?.resultado ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        {leitura ? (
          <Botao type="button" onClick={onEditar}>Editar</Botao>
        ) : (
          <Botao type="submit" disabled={pending}>{modo === 'criar' ? 'Gravar ação' : 'Salvar ação'}</Botao>
        )}
      </div>
    </Formulario>
  );
}

export function PlanoPage({ modo }: { modo: 'plano' | 'comunicacao' }) {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState<ModalPlano | null>(null);
  const planos = useQuery({
    queryKey: ['mp-planos', cicloId],
    enabled: Boolean(cicloId) && modo === 'plano',
    queryFn: () => microplanejamentoApi.listar<PlanoAcao>('planos', { cicloId, limit: 100 }),
  });
  const comunicacoes = useQuery({
    queryKey: ['mp-com', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId) && modo === 'comunicacao',
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('comunicacoes', { cicloId, estabelecimentoId }),
  });
  const locais = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!, estabelecimentoId),
  });
  const criar = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criar(modo === 'plano' ? 'planos' : 'comunicacoes', body),
    onSuccess: () => {
      setOk('Registro gravado.');
      setErro('');
      setModal(null);
      queryClient.invalidateQueries({ queryKey: ['mp-planos'] });
      queryClient.invalidateQueries({ queryKey: ['mp-com'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const atualizarPlano = useMutation({
    mutationFn: (vars: { id: number; body: unknown }) => microplanejamentoApi.atualizar('planos', vars.id, vars.body),
    onSuccess: () => {
      setOk('Ação atualizada.');
      setErro('');
      setModal(null);
      queryClient.invalidateQueries({ queryKey: ['mp-planos'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const excluirPlano = useMutation({
    mutationFn: (id: number) => microplanejamentoApi.inativar('planos', id),
    onSuccess: () => {
      setOk('Ação excluída.');
      queryClient.invalidateQueries({ queryKey: ['mp-planos'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function corpoPlano(form: FormData) {
    const localidadeId = numero(form.get('localidade_id'));
    return {
      ciclo_id: cicloId,
      acao: String(form.get('acao') || '').trim(),
      objetivo: texto(form.get('objetivo')),
      publico: texto(form.get('publico')),
      periodo: texto(form.get('periodo')),
      status: String(form.get('status') || 'RASCUNHO'),
      locais: localidadeId ? [{
        localidade_id: localidadeId,
        estabelecimento_id: estabelecimentoId ?? null,
        responsavel_nome: texto(form.get('responsavel')),
        data_inicio: texto(form.get('inicio')),
        data_fim: texto(form.get('fim')),
        resultado: texto(form.get('resultado')),
      }] : [],
    };
  }

  function onPlano(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId) return setErro('Selecione o ciclo.');
    const body = corpoPlano(new FormData(event.currentTarget));
    if (modal?.modo === 'editar') atualizarPlano.mutate({ id: modal.plano.id, body });
    else criar.mutate(body);
  }

  function onComunicacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId) return setErro('Selecione o ciclo.');
    const form = new FormData(event.currentTarget);
    criar.mutate({
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId ?? null,
      atividade: String(form.get('atividade') || '').trim(),
      data_hora: texto(form.get('data_hora')),
      local: texto(form.get('local')),
      objetivo: texto(form.get('objetivo')),
      forma: texto(form.get('forma')),
      publico: texto(form.get('publico')),
      mensagem_chave: texto(form.get('mensagem')),
      responsaveis: texto(form.get('responsaveis')),
      custo: numero(form.get('custo')),
      status: 'RASCUNHO',
    });
  }

  function onExcluir(plano: PlanoAcao) {
    if (!window.confirm(`Excluir a ação “${plano.acao}”? Ela deixa de aparecer na listagem.`)) return;
    excluirPlano.mutate(plano.id);
  }

  const tituloModal = modal?.modo === 'ver' ? 'Detalhe da ação' : modal?.modo === 'editar' ? 'Editar ação' : 'Nova ação';
  const lista = planos.data?.data ?? [];

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {modo === 'plano' ? (
        <>
          <Cartao titulo="Plano de ação" acoes={<Botao onClick={() => { setErro(''); setModal({ modo: 'criar' }); }}>Nova ação</Botao>}>
            {planos.isLoading ? (
              <p className="text-sm text-gray-500">Carregando ações…</p>
            ) : lista.length === 0 ? (
              <Aviso tipo="info">Nenhuma ação neste ciclo. Use Nova ação para cadastrar.</Aviso>
            ) : (
              <Tabela colunas={['Ação', 'Status', 'Localidade', 'Período', '']}>
                {lista.map((plano) => (
                  <Linha key={plano.id}>
                    <Celula>{plano.acao}</Celula>
                    <Celula>{STATUS_ROTULO[plano.status] ?? plano.status}</Celula>
                    <Celula>{nomeLocalidade(plano)}</Celula>
                    <Celula>{plano.periodo || '—'}</Celula>
                    <Celula>
                      <div className="flex flex-wrap gap-2">
                        <BotaoSecundario onClick={() => { setErro(''); setModal({ modo: 'ver', plano }); }}>Ver</BotaoSecundario>
                        <BotaoSecundario onClick={() => { setErro(''); setModal({ modo: 'editar', plano }); }}>Editar</BotaoSecundario>
                        <BotaoSecundario onClick={() => onExcluir(plano)} disabled={excluirPlano.isPending}>Excluir</BotaoSecundario>
                      </div>
                    </Celula>
                  </Linha>
                ))}
              </Tabela>
            )}
          </Cartao>
          {modal && (
            <Modal titulo={tituloModal} onFechar={() => setModal(null)}>
              {erro && <Aviso tipo="erro">{erro}</Aviso>}
              <FormularioPlano
                key={`${modal.modo}-${modal.modo === 'criar' ? 'novo' : modal.plano.id}`}
                modo={modal.modo}
                plano={modal.modo === 'criar' ? undefined : modal.plano}
                locaisCiclo={locais.data?.data ?? []}
                onSubmit={onPlano}
                onEditar={modal.modo === 'ver' ? () => setModal({ modo: 'editar', plano: modal.plano }) : undefined}
                pending={criar.isPending || atualizarPlano.isPending}
              />
            </Modal>
          )}
        </>
      ) : (
        <Cartao titulo="Comunicação">
          <p className="text-sm">Custo total: {String(comunicacoes.data?.custo_total ?? 0)}</p>
          <Formulario onSubmit={onComunicacao}>
            <Campo label="Atividade"><input name="atividade" required className={inputClass} /></Campo>
            <Campo label="Data e hora"><input name="data_hora" type="datetime-local" className={inputClass} /></Campo>
            <Campo label="Local"><input name="local" className={inputClass} /></Campo>
            <Campo label="Objetivo"><input name="objetivo" className={inputClass} /></Campo>
            <Campo label="Forma"><input name="forma" className={inputClass} /></Campo>
            <Campo label="Público"><input name="publico" className={inputClass} /></Campo>
            <Campo label="Mensagem-chave"><input name="mensagem" className={inputClass} /></Campo>
            <Campo label="Responsáveis"><input name="responsaveis" className={inputClass} /></Campo>
            <Campo label="Custo"><input name="custo" type="number" min={0} step="0.01" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Gravar atividade</Botao></div>
          </Formulario>
          <Tabela colunas={['Atividade', 'Custo', 'Status']}>
            {(comunicacoes.data?.data ?? []).map((item) => (
              <Linha key={String(item.id)}>
                <Celula>{String(item.atividade)}</Celula>
                <Celula>{String(item.custo ?? 0)}</Celula>
                <Celula>{String(item.status ?? '')}</Celula>
              </Linha>
            ))}
          </Tabela>
        </Cartao>
      )}
    </div>
  );
}
