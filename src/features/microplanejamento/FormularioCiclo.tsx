import { FormEvent, useState } from 'react';
import type { Ciclo } from './api';
import { CampoMunicipio } from './FiltrosTerritorio';
import { Botao, Campo, Formulario, inputClass } from './ui';
import { numero, texto, useMunicipios, type MunicipioOption } from './useMp';

export const ESTRATEGIAS = ['ROTINA', 'INTENSIFICACAO', 'CAMPANHA', 'MULTIVACINACAO', 'BLOQUEIO'];

export const STATUS_CICLO = [
  ['RASCUNHO', 'Rascunho'],
  ['EM_VALIDACAO', 'Em validação'],
  ['APROVADO', 'Aprovado'],
  ['EM_EXECUCAO', 'Em execução'],
  ['ENCERRADO', 'Encerrado'],
] as const;

export const STATUS_CICLO_ROTULO: Record<string, string> = Object.fromEntries(STATUS_CICLO);

export type DadosCiclo = {
  nome: string;
  ano: number;
  estrategia: string;
  tipo_municipio_id: number;
  status: string;
  data_inicio?: string | null;
  data_fim?: string | null;
  dias_operacionais: number;
};

function isoDate(valor?: string | null) {
  return valor ? String(valor).slice(0, 10) : '';
}

/** Dias corridos entre as datas, contando o dia de início. Null se o período for inválido. */
export function diasOperacionaisEntre(inicio: string, fim: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim) || inicio >= fim) return null;
  const [ai, mi, di] = inicio.split('-').map(Number);
  const [af, mf, df] = fim.split('-').map(Number);
  const a = Date.UTC(ai, mi - 1, di);
  const b = Date.UTC(af, mf - 1, df);
  return Math.round((b - a) / 86_400_000) + 1;
}

const inputCurto = 'w-full min-w-0 rounded-md border border-gray-300 px-2 py-2 text-sm bg-white';

