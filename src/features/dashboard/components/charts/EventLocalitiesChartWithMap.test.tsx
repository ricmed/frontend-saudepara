import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventLocalitiesChartWithMap from './EventLocalitiesChartWithMap';
import { EventLocalityAggregate } from '../../utils/eventLocalities';

vi.mock('./EventLocalitiesMiniMap', () => ({
  default: () => <div data-testid="event-localities-map" />
}));

const createAggregate = (
  id: number,
  label: string,
  count: number,
  suppressed: boolean
): EventLocalityAggregate => ({
  id,
  label,
  count,
  suppressed,
  tipo: 'BAIRRO',
  especial: 'NORMAL',
  ribeirinha: false,
  latitude: -2.43,
  longitude: -54.7,
  exibirMapa: true,
  ordem: id
});

describe('EventLocalitiesChartWithMap', () => {
  it('hides exact small counts and disables their filter', () => {
    const onLocalityClick = vi.fn();

    render(
      <EventLocalitiesChartWithMap
        eventDescription="Evento de teste"
        data={[
          createAggregate(1, 'Reservado', 2, true),
          createAggregate(2, 'Liberado', 8, false)
        ]}
        selectedLocalityIds={[2]}
        aggregatePolicy={{
          enabled: true,
          minimumCount: 5,
          source: 'environment'
        }}
        onLocalityClick={onLocalityClick}
      />
    );

    const suppressed = screen.getByRole('listitem', {
      name: 'Reservado: <5 notificações'
    });
    expect(suppressed).toBeDisabled();
    expect(screen.queryByText('2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('listitem', {
      name: 'Liberado: 8 notificações'
    }));
    expect(onLocalityClick).toHaveBeenCalledWith(2, false);
    expect(screen.getByTestId('event-localities-map')).toBeInTheDocument();
  });

  it('fails closed without an approved production threshold', () => {
    render(
      <EventLocalitiesChartWithMap
        eventDescription="Evento de teste"
        data={[createAggregate(1, 'Não deve aparecer', 20, true)]}
        selectedLocalityIds={[]}
        aggregatePolicy={{
          enabled: false,
          minimumCount: null,
          source: 'disabled'
        }}
        onLocalityClick={vi.fn()}
      />
    );

    expect(screen.getByText(/Granularidade indisponível/)).toBeInTheDocument();
    expect(screen.queryByText('Não deve aparecer')).not.toBeInTheDocument();
  });
});
