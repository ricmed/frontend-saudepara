import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FormData } from '@/features/notificationForms/types/index2';
import type { LocalidadeEventoDTO } from '@/features/notificationForms/types/index2';
import {
  changeEventoAndClearLocalidade,
  normalizeText,
  formatCPF,
  displayFormattedCPF,
  validateBirthDate,
  compareDates,
  validateManualAge,
  isTipoAtendimento,
  isTipoEncerramento,
  validateLocalidadeEvento,
  validateForm,
} from './formUtils';
import type { SectionState } from '@/features/notificationForms/hooks/useSectionExpansion';

describe('formUtils — helpers', () => {
  it('normalizeText removes accents and uppercases', () => {
    expect(normalizeText('ação')).toBe('ACAO');
    expect(normalizeText('')).toBe('');
  });

  it('formatCPF keeps digits only max 11', () => {
    expect(formatCPF('529.982.247-25')).toBe('52998224725');
  });

  it('displayFormattedCPF formats 11 digits', () => {
    expect(displayFormattedCPF('52998224725')).toBe('529.982.247-25');
    expect(displayFormattedCPF('123')).toBe('123');
  });

  it('validateBirthDate', () => {
    expect(validateBirthDate('').isValid).toBe(true);
    expect(validateBirthDate('2099-01-01').isValid).toBe(false);
    expect(validateBirthDate('invalid').isValid).toBe(false);
  });

  it('compareDates', () => {
    expect(compareDates('', '2020-01-01')).toBe(true);
    expect(compareDates('2024-06-01', '2024-01-01')).toBe(true);
  });

  it('validateManualAge requires idade or data', () => {
    const base = { dataNascimento: '', idade: '', idadeMeses: '' } as FormData;
    const r = validateManualAge(base);
    expect(r.isValid).toBe(false);
    expect(r.errors.idade).toBeDefined();
  });

  it('isTipoAtendimento matches descricao (tipo normalizado contido na descrição)', () => {
    const opts = [{ idtipo_atendimento: 1, descricao: 'ATENDIMENTO CLINICO' }];
    expect(isTipoAtendimento('CLINICO', '1', opts)).toBe(true);
    expect(isTipoAtendimento('CLINICO', '2', opts)).toBe(false);
  });

  it('isTipoEncerramento matches descricao', () => {
    const opts = [{ idtipo_encerramento: 5, descricao: 'PACIENTE TRANSFERIDO' }];
    expect(isTipoEncerramento('transferido', '5', opts)).toBe(true);
  });
});

describe('validateForm — CPF curto', () => {
  const expanded: SectionState = {
    dadosGerais: true,
    procedencia: true,
    identificacao: true,
    atendimento: true,
    unidadeNotificadora: true,
    encerramento: true,
    anexos: false,
  };

  function minimalForm(overrides: Partial<FormData>): FormData {
    return {
      evento: '1',
      publicoAtendido: '1',
      localidadeEvento: '',
      localidadeEventoOutro: '',
      localidadeEventoAtual: null,
      residenteBelem: '1',
      bairro: 'Centro',
      municipio: '',
      uf: '',
      paisProcedencia: '105',
      localHospedagem: '',
      contatoLocal: '',
      paciente: 'Paciente Teste',
      nomeMae: 'Maria Teste',
      dataNascimento: '',
      idade: '30',
      idadeMeses: '',
      idadeUnidade: 'anos',
      cpf: '52998224725',
      identidadeGenero: '1',
      gestante: '',
      raca: '1',
      escolaridade: '1',
      profissao: '1',
      ddi: '55',
      contatoTelefonico: '91999999999',
      tipoAtendimento: '10',
      sinaisESintomas: [],
      dataInicioSintomas: '',
      observacaoSintomas: '',
      hipoteseDiagnostica: [],
      observacaoHipotese: '',
      tipoTrauma: [],
      observacaoTrauma: '',
      relacionadoSurto: '',
      observacaoIncidente: '',
      dataAtendimento: '',
      unidadeNotificadora: '1',
      nomeNotificador: '',
      contatoNotificador: '',
      dataEncerramento: '',
      tipoEncerramento: '20',
      localEncaminhamento: '',
      arquivos: [],
      ...overrides,
    } as FormData;
  }

  const atendimentoOptions = [{ idtipo_atendimento: 10, descricao: 'Outro tipo' }];
  const encerramentoOptions = [{ idtipo_encerramento: 20, descricao: 'Alta curada' }];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preenche erro de CPF quando dígitos < 11', () => {
    const setErrors = vi.fn();
    const setExpanded = vi.fn();
    const ok = validateForm(
      minimalForm({ cpf: '12345' }),
      {},
      setErrors,
      setExpanded,
      expanded,
      atendimentoOptions,
      encerramentoOptions
    );
    expect(ok).toBe(false);
    expect(setErrors).toHaveBeenCalled();
    const payload = setErrors.mock.calls[0][0] as Record<string, string>;
    expect(payload.cpf).toMatch(/11 dígitos/i);
    vi.runAllTimers();
  });
});

describe('localidade do evento', () => {
  const outro: LocalidadeEventoDTO = {
    id: 10,
    nome: 'Outro',
    tipo: null,
    especial: 'OUTRO',
    ribeirinha: false,
    latitude: null,
    longitude: null,
    exibir_mapa: false,
    ativo: true,
    ordem: 1,
  };
  const naoInformado: LocalidadeEventoDTO = {
    ...outro,
    id: 11,
    nome: 'Não informado',
    especial: 'NAO_INFORMADO',
    ordem: 2,
  };

  const form = {
    localidadeEvento: '',
    localidadeEventoOutro: '',
    localidadeEventoAtual: null,
  } as FormData;

  it('respeita os três modos e bloqueia catálogo obrigatório ausente', () => {
    expect(
      validateLocalidadeEvento(form, {
        modo: 'NAO_USA',
        options: [],
        catalogAvailable: false,
      }),
    ).toEqual({});
    expect(
      validateLocalidadeEvento(form, {
        modo: 'OPCIONAL',
        options: [],
        catalogAvailable: false,
      }),
    ).toEqual({});
    expect(
      validateLocalidadeEvento(form, {
        modo: 'OBRIGATORIA',
        options: [],
        catalogAvailable: false,
      }).localidadeEvento,
    ).toMatch(/sincronize os dados de apoio/i);
  });

  it('exige texto somente para OUTRO', () => {
    expect(
      validateLocalidadeEvento(
        { ...form, localidadeEvento: '10', localidadeEventoAtual: outro },
        {
          modo: 'OBRIGATORIA',
          options: [outro, naoInformado],
          catalogAvailable: true,
        },
      ).localidadeEventoOutro,
    ).toBeDefined();

    expect(
      validateLocalidadeEvento(
        {
          ...form,
          localidadeEvento: '11',
          localidadeEventoAtual: naoInformado,
        },
        {
          modo: 'OBRIGATORIA',
          options: [outro, naoInformado],
          catalogAvailable: true,
        },
      ),
    ).toEqual({});
  });

  it('limpa localidade e complemento ao trocar evento', () => {
    const changed = changeEventoAndClearLocalidade(
      {
        ...form,
        evento: '1',
        localidadeEvento: '10',
        localidadeEventoOutro: 'Área genérica',
        localidadeEventoAtual: outro,
      } as FormData,
      '2',
    );

    expect(changed.evento).toBe('2');
    expect(changed.localidadeEvento).toBe('');
    expect(changed.localidadeEventoOutro).toBe('');
    expect(changed.localidadeEventoAtual).toBeNull();
  });
});
