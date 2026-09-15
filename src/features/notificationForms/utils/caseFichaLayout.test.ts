import { describe, expect, it } from 'vitest';
import {
  EXPORT_BAIRRO_COLUMN,
  EXPORT_LOCALIDADE_COLUMN,
  EXPORT_LOCALIDADE_OUTRO_COLUMN,
} from '@/features/notificationForms/components/exportColumns';
import {
  buildComunicacaoCasoFichaBlocks,
  formatFichaPhone,
  getComunicacaoCasoFichaSections,
} from './caseFichaLayout';

describe('caseFichaLayout', () => {
  it('evento NAO_USA usa bairro e não localidade', () => {
    const sections = getComunicacaoCasoFichaSections('NAO_USA');
    const procedencia = sections.find((section) =>
      section.title.startsWith('2.'),
    );
    expect(procedencia?.fields).toContain(EXPORT_BAIRRO_COLUMN);
    expect(procedencia?.fields).not.toContain(EXPORT_LOCALIDADE_COLUMN);
    expect(procedencia?.fields).toContain('Residente em Belém');
  });

  it('evento com localidade usa localidade e não bairro', () => {
    const sections = getComunicacaoCasoFichaSections('OBRIGATORIA');
    const dadosGerais = sections.find((section) =>
      section.title.startsWith('1.'),
    );
    const procedencia = sections.find((section) =>
      section.title.startsWith('2.'),
    );
    expect(dadosGerais?.fields).not.toContain(EXPORT_LOCALIDADE_COLUMN);
    expect(procedencia?.fields).toContain(EXPORT_LOCALIDADE_COLUMN);
    expect(procedencia?.fields).not.toContain(EXPORT_BAIRRO_COLUMN);
    expect(procedencia?.fields).toContain('Residente em Alter do Chão');
  });

  it('combina DDI e telefone na impressão', () => {
    expect(
      formatFichaPhone(
        { 'DDI Paciente': '55', 'Contato Telefônico': '91999999999' },
        'Contato Telefônico',
      ),
    ).toBe('+55 91999999999');
  });

  it('não mostra DDI sozinho quando o número está vazio', () => {
    expect(
      formatFichaPhone(
        { 'DDI Paciente': '55', 'Contato Telefônico': '' },
        'Contato Telefônico',
      ),
    ).toBe('');
  });

  it('omite outra localidade vazia e preenche vazio com travessão no documento', () => {
    const blocks = buildComunicacaoCasoFichaBlocks(
      {
        Evento: 'Festival do Sairé 2026',
        'Público Atendido': 'Visitante',
        'Residente em Alter do Chão': 'SIM',
        [EXPORT_LOCALIDADE_COLUMN]: 'Centro',
        [EXPORT_LOCALIDADE_OUTRO_COLUMN]: '',
        'Nome do Paciente': 'Paciente teste',
      },
      'OBRIGATORIA',
      '—',
    );

    const procedencia = blocks.find((block) => block.title.startsWith('2.'));
    expect(procedencia?.rows.map((row) => row.label)).not.toContain(
      EXPORT_LOCALIDADE_OUTRO_COLUMN,
    );

    const identificacao = blocks.find((block) => block.title.startsWith('3.'));
    const cpf = identificacao?.rows.find((row) => row.label === 'CPF');
    expect(cpf?.value).toBe('—');
  });
});
