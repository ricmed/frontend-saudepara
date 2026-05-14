import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { FormSchema } from '@/services/FormService';
import { useFormRenderer } from '../hooks/useFormRenderer';
import { TextField, DateField, NumberField, TextareaField, CheckboxField, CurrencyField, AccountingField } from './FormFields';
import { SelectField, SelectSearchField, CodeListSelectField, CodeListSearchField, ApiSelectField, ApiSelectSearchField, CboSearchField, CnaeSearchField, DseiPoloAldeiaFields } from './SelectFields';
import { 
  CheckboxGroupField, 
  RadioGroupField, 
  MultiSelectField, 
  TimeField, 
  DateTimeField, 
  EmailField, 
  PhoneField, 
  CPFField, 
  CEPField,
  CNSField,
  PassaporteField,
  IdadeField,
  InternationalPhoneField
} from './AdvancedFields';
import type { CepFoundDetail } from './AdvancedFields';
import {
  FileUploadField,
  SignatureField,
  GeoLocationField,
  AutocompleteField,
  ColorPickerField,
  SliderField,
  StarRatingField,
  LinearScaleField,
  GoogleMapsAddressField,
  AddressField
} from './SpecialFields';
import { EstadoMunicipioNotificacao } from './EstadoMunicipioNotificacao';
import { EstabelecimentoNotificacao } from './EstabelecimentoNotificacao';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import { EstadoMunicipioResidencia } from './EstadoMunicipioResidencia';
import { TableField } from './TableField';
import { ClipboardList, Calendar, DollarSign, Target, Activity, Shield, Leaf, BarChart3, Wrench, Users } from 'lucide-react';
import { convertLocalDateTimeToUTC } from '@/utils/timezoneUtils';
import FormService from '@/services/FormService';
import type { MonitorOperRegionalScopePayload } from '../types/monitorOperRegionalScope';
import type { NotificacaoEscopo } from '../utils/notificacaoScopeDefaults';
import { validateCPF } from '@/utils/cpfValidator';
import { validateCNS } from '@/utils/cnsValidator';

const NOTIFICATION_LOCATION_KEYS = new Set([
  'notificacao.uf_notificacao',
  'notificacao.municipio_notificacao_ibge',
  'notificacao.municipio_id',
]);

const NOTIFICATION_ESTABELECIMENTO_KEYS = new Set([
  'notificacao.estabelecimento_cnes',
  'notificacao.estabelecimento',
  'notificacao.unidade_id',
]);

const RESIDENCIA_BLOCK_KEYS = new Set([
  'residencia.cep',
  'residencia.uf',
  'residencia.municipio_ibge',
  'residencia.bairro',
  'residencia.logradouro',
  'residencia.zona',
  'residencia.numero',
  'residencia.complemento',
  'residencia.telefone',
]);

/** Campos do bloco Identificação renderizados em layout customizado; Sexo ao nascimento fica ao lado de Idade; os demais (orientação sexual, etc.) renderizam no grid após o bloco */
const IDENTIFICACAO_BLOCK_KEYS = new Set([
  'notificacao.dt_notificacao',
  'paciente.cpf',
  'paciente.cns',
  'paciente.e_estrangeiro',
  'paciente.nome',
  'paciente.nome_social',
  'paciente.nome_mae',
  'paciente.data_nascimento',
  'paciente.idade',
  'paciente.sexo',
  'paciente.passaporte',
  'paciente.pais_nascimento_id',
]);

