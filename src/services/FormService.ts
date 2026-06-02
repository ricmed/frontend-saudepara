import axios from 'axios';
import { getRuntimeApiBaseOrigin, getRuntimeApiRoot } from '@/config/runtimeApiBase';

const API_URL = getRuntimeApiRoot();
const PUBLIC_API_URL = getRuntimeApiBaseOrigin();
const PUBLIC_FORM_SUBMIT_TIMEOUT_MS = 180000;

// Instância do axios com credenciais (cookies de autenticação)
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ✅ Envia cookies de autenticação automaticamente
});

// Instância para rotas públicas (sem /api)
const publicApi = axios.create({
  baseURL: PUBLIC_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// Types
export interface Form {
  id: number;
  form_key: string;
  nome: string;
  descricao?: string;
  status: string;
  is_active: boolean;
  /** Papel do usuário atual no formulário (somente em algumas listagens internas). */
  my_role?: 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
  active_version_id?: number;
  categoria?: string;
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  require_login?: boolean;
  slug?: string | null;
  open_at?: string | null;
  close_at?: string | null;
  max_submissions?: number | null;
  confirmation_message?: string | null;
  redirect_url?: string | null;
  collect_email?: boolean;
  one_response_per_user?: boolean;
  owner_user_id?: string | null;
  allow_edit_after_submit?: boolean;
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

export interface PublicFormPayload {
  form: {
    id: number;
    form_key: string;
    nome: string;
    descricao?: string | null;
    categoria?: string | null;
    slug: string | null;
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    require_login: boolean;
    open_at?: string | null;
    close_at?: string | null;
    max_submissions?: number | null;
    confirmation_message?: string | null;
    redirect_url?: string | null;
    collect_email?: boolean;
    one_response_per_user?: boolean;
    /** Quando true, o respondente pode alterar a resposta após o envio (fluxo público). */
    allow_edit_after_submit?: boolean;
  };
  version: {
    id: number;
    form_id: number;
    version: number;
    schema_json: FormSchema;
    ui_json?: any;
    rules_json?: any;
    published_at?: string;
  };
}

export interface FormSchema {
  agravo: string;
  /** Título exibido para quem está preenchendo (ex.: "Cadastro de Pessoas"). */
  title?: string;
  sections: FormSection[];
  rules?: FormRule[];
  validations?: FormValidation[];
  /** Quando ativo, o formulário exibe apenas os campos marcados como coluna fixa */
  fixedColumnsConfig?: {
    enabled?: boolean;
    autoExtract?: boolean;
    columns?: string[];
  };
  /** Questionário (pontuação no envio) — “Meus formulários”. */
  quiz?: {
    enabled?: boolean;
    showScoreAfter?: boolean;
    showCorrectAnswers?: boolean;
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
  /** Para campo `date`: inicia com a data atual (usuário pode editar normalmente). */
  defaultCurrentDate?: boolean;
  mask?: string;
  min?: number;
  max?: number;
  /** Passo numérico (ex.: slider; escala linear em valores inteiros). */
  step?: number;
  /** Rótulo no extremo inferior/esquerdo da escala linear. */
  scaleLowLabel?: string;
  /** Rótulo no extremo superior/direito da escala linear. */
  scaleHighLabel?: string;
  /** Rótulos por valor da nota (escala linear); substitui/estende os dois extremos quando preenchido. */
  scalePointLabels?: Array<{ value: number; label: string }>;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  disabled?: boolean;
  hidden?: boolean;
  helpText?: string;
  /** Para checkbox: salva como '1'/'0' em vez de boolean */
  storeAs01?: boolean;
  // Configuração de origem de dados
  dataSource?: 'manual' | 'database' | 'api';
  dataTable?: string;
  dataValueColumn?: string;
  dataLabelColumn?: string;
  /** Query params fixos na chamada da API (ex.: tipo_estado_idtipo_estado=15, todos=1). */
  apiSelectStaticParams?: Record<string, string>;
  /**
   * Preset escolhido no construtor em “Lista pronta” (API). Ajuda a UI quando o endpoint
   * ainda não reflete o passo (ex.: “cidades que seguem a regional” antes de ligar o campo).
   */
  apiListGuidedPreset?:
    | 'crs_regionais'
    | 'municipios_segue_regional'
    | 'municipios_cidades'
    | 'municipios_todos'
    | 'outro_lista_pronta';
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
  /** Número de colunas do grid para opções em `checkbox-group`, `radio` e `select` em modo cartões (padrão 2). Omitir em `select` para lista suspensa nativa. */
  gridCols?: number;
  /** Radio: tiles pequenos (px-2), grid 2 colunas. */
  compactTiles?: boolean;
  /** Radio: tiles médios em grid com largura do conteúdo (linhas HBV dose). */
  inlineTiles?: boolean;
  /** Radio: quase padrão (p-3, h-5), grid 2 colunas preenchendo o pai — linhas HBV dose. */
  doseRowTiles?: boolean;
  /** Oculta rótulo visual do campo (sr-only), mantendo acessibilidade. */
  hideLabel?: boolean;
  /** Date: controles −/+ mais compactos e sem margem inferior extra. */
  denseControls?: boolean;
  /** Com `denseControls`: rótulo/input um pouco maiores (linhas HBV dose). */
  denseControlsLargeText?: boolean;
  /** Com `denseControls`: rótulo/input menores (painel laboratorial criança). */
  denseControlsSmallText?: boolean;
  /**
   * `radio`, `select` em cartões (`gridCols` 1–3) ou `checkbox-group`: opção extra com campo de texto (estilo Google Forms).
   * O texto é salvo em `radioChoiceOtherTextKey(key)`; no `radio`/`select` o valor da escolha segue sendo `choiceWithTextValue`;
   * no `checkbox-group` esse valor entra no array de opções marcadas.
   * Não inclua essa opção na lista manual — ela é exibida automaticamente ao ativar.
   */
  choiceWithText?: boolean;
  /** Rótulo da opção com texto (ex.: Outro, Especifique, NSI — comente). */
  choiceWithTextLabel?: string;
  /** Placeholder do campo de texto ao lado da opção. */
  choiceWithTextPlaceholder?: string;
  /**
   * Valor persistido no campo quando a opção com texto está marcada.
   * Não pode repetir o `value` de nenhuma opção manual.
   */
  choiceWithTextValue?: string;
  quiz?: {
    enabled?: boolean;
    points?: number;
    correctValue?: string;
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

export interface AdminFormsQuery {
  page?: number;
  limit?: number;
  scope?: 'all' | 'sinan' | 'general';
  search?: string;
  is_active?: boolean;
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PacienteLookupBasic {
  id: number;
  cpf: string | null;
  cns: string | null;
  nome: string | null;
  data_nascimento: string | null; // YYYY-MM-DD
  nome_mae: string | null;
  sexo: string | null; // M/F/I (ou conforme base interna)
}

// ── Tipos para importação via Excel ──────────────────────────────────────────

export interface XlsFormPreview {
  form: {
    form_key: string;
    nome: string;
    descricao?: string;
    categoria?: string;
    agravo: string;
  };
  schema_json: FormSchema;
  codeLists: Array<{
    name: string;
    items: Array<{ code: string; label: string }>;
  }>;
  warnings: string[];
}

// Service
class FormService {
  // Meus formulários (owner + ACL)
  async getMyForms(): Promise<Form[]> {
    const response = await api.get('/forms/me');
    return response.data;
  }

  // Criar formulário “geral” (dono automático, sem precisar mandar created_by)
  async createMyForm(data: {
    form_key?: string;
    nome: string;
    descricao?: string;
    categoria?: string;
    visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    require_login?: boolean;
    slug?: string;
    is_active?: boolean;
  }): Promise<Form> {
    const response = await api.post('/forms/me', data);
    return response.data;
  }

  async updateMyForm(
    id: number,
    data: {
      nome?: string;
      descricao?: string;
      categoria?: string;
      visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
      require_login?: boolean;
      slug?: string | null;
      allow_edit_after_submit?: boolean;
      is_active?: boolean;
      open_at?: string | Date | null;
      close_at?: string | Date | null;
      max_submissions?: number | null;
      confirmation_message?: string | null;
      redirect_url?: string | null;
      collect_email?: boolean;
      one_response_per_user?: boolean;
    }
  ): Promise<Form> {
    const response = await api.put(`/forms/me/${id}`, data);
    return response.data;
  }

  async deleteMyForm(id: number): Promise<void> {
    await api.delete(`/forms/me/${id}`);
  }

  async duplicateMyForm(id: number): Promise<Form> {
    const response = await api.post(`/forms/me/${id}/duplicate`);
    return response.data;
  }
  async getCategories(): Promise<Array<{ key: string; label: string }>> {
    const response = await api.get('/forms/categories');
    const data = response.data;
    if (!Array.isArray(data)) return [];
    return data
      .map((c: any) => ({ key: String(c.key ?? ''), label: String(c.label ?? '') }))
      .filter((c) => c.key && c.label);
  }

  async lookupPacienteBasic(params: { cpf?: string; cns?: string }): Promise<PacienteLookupBasic | null> {
    try {
      const response = await api.get('/paciente/lookup', { params });
      const data = response.data;
      if (!data || typeof data !== 'object') return null;
      if (typeof data.id !== 'number') return null;
      return data as PacienteLookupBasic;
    } catch (e: any) {
      // 404 = não encontrado; não é erro de UX
      if (e?.response?.status === 404) return null;
      throw e;
    }
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

  // Admin: listar globalmente (com filtros/paginação)
  async getAdminForms(params?: AdminFormsQuery): Promise<Paginated<Form>> {
    const response = await api.get('/forms/admin', { params: params ?? {} });
    return response.data;
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

  // Buscar formulário público por slug (usa token `t` quando UNLISTED)
  async getPublicForm(slug: string, token?: string | null): Promise<PublicFormPayload> {
    const params: Record<string, string> = {};
    if (token) params.t = token;
    // Em produção o nginx costuma fazer proxy só de /api → backend.
    const response = await publicApi.get(`/api/public/forms/${encodeURIComponent(slug)}`, { params });
    return response.data;
  }

  /** Resposta do POST público: submissão + resumo de quiz (se configurado). */
  async submitPublicForm(params: { slug: string; token?: string | null; data_json: Record<string, any>; draft?: boolean }): Promise<
    Record<string, any> & {
      quiz?: { score: number; maxScore: number; items: Array<{ key: string; points: number; awarded: number; correct: boolean; expected?: string; answer?: string }> } | null;
    }
  > {
    const qs: Record<string, string> = {};
    if (params.token) qs.t = params.token;
    if (params.draft) qs.draft = '1';
    const response = await publicApi.post(
      `/api/public/forms/${encodeURIComponent(params.slug)}/submissions`,
      { data_json: params.data_json },
      { params: qs, timeout: PUBLIC_FORM_SUBMIT_TIMEOUT_MS }
    );
    return response.data;
  }

  /** Atualiza resposta já enviada no fluxo público (requer `allow_edit_after_submit` no formulário). */
  async updatePublicSubmission(params: {
    slug: string;
    submissionId: number;
    token?: string | null;
    data_json: Record<string, any>;
  }): Promise<
    Record<string, any> & {
      quiz?: { score: number; maxScore: number; items: Array<{ key: string; points: number; awarded: number; correct: boolean; expected?: string; answer?: string }> } | null;
    }
  > {
    const qs: Record<string, string> = {};
    if (params.token) qs.t = params.token;
    const response = await publicApi.patch(
      `/api/public/forms/${encodeURIComponent(params.slug)}/submissions/${params.submissionId}`,
      { data_json: params.data_json },
      { params: qs, timeout: PUBLIC_FORM_SUBMIT_TIMEOUT_MS }
    );
    return response.data;
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

  // ── Importação via Excel (XLSForm) ────────────────────────────────────────

  async downloadImportTemplate(): Promise<void> {
    const response = await api.get('/forms/import-excel/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_formulario.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async previewImportExcel(file: File): Promise<XlsFormPreview> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/forms/import-excel/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async confirmImportExcel(preview: XlsFormPreview): Promise<{ formId: number; versionId: number }> {
    const response = await api.post('/forms/import-excel/confirm', { preview });
    return response.data;
  }
}

export default new FormService();
