import { describe, expect, it } from 'vitest';
import {
  escopoEventoDoUsuario,
  eventoVisivelParaUsuario,
  idsAbrangencia,
} from './eventoAbrangenciaUsuario';

const cirio = {
  evento_abrangencia_municipio: [
    { tipo_municipio: { idtipo_municipio: 170 } },
    { tipo_municipio_id: 156 },
  ],
};

const municipal = {
  pronto: true,
  verTodos: false,
  isEstado: false,
  municipioId: 170,
};

describe('idsAbrangencia', () => {
  it('lê o formato que a API já devolve', () => {
    expect(idsAbrangencia(cirio)).toEqual([170, 156]);
  });

  it('lê municipios_ids e abrangencia', () => {
    expect(idsAbrangencia({ municipios_ids: [170, 156] })).toEqual([170, 156]);
    expect(
      idsAbrangencia({
        abrangencia: [{ municipio: { idtipo_municipio: 265 } }],
      }),
    ).toEqual([265]);
  });
});

describe('eventoVisivelParaUsuario', () => {
  it('Belém vê o evento que também tem outra cidade', () => {
    expect(eventoVisivelParaUsuario(cirio, municipal)).toBe(true);
  });

  it('Santarém não vê o Círio', () => {
    expect(
      eventoVisivelParaUsuario(cirio, { ...municipal, municipioId: 265 }),
    ).toBe(false);
  });

  it('estado vê o evento', () => {
    expect(
      eventoVisivelParaUsuario(cirio, {
        pronto: true,
        verTodos: false,
        isEstado: true,
        municipioId: null,
      }),
    ).toBe(true);
  });

  it('CRS vê se alguma cidade da regional está na lista', () => {
    expect(
      eventoVisivelParaUsuario(cirio, {
        ...municipal,
        municipioId: null,
        municipioIds: [156, 200],
      }),
    ).toBe(true);
    expect(
      eventoVisivelParaUsuario(cirio, {
        ...municipal,
        municipioId: null,
        municipioIds: [265],
      }),
    ).toBe(false);
  });

  it('lista vazia não fica pública para o município', () => {
    expect(
      eventoVisivelParaUsuario({ municipios_ids: [] }, municipal),
    ).toBe(false);
  });
});

describe('escopoEventoDoUsuario', () => {
  it('ainda não filtra cidade enquanto o acesso carrega', () => {
    expect(
      escopoEventoDoUsuario({
        loading: true,
        isAdmin: false,
        isEstado: false,
        municipioId: 170,
      }).pronto,
    ).toBe(false);
  });
});
