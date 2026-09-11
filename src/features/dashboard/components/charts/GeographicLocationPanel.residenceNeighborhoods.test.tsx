import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GeographicLocationPanel from './GeographicLocationPanel';

const empty: Array<{ name: string; value: number; fill: string }> = [];

describe('GeographicLocationPanel residence neighborhoods', () => {
  it('shows Bairros de Residência for events that do not use locality mode', () => {
    render(
      <GeographicLocationPanel
        paisData={empty}
        estadoData={empty}
        municipioData={empty}
        bairroData={empty}
      />
    );

    expect(screen.getByText('Bairros de Residência')).toBeInTheDocument();
    expect(screen.getByText('Países de Residência')).toBeInTheDocument();
    expect(screen.getByText('Municípios de Residência')).toBeInTheDocument();
  });

  it('hides Bairros de Residência when the selected event uses locality mode', () => {
    render(
      <GeographicLocationPanel
        paisData={empty}
        estadoData={empty}
        municipioData={empty}
        bairroData={[{ name: 'Centro', value: 10, fill: '#7c3aed' }]}
        hideResidenceNeighborhoods
      />
    );

    expect(screen.queryByText('Bairros de Residência')).not.toBeInTheDocument();
    expect(screen.queryByTestId('residence-neighborhoods')).not.toBeInTheDocument();
    expect(screen.getByText('Países de Residência')).toBeInTheDocument();
    expect(screen.getByText('Estados/UF de Residência')).toBeInTheDocument();
    expect(screen.getByText('Municípios de Residência')).toBeInTheDocument();
  });

  it('places event localities beside Municípios de Residência', () => {
    render(
      <GeographicLocationPanel
        paisData={empty}
        estadoData={empty}
        municipioData={empty}
        bairroData={empty}
        hideResidenceNeighborhoods
        eventLocalitiesChart={<div>Localidades no Evento</div>}
      />
    );

    expect(screen.queryByText('Bairros de Residência')).not.toBeInTheDocument();
    expect(screen.getByText('Municípios de Residência')).toBeInTheDocument();
    expect(screen.getByText('Localidades no Evento')).toBeInTheDocument();
  });
});
