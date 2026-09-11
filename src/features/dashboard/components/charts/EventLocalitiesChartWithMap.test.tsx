import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventLocalitiesChartWithMap from './EventLocalitiesChartWithMap';
import { EventLocalityAggregate } from '../../utils/eventLocalities';

vi.mock('./EventLocalitiesMiniMap', () => ({
  default: () => <div data-testid="event-localities-map" />
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const createAggregate = (
  id: number,
  label: string,
  count: number
): EventLocalityAggregate => ({
  id,
  label,
  count,
  suppressed: count < 5,
  tipo: 'BAIRRO',
  especial: 'NORMAL',
  ribeirinha: false,
  latitude: -2.43,
  longitude: -54.7,
  exibirMapa: true,
  ordem: id
});

describe('EventLocalitiesChartWithMap', () => {
  it('ranks every locality with the exact count and charts only the top 10', () => {
    const onLocalityClick = vi.fn();
    const data = [
      ...Array.from({ length: 11 }, (_, index) =>
        createAggregate(index + 1, `Localidade ${index + 1}`, 20 - index)
      ),
      createAggregate(99, 'Pequena', 2)
    ];

    render(
      <EventLocalitiesChartWithMap
        eventDescription="Evento de teste"
        data={data}
        selectedLocalityIds={[99]}
        onLocalityClick={onLocalityClick}
      />
    );

    expect(screen.getByText('Top 10 Localidades')).toBeInTheDocument();
    expect(screen.getByText('Todas as Localidades')).toBeInTheDocument();
    expect(screen.getByText('12 localidades')).toBeInTheDocument();
    expect(screen.getByRole('listitem', {
      name: 'Pequena: 2 notificações'
    })).toBeEnabled();

    fireEvent.click(screen.getByRole('listitem', {
      name: 'Pequena: 2 notificações'
    }));
    expect(onLocalityClick).toHaveBeenCalledWith(99, false);
  });
});
