import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { microplanejamentoApi } from './api';
import { somarPopulacaoUbs } from './populacaoUbs';
import { formatarNumero } from './rotulos';
import { inputClass } from './ui';
import {
  buscarEstabelecimentos,
  useEstabelecimentoSelecionado,
  useMpFiltro,
  useMunicipios,
  useUbsDoCiclo,
  type EstabelecimentoOption,
  type MunicipioOption,
} from './useMp';

function normalizar(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function rotuloUbs(item: EstabelecimentoOption) {
  return item.cnes ? `${item.nome} · ${item.cnes}` : item.nome;
}

export function FiltroUbsCiclo({ aplicaLocalidade }: { aplicaLocalidade: boolean }) {
  const filtro = useMpFiltro();
  const { ubs, isLoading } = useUbsDoCiclo(filtro.cicloId);
  const localidades = useQuery({
    queryKey: ['mp-localidades', filtro.estabelecimentoId],
    enabled: Boolean(filtro.estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId: filtro.estabelecimentoId, limit: 100 }),
  });
  const aporte = useQuery({
    queryKey: ['mp-localidades-ciclo', filtro.cicloId, filtro.estabelecimentoId],
    enabled: Boolean(filtro.cicloId && filtro.estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(filtro.cicloId!, filtro.estabelecimentoId),
  });

  useEffect(() => {
    if (!filtro.localidadeId || !localidades.isSuccess) return;
    const existe = (localidades.data?.data ?? []).some((item) => item.id === filtro.localidadeId);
    if (!existe) filtro.setFiltro('localidadeId', '');
  }, [filtro.localidadeId, filtro.setFiltro, localidades.data, localidades.isSuccess]);

  const linhasAporte = (aporte.data?.data ?? []).filter((linha) =>
    !filtro.localidadeId || linha.localidade_id === filtro.localidadeId,
  );
  const populacao = somarPopulacaoUbs(linhasAporte.map((linha) => ({
    populacao_alvo: linha.populacao_alvo,
    zona: linha.localidade.zona,
  })));
  const itens = localidades.data?.data ?? [];

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,24rem)_minmax(16rem,24rem)_1fr] lg:items-end">
        <label className="text-sm text-gray-700">
          UBS do ciclo
          {isLoading ? (
            <p className="mt-1 text-gray-500">Carregando…</p>
          ) : ubs.length === 0 ? (
            <p className="mt-1 text-gray-500">Inclua uma UBS em Localidades.</p>
          ) : (
            <select
              className={`${inputClass} mt-1`}
              value={filtro.estabelecimentoId ?? ''}
              onChange={(event) => filtro.setFiltro('estabelecimentoId', event.target.value)}
            >
              <option value="">Selecione</option>
              {ubs.map((item) => (
                <option key={item.idestabelecimento} value={item.idestabelecimento}>
                  {item.cnes ? `${item.nome} · ${item.cnes}` : item.nome}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="text-sm text-gray-700">
          Localidade
          <select
            className={`${inputClass} mt-1`}
            value={filtro.localidadeId ?? ''}
            disabled={!filtro.estabelecimentoId || localidades.isLoading}
            onChange={(event) => filtro.setFiltro('localidadeId', event.target.value)}
          >
            <option value="">{filtro.estabelecimentoId ? 'Todas' : 'Selecione a UBS'}</option>
            {itens.map((item) => (
              <option key={item.id} value={item.id}>{item.nome}</option>
            ))}
          </select>
        </label>
        <CardPopulacao
          titulo={filtro.localidadeId ? 'População da localidade' : 'População da UBS'}
          semUbs={!filtro.estabelecimentoId}
          carregando={Boolean(filtro.estabelecimentoId) && aporte.isLoading}
          erro={aporte.isError}
          total={populacao.total}
          urbana={populacao.urbana}
          rural={populacao.rural}
          semZona={populacao.semZona}
        />
      </div>
      {filtro.localidadeId && !aplicaLocalidade && (
        <p className="text-xs text-gray-500">
          O recorte por localidade vale para lideranças, plano de ação, execução e MEV. Esta seção continua da UBS inteira.
        </p>
      )}
    </section>
  );
}

function CardPopulacao({
  titulo,
  semUbs,
  carregando,
  erro,
  total,
  urbana,
  rural,
  semZona,
}: {
  titulo: string;
  semUbs: boolean;
  carregando: boolean;
  erro: boolean;
  total: number;
  urbana: number;
  rural: number;
  semZona: number;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
      <p className="font-medium text-gray-900">{titulo}</p>
      {semUbs ? (
        <p className="mt-1 text-gray-500">Selecione a UBS.</p>
      ) : carregando ? (
        <p className="mt-1 text-gray-500">Carregando…</p>
      ) : erro ? (
        <p className="mt-1 text-gray-500">Não foi possível carregar a população.</p>
      ) : (
        <>
          <dl className="mt-1 grid grid-cols-3 gap-2">
            <div><dt className="text-xs text-gray-500">Total</dt><dd className="font-medium">{formatarNumero(total)}</dd></div>
            <div><dt className="text-xs text-gray-500">Urbana</dt><dd className="font-medium">{formatarNumero(urbana)}</dd></div>
            <div><dt className="text-xs text-gray-500">Rural</dt><dd className="font-medium">{formatarNumero(rural)}</dd></div>
          </dl>
          {total === 0 && (
            <p className="mt-1 text-xs text-gray-500">A população é preenchida em Localidades, na aba Aporte.</p>
          )}
          {semZona > 0 && (
            <p className="mt-1 text-xs text-gray-500">Sem zona: {formatarNumero(semZona)}. Informe a zona da localidade para entrar em urbana ou rural.</p>
          )}
        </>
      )}
    </div>
  );
}

export function FiltrosTerritorio() {
  const filtro = useMpFiltro();
  const municipios = useMunicipios();
  const selecionado = municipios.data?.find((item) => item.idtipo_municipio === filtro.municipioId);
  const ubs = useEstabelecimentoSelecionado(filtro.estabelecimentoId);

  return (
    <>
      <CampoMunicipio
        itens={municipios.data ?? []}
        carregando={municipios.isLoading}
        erro={municipios.isError}
        selecionado={selecionado}
        onEscolher={(id) => filtro.setFiltro('municipioId', id ? String(id) : '')}
      />
      <CampoUbs
        municipioId={filtro.municipioId}
        selecionado={ubs.data}
        onEscolher={(id) => filtro.setFiltro('estabelecimentoId', id ? String(id) : '')}
      />
    </>
  );
}

export function CampoMunicipio({
  itens,
  carregando,
  erro,
  selecionado,
  onEscolher,
}: {
  itens: MunicipioOption[];
  carregando: boolean;
  erro: boolean;
  selecionado?: MunicipioOption;
  onEscolher: (id: number | null) => void;
}) {
  const listaId = useId();
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const texto = rascunho ?? selecionado?.descricao ?? '';
  const termo = rascunho ?? '';
  const filtrados = useMemo(() => {
    const base = termo
      ? itens.filter((item) => normalizar(item.descricao).includes(normalizar(termo)))
      : itens;
    return base.slice(0, 40);
  }, [itens, termo]);

  useEffect(() => {
    function fechar(event: MouseEvent) {
      if (!caixa.current?.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const mensagem = carregando
    ? 'Buscando municípios...'
    : erro
      ? 'Não foi possível carregar os municípios.'
      : itens.length === 0
        ? 'Nenhum município encontrado.'
        : filtrados.length === 0
          ? 'Nenhum município com esse nome.'
          : '';

  return (
    <div ref={caixa} className="relative text-sm text-gray-700">
      <span className="font-medium">Município</span>
      <input
        className={`${inputClass} mt-1`}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        placeholder={carregando ? 'Buscando municípios...' : 'Digite o município'}
        disabled={carregando || erro}
        value={texto}
        onFocus={() => setAberto(true)}
        onMouseDown={() => setAberto(true)}
        onChange={(event) => {
          const valor = event.target.value;
          setRascunho(valor);
          setAberto(true);
          if (!valor.trim()) onEscolher(null);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (caixa.current?.contains(document.activeElement)) return;
            setRascunho(null);
            setAberto(false);
          }, 150);
        }}
      />
      {aberto && (
        <ul id={listaId} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {mensagem ? <li className="px-3 py-2 text-gray-500">{mensagem}</li> : filtrados.map((item) => (
            <li key={item.idtipo_municipio}>
              <button
                type="button"
                role="option"
                className="block w-full px-3 py-2 text-left hover:bg-blue-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onEscolher(item.idtipo_municipio);
                  setRascunho(null);
                  setAberto(false);
                }}
              >
                {item.descricao}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!carregando && (erro || itens.length === 0) && (
        <p className="mt-1 text-xs text-gray-500">{erro ? 'Não foi possível carregar os municípios.' : 'Nenhum município encontrado.'}</p>
      )}
    </div>
  );
}

export function CampoUbs({
  municipioId,
  selecionado,
  onEscolher,
  label = 'UBS',
}: {
  municipioId?: number;
  selecionado?: EstabelecimentoOption;
  onEscolher: (id: number | null) => void;
  label?: string;
}) {
  const listaId = useId();
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<string | null>(null);
  const [termo, setTermo] = useState('');
  const caixa = useRef<HTMLDivElement>(null);
  const texto = rascunho ?? (selecionado ? rotuloUbs(selecionado) : '');

  useEffect(() => {
    if (rascunho == null || rascunho.trim().length < 2) {
      setTermo('');
      return;
    }
    const timer = window.setTimeout(() => setTermo(rascunho.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [rascunho]);

  const busca = useQuery({
    queryKey: ['mp-ubs-busca', municipioId, termo],
    enabled: Boolean(municipioId) && termo.length >= 2,
    queryFn: () => buscarEstabelecimentos(municipioId!, termo),
  });

  useEffect(() => {
    function fechar(event: MouseEvent) {
      if (!caixa.current?.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const aguardando = (rascunho ?? '').trim().length >= 2 && termo !== (rascunho ?? '').trim();
  const mensagem = !municipioId
    ? 'Selecione o município.'
    : (rascunho ?? '').trim().length < 2
      ? 'Digite ao menos 2 caracteres.'
      : aguardando || busca.isFetching
        ? 'Buscando estabelecimentos...'
        : busca.isError
          ? 'Não foi possível buscar os estabelecimentos.'
          : (busca.data?.length ?? 0) === 0
            ? 'Nenhum estabelecimento encontrado.'
            : '';

  return (
    <div ref={caixa} className="relative text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      <input
        className={`${inputClass} mt-1`}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        placeholder={municipioId ? 'Nome ou CNES' : 'Selecione o município'}
        disabled={!municipioId}
        value={texto}
        onFocus={() => setAberto(true)}
        onMouseDown={() => setAberto(true)}
        onChange={(event) => {
          const valor = event.target.value;
          setRascunho(valor);
          setAberto(true);
          if (!valor.trim()) onEscolher(null);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (caixa.current?.contains(document.activeElement)) return;
            setRascunho(null);
            setAberto(false);
          }, 150);
        }}
      />
      {aberto && municipioId && (
        <ul id={listaId} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {mensagem ? <li className="px-3 py-2 text-gray-500">{mensagem}</li> : (busca.data ?? []).map((item) => (
            <li key={item.idestabelecimento}>
              <button
                type="button"
                role="option"
                className="block w-full px-3 py-2 text-left hover:bg-blue-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onEscolher(item.idestabelecimento);
                  setRascunho(null);
                  setAberto(false);
                }}
                onClick={() => {
                  onEscolher(item.idestabelecimento);
                  setRascunho(null);
                  setAberto(false);
                }}
              >
                {rotuloUbs(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
