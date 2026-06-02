import raw from './hospitaisNascimentoPara.json';

export type HospitalNascimentoItem = {
  id: number;
  cnes: string;
  nome: string;
};

export type HospitaisNascimentoParaData = {
  version: number;
  source?: string;
  generatedAt: string;
  estadoId: number;
  uf: 'PA';
  stats: {
    sinascCnes?: number;
    dbfCnesPa?: number;
    matched: number;
    skippedNoDb: number;
    skippedNoMunicipio: number;
    municipiosComHospitais: number;
  };
  porMunicipioId: Record<string, HospitalNascimentoItem[]>;
};

export const HOSPITAIS_NASCIMENTO_PARA = raw as HospitaisNascimentoParaData;

export function getHospitaisNascimentoPorMunicipio(
  municipioId: number | null | undefined,
): HospitalNascimentoItem[] {
  if (municipioId == null || Number.isNaN(Number(municipioId))) return [];
  return HOSPITAIS_NASCIMENTO_PARA.porMunicipioId[String(municipioId)] ?? [];
}

export function toUnidadeSelectOptions(
  items: HospitalNascimentoItem[],
): Array<{ idestabelecimento: number; nome: string; cnes?: string }> {
  return items.map((h) => ({
    idestabelecimento: h.id,
    nome: h.nome,
    cnes: h.cnes,
  }));
}
