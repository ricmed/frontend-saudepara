import { describe, expect, it } from 'vitest';
import {
  shouldIncludeHepatiteSectionInPdf,
} from './hepatiteCriancaPdfExport';
import {
  TIPO_EXPOSICAO_AMBOS,
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
  TIPO_EXPOSICAO_HEPATITE_KEY,
} from './hepatiteCriancaExposicao';

describe('hepatiteCriancaPdfExport', () => {
  it('oculta seções HBV/HCV conforme tipo de exposição', () => {
    const hbvOnly = { notificacao: { tipo_exposicao_hepatite: TIPO_EXPOSICAO_HBV } };
    expect(shouldIncludeHepatiteSectionInPdf('section_dados_laboratoriais_crianca', hbvOnly)).toBe(true);
    expect(shouldIncludeHepatiteSectionInPdf('section_acompanhamento_crianca', hbvOnly)).toBe(false);

    const hcvOnly = { notificacao: { tipo_exposicao_hepatite: TIPO_EXPOSICAO_HCV } };
    expect(shouldIncludeHepatiteSectionInPdf('section_dados_laboratoriais_crianca', hcvOnly)).toBe(false);
    expect(shouldIncludeHepatiteSectionInPdf('section_acompanhamento_crianca', hcvOnly)).toBe(true);

    const ambos = { notificacao: { tipo_exposicao_hepatite: TIPO_EXPOSICAO_AMBOS } };
    expect(shouldIncludeHepatiteSectionInPdf('section_dados_laboratoriais_crianca', ambos)).toBe(true);
    expect(shouldIncludeHepatiteSectionInPdf('section_acompanhamento_crianca', ambos)).toBe(true);
  });

  it('não exporta seção decorativa nem lab da mãe sem tipo', () => {
    expect(shouldIncludeHepatiteSectionInPdf('section_dados_complementares_caso', {})).toBe(false);
    expect(shouldIncludeHepatiteSectionInPdf('section_dados_laboratoriais_mae', {})).toBe(false);
  });
});
