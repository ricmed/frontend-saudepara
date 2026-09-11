import type { ModoLocalidadeEvento } from '@/features/notificationForms/types/index2';
import {
  getResidentePerguntaLabel,
  usaLocalidadeEvento,
} from '@/features/notificationForms/utils/procedenciaResidencia';

export const EXPORT_LOCALIDADE_COLUMN = 'Localidade no evento';
export const EXPORT_LOCALIDADE_OUTRO_COLUMN = 'Outra localidade';
export const EXPORT_BAIRRO_COLUMN = 'Bairro';

export function getExportResidenteColumnLabel(
  modo: ModoLocalidadeEvento | null | undefined,
): string {
  return getResidentePerguntaLabel(modo ?? 'NAO_USA').replace(/\?$/, '');
}

export function getExportDadosGeraisFieldKeys(
  modo: ModoLocalidadeEvento | null | undefined,
): string[] {
  const fields = ['Evento', 'Público Atendido'];
  if (usaLocalidadeEvento(modo)) {
    fields.push(EXPORT_LOCALIDADE_COLUMN, EXPORT_LOCALIDADE_OUTRO_COLUMN);
  }
  return fields;
}

export function getExportProcedenciaFieldKeys(
  modo: ModoLocalidadeEvento | null | undefined,
): string[] {
  const residente = getExportResidenteColumnLabel(modo);
  if (usaLocalidadeEvento(modo)) {
    return [
      residente,
      'País de Procedência',
      'UF',
      'Município',
      EXPORT_LOCALIDADE_COLUMN,
      EXPORT_LOCALIDADE_OUTRO_COLUMN,
      'Local de Hospedagem',
      'DDI Local',
      'Contato do Local',
    ];
  }

  return [
    residente,
    'País de Procedência',
    'UF',
    'Município',
    EXPORT_BAIRRO_COLUMN,
    'Local de Hospedagem',
    'DDI Local',
    'Contato do Local',
  ];
}

export function getExportPdfProcedenciaFieldKeys(
  modo: ModoLocalidadeEvento | null | undefined,
): string[] {
  return getExportProcedenciaFieldKeys(modo).filter(
    (key) =>
      key !== EXPORT_LOCALIDADE_COLUMN &&
      key !== EXPORT_LOCALIDADE_OUTRO_COLUMN,
  );
}
