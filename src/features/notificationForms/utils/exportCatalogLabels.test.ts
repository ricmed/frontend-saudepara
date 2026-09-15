import { describe, expect, it } from 'vitest';
import {
  findCboOption,
  formatCboLabel,
  looksLikeNumericId,
  resolveCatalogLabel,
  resolveCboLabel,
} from './exportCatalogLabels';

describe('exportCatalogLabels', () => {
  const options = [
    { idtipo_cbo: 42, codigo: '2231-05', descricao: 'Médico' },
    { id: 99, descricao: 'Enfermeiro' },
  ];

  it('formata codigo + descricao no padrão da ficha', () => {
    expect(formatCboLabel(options[0])).toBe('2231-05 - Médico');
    expect(formatCboLabel(options[1])).toBe('Enfermeiro');
  });

  it('acha CBO por idtipo_cbo ou id', () => {
    expect(findCboOption('42', options)?.descricao).toBe('Médico');
    expect(findCboOption(99, options)?.descricao).toBe('Enfermeiro');
  });

  it('resolve descrição e não devolve o ID numérico', () => {
    expect(resolveCboLabel('42', options)).toBe('2231-05 - Médico');
    expect(resolveCboLabel('99', options)).toBe('Enfermeiro');
    expect(resolveCboLabel('777', options)).toBe('');
    expect(looksLikeNumericId('777')).toBe(true);
  });

  it('aceita objeto já expandido', () => {
    expect(resolveCboLabel({ codigo: '3222-05', descricao: 'Técnico de enfermagem' })).toBe(
      '3222-05 - Técnico de enfermagem',
    );
  });

  it('resolve catálogo genérico por id ou nome, sem vazar o ID', () => {
    const unidades = [
      { idestabelecimento: 7, nome: 'UPA Jurunas' },
      { id: 8, descricao: 'UBS Nazaré' },
    ];
    expect(resolveCatalogLabel('7', unidades, 'idestabelecimento', 'nome')).toBe(
      'UPA Jurunas',
    );
    expect(resolveCatalogLabel('8', unidades, 'idestabelecimento', 'nome')).toBe(
      'UBS Nazaré',
    );
    expect(resolveCatalogLabel('99', unidades, 'idestabelecimento', 'nome')).toBe('');
    expect(resolveCatalogLabel('Nazaré', [], 'idtipo_bairro')).toBe('Nazaré');
  });
});
