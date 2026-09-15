import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComunicacaoCasoPrintFicha } from './ComunicacaoCasoPrintFicha';

describe('ComunicacaoCasoPrintFicha', () => {
  it('mostra ficha Círio com bairro e sem logo Sairé', () => {
    render(
      <ComunicacaoCasoPrintFicha
        data={{
          Evento: 'Círio de Nazaré',
          'Público Atendido': 'Visitante',
          'Residente em Belém': 'SIM',
          Bairro: 'Nazaré',
          'Nome do Paciente': 'Paciente teste',
        }}
        modoLocalidadeEvento="NAO_USA"
        isSaire={false}
        eventoNome="Círio de Nazaré"
      />,
    );

    expect(screen.getByText('Ficha de Comunicação de Caso')).toBeTruthy();
    expect(screen.getAllByText('Círio de Nazaré').length).toBeGreaterThan(0);
    expect(screen.getByText('Bairro')).toBeTruthy();
    expect(screen.queryByAltText('Festival do Sairé 2026')).toBeNull();
    expect(screen.queryByText('Localidade no evento')).toBeNull();
  });

  it('mostra ficha Sairé com localidade e logo', () => {
    render(
      <ComunicacaoCasoPrintFicha
        data={{
          Evento: 'Festival do Sairé 2026',
          'Público Atendido': 'Visitante',
          'Residente em Alter do Chão': 'SIM',
          'Localidade no evento': 'Centro',
          'Nome do Paciente': 'Paciente teste',
        }}
        modoLocalidadeEvento="OBRIGATORIA"
        isSaire
        eventoNome="Festival do Sairé 2026"
      />,
    );

    expect(screen.getByText('Localidade no evento')).toBeTruthy();
    expect(screen.getByAltText('Festival do Sairé 2026')).toBeTruthy();
    expect(screen.queryByText('Bairro')).toBeNull();
  });
});
