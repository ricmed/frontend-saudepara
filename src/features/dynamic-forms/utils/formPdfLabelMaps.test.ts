import { describe, expect, it } from 'vitest';
import type { FormField } from '@/services/FormService';
import {
  EMPTY_PDF_LABEL_MAPS,
  formatPdfFieldValue,
  resolveEstadoLabel,
  resolveMunicipioIbgeLabel,
  shouldSkipPdfField,
} from './formPdfLabelMaps';

describe('formPdfLabelMaps', () => {
  it('omite ids internos duplicados', () => {
    expect(shouldSkipPdfField({ key: 'notificacao.municipio_id' } as FormField)).toBe(true);
    expect(shouldSkipPdfField({ key: 'residencia.municipio_ibge' } as FormField)).toBe(false);
  });

  it('resolve município por código IBGE', () => {
    const maps = {
      ...EMPTY_PDF_LABEL_MAPS,
      municipioByIbge: { '1501402': 'Belém' },
    };
    expect(resolveMunicipioIbgeLabel(maps, '1501402')).toBe('Belém');
  });

  it('resolve UF por sigla ou código IBGE', () => {
    const maps = {
      ...EMPTY_PDF_LABEL_MAPS,
      estadoByCodigo: { '15': 'Pará' },
      estadoBySigla: { PA: 'Pará' },
    };
    expect(resolveEstadoLabel(maps, '15')).toBe('Pará');
    expect(resolveEstadoLabel(maps, 'PA')).toBe('Pará');
  });

  it('formata select SINAN com descrição em vez de código', () => {
    const field = {
      key: 'mae.lab.hbv_hbsag',
      type: 'select',
      label: 'HBsAg',
      options: [
        { value: '1', label: 'Reagente' },
        { value: '2', label: 'Não Reagente' },
      ],
    } as FormField;
    expect(formatPdfFieldValue(field, '1', EMPTY_PDF_LABEL_MAPS, {}, true)).toBe('1 · Reagente');
  });

  it('formata estabelecimento com nome e CNES', () => {
    const field = {
      key: 'prenatal.estabelecimento_cnes',
      type: 'text',
      label: 'Estabelecimento',
    } as FormField;
    const formData = {
      prenatal: {
        estabelecimento_cnes: '1234567',
        estabelecimento_nome: 'Hospital Municipal',
      },
    };
    expect(formatPdfFieldValue(field, '1234567', EMPTY_PDF_LABEL_MAPS, formData, true)).toBe(
      'Hospital Municipal (CNES 1234567)',
    );
  });

  it('resolve api select por endpoint', () => {
    const field = {
      key: 'paciente.sexo',
      type: 'select',
      label: 'Sexo',
      apiSelectEndpoint: 'tipo-sexo-nascimento/select',
    } as FormField;
    const maps = {
      ...EMPTY_PDF_LABEL_MAPS,
      apiSelectByEndpoint: {
        'tipo-sexo-nascimento/select': { '1': 'Masculino', '2': 'Feminino' },
      },
    };
    expect(formatPdfFieldValue(field, '2', maps, {}, true)).toBe('Feminino');
  });
});
