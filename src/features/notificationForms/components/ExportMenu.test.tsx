import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ExportMenu from './ExportMenu';
import type { EventoOption } from '@/features/notificationForms/types/index2';

const eventos: EventoOption[] = [
  {
    idtipo_evento: 6,
    descricao: 'Festival do Sairé 2026',
    modo_localidade_evento: 'OBRIGATORIA',
  },
  {
    idtipo_evento: 1,
    descricao: 'Círio de Nazaré',
    modo_localidade_evento: 'NAO_USA',
  },
];

describe('ExportMenu', () => {
  it('não exporta sem evento selecionado', () => {
    const onExport = vi.fn();
    render(
      <ExportMenu
        isOpen
        isLoading={false}
        eventos={eventos}
        onExport={onExport}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Página' })[0]);
    expect(onExport).not.toHaveBeenCalled();
  });

  it('exporta só depois de escolher o evento', () => {
    const onExport = vi.fn();
    render(
      <ExportMenu
        isOpen
        isLoading={false}
        eventos={eventos}
        onExport={onExport}
      />,
    );

    fireEvent.change(screen.getByTestId('export-evento'), {
      target: { value: '6' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Todos' })[0]);

    expect(onExport).toHaveBeenCalledWith('excel', 'all', undefined, 6);
  });
});
