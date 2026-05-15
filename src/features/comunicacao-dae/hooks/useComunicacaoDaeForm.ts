import { useCallback, useState } from 'react';
import {
  CreateComunicacaoDaeData,
  OrigemTipo
} from '@/services/ComunicacaoDaeService';
import { getLocalDateTime } from '@/utils/timezoneUtils';

const getInitialFormData = (origemTipo: OrigemTipo = 'CRS'): CreateComunicacaoDaeData => ({
  data_comunicacao: getLocalDateTime(),
  nome_paciente: '',
  observacao_descricao: '',
  digitador: '',
  telefone_digitador: '',
  id_municipio_ocorrencia: 0,
  id_municipio_residencia: 0,
  origem_tipo: origemTipo,
  origem_id: 0,
  id_daes: [],
});

type UseComunicacaoDaeFormParams = {
  isEditMode: boolean;
  lockOrigemSelection: boolean;
  allowedOrigemTipos: OrigemTipo[];
};

export const useComunicacaoDaeForm = ({
  isEditMode,
  lockOrigemSelection,
  allowedOrigemTipos
}: UseComunicacaoDaeFormParams) => {
  const [formData, setFormData] = useState<CreateComunicacaoDaeData>(getInitialFormData());

  const resetFormData = useCallback((currentFormData: CreateComunicacaoDaeData) => {
    const shouldPreserveLockedOrigem = !isEditMode && lockOrigemSelection && currentFormData.origem_id > 0;
    const defaultOrigemTipo = !isEditMode && allowedOrigemTipos.length === 1
      ? allowedOrigemTipos[0]
      : ('CRS' as OrigemTipo);

    setFormData({
      ...getInitialFormData(defaultOrigemTipo),
      origem_tipo: shouldPreserveLockedOrigem ? currentFormData.origem_tipo : defaultOrigemTipo,
      origem_id: shouldPreserveLockedOrigem ? currentFormData.origem_id : 0,
    });
  }, [allowedOrigemTipos, isEditMode, lockOrigemSelection]);

  return {
    formData,
    setFormData,
    resetFormData
  };
};
