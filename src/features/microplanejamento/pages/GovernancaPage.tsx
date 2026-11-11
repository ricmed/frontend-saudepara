import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { formatarDataIso, formatarNumero } from '../rotulos';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, CampoCheck, Cartao, Celula, Formulario, inputClass, Linha, Modal, Tabela } from '../ui';

type Aba = 'comite' | 'capacitacoes' | 'profissionais' | 'liderancas';

export function GovernancaPage() {
  const { cicloId, estabelecimentoId, localidadeId, municipioId } = useMpFiltro();
  const [aba, setAba] = useState<Aba>('comite');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [detalheCapacitacao, setDetalheCapacitacao] = useState<Record<string, unknown> | null>(null);
  const [formCapacitacao, setFormCapacitacao] = useState<{ modo: 'criar' } | { modo: 'editar'; linha: Record<string, unknown> } | null>(null);
  const queryClient = useQueryClient();
  const params = { cicloId, estabelecimentoId, limit: 100 };

  const comite = useQuery({ queryKey: ['mp-comite', cicloId], enabled: Boolean(cicloId), queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('comite', params) });
  const capacitacoes = useQuery({ queryKey: ['mp-cap', cicloId, estabelecimentoId], enabled: Boolean(cicloId), queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('capacitacoes', params) });
  const profissionais = useQuery({ queryKey: ['mp-prof', estabelecimentoId], enabled: Boolean(estabelecimentoId), queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('profissionais', { estabelecimentoId, limit: 100 }) });
  const liderancas = useQuery({
    queryKey: ['mp-lid', estabelecimentoId, localidadeId],
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('liderancas', { estabelecimentoId, localidadeId, limit: 100 }),
  });
  const localidades = useQuery({ queryKey: ['mp-localidades', estabelecimentoId], enabled: Boolean(estabelecimentoId), queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId, limit: 100 }) });

  const criar = useMutation({
    mutationFn: (vars: { recurso: string; body: unknown }) => microplanejamentoApi.criar(vars.recurso, vars.body),
    onSuccess: () => {
      setErro('');
      setOk('Registro gravado.');
      queryClient.invalidateQueries({ queryKey: ['mp-comite'] });
      queryClient.invalidateQueries({ queryKey: ['mp-cap'] });
      queryClient.invalidateQueries({ queryKey: ['mp-prof'] });
      queryClient.invalidateQueries({ queryKey: ['mp-lid'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const atualizar = useMutation({
    mutationFn: (vars: { recurso: string; id: number; body: unknown }) => microplanejamentoApi.atualizar(vars.recurso, vars.id, vars.body),
    onSuccess: () => {
      setErro('');
      setOk('Registro gravado.');
      queryClient.invalidateQueries({ queryKey: ['mp-cap'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const inativar = useMutation({
    mutationFn: (vars: { recurso: string; id: number }) => microplanejamentoApi.inativar(vars.recurso, vars.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mp-comite'] });
      queryClient.invalidateQueries({ queryKey: ['mp-cap'] });
      queryClient.invalidateQueries({ queryKey: ['mp-prof'] });
      queryClient.invalidateQueries({ queryKey: ['mp-lid'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function corpoCapacitacao(form: FormData) {
    return {
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId ?? null,
      data: texto(form.get('data')),
      local: texto(form.get('local')),
      meio_divulgacao: texto(form.get('meio_divulgacao')),
      publico: texto(form.get('publico')),
      objetivo: texto(form.get('objetivo')),
      temas: texto(form.get('temas')),
      numero_participantes: form.get('participantes') ? numero(form.get('participantes')) : null,
      responsaveis: texto(form.get('responsaveis')),
      expositores: texto(form.get('expositores')),
      materiais: texto(form.get('materiais')),
      custo: numero(form.get('custo')),
      observacoes: texto(form.get('observacoes')),
      link_presenca: texto(form.get('link_presenca')),
    };
  }

  function salvarCapacitacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formCapacitacao) return;
    if (!cicloId) return setErro('Selecione o ciclo.');
    const body = corpoCapacitacao(new FormData(event.currentTarget));
    const fechar = () => setFormCapacitacao(null);
    if (formCapacitacao.modo === 'editar') {
      atualizar.mutate({ recurso: 'capacitacoes', id: Number(formCapacitacao.linha.id), body }, { onSuccess: fechar });
      return;
    }
    criar.mutate({ recurso: 'capacitacoes', body }, { onSuccess: fechar });
  }

  function enviar(recurso: string, body: unknown, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((recurso === 'comite' || recurso === 'capacitacoes') && !cicloId) return setErro('Selecione o ciclo.');
    if (recurso === 'comite' && !municipioId) return setErro('Selecione o município.');
    if (recurso === 'profissionais' && !estabelecimentoId) return setErro('Selecione a UBS.');
    criar.mutate({ recurso, body });
    event.currentTarget.reset();
  }

  const totais = (profissionais.data?.totais ?? {}) as Record<string, number>;
  const locaisDaUbs = (localidades.data?.data ?? []).filter((local) => !localidadeId || local.id === localidadeId);
  const semLideranca = locaisDaUbs.filter((local) =>
    !(liderancas.data?.data ?? []).some((lider) => Number(lider.localidade_id) === local.id),
  );

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-wrap gap-2">
        {([['comite', 'Comitê'], ['capacitacoes', 'Capacitações'], ['profissionais', 'Equipe'], ['liderancas', 'Lideranças']] as const).map(([id, rotulo]) => (
          <button key={id} type="button" onClick={() => setAba(id)} className={`rounded-full px-3 py-1 text-sm ${aba === id ? 'bg-blue-700 text-white' : 'bg-white border'}`}>{rotulo}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4 text-sm">
        <Cartao titulo="Membros">{comite.data?.pagination?.total ?? comite.data?.data.length ?? 0}</Cartao>
        <Cartao titulo="Capacitações">{capacitacoes.data?.data.length ?? 0}</Cartao>
        <Cartao titulo="Vacinadores">{totais.vacinador ?? 0}</Cartao>
        <Cartao titulo="Sem liderança">{semLideranca.length}</Cartao>
      </div>

      {aba === 'comite' && (
        <Cartao titulo="Comitê">
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            enviar('comite', {
              ciclo_id: cicloId,
              tipo_municipio_id: municipioId,
              estabelecimento_id: estabelecimentoId ?? null,
              nome: String(form.get('nome')),
              cargo: String(form.get('cargo')),
              responsabilidades: String(form.get('responsabilidades')),
              email: texto(form.get('email')) ?? '',
              telefone: texto(form.get('telefone')),
            }, event);
          }}>
            <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
            <Campo label="Cargo"><input name="cargo" required className={inputClass} /></Campo>
            <Campo label="Responsabilidades"><input name="responsabilidades" required className={inputClass} /></Campo>
            <Campo label="E-mail"><input name="email" type="email" className={inputClass} /></Campo>
            <Campo label="Telefone"><input name="telefone" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Incluir membro</Botao></div>
          </Formulario>
          <Lista linhas={comite.data?.data ?? []} colunas={['nome', 'cargo']} recurso="comite" onInativar={(id) => inativar.mutate({ recurso: 'comite', id })} />
        </Cartao>
      )}

      {aba === 'capacitacoes' && (
        <Cartao
          titulo="Capacitações"
          acoes={<Botao onClick={() => { setErro(''); setFormCapacitacao({ modo: 'criar' }); }}>Incluir capacitação</Botao>}
        >
          <Lista
            linhas={capacitacoes.data?.data ?? []}
            colunas={['data', 'local', 'publico', 'objetivo']}
            rotulos={['Data', 'Local', 'Público', 'Objetivo']}
            recurso="capacitacoes"
            acao="Excluir"
            formatar={(coluna, valor) => coluna === 'data' ? formatarDataIso(typeof valor === 'string' ? valor : null) : String(valor ?? '—')}
            onInativar={(id) => inativar.mutate({ recurso: 'capacitacoes', id })}
            onDetalhe={setDetalheCapacitacao}
            onEditar={(linha) => { setErro(''); setFormCapacitacao({ modo: 'editar', linha }); }}
          />
          {detalheCapacitacao && (
            <Modal titulo="Detalhe da capacitação" onFechar={() => setDetalheCapacitacao(null)}>
              <DetalheCapacitacao linha={detalheCapacitacao} />
            </Modal>
          )}
          {formCapacitacao && (
            <Modal
              titulo={formCapacitacao.modo === 'editar' ? 'Editar capacitação' : 'Incluir capacitação'}
              onFechar={() => setFormCapacitacao(null)}
            >
              {erro && <Aviso tipo="erro">{erro}</Aviso>}
              <FormularioCapacitacao
                key={formCapacitacao.modo === 'editar' ? String(formCapacitacao.linha.id) : 'nova'}
                linha={formCapacitacao.modo === 'editar' ? formCapacitacao.linha : undefined}
                pending={criar.isPending || atualizar.isPending}
                onSubmit={salvarCapacitacao}
              />
            </Modal>
          )}
        </Cartao>
      )}

      {aba === 'profissionais' && (
        <Cartao titulo="Equipe">
          <p className="text-sm text-gray-600">Anotadores {totais.anotador ?? 0} · ACS {totais.acs ?? 0} · voluntários {totais.voluntario ?? 0} · MEV {totais.participa_mev ?? 0}</p>
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            enviar('profissionais', {
              estabelecimento_id: estabelecimentoId,
              nome: String(form.get('nome')),
              lotacao: texto(form.get('lotacao')),
              telefone: texto(form.get('telefone')),
              email: texto(form.get('email')) ?? '',
              vacinador: form.get('vacinador') === 'on',
              anotador: form.get('anotador') === 'on',
              acs: form.get('acs') === 'on',
              voluntario: form.get('voluntario') === 'on',
              participa_mev: form.get('mev') === 'on',
            }, event);
          }}>
            <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
            <Campo label="Lotação"><input name="lotacao" className={inputClass} /></Campo>
            <Campo label="Telefone"><CampoTelefone name="telefone" /></Campo>
            <Campo label="E-mail"><CampoEmail name="email" /></Campo>
            <div className="flex flex-col gap-2 md:col-span-2">
              <CampoCheck label="Vacinador"><input name="vacinador" type="checkbox" /></CampoCheck>
              <CampoCheck label="Anotador"><input name="anotador" type="checkbox" /></CampoCheck>
              <CampoCheck label="ACS"><input name="acs" type="checkbox" /></CampoCheck>
              <CampoCheck label="Voluntário"><input name="voluntario" type="checkbox" /></CampoCheck>
              <CampoCheck label="Participa da MEV"><input name="mev" type="checkbox" /></CampoCheck>
            </div>
            <div className="md:col-span-2"><Botao type="submit">Incluir profissional</Botao></div>
          </Formulario>
          <Lista linhas={profissionais.data?.data ?? []} colunas={['nome', 'lotacao']} recurso="profissionais" onInativar={(id) => inativar.mutate({ recurso: 'profissionais', id })} />
        </Cartao>
      )}

      {aba === 'liderancas' && (
        <Cartao titulo="Lideranças">
          {semLideranca.length > 0 && <Aviso tipo="info">{semLideranca.length} localidade(s) sem liderança.</Aviso>}
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            const tipos = ['COMUNITARIA', 'POLITICA', 'RELIGIOSA', 'OUTRA'].filter((tipo) => form.get(tipo) === 'on');
            if (tipos.length === 0) {
              event.preventDefault();
              return setErro('Marque ao menos um tipo de liderança.');
            }
            enviar('liderancas', {
              localidade_id: numero(form.get('localidade_id')),
              nome: String(form.get('nome')),
              tipos,
              telefone: texto(form.get('telefone')),
              email: texto(form.get('email')) ?? '',
              disponibilidade: texto(form.get('disponibilidade')),
              observacoes: texto(form.get('observacoes')),
            }, event);
          }}>
            <Campo label="Localidade">
              <select key={localidadeId ?? 'todas'} name="localidade_id" required className={inputClass} defaultValue={localidadeId ?? ''}>
                <option value="">Selecione</option>
                {(localidades.data?.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
            {['COMUNITARIA', 'POLITICA', 'RELIGIOSA', 'OUTRA'].map((tipo) => <CampoCheck key={tipo} label={tipo}><input name={tipo} type="checkbox" /></CampoCheck>)}
            <Campo label="Telefone"><CampoTelefone name="telefone" /></Campo>
            <Campo label="E-mail"><CampoEmail name="email" /></Campo>
            <Campo label="Disponibilidade"><input name="disponibilidade" className={inputClass} /></Campo>
            <Campo label="Observações"><input name="observacoes" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Incluir liderança</Botao></div>
          </Formulario>
          <Lista linhas={liderancas.data?.data ?? []} colunas={['nome']} recurso="liderancas" onInativar={(id) => inativar.mutate({ recurso: 'liderancas', id })} />
        </Cartao>
      )}
    </div>
  );
}

function CampoData({ name, valor }: { name: string; valor?: string | null }) {
  const campo = useRef<HTMLInputElement>(null);
  const iso = valor ? String(valor).slice(0, 10) : '';
  const [texto, setTexto] = useState(iso ? formatarDataIso(iso) : '');

  useEffect(() => {
    const form = campo.current?.form;
    if (!form) return;
    const limpar = () => setTexto('');
    form.addEventListener('reset', limpar);
    return () => form.removeEventListener('reset', limpar);
  }, []);

  return (
    <div className="relative">
      <input
        ref={campo}
        name={name}
        type="date"
        lang="pt-BR"
        defaultValue={iso}
        className={`${inputClass} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0`}
        onChange={(event) => setTexto(event.target.value ? formatarDataIso(event.target.value) : '')}
      />
      <div className="pointer-events-none absolute inset-y-px left-px right-10 flex items-center rounded-l-md bg-white px-3 text-sm">
        {texto || <span className="text-gray-400">dd/mm/aaaa</span>}
      </div>
      <button
        type="button"
        aria-label="Abrir calendário"
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500"
        onClick={() => {
          const campoAtual = campo.current;
          if (!campoAtual) return;
          try {
            campoAtual.showPicker();
          } catch {
            campoAtual.focus();
          }
        }}
      >
        <svg viewBox="0 0 24 24" className="pointer-events-none h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>
    </div>
  );
}

function mascararTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length < 3) return digitos ? `(${digitos}` : '';
  if (digitos.length < 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length < 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function CampoTelefone({ name }: { name: string }) {
  return (
    <input
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(00) 00000-0000"
      maxLength={15}
      className={inputClass}
      onInput={(event) => {
        const alvo = event.currentTarget;
        alvo.value = mascararTelefone(alvo.value);
        const digitos = alvo.value.replace(/\D/g, '').length;
        alvo.setCustomValidity(
          digitos === 0 || digitos === 10 || digitos === 11
            ? ''
            : 'Informe um telefone com DDD: (00) 0000-0000 ou (00) 00000-0000.',
        );
      }}
    />
  );
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function CampoEmail({ name }: { name: string }) {
  return (
    <input
      name={name}
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="nome@dominio.com"
      className={inputClass}
      onInput={(event) => {
        const valor = event.currentTarget.value.trim();
        event.currentTarget.setCustomValidity(
          valor && !EMAIL_VALIDO.test(valor) ? 'Informe um e-mail válido, como nome@dominio.com.' : '',
        );
      }}
    />
  );
}

function CampoReais({ name, valor }: { name: string; valor?: number | null }) {
  const hidden = useRef<HTMLInputElement>(null);
  const temValor = valor != null && Number.isFinite(valor) && valor > 0;
  const visivel = temValor
    ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500">R$</span>
      <input
        inputMode="numeric"
        placeholder="0,00"
        autoComplete="off"
        defaultValue={visivel}
        className={`${inputClass} pl-9`}
        onInput={(event) => {
          const alvo = event.currentTarget;
          const digitos = alvo.value.replace(/\D/g, '').slice(0, 12);
          const centavos = Number(digitos) / 100;
          alvo.value = digitos
            ? centavos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '';
          if (hidden.current) hidden.current.value = digitos ? String(centavos) : '';
        }}
      />
      <input ref={hidden} type="hidden" name={name} defaultValue={temValor ? String(valor) : ''} />
    </div>
  );
}

const CAMPOS_CAPACITACAO = [
  ['data', 'Data'],
  ['local', 'Local'],
  ['meio_divulgacao', 'Meio de divulgação'],
  ['publico', 'Público'],
  ['objetivo', 'Objetivo'],
  ['temas', 'Temas'],
  ['numero_participantes', 'Qtd de participantes'],
  ['responsaveis', 'Responsáveis'],
  ['expositores', 'Expositores'],
  ['materiais', 'Materiais'],
  ['custo', 'Custo'],
  ['observacoes', 'Observações'],
  ['link_presenca', 'Link de presença'],
] as const;

function textoDetalhe(campo: string, valor: unknown) {
  if (valor == null || valor === '') return '—';
  if (campo === 'data') return formatarDataIso(typeof valor === 'string' ? valor : null);
  if (campo === 'custo') {
    const numeroValor = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numeroValor)
      ? numeroValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';
  }
  if (campo === 'numero_participantes') {
    const numeroValor = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numeroValor) ? formatarNumero(numeroValor) : '—';
  }
  return String(valor);
}

function DetalheCapacitacao({ linha }: { linha: Record<string, unknown> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {CAMPOS_CAPACITACAO.map(([campo, rotulo]) => (
        <div key={campo} className={campo === 'objetivo' || campo === 'temas' || campo === 'expositores' || campo === 'materiais' || campo === 'observacoes' ? 'sm:col-span-2' : undefined}>
          <dt className="text-xs font-medium text-gray-500">{rotulo}</dt>
          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{textoDetalhe(campo, linha[campo])}</dd>
        </div>
      ))}
    </dl>
  );
}

function textoCampo(linha: Record<string, unknown> | undefined, campo: string) {
  const valor = linha?.[campo];
  return valor == null ? '' : String(valor);
}

function FormularioCapacitacao({
  linha,
  pending,
  onSubmit,
}: {
  linha?: Record<string, unknown>;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const participantes = linha?.numero_participantes;
  const custo = typeof linha?.custo === 'number' ? linha.custo : Number(linha?.custo);
  return (
    <Formulario onSubmit={onSubmit}>
      <Campo label="Data"><CampoData name="data" valor={textoCampo(linha, 'data')} /></Campo>
      <Campo label="Local"><input name="local" maxLength={180} className={inputClass} defaultValue={textoCampo(linha, 'local')} /></Campo>
      <Campo label="Meio de divulgação"><input name="meio_divulgacao" maxLength={180} className={inputClass} defaultValue={textoCampo(linha, 'meio_divulgacao')} /></Campo>
      <Campo label="Público"><input name="publico" maxLength={180} className={inputClass} defaultValue={textoCampo(linha, 'publico')} /></Campo>
      <Campo label="Objetivo"><textarea name="objetivo" rows={2} className={inputClass} defaultValue={textoCampo(linha, 'objetivo')} /></Campo>
      <Campo label="Temas"><textarea name="temas" rows={2} className={inputClass} defaultValue={textoCampo(linha, 'temas')} /></Campo>
      <Campo label="Qtd de participantes">
        <input name="participantes" type="number" min={0} className={inputClass} defaultValue={participantes == null ? '' : String(participantes)} />
      </Campo>
      <Campo label="Responsáveis"><textarea name="responsaveis" rows={2} className={inputClass} defaultValue={textoCampo(linha, 'responsaveis')} /></Campo>
      <Campo label="Expositores"><textarea name="expositores" rows={2} className={inputClass} defaultValue={textoCampo(linha, 'expositores')} /></Campo>
      <Campo label="Materiais"><textarea name="materiais" rows={2} className={inputClass} defaultValue={textoCampo(linha, 'materiais')} /></Campo>
      <Campo label="Custo"><CampoReais name="custo" valor={Number.isFinite(custo) ? custo : null} /></Campo>
      <Campo label="Observações"><textarea name="observacoes" rows={2} className={inputClass} defaultValue={textoCampo(linha, 'observacoes')} /></Campo>
      <Campo label="Link de presença"><input name="link_presenca" type="url" maxLength={400} className={inputClass} defaultValue={textoCampo(linha, 'link_presenca')} /></Campo>
      <div className="md:col-span-2">
        <Botao type="submit" disabled={pending}>{linha ? 'Salvar capacitação' : 'Incluir capacitação'}</Botao>
      </div>
    </Formulario>
  );
}

function Lista({
  linhas,
  colunas,
  rotulos,
  onInativar,
  onDetalhe,
  onEditar,
  acao = 'Inativar',
  formatar,
}: {
  linhas: Record<string, unknown>[];
  colunas: string[];
  rotulos?: string[];
  recurso: string;
  onInativar: (id: number) => void;
  onDetalhe?: (linha: Record<string, unknown>) => void;
  onEditar?: (linha: Record<string, unknown>) => void;
  acao?: string;
  formatar?: (coluna: string, valor: unknown) => string;
}) {
  if (linhas.length === 0) return <p className="text-sm text-gray-500">Nenhum registro.</p>;
  return (
    <Tabela colunas={[...(rotulos ?? colunas), '']}>
      {linhas.map((linha) => (
        <Linha key={String(linha.id)}>
          {colunas.map((coluna) => (
            <Celula key={coluna}>{formatar ? formatar(coluna, linha[coluna]) : String(linha[coluna] ?? '—')}</Celula>
          ))}
          <Celula>
            <div className="flex flex-wrap gap-2">
              {onDetalhe && <BotaoSecundario onClick={() => onDetalhe(linha)}>Detalhes</BotaoSecundario>}
              {onEditar && <BotaoSecundario onClick={() => onEditar(linha)}>Editar</BotaoSecundario>}
              <BotaoSecundario onClick={() => onInativar(Number(linha.id))}>{acao}</BotaoSecundario>
            </div>
          </Celula>
        </Linha>
      ))}
    </Tabela>
  );
}
