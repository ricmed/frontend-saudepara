import { describe, expect, it } from 'vitest';
import {
  applyResidenciaAutoFill,
  BELEM_MUNICIPIO_ID,
  BRASIL_PAIS_ID,
  findSantaremMunicipioId,
  getResidentePerguntaLabel,
  PARA_ESTADO_ID,
  resolveResidenciaChangeFlags,
  usaLocalidadeEvento,
} from './procedenciaResidencia';

describe('usaLocalidadeEvento / label', () => {
  it('Círio e COP 30 (NAO_USA) ficam na pergunta de Belém', () => {
    expect(usaLocalidadeEvento('NAO_USA')).toBe(false);
    expect(getResidentePerguntaLabel('NAO_USA')).toBe('Residente em Belém?');
  });

  it('evento com localidade usa a pergunta de Alter do Chão', () => {
    expect(usaLocalidadeEvento('OBRIGATORIA')).toBe(true);
    expect(getResidentePerguntaLabel('OBRIGATORIA')).toBe(
      'Residente em Alter do Chão?',
    );
  });
});

describe('findSantaremMunicipioId', () => {
  it('não confunde com Santarém Novo', () => {
    expect(
      findSantaremMunicipioId([
        { idtipo_municipio: 1, descricao: 'Santarém Novo', codigo: '1506906' },
        { idtipo_municipio: 77, descricao: 'Santarém', codigo: '1506807' },
      ]),
    ).toBe('77');
  });

  it('reconhece descrição normalizada sem acento', () => {
    expect(
      findSantaremMunicipioId([
        { idtipo_municipio: 77, descricao: 'SANTAREM', codigo: '1506807' },
        { idtipo_municipio: 1, descricao: 'SANTAREM NOVO', codigo: '1506906' },
      ]),
    ).toBe('77');
  });
});

describe('applyResidenciaAutoFill', () => {
  const empty = {
    paisProcedencia: '',
    uf: '',
    municipio: '',
    bairro: '',
    localHospedagem: '',
    contatoLocal: '',
  };

  it('NAO_USA + SIM continua Belém', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '1',
        modo: 'NAO_USA',
        current: { ...empty, bairro: '4' },
        santaremMunicipioId: '77',
        residenteJustChanged: true,
        hydrate: false,
      }),
    ).toEqual({
      paisProcedencia: BRASIL_PAIS_ID,
      uf: PARA_ESTADO_ID,
      municipio: BELEM_MUNICIPIO_ID,
      bairro: '4',
      localHospedagem: '',
      contatoLocal: '',
    });
  });

  it('localidade + SIM grava Santarém e não leva bairro de Belém', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '1',
        modo: 'OBRIGATORIA',
        current: {
          ...empty,
          municipio: BELEM_MUNICIPIO_ID,
          bairro: '4',
        },
        santaremMunicipioId: '77',
        residenteJustChanged: true,
        hydrate: false,
      }),
    ).toEqual({
      paisProcedencia: BRASIL_PAIS_ID,
      uf: PARA_ESTADO_ID,
      municipio: '77',
      bairro: '',
      localHospedagem: '',
      contatoLocal: '',
    });
  });

  it('localidade + NÃO pré-seleciona Santarém na escolha', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: empty,
        santaremMunicipioId: '77',
        residenteJustChanged: true,
        hydrate: false,
      }),
    ).toMatchObject({
      uf: PARA_ESTADO_ID,
      municipio: '77',
    });
  });

  it('NÃO: primeira escolha (flags ainda “não mudou”) com campos vazios pré-seleciona', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: empty,
        santaremMunicipioId: '77',
        residenteJustChanged: false,
        hydrate: false,
      }),
    ).toMatchObject({
      uf: PARA_ESTADO_ID,
      municipio: '77',
    });
  });

  it('NÃO: primeira escolha sem id de Santarém ainda preenche a UF Pará', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: empty,
        santaremMunicipioId: null,
        residenteJustChanged: false,
        hydrate: false,
      }),
    ).toMatchObject({
      uf: PARA_ESTADO_ID,
      municipio: '',
    });
  });

  it('hydrate de NÃO com outro município não sobrescreve', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: {
          ...empty,
          paisProcedencia: BRASIL_PAIS_ID,
          uf: PARA_ESTADO_ID,
          municipio: '200',
        },
        santaremMunicipioId: '77',
        residenteJustChanged: false,
        hydrate: true,
      }),
    ).toMatchObject({
      municipio: '200',
    });
  });

  it('NÃO: trocar UF (município limpo) não força de volta Pará/Santarém', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: {
          ...empty,
          paisProcedencia: BRASIL_PAIS_ID,
          uf: '13',
          municipio: '',
        },
        santaremMunicipioId: '77',
        residenteJustChanged: false,
        hydrate: false,
      }),
    ).toMatchObject({
      uf: '13',
      municipio: '',
    });
  });

  it('NÃO: mantém município escolhido depois da pré-seleção (ex. Belém)', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: {
          ...empty,
          paisProcedencia: BRASIL_PAIS_ID,
          uf: PARA_ESTADO_ID,
          municipio: BELEM_MUNICIPIO_ID,
        },
        santaremMunicipioId: '77',
        residenteJustChanged: false,
        hydrate: false,
      }),
    ).toMatchObject({
      uf: PARA_ESTADO_ID,
      municipio: BELEM_MUNICIPIO_ID,
    });
  });

  it('NÃO: id de Santarém chega depois ainda preenche se UF Pará e município vazio', () => {
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: {
          ...empty,
          paisProcedencia: BRASIL_PAIS_ID,
          uf: PARA_ESTADO_ID,
          municipio: '',
        },
        santaremMunicipioId: '77',
        residenteJustChanged: false,
        hydrate: false,
      }),
    ).toMatchObject({
      uf: PARA_ESTADO_ID,
      municipio: '77',
    });
  });
});

describe('resolveResidenciaChangeFlags', () => {
  it('ficha nova: primeira escolha conta como mudança, não como hidratação', () => {
    expect(
      resolveResidenciaChangeFlags(null, '2', false),
    ).toEqual({ hydrate: false, residenteJustChanged: true });
  });

  it('editar ficha: prev null com procedência já preenchida é hidratação', () => {
    expect(
      resolveResidenciaChangeFlags(null, '2', true),
    ).toEqual({ hydrate: true, residenteJustChanged: false });
  });

  it('trocar SIM → NÃO conta como mudança', () => {
    expect(
      resolveResidenciaChangeFlags('1', '2', true),
    ).toEqual({ hydrate: false, residenteJustChanged: true });
  });

  it('efeito reexecuta no mesmo NÃO: não é mudança', () => {
    expect(
      resolveResidenciaChangeFlags('2', '2', true),
    ).toEqual({ hydrate: false, residenteJustChanged: false });
  });

  it('ficha nova: flags da primeira NÃO + auto-fill geram Pará/Santarém', () => {
    const flags = resolveResidenciaChangeFlags(null, '2', false);
    expect(
      applyResidenciaAutoFill({
        residenteBelem: '2',
        modo: 'OBRIGATORIA',
        current: {
          paisProcedencia: '',
          uf: '',
          municipio: '',
          bairro: '',
          localHospedagem: '',
          contatoLocal: '',
        },
        santaremMunicipioId: '77',
        residenteJustChanged: flags.residenteJustChanged,
        hydrate: flags.hydrate,
      }),
    ).toMatchObject({
      uf: PARA_ESTADO_ID,
      municipio: '77',
    });
  });
});
