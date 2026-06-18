import { describe, expect, it } from 'vitest';
import {
  buildDynamicFormFieldMeta,
  buildOrderedFormErrors,
  fieldKeyToInputId,
  getFirstOrderedErrorKey,
} from './dynamicFormFieldNav';
import type { FormSchema } from '@/services/FormService';

const schema: FormSchema = {
  title: 'Test',
  agravo: 'HEPATITE_CRIANCA_HBV',
  tabs: [
    { id: 'tab_gerais', label: 'Dados de Notificação', order: 1 },
    { id: 'tab_acomp', label: 'Dados de Acompanhamento', order: 2 },
  ],
  sections: [
    {
      id: 's1',
      order: 1,
      tab: 'tab_gerais',
      title: 'Gerais',
      fields: [
        { key: 'paciente.nome', type: 'text', label: 'Nome', order: 1 },
        { key: 'paciente.idade', type: 'number', label: 'Idade', order: 2 },
      ],
    },
    {
      id: 's2',
      order: 2,
      tab: 'tab_acomp',
      title: 'Acomp',
      fields: [{ key: 'investigador.nome', type: 'text', label: 'Investigador', order: 1 }],
    },
  ],
};

describe('dynamicFormFieldNav', () => {
  it('fieldKeyToInputId sanitiza caracteres especiais', () => {
    expect(fieldKeyToInputId('paciente.nome')).toBe('df-paciente_nome');
  });

  it('buildDynamicFormFieldMeta mapeia aba e rótulo', () => {
    const meta = buildDynamicFormFieldMeta(schema);
    expect(meta.get('investigador.nome')).toEqual({
      key: 'investigador.nome',
      label: 'Investigador',
      tabId: 'tab_acomp',
      tabLabel: 'Dados de Acompanhamento',
    });
  });

  it('buildOrderedFormErrors segue ordem do schema', () => {
    const meta = buildDynamicFormFieldMeta(schema);
    const ordered = buildOrderedFormErrors(
      {
        'investigador.nome': 'Investigador é obrigatório',
        'paciente.nome': 'Nome é obrigatório',
      },
      schema,
      meta,
    );
    expect(ordered.map((e) => e.key)).toEqual(['paciente.nome', 'investigador.nome']);
    expect(ordered[1].tabLabel).toBe('Dados de Acompanhamento');
  });

  it('getFirstOrderedErrorKey retorna primeiro erro na ordem do schema', () => {
    expect(
      getFirstOrderedErrorKey({ 'investigador.nome': 'x', 'paciente.nome': 'y' }, schema),
    ).toBe('paciente.nome');
  });
});
