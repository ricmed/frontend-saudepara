import { getValueAtPath } from '@/features/dynamic-forms/utils/formResponsesListUtils';
import {
  HEPATITE_CRIANCA_HBV_ONLY_SECTIONS,
  HEPATITE_CRIANCA_HCV_ONLY_SECTIONS,
  TIPO_EXPOSICAO_HEPATITE_KEY,
  tipoExposicaoMostraHbv,
  tipoExposicaoMostraHcv,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';

/** Seções só decorativas na tela — sem campos exportáveis. */
const HEPATITE_PDF_SKIP_SECTIONS = new Set(['section_dados_complementares_caso']);

export function shouldIncludeHepatiteSectionInPdf(
  sectionId: string,
  formData: Record<string, unknown>,
): boolean {
  if (HEPATITE_PDF_SKIP_SECTIONS.has(sectionId)) return false;

  const tipo = getValueAtPath(formData, TIPO_EXPOSICAO_HEPATITE_KEY);
  const tipoStr = String(tipo ?? '').trim();

  if (sectionId === 'section_dados_laboratoriais_mae' && !tipoStr) return false;
  if (HEPATITE_CRIANCA_HBV_ONLY_SECTIONS.has(sectionId) && !tipoExposicaoMostraHbv(tipo)) {
    return false;
  }
  if (HEPATITE_CRIANCA_HCV_ONLY_SECTIONS.has(sectionId) && !tipoExposicaoMostraHcv(tipo)) {
    return false;
  }

  return true;
}

export function isHepatitePdfFieldVisible(
  fieldKey: string,
  ruleVisibility: Record<string, boolean> | undefined,
): boolean {
  if (!ruleVisibility) return true;
  return ruleVisibility[fieldKey] !== false;
}
