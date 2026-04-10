// Types for Dynamic Forms System

export interface Form {
  id: number;
  nome: string;
  form_key: string;
  descricao?: string;
  categoria?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormVersion {
  id: number;
  form_id: number;
  versao: number;
  schema_json: FormSchema;
  ui_json?: any;
  rules_json?: any;
  status: 'draft' | 'published' | 'archived';
  publicado_em?: string;
  publicado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface FormSchema {
  titulo: string;
  descricao?: string;
  versao: string;
  sections: FormSection[];
}

export interface FormSection {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  fields: FormField[];
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  tipo:
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'textarea'
    | 'checkbox'
    | 'select'
    | 'select-search'
    | 'radio'
    | 'file';
  obrigatorio?: boolean;
  ordem: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validations?: FormValidation[];
  options?: FormFieldOption[];
  codeList?: string;
  conditional?: FormConditional;
}

export interface FormFieldOption {
  value: string | number;
  label: string;
}

export interface FormValidation {
  tipo: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  valor?: any;
  mensagem: string;
}

export interface FormConditional {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'isEmpty';
  value?: any;
}

export interface FormRule {
  id: string;
  condition: FormConditional;
  actions: FormRuleAction[];
}

export interface FormRuleAction {
  tipo: 'show' | 'hide' | 'required' | 'setValue' | 'clear';
  target: string;
  value?: any;
}

export interface FormSubmission {
  id: number;
  form_version_id: number;
  form_key: string;
  data_json: any;
  status: 'draft' | 'submitted' | 'synced';
  nome_paciente?: string;
  cpf_paciente?: string;
  data_notificacao?: string;
  municipio?: string;
  estabelecimento_id?: number;
  usuario_id?: number;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  synced_at?: string;
}

export interface FormSubmissionEvent {
  id: number;
  submission_id: number;
  evento: string;
  usuario_id?: number;
  dados_evento?: any;
  created_at: string;
}

export interface CodeList {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodeListItem {
  id: number;
  code_list_id: number;
  codigo: string;
  label: string;
  descricao?: string;
  ordem: number;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}
