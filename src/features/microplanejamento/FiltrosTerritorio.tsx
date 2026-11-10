import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export function FiltroUbsCiclo() {
  const filtro = useMpFiltro();
  const { ubs, isLoading } = useUbsDoCiclo(filtro.cicloId);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-3 md:max-w-sm">
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
    </section>
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
