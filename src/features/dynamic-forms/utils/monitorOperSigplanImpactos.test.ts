import { describe, expect, it } from 'vitest';
import type { FormSchema } from '@/services/FormService';
import { buildSigplanImpactosByGroup } from './monitorOperSigplanImpactos';

const schemaStub = {
  sections: [
    {
      id: 'impacto_acao',
      fields: [
        {
          key: 'imp_epi.diagnostico_lacen',
          label: 'Para melhorar a qualidade do processo de diagnóstico laboratorial (LACEN).',
        },
        {
          key: 'imp_san.fiscalizacao_estabelecimentos',
          label: 'Para melhorar fiscalizações em estabelecimentos.',
        },
        {
          key: 'imp_amb.vigiagua',
          label: 'Para melhorar o processo VIGIAGUA.',
        },
      ],
    },
  ],
} as FormSchema;

describe('monitorOperSigplanImpactos', () => {
  it('não conta imp_epi em área sanitária; une municípios da mesma linha', () => {
    const byGroup = buildSigplanImpactosByGroup(
      [
        {
          acao: {
            area: 'vigilancia_sanitaria',
            municipios_alcancados: ['A', 'B'],
          },
          imp_epi: { diagnostico_lacen: true },
          imp_san: { fiscalizacao_estabelecimentos: true },
        },
      ],
      schemaStub,
    );

    expect(byGroup.epi).toEqual([]);
    expect(byGroup.san).toHaveLength(1);
    expect(byGroup.san[0]?.municipioIds).toEqual(['A', 'B']);
    expect(byGroup.amb).toEqual([]);
  });

  it('deduplica município entre linhas e ignora linha sem município', () => {
    const byGroup = buildSigplanImpactosByGroup(
      [
        {
          acao: { area: 'imunopreveniveis', municipios_alcancados: ['X'] },
          imp_epi: { diagnostico_lacen: true },
        },
        {
          acao: { area: 'controle_endemias', municipios_alcancados: ['X', 'Y'] },
          imp_epi: { diagnostico_lacen: true },
        },
        {
          acao: { area: 'imunopreveniveis', municipios_alcancados: [] },
          imp_epi: { diagnostico_lacen: true },
        },
      ],
      schemaStub,
    );

    expect(byGroup.epi).toHaveLength(1);
    expect(byGroup.epi[0]?.municipioIds).toEqual(['X', 'Y']);
  });
});
