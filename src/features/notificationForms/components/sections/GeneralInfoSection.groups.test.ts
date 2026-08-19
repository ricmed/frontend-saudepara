import { describe, expect, it } from 'vitest';
import { groupLocalidadesEvento } from './GeneralInfoSection';
import type { LocalidadeEventoDTO } from '@/features/notificationForms/types/index2';

const option = (
  overrides: Partial<LocalidadeEventoDTO> & Pick<LocalidadeEventoDTO, 'id' | 'nome'>,
): LocalidadeEventoDTO => ({
  tipo: 'COMUNIDADE',
  especial: 'NORMAL',
  ribeirinha: false,
  latitude: null,
  longitude: null,
  exibir_mapa: false,
  ativo: true,
  ordem: overrides.id,
  ...overrides,
});

describe('groupLocalidadesEvento', () => {
  it('agrupa ribeirinha por atributo e aldeia por tipo, sem misturar no dashboard-like select', () => {
    const groups = groupLocalidadesEvento([
      option({ id: 1, nome: 'Centro', tipo: 'BAIRRO' }),
      option({ id: 2, nome: 'Areia Branca', tipo: 'COMUNIDADE', ribeirinha: false }),
      option({ id: 3, nome: 'Taparí', tipo: 'COMUNIDADE', ribeirinha: true }),
      option({ id: 4, nome: 'Ramal dos Coelhos', tipo: 'RAMAL' }),
      option({
        id: 5,
        nome: 'Aldeia Indígena Alter do Chão 1',
        tipo: 'ALDEIA_INDIGENA',
      }),
      option({
        id: 6,
        nome: 'Outro',
        tipo: null,
        especial: 'OUTRO',
      }),
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      'Bairros',
      'Comunidades',
      'Comunidades Ribeirinhas',
      'Ramais',
      'Aldeias indígenas',
      'Especiais',
    ]);
    expect(groups[1].options.map((item) => item.nome)).toEqual(['Areia Branca']);
    expect(groups[2].options.map((item) => item.nome)).toEqual(['Taparí']);
    expect(groups[4].options.map((item) => item.nome)).toEqual([
      'Aldeia Indígena Alter do Chão 1',
    ]);
  });
});
