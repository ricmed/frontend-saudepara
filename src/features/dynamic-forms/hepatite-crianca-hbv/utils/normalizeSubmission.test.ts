import { describe, expect, it } from 'vitest';
import {
  isCasoEncerrado,
  isHbvMaternoTipo,
  isHcvMaternoTipo,
  normalizeHepatiteSubmission,
} from './normalizeSubmission';
import {
  TIPO_EXPOSICAO_AMBOS,
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';

describe('normalizeHepatiteSubmission', () => {
  it('extrai campos epidemiológicos do data_json', () => {
    const row = normalizeHepatiteSubmission(1, {
      notificacao: {
        dt_notificacao: '2025-03-10',
        tipo_exposicao_hepatite: TIPO_EXPOSICAO_AMBOS,
        municipio_notificacao_ibge: '1501402',
      },
      residencia: {
        municipio_ibge: '1500800',
        geo_campo_1: '-1.45',
        geo_campo_2: '-48.49',
      },
      conclusao: { data_encerramento: '2025-06-01' },
    });

    expect(row.id).toBe(1);
    expect(row.tipoExposicao).toBe(TIPO_EXPOSICAO_AMBOS);
    expect(row.municipioNotificacaoIbge).toBe('1501402');
    expect(row.municipioResidenciaIbge).toBe('1500800');
    expect(row.lat).toBe(-1.45);
    expect(row.lng).toBe(-48.49);
    expect(isHbvMaternoTipo(row.tipoExposicao)).toBe(true);
    expect(isHcvMaternoTipo(row.tipoExposicao)).toBe(true);
    expect(isCasoEncerrado(row)).toBe(true);
  });

  it('classifica HBV e HCV isolados', () => {
    expect(isHbvMaternoTipo(TIPO_EXPOSICAO_HBV)).toBe(true);
    expect(isHcvMaternoTipo(TIPO_EXPOSICAO_HBV)).toBe(false);
    expect(isHcvMaternoTipo(TIPO_EXPOSICAO_HCV)).toBe(true);
    expect(isHbvMaternoTipo(TIPO_EXPOSICAO_HCV)).toBe(false);
  });
});
