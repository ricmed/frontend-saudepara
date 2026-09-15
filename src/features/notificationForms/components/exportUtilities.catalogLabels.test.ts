import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormData } from '@/features/notificationForms/components/types';
import {
  prepareDataForExport,
  type ExportOptions,
} from './exportUtilities';

const emptyOptions: ExportOptions = {
  eventoOptions: [],
  publicoOptions: [],
  paisOptions: [],
  estadoOptions: [],
  municipioOptions: [],
  bairroOptions: [],
  generoOptions: [],
  racaOptions: [],
  escolaridadeOptions: [],
  atendimentoOptions: [],
  sintomaOptions: [],
  hipoteseDiagOptions: [],
  traumaOptions: [],
  estabelecimentoOptions: [],
  encerramentoOptions: [],
};

function formWith(overrides: Partial<FormData>): FormData {
  return {
    evento: '',
    publicoAtendido: '',
    localidadeEvento: '',
    localidadeEventoOutro: '',
    residenteBelem: '',
    bairro: '',
    municipio: '',
    uf: '',
    paisProcedencia: '',
    localHospedagem: '',
    contatoLocal: '',
    paciente: '',
    nomeMae: '',
    dataNascimento: '',
    idade: '',
    cpf: '',
    identidadeGenero: '',
    gestante: '',
    raca: '',
    escolaridade: '',
    profissao: '',
    contatoTelefonico: '',
    tipoAtendimento: '',
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
    unidadeNotificadora: '',
    nomeNotificador: '',
    contatoNotificador: '',
    dataEncerramento: '',
    tipoEncerramento: '',
    localEncaminhamento: '',
    ...overrides,
  };
}

describe('prepareDataForExport labels de catálogo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Profissão usa codigo - descricao e não o id do CBO', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = prepareDataForExport(formWith({ profissao: '42' }), {
      ...emptyOptions,
      cboOptions: [{ idtipo_cbo: 42, codigo: '2231-05', descricao: 'Médico' }],
    });
    expect(data.Profissão).toBe('2231-05 - Médico');
  });

  it('Profissão não imprime o id quando o CBO não está no catálogo', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = prepareDataForExport(formWith({ profissao: '777' }), emptyOptions);
    expect(data.Profissão).toBe('');
  });

  it('Unidade notificadora usa o nome e não o id', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = prepareDataForExport(formWith({ unidadeNotificadora: '7' }), {
      ...emptyOptions,
      estabelecimentoOptions: [{ idestabelecimento: 7, nome: 'UPA Jurunas' }],
    });
    expect(data['Unidade Notificadora']).toBe('UPA Jurunas');
  });
});
