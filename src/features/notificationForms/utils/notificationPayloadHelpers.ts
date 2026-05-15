import type { FormData } from '@/features/notificationForms/types/index2';
import { detectUserTimezone } from '@/features/notificationForms/types/index2';
import { toUpperCaseAllStrings } from './formUtils';

export const buildNotificationDataForBackend = (
  formData: FormData,
  arquivosParaExcluir: number[]
): Record<string, any> => {
  const { arquivos = [], ...restOfData } = formData;
  const timezone = detectUserTimezone();

  return {
    ...toUpperCaseAllStrings(restOfData),
    arquivos,
    arquivos_para_excluir: arquivosParaExcluir,
    timezone_name: formData.timezone_name || timezone.timezone_name,
    timezone_offset_minutos:
      formData.timezone_offset_minutos ?? timezone.timezone_offset_minutos
  };
};