function isoParaBr(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function mascararDataBr(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter((parte) => parte.length > 0).join('/');
}

/** Converte dd/mm/aaaa em aaaa-mm-dd. Null se a data não existir. */
function dataBrParaIso(valor: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!match) return null;
  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function FormularioCiclo({
  modo,
  ciclo,
  municipioId,
  onMunicipio,
  onSubmit,
  pending,
}: {
  modo: 'criar' | 'editar';
  ciclo?: Ciclo;
  municipioId?: number;
  onMunicipio?: (id: number | null) => void;
  onSubmit: (dados: DadosCiclo) => void;
  pending?: boolean;
}) {
  const anoCorrente = new Date().getFullYear();
  const municipios = useMunicipios();
  const [municipioLocal, setMunicipioLocal] = useState<number | undefined>(municipioId);
  const [ano, setAno] = useState(String(ciclo?.ano ?? anoCorrente));
  const [inicioBr, setInicioBr] = useState(isoParaBr(isoDate(ciclo?.data_inicio)));
  const [fimBr, setFimBr] = useState(isoParaBr(isoDate(ciclo?.data_fim)));
  const [erro, setErro] = useState('');
  const inicio = dataBrParaIso(inicioBr) ?? '';
  const fim = dataBrParaIso(fimBr) ?? '';
  const municipioAtual = onMunicipio ? municipioId : municipioLocal;
  const selecionado: MunicipioOption | undefined = municipios.data?.find((item) => item.idtipo_municipio === municipioAtual);
  const dias = diasOperacionaisEntre(inicio, fim);
  const erroPeriodo = inicio && fim && dias == null ? 'A data de início deve ser anterior à data de fim.' : '';
  const erroAno = modo === 'criar' && ano !== '' && numero(ano, anoCorrente) < anoCorrente
    ? 'O ano não pode ser menor que o ano corrente.'
    : '';
  const mensagem = erroAno || erroPeriodo || erro;

  function escolherMunicipio(id: number | null) {
    if (onMunicipio) onMunicipio(id);
    else setMunicipioLocal(id ?? undefined);
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tipoMunicipio = modo === 'editar' ? ciclo?.tipo_municipio_id : municipioAtual;
    if (!tipoMunicipio) return;
    const anoInformado = modo === 'editar' ? ciclo!.ano : numero(ano, anoCorrente);
    if (erroAno) {
      setErro(erroAno);
      return;
    }
    if (!inicio || !fim) {
      setErro('Informe início e fim no formato dd/mm/aaaa.');
      return;
    }
    const diasCalculados = diasOperacionaisEntre(inicio, fim);
    if (diasCalculados == null) {
      setErro('A data de início deve ser anterior à data de fim.');
      return;
    }
    setErro('');
    onSubmit({
      nome: String(form.get('nome') || '').trim(),
      ano: anoInformado,
      estrategia: modo === 'editar' ? ciclo!.estrategia : String(form.get('estrategia')),
      tipo_municipio_id: tipoMunicipio,
      status: String(form.get('status') || 'RASCUNHO'),
      data_inicio: texto(inicio),
      data_fim: texto(fim),
      dias_operacionais: diasCalculados,
    });
  }

  return (
    <Formulario onSubmit={enviar}>
      {modo === 'criar' ? (
        <CampoMunicipio
          itens={municipios.data ?? []}
          carregando={municipios.isLoading}
          erro={municipios.isError}
          selecionado={selecionado}
          onEscolher={escolherMunicipio}
        />
      ) : (
        <Campo label="Município">
          <input className={inputClass} value={ciclo?.tipo_municipio?.descricao ?? '—'} disabled readOnly />
        </Campo>
      )}
      <Campo label="Nome"><input name="nome" required className={inputClass} defaultValue={ciclo?.nome ?? ''} /></Campo>
      <div className="grid min-w-0 grid-cols-3 gap-2 md:col-span-2">
        <Campo label="Ano">
          <input
            name="ano"
            type="number"
            required
            min={modo === 'criar' ? anoCorrente : undefined}
            className={inputCurto}
            value={ano}
            onChange={(event) => setAno(event.target.value)}
            disabled={modo === 'editar'}
            readOnly={modo === 'editar'}
          />
        </Campo>
        <Campo label="Estratégia">
          {modo === 'editar' ? (
            <input className={inputCurto} value={ciclo?.estrategia ?? ''} disabled readOnly />
          ) : (
            <select name="estrategia" className={inputCurto}>{ESTRATEGIAS.map((item) => <option key={item}>{item}</option>)}</select>
          )}
        </Campo>
        <Campo label="Status">
          <select name="status" className={inputCurto} defaultValue={ciclo?.status ?? 'RASCUNHO'}>
            {STATUS_CICLO.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </Campo>
      </div>
      <div className="grid min-w-0 grid-cols-3 gap-2 md:col-span-2">
        <Campo label="Início">
          <input
            name="data_inicio"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            placeholder="dd/mm/aaaa"
            maxLength={10}
            pattern="\d{2}/\d{2}/\d{4}"
            title="dd/mm/aaaa"
            className={inputCurto}
            value={inicioBr}
            onChange={(event) => { setInicioBr(mascararDataBr(event.target.value)); setErro(''); }}
          />
        </Campo>
        <Campo label="Fim">
          <input
            name="data_fim"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            placeholder="dd/mm/aaaa"
            maxLength={10}
            pattern="\d{2}/\d{2}/\d{4}"
            title="dd/mm/aaaa"
            className={inputCurto}
            value={fimBr}
            onChange={(event) => { setFimBr(mascararDataBr(event.target.value)); setErro(''); }}
          />
        </Campo>
        <Campo label="Dias operacionais">
          <input name="dias" type="number" readOnly tabIndex={-1} value={dias ?? ''} className={`${inputCurto} bg-gray-50`} title="Diferença entre início e fim, contando o dia de início" />
        </Campo>
      </div>
      {mensagem && <p className="text-sm text-red-700 md:col-span-2">{mensagem}</p>}
      <div className="md:col-span-2">
        <Botao type="submit" disabled={pending || (modo === 'criar' && !municipioAtual)}>
          {modo === 'criar' ? 'Gravar ciclo' : 'Salvar ciclo'}
        </Botao>
      </div>
    </Formulario>
  );
}
