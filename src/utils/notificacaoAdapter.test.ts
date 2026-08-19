import { describe, expect, it } from 'vitest';
import type {
  FormData,
  LocalidadeEventoDTO,
} from '@/features/notificationForms/types/index2';
import { formatFromBackend, formatToBackend } from './notificacaoAdapter';

const outro: LocalidadeEventoDTO = {
  id: 20,
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

const normal: LocalidadeEventoDTO = {
  ...outro,
  id: 21,
  nome: 'Centro',
  tipo: 'BAIRRO',
  especial: 'NORMAL',
  ativo: true,
  ordem: 2,
};

const makeForm = (overrides: Partial<FormData> = {}): FormData =>
  ({
    evento: '1',
    publicoAtendido: '1',
    localidadeEvento: '',
    localidadeEventoOutro: '',
    localidadeEventoAtual: null,
    residenteBelem: '1',
    bairro: '1',
    municipio: '1',
    uf: '1',
    paisProcedencia: '105',
    localHospedagem: '',
    contatoLocal: '',
    paciente: 'Pessoa teste',
    pacienteId: 1,
    nomeMae: 'Responsável teste',
    dataNascimento: '',
    idade: '30',
    idadeMeses: '360',
    idadeUnidade: 'anos',
    cpf: '52998224725',
    identidadeGenero: '2',
    gestante: '',
    raca: '1',
    escolaridade: '1',
    profissao: '1',
    ddi: '55',
    contatoTelefonico: '91999999999',
    tipoAtendimento: '1',
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
    tipoEncerramento: '1',
    localEncaminhamento: '',
    arquivos: [],
    ...overrides,
  }) as FormData;

describe('notificacaoAdapter — localidade do evento', () => {
  it('mapeia FormData para o contrato da API e limpa complemento obsoleto', () => {
    const payloadOutro = formatToBackend(
      makeForm({
        localidadeEvento: '20',
        localidadeEventoOutro: '  Região genérica  ',
        localidadeEventoAtual: outro,
      }),
    );

    expect(payloadOutro.localidade_evento_id).toBe(20);
    expect(payloadOutro.localidade_evento_outro).toBe('Região genérica');

    const payloadNormal = formatToBackend(
      makeForm({
        localidadeEvento: '21',
        localidadeEventoOutro: 'texto antigo',
        localidadeEventoAtual: normal,
      }),
    );

    expect(payloadNormal.localidade_evento_id).toBe(21);
    expect(payloadNormal.localidade_evento_outro).toBeNull();
  });

  it('restaura ID, complemento e localidade inativa da API', async () => {
    const mapped = await formatFromBackend({
      tipo_evento_idtipo_evento: 1,
      tipo_publico_idtipo_publico: 1,
      localidade_evento_id: 20,
      localidade_evento_outro: 'Região genérica',
      localidade_evento: {
        ...outro,
        ativo: false,
      },
    });

    expect(mapped?.localidadeEvento).toBe('20');
    expect(mapped?.localidadeEventoOutro).toBe('Região genérica');
    expect(mapped?.localidadeEventoAtual?.ativo).toBe(false);
    expect(mapped?.localidadeEventoAtual?.nome).toBe('Outro');
  });
});
