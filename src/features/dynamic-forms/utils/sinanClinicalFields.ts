import type { FormSchema } from '@/services/FormService';
import { schemaUsesNotificacao } from './notificacaoScopeDefaults';

/** Chaves do bloco assistido de Dados Clínicos (ficha SINAN / campos fixos). */
export const SINAN_CLINICA_FIELD_KEYS = new Set([
  'clinica.data_inicio_sintomas',
  'clinica.relacionado_trabalho',
  'clinica.relacionado_desastre',
  'clinica.agravos_notificados',
  'clinica.sinais_sintomas',
  'clinica.sintomas_outro',
  'agravo_cid',
]);

export const NON_SINAN_FORM_KEYS = new Set([
  'MONITOR_OPER_REGIONAL',
  'MONITOR_TEC_PQAVS',
]);

export function isSinanClinicalFieldKey(key: string): boolean {
  return SINAN_CLINICA_FIELD_KEYS.has(key);
}

export function schemaHasActivatedSinanClinicalFields(
  schema: FormSchema | null | undefined
): boolean {
  if (!schema?.sections?.length) return false;
  return schema.sections.some((s) =>
    s.fields?.some((f) => f.isFixedColumn === true && isSinanClinicalFieldKey(f.key))
  );
}

/**
 * Bloco assistido "Dados clínicos" só existe se Campos Fixos marcou `isFixedColumn` no schema.
 * Ignora context (evita bundle antigo + context=sinan exibir bloco fantasma).
 */
export function shouldShowSinanDadosClinicosBlock(schema: FormSchema): boolean {
  return schemaHasActivatedSinanClinicalFields(schema);
}

export function resolveFormRendererContext(
  formKey: string | undefined,
  schema: FormSchema | null | undefined
): 'sinan' | 'general' | 'public' {
  const key = String(formKey || schema?.agravo || '').toUpperCase();
  if (key && NON_SINAN_FORM_KEYS.has(key)) return 'general';
  if (schema && !schemaUsesNotificacao(schema)) return 'general';
  return 'sinan';
}

/** Remove campos clínicos SINAN de seções (ex.: schema poluído no QDQQ). */
export function stripSinanClinicalFieldsFromSections<T extends { fields: Array<{ key: string }> }>(
  sections: T[]
): T[] {
  return sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter((f) => !isSinanClinicalFieldKey(f.key)),
    }))
    .filter((section) => section.fields.length > 0);
}
