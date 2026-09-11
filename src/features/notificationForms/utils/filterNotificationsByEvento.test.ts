import { describe, expect, it } from 'vitest';
import { filterNotificationsByEvento } from './filterNotificationsByEvento';

describe('filterNotificationsByEvento', () => {
  it('mantém só fichas do evento pedido', () => {
    const items = [
      { id: 1, original: { tipo_evento: { idtipo_evento: 6 } } },
      { id: 2, original: { tipo_evento_idtipo_evento: 1 } },
      { id: 3, original: { tipo_evento: { idtipo_evento: 6 } } },
    ];

    expect(filterNotificationsByEvento(items, 6).map((item) => item.id)).toEqual(
      [1, 3],
    );
  });
});
