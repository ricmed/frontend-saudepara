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
  form_key: string;
  nome: string;
  descricao?: string;
  status: string;
  is_active: boolean;
  active_version_id?: number;
  categoria?: string;
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
  /** Quando ativo, o formulário exibe apenas os campos marcados como coluna fixa */
  fixedColumnsConfig?: {
    enabled?: boolean;
    autoExtract?: boolean;
    columns?: string[];
  };
}

export interface FormSection {
  id: string;
  title: string;
  /** Nome do ícone (lucide) para o cabeçalho da seção. Ex.: 'clipboard-list' */
  icon?: string;
  /** Texto de orientação abaixo do título (ex.: regras de exibição condicional) */
  description?: string;
  order: number;
  fields: FormField[];
}

export interface FormField {
  key: string;
  type: string;
  label: string;
  /** Overrides de customização para campos fixos (persistidos no schema). */
  customLabel?: string | null;
  customType?: string | null;
  customApiSelectEndpoint?: string | null;
  customCodeList?: string | null;
  customMaxLength?: number | null;
  customOptions?: Array<{ value: string; label: string }> | null;
  required?: boolean;
  order: number;
  codeList?: string;
  /** Endpoint para carregar opções (ex: 'tipo-pais/select'). Resposta esperada: array com idtipo_pais e descricao ou value/label. */
  apiSelectEndpoint?: string;
  /** Chaves do formulário para enviar como query params na API (ex.: ["crs_id"] ou ["cabecalho.crs_id"]). */
  apiSelectEndpointParams?: string[];
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
  /** Para checkbox: salva como '1'/'0' em vez de boolean */
  storeAs01?: boolean;
  // Configuração de origem de dados
  dataSource?: 'manual' | 'database';
  dataTable?: string;
  dataValueColumn?: string;
  dataLabelColumn?: string;
  /** Usado na tela "Configurar Colunas Fixas": quando true, campo é exibido no formulário e persistido em coluna fixa */
  isFixedColumn?: boolean;
  /** Nome da coluna no banco (quando isFixedColumn) */
  fixedColumnName?: string;
  // Configuração de campos de endereço
  addressFields?: string[];
  // Upload de arquivo: tamanho máx total em bytes, máx de arquivos (1-10)
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  /** Tipo tabela/grid: definição das colunas e valor = array de objetos */
  tableColumns?: TableColumnDef[];
  /** Rótulo do botão "Adicionar linha" (tipo table) */
  addRowLabel?: string;
  /** Número mínimo de linhas (tipo table). Opcional. */
  minRows?: number;
  /** Número máximo de linhas (tipo table). Opcional. */
  maxRows?: number;
  /** Exibir linha de totais no rodapé da tabela (soma das colunas numéricas). */
  tableShowTotalRow?: boolean;
  /** Rótulo da linha de totais (ex.: "TOTAL MÊS"). */
  tableTotalRowLabel?: string;
  /** Regras de validação da tabela (ex.: total ~100% na Frequência Relativa). */
  tableValidations?: {
    /** Chave da coluna a validar (ex.: "total"). */
    totalColumnKey?: string;
    totalMin?: number;
    totalMax?: number;
    message?: string;
  };
}

/** Definição de uma coluna em um campo tipo table */
export interface TableColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'computed' | 'computedPct';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  apiSelectEndpoint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  /** Para type 'computed': chaves das colunas a somar na mesma linha (ex.: ["larv_aeg","pupa_aeg","exuv_aeg"]). */
  sumKeys?: string[];
  /** Para type 'computedPct': percentual = (numerador / soma(denominador)) * 100 (ex.: freq. relativa por tipo de recipiente). */
  computedPct?: { numeratorKey: string; denominatorKeys: string[] };
  /** Chaves do formulário para enviar como query params na API (ex.: ["crs_id"] → só municípios da CRS). */
  apiSelectEndpointParams?: string[];
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
  async getCategories(): Promise<Array<{ key: string; label: string }>> {
    const response = await api.get('/forms/categories');
    const data = response.data;
    if (!Array.isArray(data)) return [];
    return data
      .map((c: any) => ({ key: String(c.key ?? ''), label: String(c.label ?? '') }))
      .filter((c) => c.key && c.label);
  }

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

  // Buscar formulário por key (form_key)
  async getFormByKey(formKey: string): Promise<Form> {
    try {
      const response = await api.get(`/forms/key/${formKey.toUpperCase()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar formulário por key:', error);
      throw error;
    }
  }

  // Buscar versão ativa do formulário (para renderizar)
  async getActiveVersion(formKey: string): Promise<FormVersion> {
    try {
      const response = await api.get(`/forms/key/${formKey.toUpperCase()}/active`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar versão ativa:', error);
      throw error;
    }
  }

  // Criar novo formulário
  async createForm(data: {
    form_key: string;
    nome: string;
    descricao?: string;
    categoria?: string;
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
