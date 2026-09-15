import type { ModoLocalidadeEvento } from '@/features/notificationForms/types/index2';
import {
  EXPORT_BAIRRO_COLUMN,
  EXPORT_LOCALIDADE_COLUMN,
  EXPORT_LOCALIDADE_OUTRO_COLUMN,
  getExportResidenteColumnLabel,
} from '@/features/notificationForms/components/exportColumns';
import { usaLocalidadeEvento } from '@/features/notificationForms/utils/procedenciaResidencia';

export type ComunicacaoCasoFichaSection = {
  title: string;
  fields: string[];
};

export type ComunicacaoCasoFichaRow = {
  label: string;
  value: string;
};

const PHONE_DDI_BY_FIELD: Record<string, string> = {
  'Contato Telefônico': 'DDI Paciente',
  'Contato do Local': 'DDI Local',
  'Contato do Notificador': 'DDI Notificador',
};

const SKIP_WHEN_EMPTY = new Set([
  EXPORT_LOCALIDADE_OUTRO_COLUMN,
  'Data da Ocorrência',
]);

export function stringifyFichaValue(
  value: string | number | boolean | undefined | null,
): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value).trim();
}

export function toPrintDataMap(
  data: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = stringifyFichaValue(
      value as string | number | boolean | undefined,
    );
  }
  return out;
}

export function formatFichaPhone(
  data: Record<string, unknown>,
  numberField: string,
): string {
  const number = stringifyFichaValue(
    data[numberField] as string | number | boolean | undefined,
  );
  const ddiKey = PHONE_DDI_BY_FIELD[numberField];
  const ddi = ddiKey
    ? stringifyFichaValue(data[ddiKey] as string | number | boolean | undefined)
    : '';
  if (ddi && number) return `+${ddi} ${number}`;
  return number;
}

export function getComunicacaoCasoFichaSections(
  modo: ModoLocalidadeEvento | null | undefined,
): ComunicacaoCasoFichaSection[] {
  const residente = getExportResidenteColumnLabel(modo);
  const procedencia = usaLocalidadeEvento(modo)
    ? [
        residente,
        EXPORT_LOCALIDADE_COLUMN,
        EXPORT_LOCALIDADE_OUTRO_COLUMN,
        'País de Procedência',
        'UF',
        'Município',
        'Local de Hospedagem',
        'Contato do Local',
      ]
    : [
        residente,
        'País de Procedência',
        'UF',
        'Município',
        EXPORT_BAIRRO_COLUMN,
        'Local de Hospedagem',
        'Contato do Local',
      ];

  return [
    {
      title: '1. Dados Gerais',
      fields: ['Evento', 'Público Atendido'],
    },
    {
      title: '2. Procedência do indivíduo',
      fields: procedencia,
    },
    {
      title: '3. Identificação do indivíduo',
      fields: [
        'Nome do Paciente',
        'Nome da Mãe',
        'Data de Nascimento',
        'Idade',
        'CPF',
        'Identidade de Gênero',
        'Gestante',
        'Raça',
        'Escolaridade',
        'Profissão',
        'Contato Telefônico',
      ],
    },
    {
      title: '4. Informações do atendimento',
      fields: [
        'Tipo de Atendimento',
        'Sinais e Sintomas',
        'Data de Início dos Sintomas',
        'Observação dos Sintomas',
        'Hipótese Diagnóstica',
        'Observação da Hipótese',
        'Tipo de Trauma',
        'Data da Ocorrência',
        'Observação do Trauma',
        'Relacionado a Surto',
        'Observação do Incidente',
      ],
    },
    {
      title: '5. Informações da unidade notificadora',
      fields: [
        'Data do Atendimento',
        'Unidade Notificadora',
        'Nome do Notificador',
        'Contato do Notificador',
      ],
    },
    {
      title: '6. Encerramento do Caso',
      fields: [
        'Data de Encerramento',
        'Tipo de Encerramento',
        'Local de Encaminhamento',
      ],
    },
  ];
}

export function buildComunicacaoCasoFichaRows(
  data: Record<string, unknown>,
  fields: string[],
  emptyDisplay: '' | '—',
): ComunicacaoCasoFichaRow[] {
  const rows: ComunicacaoCasoFichaRow[] = [];

  for (const field of fields) {
    const raw = PHONE_DDI_BY_FIELD[field]
      ? formatFichaPhone(data, field)
      : stringifyFichaValue(data[field] as string | number | boolean | undefined);
    if (!raw && SKIP_WHEN_EMPTY.has(field)) continue;
    rows.push({
      label: field,
      value: raw || emptyDisplay,
    });
  }

  return rows;
}

export function buildComunicacaoCasoFichaBlocks(
  data: Record<string, unknown>,
  modo: ModoLocalidadeEvento | null | undefined,
  emptyDisplay: '' | '—',
): Array<{ title: string; rows: ComunicacaoCasoFichaRow[] }> {
  return getComunicacaoCasoFichaSections(modo).map((section) => ({
    title: section.title,
    rows: buildComunicacaoCasoFichaRows(data, section.fields, emptyDisplay),
  }));
}
