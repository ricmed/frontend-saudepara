import { describe, expect, it } from 'vitest';
import {
  EXPORT_BAIRRO_COLUMN,
  EXPORT_LOCALIDADE_COLUMN,
  getExportDadosGeraisFieldKeys,
  getExportPdfProcedenciaFieldKeys,
  getExportProcedenciaFieldKeys,
  getExportResidenteColumnLabel,
} from './exportColumns';

describe('exportColumns', () => {
  it('NAO_USA exporta bairro e não localidade', () => {
    expect(getExportResidenteColumnLabel('NAO_USA')).toBe('Residente em Belém');
    expect(getExportDadosGeraisFieldKeys('NAO_USA')).not.toContain(
      EXPORT_LOCALIDADE_COLUMN,
    );
    expect(getExportProcedenciaFieldKeys('NAO_USA')).toContain(
      EXPORT_BAIRRO_COLUMN,
    );
    expect(getExportProcedenciaFieldKeys('NAO_USA')).not.toContain(
      EXPORT_LOCALIDADE_COLUMN,
    );
  });

  it('evento com localidade exporta localidade e não bairro', () => {
    expect(getExportResidenteColumnLabel('OBRIGATORIA')).toBe(
      'Residente em Alter do Chão',
    );
    expect(getExportDadosGeraisFieldKeys('OBRIGATORIA')).toContain(
      EXPORT_LOCALIDADE_COLUMN,
    );
    expect(getExportProcedenciaFieldKeys('OPCIONAL')).toContain(
      EXPORT_LOCALIDADE_COLUMN,
    );
    expect(getExportProcedenciaFieldKeys('OPCIONAL')).not.toContain(
      EXPORT_BAIRRO_COLUMN,
    );
    expect(getExportPdfProcedenciaFieldKeys('OBRIGATORIA')).not.toContain(
      EXPORT_LOCALIDADE_COLUMN,
    );
    expect(getExportPdfProcedenciaFieldKeys('OBRIGATORIA')).not.toContain(
      EXPORT_BAIRRO_COLUMN,
    );
  });
});
