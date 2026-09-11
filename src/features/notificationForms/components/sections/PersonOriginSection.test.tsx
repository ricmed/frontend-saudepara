import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PersonOriginSection from './PersonOriginSection';
import type { FormData } from '@/features/notificationForms/types/index2';

vi.mock('@/features/notificationForms/components/LocationInput', () => ({
  default: ({ label }: { label?: string }) => <div>{label}</div>,
}));

vi.mock('@/features/notificationForms/components/BairroInput', () => ({
  default: () => <div>Bairro de Belém</div>,
}));

vi.mock('@/features/notificationForms/components/BrazilianPhoneInput', () => ({
  default: ({ label }: { label?: string }) => <div>{label}</div>,
}));

const baseForm = {
  evento: '6',
  publicoAtendido: '',
  localidadeEvento: '',
  localidadeEventoOutro: '',
  residenteBelem: '1',
  bairro: '',
  municipio: '',
  uf: '',
  paisProcedencia: '',
  localHospedagem: '',
  contatoLocal: '',
} as FormData;

const sectionProps = {
  formData: baseForm,
  setFormData: vi.fn(),
  errors: {},
  handleChange: vi.fn(),
  handleContatoLocalChange: vi.fn(),
  isExpanded: true,
  toggleSection: vi.fn(),
  isLoadingMunicipios: false,
  paisOptions: [],
  handleValidationError: vi.fn(),
};

describe('PersonOriginSection — modo do evento', () => {
  it('NAO_USA mantém Belém e esconde localidade do evento', () => {
    render(
      <PersonOriginSection
        {...sectionProps}
        modoLocalidadeEvento="NAO_USA"
      />,
    );

    expect(screen.getByLabelText(/Residente em Belém/i)).toBeTruthy();
    expect(screen.getByText('Bairro de Belém')).toBeTruthy();
    expect(screen.queryByText(/Localidade no evento/i)).toBeNull();
  });

  it('OBRIGATORIA pergunta Alter do Chão e abre o catálogo, sem bairro de Belém', () => {
    render(
      <PersonOriginSection
        {...sectionProps}
        modoLocalidadeEvento="OBRIGATORIA"
        localidadeEventoOptions={[
          {
            id: 1,
            nome: 'Centro',
            tipo: 'BAIRRO',
            especial: 'NORMAL',
            ribeirinha: false,
            latitude: null,
            longitude: null,
            exibir_mapa: false,
            ativo: true,
            ordem: 1,
          },
        ]}
        localidadeEventoCatalogAvailable
      />,
    );

    expect(screen.getByLabelText(/Residente em Alter do Chão/i)).toBeTruthy();
    expect(screen.getByText(/Localidade no evento/i)).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: /Localidade no evento/i })).toBeNull();
    expect(screen.queryByText('Bairro de Belém')).toBeNull();
  });

  it('NÃO esconde localidade e mostra município', () => {
    render(
      <PersonOriginSection
        {...sectionProps}
        formData={{ ...baseForm, residenteBelem: '2' }}
        modoLocalidadeEvento="OBRIGATORIA"
        localidadeEventoCatalogAvailable
      />,
    );

    expect(screen.getByLabelText(/Residente em Alter do Chão/i)).toBeTruthy();
    expect(screen.queryByText(/Localidade no evento/i)).toBeNull();
    expect(screen.getByText('Município')).toBeTruthy();
  });
});
