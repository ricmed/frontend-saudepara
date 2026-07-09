import axios from '@/utils/axiosRetry';

const API_URL = '/api';

export interface CievsMunicipio {
  idtipo_municipio: number;
  codigo: string;
  descricao: string;
}

export interface CievsAbrangencia {
  created_at: string;
  updated_at: string;
  municipio: CievsMunicipio;
}

export interface Cievs {
  id_cievs: number;
  nome: string;
  codigo: string | null;
  created_at: string;
  updated_at: string;
  abrangencia: CievsAbrangencia[];
  _count: {
    abrangencia: number;
  };
}

export interface CievsListResponse {
  data: Cievs[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    total: number;
    pages: number;
  };
}

export interface CievsPayload {
  nome: string;
  codigo: string | null;
  municipios_ids: number[];
}

export interface CievsWithLocation extends Cievs {
  estabelecimento: {
    idestabelecimento: number;
    nome: string;
    cnes: string | null;
    latitude: string | null;
    longitude: string | null;
    logradouro: string | null;
    bairro: string | null;
    numero: string | null;
    cidade: string | null;
  } | null;
}

class CievsService {
  async getAll(page: number = 1, limit: number = 10): Promise<CievsListResponse> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const response = await axios.get<CievsListResponse>(`${API_URL}/cievs`, {
      params: { page, limit: safeLimit },
    });
    return response.data;
  }

  async getById(id: number): Promise<Cievs> {
    const response = await axios.get<Cievs>(`${API_URL}/cievs/${id}`);
    return response.data;
  }

  async create(data: CievsPayload): Promise<Cievs> {
    const response = await axios.post<Cievs>(`${API_URL}/cievs`, data);
    return response.data;
  }

  async update(id: number, data: CievsPayload): Promise<Cievs> {
    const response = await axios.put<Cievs>(`${API_URL}/cievs/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/cievs/${id}`);
  }

  async getMunicipiosPara(): Promise<CievsMunicipio[]> {
    const response = await axios.get<CievsMunicipio[]>(`${API_URL}/tipo-municipio/select`);
    return response.data;
  }

  async getAllWithLocation(): Promise<CievsWithLocation[]> {
    const response = await axios.get<CievsWithLocation[]>(
      `${API_URL}/cievs/with-location/all`
    );
    return response.data;
  }
}

export default new CievsService();
