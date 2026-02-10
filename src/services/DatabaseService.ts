import axios from 'axios';

// Usar o mesmo padrão dos outros serviços
const server = import.meta.env.VITE_API_SERVER || 'http://localhost';
const port = import.meta.env.VITE_API_PORT || '3000';
const API_URL = `${server}:${port}`;

export interface TableColumn {
  name: string;
  type: string;
}

export interface OptionData {
  value: string;
  label: string;
}

class DatabaseService {
  private api = axios.create({
    baseURL: `${API_URL}/api/database`,
    withCredentials: true,
  });

  async getTables(): Promise<string[]> {
    const response = await this.api.get('/tables');
    return response.data;
  }

  async getColumns(table: string): Promise<TableColumn[]> {
    const response = await this.api.get(`/tables/${table}/columns`);
    return response.data;
  }

  async getTableData(table: string, valueColumn: string, labelColumn: string): Promise<OptionData[]> {
    const response = await this.api.get(`/tables/${table}/data`, {
      params: { valueColumn, labelColumn }
    });
    return response.data;
  }
}

export default new DatabaseService();
