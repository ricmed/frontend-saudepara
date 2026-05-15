import { useCallback } from 'react';
import { CreateComunicacaoDaeData } from '@/services/ComunicacaoDaeService';

type ValidationResult = {
  error: string | null;
  agravoIds: number[];
  formPayload: CreateComunicacaoDaeData | null;
};

export const useComunicacaoDaeValidation = () => {
  const validateAndBuildPayload = useCallback((formData: CreateComunicacaoDaeData): ValidationResult => {
    if (!formData.nome_paciente.trim()) {
      return { error: 'Nome do paciente é obrigatório', agravoIds: [], formPayload: null };
    }
    if (!formData.id_municipio_ocorrencia) {
      return { error: 'Município de ocorrência é obrigatório', agravoIds: [], formPayload: null };
    }
    if (!formData.id_municipio_residencia) {
      return { error: 'Município de residência é obrigatório', agravoIds: [], formPayload: null };
    }
    if (!formData.origem_id) {
      return { error: 'Origem da comunicação é obrigatória', agravoIds: [], formPayload: null };
    }

    const agravoIds = [...new Set(formData.id_daes || [])].filter((x) => x > 0);
    if (agravoIds.length === 0) {
      return { error: 'Selecione ao menos um agravo (DAE)', agravoIds: [], formPayload: null };
    }

    return {
      error: null,
      agravoIds,
      formPayload: {
        ...formData,
        id_daes: agravoIds,
        id_dae: agravoIds[0],
      }
    };
  }, []);

  return { validateAndBuildPayload };
};
