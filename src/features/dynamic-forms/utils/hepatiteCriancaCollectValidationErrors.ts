import type { FieldValidationError } from './formValidationTypes';
import {
  collectHepatiteCriancaExpostaAgeErrors,
} from './hepatiteCriancaHbvLimits';
import {
  buildFieldLabelMap,
  collectHepatiteCriancaMaeLabErrors,
} from './hepatiteCriancaMaeLabRequired';
import { collectHepatiteCriancaMaeSorologiaErrors } from './hepatiteCriancaMaeSorologiaRequired';
import { collectHepatiteCriancaMaternidadeHbvErrors } from './hepatiteCriancaMaternidadeHbvHbig';
import { collectHepatiteCriancaInvestigadorErrors } from './hepatiteCriancaInvestigadorRequired';

export { buildFieldLabelMap };

/**
 * Validações extras da ficha criança exposta HBV/HCV — espelham o backend (`formValidator.validateForm`).
 */
export function collectHepatiteCriancaFormValidationErrors(
  formData: Record<string, unknown>,
  visible: Record<string, boolean>,
  fieldLabels: Record<string, string>,
): FieldValidationError[] {
  return [
    ...collectHepatiteCriancaExpostaAgeErrors(formData),
    ...collectHepatiteCriancaMaeLabErrors(formData, visible, fieldLabels),
    ...collectHepatiteCriancaMaeSorologiaErrors(formData, visible, fieldLabels),
    ...collectHepatiteCriancaMaternidadeHbvErrors(formData, visible, fieldLabels),
    ...collectHepatiteCriancaInvestigadorErrors(formData, fieldLabels),
  ];
}

export function collectHepatiteCriancaFormValidationErrorsFromSchema(
  formData: Record<string, unknown>,
  visible: Record<string, boolean>,
  sections: Parameters<typeof buildFieldLabelMap>[0],
): FieldValidationError[] {
  return collectHepatiteCriancaFormValidationErrors(
    formData,
    visible,
    buildFieldLabelMap(sections),
  );
}
