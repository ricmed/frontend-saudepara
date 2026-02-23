import axios from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api`;

// Instância do axios com credenciais (cookies de autenticação)
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ✅ Envia cookies de autenticação automaticamente
});

// Types
export interface Form {
  id: number;
  agravo_key: string;
  nome: string;
  descricao?: string;
  status: string;
  is_active: boolean;
  active_version_id?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  versions?: FormVersion[];
}

export interface FormVersion {
  id: number;
  form_id: number;
  version: number;
  schema_json: FormSchema;
  ui_json?: any;
  rules_json?: any;
  published_at?: string;
  published_by?: string;
  created_at: string;
  updated_at: string;
  form?: Form;
}

export interface FormSchema {
  agravo: string;
  sections: FormSection[];
  rules?: FormRule[];
  validations?: FormValidation[];
}

export interface FormSection {
  id: string;
  title: string;
  order: number;
  fields: FormField[];
}

export interface FormField {
  key: string;
  type: string;
  label: string;
  required?: boolean;
  order: number;
  codeList?: string;
  /** Endpoint para carregar opções (ex: 'tipo-pais/select'). Resposta esperada: array com idtipo_pais e descricao ou value/label. */
  apiSelectEndpoint?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  mask?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  disabled?: boolean;
  hidden?: boolean;
  helpText?: string;
  // Configuração de origem de dados
  dataSource?: 'manual' | 'database';
  dataTable?: string;
  dataValueColumn?: string;
  dataLabelColumn?: string;
  // Configuração de campos de endereço
  addressFields?: string[];
  // Upload de arquivo: tamanho máx total em bytes, máx de arquivos (1-10)
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
}

export interface FormRule {
  id?: string;
  description?: string;
  when: {
    op: string;
    left: string;
    right: any;
  };
  then: Array<{
    action: string;
    target: string;
    value?: any;
  }>;
  else?: Array<{
    action: string;
    target: string;
    value?: any;
  }>;
}

export interface FormValidation {
  type: string;
  field: string;
  message?: string;
  [key: string]: any;
}

// Service
class FormService {
  // Listar todos os formulários
  async getAllForms(): Promise<Form[]> {
    try {
      const response = await api.get('/forms');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar formulários:', error);
      throw error;
    }
  }

  // Buscar formulário por ID
  async getFormById(id: number): Promise<Form> {
    try {
      const response = await api.get(`/forms/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar formulário:', error);
      throw error;
    }
  }

  // Buscar formulário por agravo
  async getFormByAgravo(agravo: string): Promise<Form> {
    try {
      const response = await api.get(`/forms/agravo/${agravo.toUpperCase()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar formulário por agravo:', error);
      throw error;
    }
  }

  // Buscar versão ativa do formulário (para renderizar)
  async getActiveVersion(agravo: string): Promise<FormVersion> {
    try {
      const response = await api.get(`/forms/agravo/${agravo.toUpperCase()}/active`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar versão ativa:', error);
      throw error;
    }
  }

  // Criar novo formulário
  async createForm(data: {
    agravo_key: string;
    nome: string;
    descricao?: string;
    created_by: string;
  }): Promise<Form> {
    try {
      const response = await api.post('/forms', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar formulário:', error);
      throw error;
    }
  }

  // Atualizar formulário
  async updateForm(
    id: number,
    data: {
      nome?: string;
      descricao?: string;
      status?: string;
    }
  ): Promise<Form> {
    try {
      const response = await api.put(`/forms/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar formulário:', error);
      throw error;
    }
  }

  // Criar nova versão
  async createVersion(
    formId: number,
    data: {
      schema_json: FormSchema;
      ui_json?: any;
      rules_json?: any;
      published_by?: string;
    }
  ): Promise<FormVersion> {
    try {
      const response = await api.post(`/forms/${formId}/versions`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      throw error;
    }
  }

  // Publicar versão
  async publishVersion(formId: number, versionId: number, published_by: string): Promise<FormVersion> {
    try {
      const response = await api.post(`/forms/${formId}/versions/${versionId}/publish`, {
        published_by,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao publicar versão:', error);
      throw error;
    }
  }

  // Ativar/Desativar formulário
  async toggleActive(id: number, is_active: boolean): Promise<Form> {
    try {
      const response = await api.patch(`/forms/${id}/toggle-active`, { is_active });
      return response.data;
    } catch (error) {
      console.error('Erro ao ativar/desativar formulário:', error);
      throw error;
    }
  }

  // Excluir formulário (falha se tiver notificações)
  async deleteForm(id: number): Promise<void> {
    try {
      await api.delete(`/forms/${id}`);
    } catch (error) {
      console.error('Erro ao excluir formulário:', error);
      throw error;
    }
  }

  // Excluir formulário e todas as notificações vinculadas
  async deleteFormForce(id: number): Promise<void> {
    try {
      await api.delete(`/forms/${id}?force=true`);
    } catch (error) {
      console.error('Erro ao excluir formulário (force):', error);
      throw error;
    }
  }
}

export default new FormService();