interface FormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onDataChange?: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onSaveDraft?: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  saveDraftLabel?: string;
  cancelLabel?: string;
  readOnly?: boolean;
  /** Classe extra para o container do form (útil quando embutido em modais). */
  className?: string;
  /** Exibe o título (nome/código) dentro do renderer. */
  showTitle?: boolean;
  /** Oculta a barra de ações (Enviar / Salvar rascunho / Cancelar) mantendo o formulário interativo. */
  showActions?: boolean;
  /** Contexto do formulário para ocultar campos específicos do SINAN em formulários gerais/públicos. */
  context?: 'sinan' | 'general' | 'public';
  /** Renderiza por páginas (uma seção por vez), estilo Google Forms. */
  pageMode?: boolean;
  /** Exibe barra de progresso quando em modo páginas. */
  showProgress?: boolean;
  /** Escopo CRS (MONITOR_OPER_REGIONAL): exibe regional somente leitura quando o usuário tem uma única CRS. */
  monitorOperRegionalCrsScope?: MonitorOperRegionalScopePayload | null;
  /** Vínculo territorial do usuário (SINAN): pré-preenche e trava UF / município / estabelecimento como no e-SUS. */
  notificacaoEscopo?: NotificacaoEscopo;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  initialData = {},
  onDataChange,
  onSubmit,
  onSaveDraft,
  onCancel,
  submitLabel = 'Enviar',
  saveDraftLabel = 'Salvar Rascunho',
  cancelLabel = 'Cancelar',
  readOnly = false,
  className,
  showTitle = true,
  showActions = true,
  context = 'sinan',
  pageMode = false,
  showProgress = false,
  monitorOperRegionalCrsScope = null,
  notificacaoEscopo = 'livre',
}) => {
  const sectionIconMap: Record<string, React.ComponentType<{ className?: string }>> = React.useMemo(
    () => ({
      'clipboard-list': ClipboardList,
      'calendar': Calendar,
      'dollar-sign': DollarSign,
      'target': Target,
      'activity': Activity,
      'bar-chart-3': BarChart3,
      'shield': Shield,
      'leaf': Leaf,
      'wrench': Wrench,
      'users': Users,
    }),
    []
  );

  const initialDataWithDefaults = React.useMemo(() => {
    const pac = initialData?.paciente ?? {};
    const dataNasc = pac.data_nascimento;
    const idadeAtual = pac.idade;
    const hasIdade = idadeAtual !== undefined && idadeAtual !== null && idadeAtual !== '';
    let idadeMeses: number | undefined;
    if (dataNasc && !hasIdade) {
      try {
        const birth = new Date(dataNasc);
        const today = new Date();
        let anos = today.getFullYear() - birth.getFullYear();
        let meses = today.getMonth() - birth.getMonth();
        if (meses < 0 || (meses === 0 && today.getDate() < birth.getDate())) {
          anos--;
          meses += 12;
        }
        if (today.getDate() < birth.getDate()) meses--;
        idadeMeses = anos * 12 + meses;
        if (idadeMeses < 0) idadeMeses = undefined;
      } catch {
        idadeMeses = undefined;
      }
    } else if (hasIdade) {
      const n = Number(idadeAtual);
      if (!Number.isNaN(n)) {
        if (n > 150) idadeMeses = n;
        else idadeMeses = n * 12;
      }
    }
    const estrangeiroVal = pac.e_estrangeiro;
    const eEstrangeiroDefault = (estrangeiroVal === undefined || estrangeiroVal === null || estrangeiroVal === '') ? '2' : estrangeiroVal;
    // País de nascimento não vem mais pré-selecionado como Brasil; só preenche se já vier nos dados
    return {
      ...initialData,
      paciente: {
        ...pac,
        e_estrangeiro: eEstrangeiroDefault,
        ...(idadeMeses !== undefined ? { idade: idadeMeses } : {}),
      },
    };
  }, [initialData]);

  const {
    setValue,
    getValue,
    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,
    getError,
    setError,
    clearError,
    validateAll,
    validateField,
    formData,
  } = useFormRenderer({
    schema,
    initialData: initialDataWithDefaults,
    onDataChange,
  });

  const crsReadonlySyncedRef = useRef(false);
  const { lockNotifUf, lockNotifMun, lockNotifEst } = React.useMemo(() => {
    if (notificacaoEscopo === 'unidade') {
      return { lockNotifUf: true, lockNotifMun: true, lockNotifEst: true };
    }
    if (notificacaoEscopo === 'municipio') {
      return { lockNotifUf: true, lockNotifMun: true, lockNotifEst: false };
    }
    if (notificacaoEscopo === 'estado') {
      return { lockNotifUf: true, lockNotifMun: false, lockNotifEst: false };
    }
    return { lockNotifUf: false, lockNotifMun: false, lockNotifEst: false };
  }, [notificacaoEscopo]);
  useEffect(() => {
    crsReadonlySyncedRef.current = false;
  }, [monitorOperRegionalCrsScope, initialDataWithDefaults]);
  useEffect(() => {
    if (monitorOperRegionalCrsScope?.ui !== 'readonly' || !monitorOperRegionalCrsScope.readonlyCrs) return;
    if (crsReadonlySyncedRef.current) return;
    const v = getValue('cabecalho.crs_id');
    if (v != null && String(v).trim() !== '') {
      crsReadonlySyncedRef.current = true;
      return;
    }
    setValue('cabecalho.crs_id', String(monitorOperRegionalCrsScope.readonlyCrs.id));
    crsReadonlySyncedRef.current = true;
  }, [monitorOperRegionalCrsScope, getValue, setValue]);

  // Auto-preencher dados do paciente via base interna (CPF/CNS).
  // Não sobrescreve campos já preenchidos manualmente.
  const [, setLookupLoading] = useState(false);
  const applyPacienteLookup = useCallback(
    (data: any) => {
      if (!data) return;
      const getEmpty = (k: string) => {
        const v = getValue(k);
        return v == null || String(v).trim() === '';
      };
      if (data.nome && getEmpty('paciente.nome')) setValue('paciente.nome', String(data.nome));
      if (data.data_nascimento && getEmpty('paciente.data_nascimento')) setValue('paciente.data_nascimento', String(data.data_nascimento));
      if (data.nome_mae && getEmpty('paciente.nome_mae')) setValue('paciente.nome_mae', String(data.nome_mae));
      if (data.cns && getEmpty('paciente.cns')) setValue('paciente.cns', String(data.cns));
      if (data.sexo && getEmpty('paciente.sexo')) setValue('paciente.sexo', String(data.sexo));
    },
    [getValue, setValue]
  );

  const lookupByCpfOrCns = useCallback(
    async (params: { cpf?: string; cns?: string }) => {
      try {
        setLookupLoading(true);
        const res = await FormService.lookupPacienteBasic(params);
        if (res) applyPacienteLookup(res);
      } catch (e) {
        // ignora erros de rede aqui (não pode travar preenchimento manual)
        console.warn('Paciente lookup falhou', e);
      } finally {
        setLookupLoading(false);
      }
    },
    [applyPacienteLookup]
  );

  const [uploadingCount, setUploadingCount] = useState(0);
  const handleUploadingChange = useCallback((uploading: boolean) => {
    setUploadingCount(c => Math.max(0, c + (uploading ? 1 : -1)));
  }, []);
  const isUploading = uploadingCount > 0;

  // Quando "Configurar Colunas Fixas" está ativo, exibir apenas os campos marcados como coluna fixa
  const sectionsToRender = React.useMemo(() => {
    // `fixedColumnsConfig.enabled` foi pensado para a tela de configuração de colunas fixas.
    // Para evitar formulários “vazios” quando ninguém marcou `isFixedColumn`,
    // só aplicamos o filtro se existir pelo menos 1 campo marcado como fixo.
    const enabled = !!schema.fixedColumnsConfig?.enabled;
    const hasAnyFixedField = schema.sections?.some((s) => s.fields?.some((f) => f.isFixedColumn === true));
    const useFixedOnly = enabled && hasAnyFixedField;
    if (!useFixedOnly) return schema.sections;
    return schema.sections
      .map((section) => ({
        ...section,
        fields: section.fields.filter((f) => f.isFixedColumn === true),
      }))
      .filter((section) => section.fields.length > 0)
      .sort((a, b) => a.order - b.order);
  }, [schema]);

  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => {
    setPageIndex(0);
  }, [schema]);

  const totalPages = pageMode ? Math.max(1, sectionsToRender.length) : 1;
  const currentSection = pageMode ? sectionsToRender[Math.min(pageIndex, sectionsToRender.length - 1)] : null;

  const validateCurrentPage = () => {
    if (!pageMode || !currentSection) return validateAll();
    let ok = true;
    const sortedFields = [...(currentSection.fields || [])].sort((a, b) => a.order - b.order);
    for (const f of sortedFields) {
      if (!f) continue;
      if (!isFieldVisible(f.key)) continue;
      if (isFieldDisabled(f.key)) continue;
      const valid = validateField(f as any);
      if (!valid) ok = false;
    }
    return ok;
  };

  const getNextPageIndexFromRules = (): number | null => {
    if (!pageMode) return null;
    const rules = (schema.rules || []) as any[];
    if (!rules.length) return null;

    const evalCondition = (when: any): boolean => {
      const op = String(when?.op || '').trim();
      const left = String(when?.left || '').trim();
      const right = when?.right;
      const lv = left ? getValue(left) : undefined;

      const asNum = (v: any) => {
        const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      };
      const norm = (v: any) => (v == null ? '' : String(v));

      if (op === 'isEmpty') return lv == null || norm(lv).trim() === '';
      if (op === 'isNotEmpty') return !(lv == null || norm(lv).trim() === '');
      if (op === 'contains') return norm(lv).toLowerCase().includes(norm(right).toLowerCase());
      if (op === 'startsWith') return norm(lv).toLowerCase().startsWith(norm(right).toLowerCase());
      if (op === 'endsWith') return norm(lv).toLowerCase().endsWith(norm(right).toLowerCase());

      if (op === 'in' || op === 'notIn') {
        const arr = Array.isArray(right) ? right.map(norm) : norm(right).split(',').map((s) => s.trim()).filter(Boolean);
        const has = arr.includes(norm(lv));
        return op === 'in' ? has : !has;
      }

      const ln = asNum(lv);
      const rn = asNum(right);
      if (['gt', 'gte', 'lt', 'lte'].includes(op) && ln != null && rn != null) {
        if (op === 'gt') return ln > rn;
        if (op === 'gte') return ln >= rn;
        if (op === 'lt') return ln < rn;
        if (op === 'lte') return ln <= rn;
      }

      if (op === 'eq') return norm(lv) === norm(right);
      if (op === 'neq') return norm(lv) !== norm(right);
      return false;
    };

    for (const r of rules) {
      if (!evalCondition(r.when)) continue;
      const thenActs = Array.isArray(r.then) ? r.then : [];
      const go = thenActs.find((a: any) => String(a?.action) === 'gotoSection');
      const targetId = String(go?.target || '').trim();
      if (!targetId) continue;
      const idx = sectionsToRender.findIndex((s: any) => String(s.id) === targetId);
      if (idx >= 0) return idx;
    }
    return null;
  };

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => {
    if (!validateCurrentPage()) return;
    const jump = getNextPageIndexFromRules();
    if (jump != null) {
      setPageIndex(Math.max(0, Math.min(jump, totalPages - 1)));
      return;
    }
    setPageIndex((p) => Math.min(totalPages - 1, p + 1));
  };

  const detalhamentoFieldKeys = React.useMemo(
    () => schema.sections.find((s) => s.id === 'detalhamento')?.fields.map((f) => f.key) ?? [],
    [schema],
  );

  const monitorOperImpactFieldKeys = React.useMemo(
    () =>
      schema.sections
        .flatMap((s) => s.fields ?? [])
        .map((f) => f.key)
        .filter((k) => /^(imp_epi|imp_san|imp_amb)\./.test(k)),
    [schema],
  );

  const clearDetalhamento = useCallback(() => {
    detalhamentoFieldKeys.forEach((k) => setValue(k, undefined));
  }, [detalhamentoFieldKeys, setValue]);

  // Retorno da assinatura Gov.br: preencher campo ou exibir erro e limpar hash/query
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash?.slice(1) || window.location.search?.slice(1) || ''
    );
    const signature = params.get('signature');
    const cert = params.get('cert');
    const fieldKey = params.get('fieldKey');
    const govbrError = params.get('govbr_error');
    if (govbrError) {
      try {
        const message = decodeURIComponent(govbrError);
        alert(`Assinatura Gov.br: ${message}`);
      } catch {
        alert('Erro ao processar assinatura Gov.br.');
      }
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
      return;
    }
    if (signature && fieldKey) {
      setValue(fieldKey, {
        type: 'govbr',
        signatureBase64: signature,
        certificatePem: cert || undefined,
        signedAt: new Date().toISOString(),
      });
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
    }
  }, [setValue]);

  // Função para converter campos datetime-local para UTC antes de enviar
  const convertDateTimeFieldsToUTC = (data: Record<string, any>, schema: FormSchema): Record<string, any> => {
    const result = { ...data };
    
    // Percorrer todas as seções e campos para encontrar datetime fields
    schema.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'datetime' && result[field.key]) {
          const value = result[field.key];
          // Se for datetime-local (sem timezone), converter para UTC
          if (typeof value === 'string' && 
              !value.includes('Z') && 
              !value.includes('+') &&
              value.length <= 16) {
            result[field.key] = convertLocalDateTimeToUTC(value);
          }
        }
      });
    });
    
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly || isUploading) return;

    if (validateAll()) {
      // Converter datetime fields antes de enviar
      const dataToSubmit = convertDateTimeFieldsToUTC(formData, schema);
      onSubmit?.(dataToSubmit);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly || isUploading) return;

    // Converter datetime fields antes de salvar rascunho também
    const dataToSave = convertDateTimeFieldsToUTC(formData, schema);
    onSaveDraft?.(dataToSave);
  };

  // Tipos que devem ocupar a linha inteira (não ficar na metade do grid)
  const fullWidthTypes = new Set([
    'textarea',
    'file',
    'signature',
    'geolocation',
    'checkbox-group',
    'radio',
    'multi-select',
    'address',
    'google-address',
    'slider',
    'rating',
    'linear_scale',
    'color',
    'autocomplete',
    'table',
  ]);
  const isFullWidth = (type: string) => fullWidthTypes.has(type);
  const isHalfWidthDescription = (field: any) => {
    const key = String(field?.key || '');
    // Em vários instrumentos a "descrição" funciona melhor em meia coluna,
    // para permitir o próximo campo ao lado.
    return key.includes('descricao');
  };

  const normalizeMaiusculo = (v: any) => {
    if (v == null || v === '') return v;
    return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  };
  const normalizeNumeroSN = (v: any) => {
    if (v == null || v === '') return v;
    const s = String(v).toUpperCase();
    if (/[0-9]/.test(s)) return s.replace(/\D/g, ''); // só números: qualquer outro caractere removido
    let result = '';
    for (const c of s) {
      if (c === 'S' && result === '') result = 'S';
      else if (c === 'N' && result === 'S') result = 'SN';
    }
    return result;
  };

  const residenciaPlaceholders: Record<string, string> = {
    'residencia.bairro': 'Ex.: NAZARÉ, JURUNAS',
    'residencia.logradouro': 'Ex.: AV. CONSELHEIRO FURTADO, RUA 15 DE NOVEMBRO',
    'residencia.numero': 'Ex.: 100, SN (sem número)',
    'residencia.complemento': 'Ex.: APTO 101, CASA 2, FUNDOS',
  };

  // Mapeamento por key: garante tipo/opções corretos mesmo quando o schema vem com type "text" do banco
  const getResolvedField = (field: any) => {
    const keyMap: Record<string, { type: string; options?: Array<{ value: string; label: string }>; apiSelectEndpoint?: string; maxLength?: number }> = {
      'paciente.nome': { type: 'text', maxLength: 100 },
      'paciente.cpf': { type: 'cpf' },
      'paciente.cns': { type: 'cns' },
      'paciente.nome_social': { type: 'text', maxLength: 100 },
      'paciente.e_estrangeiro': { type: 'select', options: [{ value: '1', label: 'SIM' }, { value: '2', label: 'NÃO' }] },
      'paciente.povo_tradicional': { type: 'select', options: [{ value: '1', label: 'SIM' }, { value: '2', label: 'NAO' }, { value: '9', label: 'IGNORADO' }] },
      'paciente.passaporte': { type: 'passaporte' },
      'paciente.pais_nascimento_id': { type: 'select', apiSelectEndpoint: 'tipo-pais/select' },
      'residencia.pais': { type: 'select', apiSelectEndpoint: 'tipo-pais/select' },
      'paciente.data_nascimento': { type: 'date' },
      'paciente.idade': { type: 'idade' },
      'paciente.nome_mae': { type: 'text', maxLength: 100 },
    };
    const over = keyMap[field.key];
    const base = over
      ? { ...field, type: over.type, options: over.options ?? field.options, apiSelectEndpoint: over.apiSelectEndpoint ?? field.apiSelectEndpoint, maxLength: over.maxLength ?? field.maxLength }
      : field;
    const placeholder = residenciaPlaceholders[base.key];
    const withPlaceholder =
      placeholder != null ? { ...base, placeholder: base.placeholder ?? placeholder } : base;

    if (field.key === 'detalhamento.complementar_detalhe') {
      const parent = getValue('detalhamento.complementar_descricao');
      const optPrevencao = [
        { value: 'imunizacao', label: 'Imunização' },
        { value: 'controle_vetorial', label: 'Controle Vetorial' },
        { value: 'controle_reservatorios', label: 'Controle de Reservatórios' },
      ];
      const optDiagnostico = [
        { value: 'coleta_material', label: 'Coleta de Material' },
        { value: 'realizacao_exames', label: 'Realização de Exames' },
      ];
      const options =
        parent === 'acoes_prevencao_saude'
          ? optPrevencao
          : parent === 'acoes_diagnostico'
            ? optDiagnostico
            : [];
      return { ...withPlaceholder, options };
    }

    return withPlaceholder;
  };

  const renderField = (field: any) => {
    const resolved = getResolvedField(field);
    // Em formulários gerais/públicos, ocultar campos específicos de paciente/SINAN
    if (context !== 'sinan') {
      const sinanOnlyKeys = new Set([
        'paciente.e_estrangeiro',
        'paciente.passaporte',
        'paciente.pais_nascimento_id',
        'paciente.cpf',
        'paciente.cns',
      ]);
      if (sinanOnlyKeys.has(resolved.key)) return null;
    }
    // Não exibir paciente.pais_nascimento (texto); só o select paciente.pais_nascimento_id é usado
    if (resolved.key === 'paciente.pais_nascimento') {
      return null;
    }
    const value = getValue(resolved.key);
    const error = getError(resolved.key);
    const required = isFieldRequired(resolved.key);
    const visible = isFieldVisible(resolved.key);
    const disabled = isFieldDisabled(resolved.key) || readOnly;

    if (!visible) {
      return null;
    }

    if (resolved.type === 'estabelecimento-search') {
      return (
        <div className={`mb-4 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
          <UnidadeNotificadoraField
            value={value != null && value !== '' ? String(value) : ''}
            onChange={(newValue) => {
              const id = newValue ? Number(newValue) : NaN;
              setValue(resolved.key, Number.isFinite(id) ? id : undefined);
            }}
            label={resolved.label + (required ? ' *' : '')}
            placeholder="Pesquise por código (CNES) ou nome (mín. 3 caracteres)"
            allowAllEstablishments
            hasError={!!error}
            errorMessage={error || ''}
          />
        </div>
      );
    }

    const commonProps = {
      field: resolved,
      value,
      onChange: (val: any) => setValue(resolved.key, val),
      error,
      required,
      disabled,
    };

    const selectAux = { getValue, setValue };

    const isNomeOuNomeSocialOuNomeMae =
      resolved.key === 'paciente.nome' || resolved.key === 'paciente.nome_social' || resolved.key === 'paciente.nome_mae';
    const isResidenciaMaiusculo =
      resolved.key === 'residencia.bairro' || resolved.key === 'residencia.logradouro' || resolved.key === 'residencia.complemento';
    const isResidenciaNumero = resolved.key === 'residencia.numero';
    let textProps = commonProps;
    if (isNomeOuNomeSocialOuNomeMae || isResidenciaMaiusculo) {
      textProps = { ...commonProps, onChange: (val: any) => setValue(resolved.key, normalizeMaiusculo(val)) };
    } else if (isResidenciaNumero) {
      textProps = { ...commonProps, onChange: (val: any) => setValue(resolved.key, normalizeNumeroSN(val)) };
    }

    const isDataNascimento = resolved.key === 'paciente.data_nascimento';
    const MAX_IDADE_MESES = 120 * 12;
    const dateProps = isDataNascimento
      ? {
          ...commonProps,
          onChange: (val: any) => {
            setValue(resolved.key, val);
            if (val) {
              const birth = new Date(val);
              const today = new Date();
              let anos = today.getFullYear() - birth.getFullYear();
              let meses = today.getMonth() - birth.getMonth();
              if (meses < 0 || (meses === 0 && today.getDate() < birth.getDate())) {
                anos--;
                meses += 12;
              }
              if (today.getDate() < birth.getDate()) meses--;
              const totalMeses = anos * 12 + meses;
              if (totalMeses < 0) {
                clearError('paciente.data_nascimento');
                setValue('paciente.idade', undefined);
              } else if (totalMeses > MAX_IDADE_MESES) {
                setError('paciente.data_nascimento', 'A idade calculada não pode ser superior a 120 anos.');
                setValue('paciente.idade', undefined);
              } else {
                clearError('paciente.data_nascimento');
                setValue('paciente.idade', totalMeses);
              }
            } else {
              clearError('paciente.data_nascimento');
              setValue('paciente.idade', undefined);
            }
          },
        }
      : commonProps;

    const hasDataNascimento = !!getValue('paciente.data_nascimento');

    switch (resolved.type) {
      case 'text':
        // DSEI, Polo Base, Aldeia: selects em cascata (só visíveis quando Vive aldeado? = Sim)
        if (resolved.key === 'paciente.distrito_sanitario') {
          return (
            <DseiPoloAldeiaFields
              getValue={getValue}
              setValue={setValue}
              getError={getError}
              isFieldRequired={isFieldRequired}
              disabled={disabled}
            />
          );
        }
        if (resolved.key === 'paciente.polo_base' || resolved.key === 'paciente.aldeia') {
          return null;
        }
        return <TextField {...textProps} />;
      case 'date':
        return <DateField {...dateProps} />;
      case 'month':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {resolved.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="month"
              value={value ?? ''}
              onChange={(e) => setValue(resolved.key, e.target.value || undefined)}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
      case 'month-year': {
        const comp = typeof value === 'string' ? value : '';
        const m = comp.match(/^(\d{4})-(\d{2})$/);
        const year = m ? m[1] : '';
        const month = m ? m[2] : '';
        const months = [
          { value: '01', label: 'Janeiro' },
          { value: '02', label: 'Fevereiro' },
          { value: '03', label: 'Março' },
          { value: '04', label: 'Abril' },
          { value: '05', label: 'Maio' },
          { value: '06', label: 'Junho' },
          { value: '07', label: 'Julho' },
          { value: '08', label: 'Agosto' },
          { value: '09', label: 'Setembro' },
          { value: '10', label: 'Outubro' },
          { value: '11', label: 'Novembro' },
          { value: '12', label: 'Dezembro' },
        ];

        const setComp = (y: string, mm: string) => {
          if (y && mm) setValue(resolved.key, `${y}-${mm}`);
          else setValue(resolved.key, undefined);
        };

        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {resolved.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {resolved.helpText && <p className="text-xs text-gray-500 mb-2">{resolved.helpText}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={month}
                onChange={(e) => setComp(year, e.target.value)}
                disabled={disabled}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Selecione o mês</option>
                {months.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                value={year}
                onChange={(e) => setComp(e.target.value ? String(e.target.value) : '', month)}
                disabled={disabled}
                placeholder="Ano"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
      }
      case 'datetime':
        return <DateTimeField {...commonProps} />;
      case 'time':
        return <TimeField {...commonProps} />;
      case 'number':
        return <NumberField {...commonProps} />;
      case 'currency':
        return <CurrencyField {...commonProps} />;
      case 'accounting':
        return <AccountingField {...commonProps} />;
      case 'idade':
        return (
          <IdadeField
            {...commonProps}
            onBlur={() => validateField(resolved)}
            calculadaPorDataNascimento={hasDataNascimento}
            disabled={disabled || hasDataNascimento}
          />
        );
      case 'textarea':
        return <TextareaField {...commonProps} />;
      case 'checkbox':
        return <CheckboxField {...commonProps} />;
      case 'checkbox-group':
        return <CheckboxGroupField {...commonProps} {...selectAux} />;
      case 'select':
        // Vive aldeado?: ao mudar para Não/Ignorado, limpar DSEI, Polo Base e Aldeia
        if (resolved.key === 'paciente.vive_aldeado') {
          const viveAldeadoOnChange = (val: any) => {
            setValue(resolved.key, val);
            if (val !== '1') {
              setValue('paciente.distrito_sanitario', undefined);
              setValue('paciente.polo_base', undefined);
              setValue('paciente.aldeia', undefined);
            }
          };
          if (resolved.codeList) {
            return <CodeListSelectField {...commonProps} {...selectAux} onChange={viveAldeadoOnChange} />;
          }
          return <SelectField {...commonProps} {...selectAux} onChange={viveAldeadoOnChange} />;
        }
        if (resolved.codeList) {
          return <CodeListSelectField {...commonProps} {...selectAux} />;
        }
        if (
          (resolved as { apiSelectEndpoint?: string }).apiSelectEndpoint ||
          (resolved as { dataSource?: string }).dataSource === 'api'
        ) {
          if (resolved.key === 'paciente.ocupacao_cbo') {
            return <CboSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.atividade_cnae') {
            return <CnaeSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.pais_nascimento_id' || resolved.key === 'residencia.pais') {
            return <ApiSelectSearchField {...commonProps} getValue={getValue} />;
          }
          if (resolved.key === 'paciente.qual_povo_tradicional') {
            return (
              <ApiSelectSearchField
                {...commonProps}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (val !== '39') setValue('paciente.outro_povo_tradicional', undefined);
                }}
              />
            );
          }
          if (resolved.key === 'paciente.etnia') {
            return <ApiSelectSearchField {...commonProps} getValue={getValue} />;
          }
          if (resolved.key === 'paciente.raca_cor') {
            return (
              <ApiSelectField
                {...commonProps}
                {...selectAux}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (String(val ?? '') !== '5') {
                    setValue('paciente.etnia', undefined);
                    setValue('paciente.vive_aldeado', undefined);
                    setValue('paciente.distrito_sanitario', undefined);
                    setValue('paciente.polo_base', undefined);
                    setValue('paciente.aldeia', undefined);
                  }
                }}
              />
            );
          }
          if (resolved.key === 'paciente.orientacao_sexual') {
            return (
              <ApiSelectField
                {...commonProps}
                {...selectAux}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (val !== '4') setValue('paciente.outra_orientacao_sexual', undefined);
                }}
              />
            );
          }
        if (resolved.key === 'acao.programa_alcancado') {
          const semArea = !getValue('acao.area');
          return <ApiSelectField {...commonProps} {...selectAux} disabled={disabled || semArea} />;
        }
        if (resolved.key === 'acao.atividade') {
          return (
            <ApiSelectField
              {...commonProps}
              {...selectAux}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                clearDetalhamento();
              }}
            />
          );
        }
        return <ApiSelectField {...commonProps} {...selectAux} />;
        }
        // Ao mudar Área da vigilância, limpar Atividade (seletor dependente)
        if (resolved.key === 'acao.area') {
          return (
            <SelectField
              {...commonProps}
              {...selectAux}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                setValue('acao.atividade', undefined);
                setValue('acao.programa_alcancado', undefined);
                clearDetalhamento();
                monitorOperImpactFieldKeys.forEach((k) => setValue(k, false));
              }}
            />
          );
        }
        // É estrangeiro?: ao mudar, limpar documento que não se aplica e ajustar país de nascimento
        if (resolved.key === 'paciente.e_estrangeiro') {
          return (
            <SelectField
              {...commonProps}
              {...selectAux}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                if (val === '1') {
                  setValue('paciente.cpf', undefined);
                  setValue('paciente.pais_nascimento_id', undefined); // estrangeiro: não é Brasil automaticamente
                }
                if (val === '2') {
                  setValue('paciente.passaporte', undefined);
                  setValue('paciente.pais_nascimento_id', undefined); // não estrangeiro: país fica oculto, não pré-selecionar Brasil
                }
              }}
            />
          );
        }
        // É membro de povo ou comunidade tradicional?: ao mudar para Não/Ignorado, limpar Qual povo e Outro povo
        if (resolved.key === 'paciente.povo_tradicional') {
          return (
            <SelectField
              {...commonProps}
              {...selectAux}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                if (val !== '1') {
                  setValue('paciente.qual_povo_tradicional', undefined);
                  setValue('paciente.outro_povo_tradicional', undefined);
                }
              }}
            />
          );
        }
        if (resolved.key === 'detalhamento.complementar_descricao') {
          return (
            <SelectField
              {...commonProps}
              {...selectAux}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                setValue('detalhamento.complementar_detalhe', undefined);
              }}
            />
          );
        }
        return <SelectField {...commonProps} {...selectAux} />;
      case 'select-search':
        if (field.codeList) {
          return <CodeListSearchField {...commonProps} />;
        }
        if (
          (resolved as { apiSelectEndpoint?: string }).apiSelectEndpoint ||
          (resolved as { dataSource?: string }).dataSource === 'api'
        ) {
          if (
            resolved.key === 'cabecalho.crs_id' &&
            monitorOperRegionalCrsScope?.ui === 'readonly' &&
            monitorOperRegionalCrsScope.readonlyCrs
          ) {
            const rc = monitorOperRegionalCrsScope.readonlyCrs;
            return (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {resolved.label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {resolved.helpText && <p className="text-xs text-gray-500 mb-2">{resolved.helpText}</p>}
                <div
                  className={`w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-800 ${
                    error ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  {rc.nome}
                </div>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
            );
          }
          /** Nível central: identificação fixa + regional de destino (CRS). */
          if (resolved.key === 'cabecalho.crs_id' && monitorOperRegionalCrsScope?.canSelectAnyCrs) {
            const executorNivel = getValue('cabecalho.executor_nivel');
            if (readOnly && executorNivel !== 'CENTRAL') {
              return <ApiSelectSearchField {...commonProps} getValue={getValue} />;
            }
            return (
              <div className="mb-4 md:grid md:grid-cols-2 md:gap-4 md:items-start">
                <div className="mb-4 md:mb-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identificação do executor
                  </label>
                  <div className="w-full px-3 py-2.5 border rounded-md bg-teal-50/90 border-teal-200 text-gray-900 font-medium">
                    Nível Central
                  </div>
                </div>
                <div className="min-w-0 [&>div]:mb-0">
                  <ApiSelectSearchField {...commonProps} getValue={getValue} />
                </div>
              </div>
            );
          }
          return <ApiSelectSearchField {...commonProps} getValue={getValue} />;
        }
        return <SelectSearchField {...commonProps} />;
      case 'multi-select':
        return <MultiSelectField {...commonProps} getValue={getValue} />;
      case 'radio':
        return <RadioGroupField {...commonProps} getValue={getValue} setValue={setValue} />;
      case 'email':
        return <EmailField {...commonProps} />;
      case 'phone':
        return <PhoneField {...commonProps} />;
      case 'international-phone':
        return <InternationalPhoneField {...commonProps} />;
      case 'cpf':
        return (
          <CPFField
            {...commonProps}
            onBlur={async () => {
              const ok = validateField(resolved);
              const digits = String(getValue(resolved.key) ?? '').replace(/\D/g, '');
              if (ok && digits.length === 11 && validateCPF(digits)) {
                await lookupByCpfOrCns({ cpf: digits });
              }
            }}
          />
        );
      case 'cns':
        return (
          <CNSField
            {...commonProps}
            onBlur={async () => {
              const ok = validateField(resolved);
              const digits = String(getValue(resolved.key) ?? '').replace(/\D/g, '');
              if (ok && digits.length === 15 && validateCNS(digits)) {
                await lookupByCpfOrCns({ cns: digits });
              }
            }}
          />
        );
      case 'passaporte':
        return <PassaporteField {...commonProps} onBlur={() => validateField(resolved)} />;
      case 'cep':
        return <CEPField {...commonProps} />;
      case 'file':
        return <FileUploadField {...commonProps} onUploadingChange={handleUploadingChange} />;
      case 'signature':
        return <SignatureField {...commonProps} />;
      case 'geolocation':
        return <GeoLocationField {...commonProps} />;
      case 'autocomplete':
        return <AutocompleteField {...commonProps} />;
      case 'color':
        return <ColorPickerField {...commonProps} />;
      case 'slider':
        return <SliderField {...commonProps} />;
      case 'rating':
        return <StarRatingField {...commonProps} />;
      case 'linear_scale':
        return <LinearScaleField {...commonProps} />;
      case 'google-address':
        return <GoogleMapsAddressField {...commonProps} />;
      case 'address':
        return <AddressField {...commonProps} />;
      case 'table':
        return <TableField {...commonProps} getValue={getValue} />;
      default:
        return (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Tipo de campo não suportado: <strong>{resolved.type}</strong>
            </p>
          </div>
        );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`max-w-5xl mx-auto p-6 bg-white rounded-lg shadow ${className ?? ''}`.trim()}
    >
      {showTitle ? (
        <h1 className="text-2xl font-bold mb-6 text-gray-800">{schema.title || schema.agravo}</h1>
      ) : null}

      {pageMode && showProgress ? (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>
              Página {Math.min(pageIndex + 1, totalPages)} de {totalPages}
            </span>
            <span>{Math.round((Math.min(pageIndex + 1, totalPages) / totalPages) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded bg-gray-200">
            <div
              className="h-2 rounded bg-blue-600 transition-all"
              style={{ width: `${(Math.min(pageIndex + 1, totalPages) / totalPages) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {(pageMode ? (currentSection ? [currentSection] : []) : sectionsToRender).map((section) => {
          const sortedFields = [...section.fields].sort((a, b) => a.order - b.order);
          const firstNotificationField = sortedFields.find(
            (f) =>
              NOTIFICATION_LOCATION_KEYS.has(f.key) ||
              NOTIFICATION_ESTABELECIMENTO_KEYS.has(f.key)
          );
          const dtNotificacaoField = sortedFields.find((f) => f.key === 'notificacao.dt_notificacao');
          const cpfField = sortedFields.find((f) => f.key === 'paciente.cpf');
          const cnsField = sortedFields.find((f) => f.key === 'paciente.cns');
          const estrangeiroField = sortedFields.find((f) => f.key === 'paciente.e_estrangeiro');
          const nomeField = sortedFields.find((f) => f.key === 'paciente.nome');
          const nomeSocialField = sortedFields.find((f) => f.key === 'paciente.nome_social');
          const nomeMaeField = sortedFields.find((f) => f.key === 'paciente.nome_mae');
          const dataNascimentoField = sortedFields.find((f) => f.key === 'paciente.data_nascimento');
          const idadeField = sortedFields.find((f) => f.key === 'paciente.idade');
          const sexoField = sortedFields.find((f) => f.key === 'paciente.sexo');
          const passaporteField = sortedFields.find((f) => f.key === 'paciente.passaporte');
          const paisField = sortedFields.find((f) => f.key === 'paciente.pais_nascimento_id');
          return (
            <div key={section.id} className="mb-6">
              {/* Card da seção (header azul só no topo, com curva) */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-blue-600 px-4 py-3 flex items-center gap-3 rounded-t-xl">
                  {(section as any).icon && sectionIconMap[(section as any).icon] ? (
                    React.createElement(sectionIconMap[(section as any).icon], {
                      className: 'h-5 w-5 text-white/95 flex-shrink-0',
                    })
                  ) : (
                    <div className="h-5 w-5 flex-shrink-0" />
                  )}
                  <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
                    {section.title}
                  </h2>
                </div>
                <div className="p-4 rounded-b-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.description ? (
                    <div className="md:col-span-2 text-sm text-gray-600 mb-1">{section.description}</div>
                  ) : null}
                  {section.id === 'detalhamento' &&
                  String(schema.agravo || '').includes('Monitoramento operacional') &&
                  !getValue('acao.atividade') ? (
                    <div className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Selecione a <strong>Atividade</strong> na seção &quot;Ação realizada&quot; para exibir os campos de
                      detalhamento correspondentes.
                    </div>
                  ) : null}
                {sortedFields.map((field) => {
                  // Bloco único: Estabelecimento de saúde de notificação (UF, Município, Estabelecimento). Data da notificação fica em Dados do paciente.
                  if (firstNotificationField && field.key === firstNotificationField.key) {
                    return (
                      <div key="notificacao-estabelecimento-block" className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Estabelecimento de saúde de notificação</h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.35fr)] md:items-start md:gap-3">
                          <EstadoMunicipioNotificacao
                            getValue={getValue}
                            setValue={setValue}
                            disabled={readOnly}
                            lockUf={lockNotifUf}
                            lockMunicipio={lockNotifMun}
                            sinanThreeColumn
                            error={getError('notificacao.municipio_id') || getError('notificacao.uf_notificacao')}
                            required={isFieldRequired('notificacao.uf_notificacao') || isFieldRequired('notificacao.municipio_id')}
                          />
                          <EstabelecimentoNotificacao
                            getValue={getValue}
                            setValue={setValue}
                            disabled={readOnly}
                            lockEstablishment={lockNotifEst}
                            error={getError('notificacao.unidade_id') || getError('notificacao.estabelecimento_cnes')}
                            required={isFieldRequired('notificacao.unidade_id') || isFieldRequired('notificacao.estabelecimento_cnes')}
                          />
                        </div>
                      </div>
                    );
                  }
                  if (NOTIFICATION_LOCATION_KEYS.has(field.key) || NOTIFICATION_ESTABELECIMENTO_KEYS.has(field.key)) {
                    return null;
                  }
                  const firstResidenciaField = sortedFields.find((f) => RESIDENCIA_BLOCK_KEYS.has(f.key));
                  if (firstResidenciaField && field.key === firstResidenciaField.key) {
                    const cepField = sortedFields.find((f) => f.key === 'residencia.cep');
                    const bairroField = sortedFields.find((f) => f.key === 'residencia.bairro');
                    const logradouroField = sortedFields.find((f) => f.key === 'residencia.logradouro');
                    const zonaField = sortedFields.find((f) => f.key === 'residencia.zona');
                    const numeroField = sortedFields.find((f) => f.key === 'residencia.numero');
                    const complementoField = sortedFields.find((f) => f.key === 'residencia.complemento');
                    const telefoneField = sortedFields.find((f) => f.key === 'residencia.telefone');
                    const handleCepFound = (detail: CepFoundDetail) => {
                      setValue('residencia.uf', detail.uf ?? '');
                      setValue('residencia.municipio_ibge', detail.ibge ?? '');
                      setValue('residencia.logradouro', normalizeMaiusculo(detail.logradouro ?? ''));
                      setValue('residencia.bairro', normalizeMaiusculo(detail.bairro ?? ''));
                    };
                    return (
                      <div key="residencia-block" className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Endereço de residência</h3>
                        <div className="space-y-4">
                          {cepField && (
                            <CEPField
                              field={getResolvedField(cepField)}
                              value={getValue(cepField.key)}
                              onChange={(v) => setValue(cepField.key, v)}
                              error={getError(cepField.key)}
                              required={isFieldRequired(cepField.key)}
                              disabled={readOnly}
                              onCepFound={handleCepFound}
                            />
                          )}
                          <EstadoMunicipioResidencia
                            getValue={getValue}
                            setValue={setValue}
                            disabled={readOnly}
                            error={getError('residencia.uf') || getError('residencia.municipio_ibge')}
                            required={isFieldRequired('residencia.uf') || isFieldRequired('residencia.municipio_ibge')}
                          />
                          {bairroField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(bairroField))}
                            </div>
                          )}
                          {logradouroField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(logradouroField))}
                            </div>
                          )}
                          {zonaField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(zonaField))}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {numeroField && (
                              <div className="min-w-0">
                                {renderField(getResolvedField(numeroField))}
                              </div>
                            )}
                            {complementoField && (
                              <div className="min-w-0">
                                {renderField(getResolvedField(complementoField))}
                              </div>
                            )}
                          </div>
                          {telefoneField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(telefoneField))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (RESIDENCIA_BLOCK_KEYS.has(field.key)) return null;
                  // Bloco Paciente - Identificação: quando Sim, Passaporte e País (ao lado) surgem embaixo de CNS/É estrangeiro e empurram Nome/Nome social pra baixo. País oculto quando Não; sem pré-seleção Brasil.
                  if (dtNotificacaoField && field.key === 'notificacao.dt_notificacao') {
                    const estrangeiroSim = getValue('paciente.e_estrangeiro') === '1';
                    return (
                      <div key="identificacao-block" className="md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 items-start">
                          {dtNotificacaoField && <div className="min-w-0">{renderField(dtNotificacaoField)}</div>}
                          {cpfField && <div className="min-w-0">{renderField(cpfField)}</div>}
                          {cnsField && <div className="min-w-0">{renderField(cnsField)}</div>}
                          {estrangeiroField && <div className="min-w-0">{renderField(estrangeiroField)}</div>}
                          {estrangeiroSim && passaporteField && <div className="min-w-0">{renderField(passaporteField)}</div>}
                          {estrangeiroSim && paisField && <div className="min-w-0">{renderField(paisField)}</div>}
                          {nomeField && <div className="min-w-0">{renderField(nomeField)}</div>}
                          {nomeSocialField && <div className="min-w-0">{renderField(nomeSocialField)}</div>}
                          {nomeMaeField && <div className="min-w-0">{renderField(nomeMaeField)}</div>}
                          {dataNascimentoField && <div className="min-w-0">{renderField(dataNascimentoField)}</div>}
                          {idadeField && <div className="min-w-0">{renderField(idadeField)}</div>}
                          {sexoField && <div className="min-w-0">{renderField(sexoField)}</div>}
                        </div>
                      </div>
                    );
                  }
                  if (IDENTIFICACAO_BLOCK_KEYS.has(field.key)) return null;
                  if (field.key === 'paciente.pais_nascimento') return null;
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.complementar_descricao') {
                    const parentVal = getValue('detalhamento.complementar_descricao');
                    const subVisivel =
                      parentVal === 'acoes_prevencao_saude' || parentVal === 'acoes_diagnostico';
                    const detalheFieldDef = sortedFields.find((f) => f.key === 'detalhamento.complementar_detalhe');
                    return (
                      <div key="detalhamento-complementar-bloco" className="md:col-span-2">
                        <div className={subVisivel ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1'}>
                          <div className="min-w-0">{renderField(field)}</div>
                          {subVisivel && detalheFieldDef ? (
                            <div className="min-w-0">{renderField(detalheFieldDef)}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.complementar_detalhe') {
                    return null;
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.aquisicao_descricao') {
                    const quantFieldDef = sortedFields.find((f) => f.key === 'detalhamento.aquisicao_quantificacao');
                    return (
                      <div key="detalhamento-aquisicao-bloco" className="md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="min-w-0">{renderField(field)}</div>
                          {quantFieldDef ? <div className="min-w-0">{renderField(quantFieldDef)}</div> : null}
                        </div>
                      </div>
                    );
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.aquisicao_quantificacao') {
                    return null;
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.distribuicao_descricao') {
                    const quantDistFieldDef = sortedFields.find(
                      (f) => f.key === 'detalhamento.distribuicao_quantificacao',
                    );
                    return (
                      <div key="detalhamento-distribuicao-bloco" className="md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="min-w-0">{renderField(field)}</div>
                          {quantDistFieldDef ? (
                            <div className="min-w-0">{renderField(quantDistFieldDef)}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.distribuicao_quantificacao') {
                    return null;
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.fiscalizacao_descricao') {
                    const estFieldDef = sortedFields.find((f) => f.key === 'detalhamento.fiscalizacao_estabelecimento_id');
                    return (
                      <div key="detalhamento-fiscalizacao-bloco" className="md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="min-w-0">{renderField(field)}</div>
                          {estFieldDef ? <div className="min-w-0">{renderField(estFieldDef)}</div> : null}
                        </div>
                      </div>
                    );
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.fiscalizacao_estabelecimento_id') {
                    return null;
                  }
                  if (section.id === 'detalhamento' && field.key === 'detalhamento.regulacao_descricao') {
                    return (
                      <div key="detalhamento-regulacao-bloco" className="md:col-span-2">
                        {renderField(field)}
                      </div>
                    );
                  }
                  const content = renderField(field);
                  if (content == null) return null;
                  return (
                    <div
                      key={field.key}
                      className={
                        field.key === 'detalhamento.avaliacao_como' ||
                        field.key === 'detalhamento.complementar_pop_coberta' ||
                        /^(imp_epi|imp_san|imp_amb)\./.test(field.key)
                          ? 'md:col-span-2'
                          : isFullWidth(field.type) && !isHalfWidthDescription(field)
                            ? 'md:col-span-2'
                            : ''
                      }
                    >
                      {content}
                    </div>
                  );
                })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      {!readOnly && showActions && (
        <div className="flex gap-4 justify-end mt-6 pt-6 border-t">
          {isUploading && (
            <p className="mr-auto text-sm text-amber-700 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Processando arquivo… Aguarde antes de enviar ou sair da página.
            </p>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
          )}
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isUploading}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveDraftLabel}
            </button>
          )}
          {pageMode ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={isUploading || pageIndex <= 0}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {pageIndex >= totalPages - 1 ? (
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Aguarde...' : submitLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isUploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              )}
            </>
          ) : (
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Aguarde...' : submitLabel}
            </button>
          )}
        </div>
      )}
    </form>
  );
};
