import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ListaEventoSelect from './ListaEventoSelect';
import TipoAtendimentoFilter from './TipoAtendimentoFilter';
import type { EventoOption } from '../types/index2';

const eventos: EventoOption[] = [
  {
    idtipo_evento: 1,
    descricao: 'Círio de Nazaré',
    ativo: 'S',
    modo_localidade_evento: 'NAO_USA',
  },
  {
    idtipo_evento: 6,
    descricao: 'Festival do Sairé 2026',
    ativo: 'N',
    modo_localidade_evento: 'OBRIGATORIA',
  },
];

describe('ListaEventoSelect', () => {
  it('coloca o evento desativado em Histórico e avisa ao escolher', () => {
    const onChange = vi.fn();
    render(
      <ListaEventoSelect
        eventos={eventos}
        selectedEventId={null}
        onChange={onChange}
      />,
    );

    const historico = screen.getByRole('group', { name: 'Histórico' });
    expect(historico).toHaveTextContent('Festival do Sairé 2026');
    expect(screen.getByRole('group', { name: 'Eventos ativos' })).toHaveTextContent('Círio de Nazaré');

    fireEvent.change(screen.getByTestId('lista-evento'), { target: { value: '6' } });
    expect(onChange).toHaveBeenCalledWith(6);
    expect(screen.getByTestId('lista-evento').parentElement).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('sem evento ativo pede para abrir o histórico', () => {
    render(
      <ListaEventoSelect
        eventos={[eventos[1]]}
        selectedEventId={null}
        onChange={vi.fn()}
        pronto
      />,
    );

    expect(screen.getByText(/Escolha um evento em Histórico/)).toBeInTheDocument();
  });

  it('entra no quadro de tipo de atendimento, à esquerda dos botões', () => {
    render(
      <TipoAtendimentoFilter
        selectedTipo={null}
        onTipoChange={vi.fn()}
        eventoSelect={(
          <ListaEventoSelect
            eventos={eventos}
            selectedEventId={null}
            onChange={vi.fn()}
          />
        )}
      />,
    );

    const select = screen.getByTestId('lista-evento');
    const titulo = screen.getByRole('heading', { name: /Tipo de Atendimento/ });
    expect(titulo.closest('div.bg-white')).toContainElement(select);
    expect(
      select.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
