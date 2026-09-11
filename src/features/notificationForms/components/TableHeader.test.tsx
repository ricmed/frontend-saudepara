import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TableHeader from './TableHeader';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useNavigate: () => navigate
  };
});

vi.mock('./SearchBar', () => ({
  default: () => <div data-testid="search-bar" />
}));
vi.mock('./ColumnsMenu', () => ({ default: () => null }));
vi.mock('./SortingMenu', () => ({ default: () => null }));
vi.mock('./ExportMenu', () => ({ default: () => null }));

const headerProps = {
  onMenuOpen: vi.fn(),
  searchParams: { field: 'paciente' as const, term: '' },
  onSearchChange: vi.fn(),
  onSearch: vi.fn(),
  columnsMenuOpen: false,
  onColumnsMenuToggle: vi.fn(),
  columns: [],
  selectedColumns: [],
  onToggleColumn: vi.fn(),
  sortingMenuOpen: false,
  onSortingMenuToggle: vi.fn(),
  sortKey: 'data',
  sortOrder: 'desc' as const,
  onSortChange: vi.fn(),
  exportMenuOpen: false,
  onExportMenuToggle: vi.fn(),
  onExport: vi.fn(),
  searchFields: [],
  exportEventos: []
};

describe('TableHeader', () => {
  it('abre o dashboard de comunicação de caso pelo botão da lista', () => {
    render(<TableHeader {...headerProps} />);

    fireEvent.click(screen.getByTestId('lista-caso-dashboard'));
    expect(navigate).toHaveBeenCalledWith('/dashboard-page');
  });
});
