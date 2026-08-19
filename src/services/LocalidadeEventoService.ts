import { getApiRoot } from '@/config/apiOrigin';
import type {
  LocalidadeEventoDTO,
  LocalidadesEventoResponse,
} from '@/features/notificationForms/types/index2';
import axios from '@/utils/axiosRetry';

export const LocalidadeEventoService = {
  async getByEventoId(eventoId: number): Promise<LocalidadeEventoDTO[]> {
    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      throw new Error('Evento inválido para carregar localidades.');
    }

    const response = await axios.get<LocalidadesEventoResponse>(
      `${getApiRoot()}/localidades-evento`,
      {
        params: { eventoId },
        withCredentials: true,
      },
    );

    return Array.isArray(response.data?.data) ? response.data.data : [];
  },
};

export default LocalidadeEventoService;
