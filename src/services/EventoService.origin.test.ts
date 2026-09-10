import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('@/utils/axiosRetry', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({}),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { TiposEventoService } from './EventoService';

describe('TiposEventoService origin', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: {
        data: [{ idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO', ativo: 'S' }],
      },
    });
  });

  it('calls /api/tipo-evento on a resolvable origin, never undefined:undefined', async () => {
    await TiposEventoService.getAll();

    expect(getMock).toHaveBeenCalled();
    const url = String(getMock.mock.calls[0][0]);
    expect(url).not.toContain('undefined');
    expect(url).toMatch(/\/api\/tipo-evento$/);
  });
});
