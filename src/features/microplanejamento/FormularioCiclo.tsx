import { FormEvent, useState } from 'react';
import type { Ciclo } from './api';
import { CampoMunicipio } from './FiltrosTerritorio';
import { Botao, Campo, Formulario, inputClass } from './ui';
import { numero, texto, useMunicipios, type MunicipioOption } from './useMp';

export const ESTRATEGIAS = ['ROTINA', 'INTENSIFICACAO', 'CAMPANHA', 'MULTIVACINACAO', 'BLOQUEIO'];

export type DadosCiclo = {
  nome: string;
  ano: number;
  estrategia: string;
  tipo_municipio_id: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  dias_operacionais: number;
};

function isoDate(valor?: string | null) {
  return valor ? String(valor).slice(0, 10) : '';
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
  const municipios = useMunicipios();
  const [municipioLocal, setMunicipioLocal] = useState<number | undefined>(municipioId);
  const municipioAtual = onMunicipio ? municipioId : municipioLocal;
  const selecionado: MunicipioOption | undefined = municipios.data?.find((item) => item.idtipo_municipio === municipioAtual);

  function escolherMunicipio(id: number | null) {
    if (onMunicipio) onMunicipio(id);
    else setMunicipioLocal(id ?? undefined);
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tipoMunicipio = modo === 'editar' ? ciclo?.tipo_municipio_id : municipioAtual;
    if (!tipoMunicipio) return;
    onSubmit({
      nome: String(form.get('nome') || '').trim(),
      ano: modo === 'editar' ? ciclo!.ano : numero(form.get('ano'), new Date().getFullYear()),
      estrategia: modo === 'editar' ? ciclo!.estrategia : String(form.get('estrategia')),
      tipo_municipio_id: tipoMunicipio,
      data_inicio: texto(form.get('data_inicio')),
      data_fim: texto(form.get('data_fim')),
      dias_operacionais: numero(form.get('dias'), 22),
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
      <Campo label="Ano">
        <input name="ano" type="number" required className={inputClass} defaultValue={ciclo?.ano ?? new Date().getFullYear()} disabled={modo === 'editar'} readOnly={modo === 'editar'} />
      </Campo>
      <Campo label="Estratégia">
        {modo === 'editar' ? (
          <input className={inputClass} value={ciclo?.estrategia ?? ''} disabled readOnly />
        ) : (
          <select name="estrategia" className={inputClass}>{ESTRATEGIAS.map((item) => <option key={item}>{item}</option>)}</select>
        )}
      </Campo>
      <Campo label="Dias operacionais"><input name="dias" type="number" min={1} max={31} defaultValue={ciclo?.dias_operacionais ?? 22} className={inputClass} /></Campo>
      <Campo label="Início"><input name="data_inicio" type="date" className={inputClass} defaultValue={isoDate(ciclo?.data_inicio)} /></Campo>
      <Campo label="Fim"><input name="data_fim" type="date" className={inputClass} defaultValue={isoDate(ciclo?.data_fim)} /></Campo>
      <div className="md:col-span-2">
        <Botao type="submit" disabled={pending || (modo === 'criar' && !municipioAtual)}>
          {modo === 'criar' ? 'Gravar ciclo' : 'Salvar ciclo'}
        </Botao>
      </div>
    </Formulario>
  );
}
