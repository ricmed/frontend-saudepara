import { FormEvent, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Meta } from '../api';
import { mensagemPopulacaoAlvo, somarPopulacaoUbs } from '../populacaoUbs';
import { dataCurta, mensagemPeriodoMeta } from '../periodoMeta';
import { numero, useMpFiltro } from '../useMp';
import { Aviso, Botao, Cartao, Celula, inputClass, Linha, Tabela } from '../ui';

const campoBloqueado = `${inputClass} disabled:bg-gray-100 disabled:text-gray-500`;

export function MetasPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const atualizando = useRef(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [itemId, setItemId] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [populacao, setPopulacao] = useState('');
  const [doses, setDoses] = useState('');
  const vacinas = useQuery({ queryKey: ['mp-cat-vac'], queryFn: () => microplanejamentoApi.catalogo('VACINA') });
  const aporte = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!, estabelecimentoId),
  });
  const metas = useQuery({
    queryKey: ['mp-metas', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.metas(cicloId!, estabelecimentoId),
  });
  const totalUbs = somarPopulacaoUbs((aporte.data?.data ?? []).map((linha) => ({
    populacao_alvo: linha.populacao_alvo,
    zona: linha.localidade.zona,
  }))).total;
  const metaSelecionada = (metas.data?.data ?? []).find((meta) => String(meta.item_id) === itemId);
  const bloqueada = Boolean(metaSelecionada?.grade?.usaExecucao);
  const salvarMeta = useMutation({
    mutationFn: microplanejamentoApi.salvarMeta,
    onSuccess: () => {
      setOk(atualizando.current ? 'Meta atualizada.' : 'Meta gravada.');
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-metas'] });
    },
    onError: (error) => {
      setOk('');
      setErro(apiErrorMessage(error));
    },
  });

  function preencher(meta?: Meta) {
    setInicio(meta?.data_inicio?.slice(0, 10) ?? '');
    setFim(meta?.data_fim?.slice(0, 10) ?? '');
    setPopulacao(meta ? String(meta.populacao_alvo) : '');
    setDoses(meta ? String(meta.doses_por_pessoa) : '');
  }

  function aoEscolherVacina(valor: string) {
    setItemId(valor);
    setOk('');
    setErro('');
    preencher((metas.data?.data ?? []).find((meta) => String(meta.item_id) === valor));
  }

  function onMeta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOk('');
    if (bloqueada) return setErro('A meta não pode ser alterada porque já há execução diária.');
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    if (aporte.isLoading) return setErro('Aguarde a população da UBS.');
    if (aporte.isError) return setErro('Não foi possível carregar a população da UBS.');
    const populacaoInformada = numero(populacao);
    const erroPeriodo = mensagemPeriodoMeta(inicio, fim);
    const erroPopulacao = mensagemPopulacaoAlvo(populacaoInformada, totalUbs);
    if (erroPeriodo || erroPopulacao) return setErro(erroPeriodo || erroPopulacao || '');
    setErro('');
    atualizando.current = Boolean(metaSelecionada);
    salvarMeta.mutate({
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      item_id: numero(itemId),
      populacao_alvo: populacaoInformada,
      doses_por_pessoa: numero(doses, 1),
      data_inicio: inicio,
      data_fim: fim,
    });
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Meta da UBS">
        <form className="grid grid-cols-[minmax(0,1.4fr)_minmax(9.5rem,1fr)_minmax(9.5rem,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2" onSubmit={onMeta}>
          <select name="item_id" required value={itemId} className={inputClass} aria-label="Vacina" onChange={(event) => aoEscolherVacina(event.target.value)}>
            <option value="">Vacina</option>
            {(vacinas.data?.itens ?? []).map((item) => <option key={item.id} value={item.id}>{item.texto}</option>)}
          </select>
          <CampoData name="data_inicio" rotulo="Data início" valor={inicio} onChange={setInicio} disabled={bloqueada} />
          <CampoData name="data_fim" rotulo="Data fim" valor={fim} onChange={setFim} disabled={bloqueada} />
          <input
            name="populacao"
            type="number"
            min={1}
            max={totalUbs > 0 ? totalUbs : undefined}
            step={1}
            required
            disabled={bloqueada}
            value={populacao}
            onChange={(event) => setPopulacao(event.target.value)}
            placeholder="População-alvo"
            aria-label="População-alvo"
            className={campoBloqueado}
          />
          <input
            name="doses"
            type="number"
            min={1}
            step="0.01"
            required
            disabled={bloqueada}
            value={doses}
            onChange={(event) => setDoses(event.target.value)}
            placeholder="Doses por pessoa"
            aria-label="Doses por pessoa"
            className={campoBloqueado}
          />
          <Botao type="submit" disabled={bloqueada || salvarMeta.isPending}>{metaSelecionada ? 'Atualizar meta' : 'Gravar meta'}</Botao>
        </form>
        <p className="text-xs text-gray-500">População da UBS: {totalUbs}. O período pode ter no máximo 12 meses.</p>
        {bloqueada && <Aviso tipo="info">A meta não pode ser alterada porque já há execução diária.</Aviso>}
        {(metas.data?.data ?? []).map((meta) => (
          <div key={meta.id} className="mt-4">
            <p className="font-medium text-sm">
              {meta.item?.texto} · população {meta.populacao_alvo} · doses/pessoa {meta.doses_por_pessoa}
              {meta.data_inicio && meta.data_fim ? ` · ${dataCurta(meta.data_inicio)} a ${dataCurta(meta.data_fim)}` : ''}
            </p>
            <Tabela colunas={['Mês', 'Meta acumulada', 'Doses', 'Saldo', '%']}>
              {(meta.grade?.meses ?? []).map((mes) => (
                <Linha key={`${mes.ano ?? 'ano'}-${mes.mes}`}>
                  <Celula>{mes.rotulo ?? mes.mes}</Celula>
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
    </div>
  );
}

function CampoData({
  name,
  rotulo,
  valor,
  onChange,
  disabled,
}: {
  name: string;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  const campo = useRef<HTMLInputElement>(null);

  function abrirCalendario() {
    const atual = campo.current;
    if (!atual || disabled) return;
    try {
      atual.showPicker();
    } catch {
      atual.focus();
    }
  }

  return (
    <div className="relative min-w-0">
      <input
        ref={campo}
        name={name}
        type="date"
        required
        lang="pt-BR"
        disabled={disabled}
        value={valor}
        aria-label={rotulo}
        className={`${campoBloqueado} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0`}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className={`pointer-events-none absolute inset-y-px left-px right-9 flex items-center overflow-hidden rounded-l-md px-3 text-sm ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
        {valor ? dataCurta(valor) : <span className="text-gray-400">dd/mm/aaaa</span>}
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Abrir calendário de ${rotulo}`}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-gray-500 disabled:text-gray-300"
        onClick={abrirCalendario}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>
    </div>
  );
}
