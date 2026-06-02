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
import { AgravoMultiSelectField } from './AgravoMultiSelectField';
import SyndromicSintomaHelpButton from './SyndromicSintomaHelpButton';
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
import { EstadoMunicipioPrenatal } from './EstadoMunicipioPrenatal';
import { EstabelecimentoPrenatal } from './EstabelecimentoPrenatal';
import { EstadoMunicipioNascimento } from './EstadoMunicipioNascimento';
import { EstabelecimentoNascimento } from './EstabelecimentoNascimento';
import { CriancaVacinaDoseRow } from './CriancaVacinaDoseRow';
import {
  CriancaLabSorologiaEsquemaPanel,
  CRIANCA_LAB_ESQUEMA1_FIRST_KEY,
  CRIANCA_LAB_LAYOUT_KEYS,
  CRIANCA_LAB_DEPRECATED_KEYS,
} from './CriancaLabSorologiaEsquemaPanel';
import {
  CriancaAcompanhamentoHcvPanel,
  CRIANCA_ACOMP_FIRST_KEY,
  CRIANCA_ACOMP_LAYOUT_KEYS,
} from './CriancaAcompanhamentoHcvPanel';
import {
  CriancaConclusaoPanel,
  CRIANCA_CONCLUSAO_FIRST_KEY,
  CRIANCA_CONCLUSAO_LAYOUT_KEYS,
} from './CriancaConclusaoPanel';
import {
  InvestigadorDadosPanel,
  CRIANCA_INVESTIGADOR_FIRST_KEY,
  CRIANCA_INVESTIGADOR_LAYOUT_KEYS,
} from './InvestigadorDadosPanel';
import { TableField } from './TableField';
import MiniMapa, { type MiniMapaResolvedAddress } from '@/features/maps/leaflet/components/MiniMapa';
import { ClipboardList, Calendar, DollarSign, Target, Activity, Shield, Leaf, BarChart3, Wrench, Users } from 'lucide-react';
import { convertLocalDateTimeToUTC } from '@/utils/timezoneUtils';
import FormService from '@/services/FormService';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import type { MonitorOperRegionalScopePayload } from '../types/monitorOperRegionalScope';
import type { NotificacaoEscopo } from '../utils/notificacaoScopeDefaults';
import { validateCPF } from '@/utils/cpfValidator';
import { validateCNS } from '@/utils/cnsValidator';
import {
  fetchSyndromicAgravos,
  fetchSyndromicAgravosRanking,
  fetchSyndromicSintomas,
  type SyndromicAgravoRanking,
} from '@/features/dynamic-forms/services/syndromicMatrixService';

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

/** UF + município de residência (LocationInput); renderizados em bloco único fora da ficha HBV. */
const RESIDENCIA_UF_MUNICIPIO_KEYS = new Set([
  'residencia.uf',
  'residencia.municipio_ibge',
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
  'residencia.ponto_referencia',
  'residencia.pais',
  'residencia.geolocalizacao',
  'residencia.geo_campo_1',
  'residencia.geo_campo_2',
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

const IMUNIZACAO_MAE_LAYOUT_KEYS = new Set([
  'mae.imunizacao_hepatite_b_completa',
  'mae.imunizacao_hepatite_b_incompleta',
  'mae.imunizacao_hepatite_a_completa',
  'mae.imunizacao_hepatite_a_incompleta',
  'mae.confirmacao_carteira',
]);

const LAB_MAE_CAMPO37_KEYS = new Set([
  'mae.lab.sorologia_reagente_hepatite_b',
  'mae.lab.sorologia_reagente_hepatite_c',
]);

const MAE_LAB_HBV_WHEN_KEYS = [
  'mae.lab.hepatite_b_quando_antes_prenatal',
  'mae.lab.hepatite_b_quando_durante_prenatal',
  'mae.lab.hepatite_b_quando_maternidade',
] as const;

const MAE_LAB_HCV_WHEN_KEYS = [
  'mae.lab.hepatite_c_quando_antes_prenatal',
  'mae.lab.hepatite_c_quando_durante_prenatal',
  'mae.lab.hepatite_c_quando_maternidade',
] as const;

const LAB_MAE_CAMPO38_KEYS = new Set([...MAE_LAB_HBV_WHEN_KEYS, ...MAE_LAB_HCV_WHEN_KEYS]);

const LAB_MAE_QUANDO_ROWS: Array<{
  label: string;
  hbvKey: string;
  hcvKey: string;
}> = [
  {
    label: 'Antes do Pré-natal',
    hbvKey: 'mae.lab.hepatite_b_quando_antes_prenatal',
    hcvKey: 'mae.lab.hepatite_c_quando_antes_prenatal',
  },
  {
    label: 'Durante o Pré-natal',
    hbvKey: 'mae.lab.hepatite_b_quando_durante_prenatal',
    hcvKey: 'mae.lab.hepatite_c_quando_durante_prenatal',
  },
  {
    label: 'Maternidade',
    hbvKey: 'mae.lab.hepatite_b_quando_maternidade',
    hcvKey: 'mae.lab.hepatite_c_quando_maternidade',
  },
];

const LAB_MAE_CAMPO39_KEYS = new Set([
  'mae.lab.hbv_hbsag',
  'mae.lab.hbv_anti_hbc_total',
  'mae.lab.hbv_anti_hbc_igm',
  'mae.lab.hbv_hbeag',
  'mae.lab.hbv_anti_hbe',
  'mae.lab.hbv_anti_hbs',
  'mae.lab.hbv_dna',
]);

const LAB_MAE_CAMPO40_KEYS = new Set(['mae.lab.hcv_anti_hcv', 'mae.lab.hcv_rna']);

const LAB_MAE_LAYOUT_KEYS = new Set([
  ...LAB_MAE_CAMPO37_KEYS,
  ...LAB_MAE_CAMPO38_KEYS,
  ...LAB_MAE_CAMPO39_KEYS,
  ...LAB_MAE_CAMPO40_KEYS,
]);

const CRIANCA_ANTECEDENTES_LAYOUT_KEYS = new Set([
  'crianca.numero_dnv',
  'crianca.nascimento_uf',
  'crianca.nascimento_estado_id',
  'crianca.nascimento_municipio_ibge',
  'crianca.nascimento_municipio_id',
  'crianca.hospital_nascimento_unidade_id',
  'crianca.hospital_nascimento_cnes',
  'crianca.hospital_nascimento_nome',
  'crianca.vacina_hepatite_b_maternidade_antes_24h',
  'crianca.vacina_hepatite_b_maternidade_apos_24h',
  'crianca.vacina_hepatite_b_dose_1',
  'crianca.vacina_hepatite_b_dose_1_data',
  'crianca.vacina_hepatite_b_dose_2',
  'crianca.vacina_hepatite_b_dose_2_data',
  'crianca.vacina_hepatite_b_dose_3',
  'crianca.vacina_hepatite_b_dose_3_data',
  'crianca.vacina_hepatite_b_dose_4',
  'crianca.vacina_hepatite_b_dose_4_data',
  'crianca.imunoglobulina_hbig',
  'crianca.imunoglobulina_hbig_data',
  'crianca.vacina_hepatite_a',
]);

const CRIANCA_DOSE_ROWS: { simKey: string; dataKey: string; label: string }[] = [
  { simKey: 'crianca.vacina_hepatite_b_dose_1', dataKey: 'crianca.vacina_hepatite_b_dose_1_data', label: '1ª dose' },
  { simKey: 'crianca.vacina_hepatite_b_dose_2', dataKey: 'crianca.vacina_hepatite_b_dose_2_data', label: '2ª dose' },
  { simKey: 'crianca.vacina_hepatite_b_dose_3', dataKey: 'crianca.vacina_hepatite_b_dose_3_data', label: '3ª dose' },
  { simKey: 'crianca.vacina_hepatite_b_dose_4', dataKey: 'crianca.vacina_hepatite_b_dose_4_data', label: '4ª dose' },
];

const PRENATAL_LAYOUT_KEYS = new Set([
  'prenatal.fez_prenatal',
  'prenatal.uf',
  'prenatal.estado_id',
  'prenatal.municipio_ibge',
  'prenatal.municipio_id',
  'prenatal.unidade_id',
  'prenatal.estabelecimento_cnes',
  'prenatal.estabelecimento_nome',
  'prenatal.endereco',
  'prenatal.telefone',
  'prenatal.tratamento_hepatite_b',
  'prenatal.prevencao_transmissao_vertical_b',
  'prenatal.medicamento_utilizado',
  'prenatal.familia_portadora_hepatite_b',
  'prenatal.familia_portadora_hepatite_c',
]);

type LabMaePanelVariant = 'neutral' | 'quando' | 'hbv' | 'hcv';

/** Paleta DAE: primary #3b5bdb, barras #5eafc6 / #06b6d4, rótulos #1e6f8c (ComunicacaoDaeDashboard). */
const LAB_MAE_HBV_SURFACE =
  'rounded-md border border-[#3b5bdb]/20 bg-[#3b5bdb]/[0.06] px-2 py-1';
const LAB_MAE_HCV_SURFACE =
  'rounded-md border border-[#06b6d4]/25 bg-[#06b6d4]/[0.08] px-2 py-1';

const LAB_MAE_PANEL_STYLES: Record<
  LabMaePanelVariant,
  { container: string; badge: string; title: string; subtitle: string }
> = {
  neutral: {
    container: 'border border-gray-200 bg-white',
    badge: 'bg-gray-200 text-gray-800',
    title: 'text-gray-900',
    subtitle: 'text-gray-600',
  },
  quando: {
    container:
      'border border-gray-200 bg-[#5eafc6]/[0.12] border-l-4 border-l-[#5eafc6] shadow-sm',
    badge: 'bg-[#5eafc6]/35 text-[#1e6f8c] ring-1 ring-[#06b6d4]/20',
    title: 'text-gray-900',
    subtitle: 'text-gray-600',
  },
  hbv: {
    container:
      'border border-[#3b5bdb]/25 bg-[#3b5bdb]/[0.06] border-l-4 border-l-[#3b5bdb] shadow-sm',
    badge: 'bg-[#3b5bdb]/15 text-[#364fc7] ring-1 ring-[#3b5bdb]/20',
    title: 'text-[#364fc7]',
    subtitle: 'text-gray-600',
  },
  hcv: {
    container:
      'border border-[#06b6d4]/30 bg-[#06b6d4]/[0.08] border-l-4 border-l-[#06b6d4] shadow-sm',
    badge: 'bg-[#5eafc6]/40 text-[#1e6f8c] ring-1 ring-[#06b6d4]/25',
    title: 'text-[#1e6f8c]',
    subtitle: 'text-gray-600',
  },
};

function LabMaePanel({
  step,
  title,
  subtitle,
  tag,
  variant,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  tag?: string;
  variant: LabMaePanelVariant;
  children: React.ReactNode;
}) {
  const styles = LAB_MAE_PANEL_STYLES[variant];
  return (
    <div className={`rounded-lg p-4 sm:p-5 ${styles.container}`}>
      <div className="flex flex-wrap items-start gap-2 sm:gap-3 mb-4">
        <span
          className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-xs font-bold ${styles.badge}`}
          aria-hidden
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-semibold ${styles.title}`}>{title}</h3>
            {tag ? (
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
              >
                {tag}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className={`mt-1 text-xs sm:text-sm ${styles.subtitle}`}>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

import {
  isSinanClinicalFieldKey,
  shouldShowSinanDadosClinicosBlock,
  stripSinanClinicalFieldsFromSections,
} from '../utils/sinanClinicalFields';

const CLINICA_RADIO_OPTIONS = [
  { value: '1', label: 'Sim' },
  { value: '2', label: 'Não' },
  { value: '9', label: 'Ignorado' },
];

const SINTOMA_OUTRO_ID = '__outro_especifique__';
const UF_SIGLA_TO_IBGE: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29', CE: '23', DF: '53', ES: '32', GO: '52',
  MA: '21', MT: '51', MS: '50', MG: '31', PA: '15', PB: '25', PR: '41', PE: '26', PI: '22',
  RJ: '33', RN: '24', RS: '43', RO: '11', RR: '14', SC: '42', SP: '35', SE: '28', TO: '17',
};
const IBGE_TO_UF_SIGLA: Record<string, string> = Object.fromEntries(
  Object.entries(UF_SIGLA_TO_IBGE).map(([k, v]) => [v, k]),
);
const UF_MAP_CENTER: Record<string, { lat: number; lng: number }> = {
  AC: { lat: -9.0238, lng: -70.8120 },
  AL: { lat: -9.5713, lng: -36.7820 },
  AP: { lat: 1.4140, lng: -51.7700 },
  AM: { lat: -3.4168, lng: -65.8561 },
  BA: { lat: -12.5797, lng: -41.7007 },
  CE: { lat: -5.4984, lng: -39.3206 },
  DF: { lat: -15.7998, lng: -47.8645 },
  ES: { lat: -19.1834, lng: -40.3089 },
  GO: { lat: -15.8270, lng: -49.8362 },
  MA: { lat: -4.9609, lng: -45.2744 },
  MT: { lat: -12.6819, lng: -56.9211 },
  MS: { lat: -20.7722, lng: -54.7852 },
  MG: { lat: -18.5122, lng: -44.5550 },
  PA: { lat: -3.4168, lng: -52.0000 },
  PB: { lat: -7.2399, lng: -36.7820 },
  PR: { lat: -24.8902, lng: -51.5500 },
  PE: { lat: -8.8137, lng: -36.9541 },
  PI: { lat: -7.7183, lng: -42.7289 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  RN: { lat: -5.4026, lng: -36.9541 },
  RS: { lat: -30.0346, lng: -51.2177 },
  RO: { lat: -10.9472, lng: -62.8278 },
  RR: { lat: 2.7376, lng: -62.0751 },
  SC: { lat: -27.2423, lng: -50.2189 },
  SP: { lat: -23.5505, lng: -46.6333 },
  SE: { lat: -10.5741, lng: -37.3857 },
  TO: { lat: -10.1753, lng: -48.2982 },
};

const normalizeAddressText = (value: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const UF_NAME_TO_SIGLA: Record<string, string> = {
  ACRE: 'AC',
  ALAGOAS: 'AL',
  AMAPA: 'AP',
  AMAZONAS: 'AM',
  BAHIA: 'BA',
  CEARA: 'CE',
  'DISTRITO FEDERAL': 'DF',
  'ESPIRITO SANTO': 'ES',
  GOIAS: 'GO',
  MARANHAO: 'MA',
  'MATO GROSSO': 'MT',
  'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG',
  PARA: 'PA',
  PARAIBA: 'PB',
  PARANA: 'PR',
  PERNAMBUCO: 'PE',
  PIAUI: 'PI',
  'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN',
  'RIO GRANDE DO SUL': 'RS',
  RONDONIA: 'RO',
  RORAIMA: 'RR',
  'SANTA CATARINA': 'SC',
  'SAO PAULO': 'SP',
  SERGIPE: 'SE',
  TOCANTINS: 'TO',
};

const resolveUfSigla = (value: string | undefined): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const normalized = normalizeAddressText(raw);
  if (normalized.length === 2 && UF_SIGLA_TO_IBGE[normalized]) return normalized;

  const digits = normalized.replace(/\D/g, '');
  if (digits) {
    const fromIbge = IBGE_TO_UF_SIGLA[digits.slice(0, 2)];
    if (fromIbge) return fromIbge;
  }

  const fromName = UF_NAME_TO_SIGLA[normalized];
  if (fromName) return fromName;

  const siglaMatch = normalized.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  if (siglaMatch?.[1]) return siglaMatch[1];

  return '';
};

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
  context = 'general',
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
  const isHepatiteCriancaHBV =
    String(schema.agravo || '').toUpperCase() === 'HEPATITE_CRIANCA_HBV';

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
  const hierarquiaCacheRef = useRef<any | null>(null);
  const municipiosPorEstadoCacheRef = useRef<Map<number, any[]>>(new Map());
  const lastResolveMunicipioKeyRef = useRef<string>('');
  const municipioCenterCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const lastMunicipioCenterSignatureRef = useRef<string>('');
  const [pendingResidenciaMapAddress, setPendingResidenciaMapAddress] = useState<MiniMapaResolvedAddress | null>(null);

  const matchMunicipioIbgeCodigo = (cod: string | undefined, ibgeNorm: string): boolean => {
    if (cod == null || !ibgeNorm) return false;
    const c = String(cod).replace(/\D/g, '');
    if (!c) return false;
    if (c === ibgeNorm) return true;
    if (ibgeNorm.length === 7 && c.length === 6 && ibgeNorm.slice(0, 6) === c) return true;
    if (ibgeNorm.length === 6 && c.length === 7 && ibgeNorm === c.slice(0, 6)) return true;
    return false;
  };

  const resolveResidenciaMunicipioFromAddress = useCallback(
    async (
      ufSigla: string | undefined,
      municipioNome?: string | undefined,
      ibgeCodigo?: string | undefined,
    ) => {
      if (!ufSigla) return;
      const ibgeNorm = ibgeCodigo ? String(ibgeCodigo).replace(/\D/g, '') : '';
      const rawMunicipio = String(municipioNome || '').trim();
      if (!rawMunicipio && !ibgeNorm) return;
      try {
        const ufNorm = resolveUfSigla(ufSigla) || normalizeAddressText(ufSigla);
        const normalizeMunicipioCandidate = (raw: string): string => {
          return normalizeAddressText(raw)
            .replace(/^MUNICIPIO DE\s+/, '')
            .replace(/^CIDADE DE\s+/, '')
            .replace(/\s*[-,/]\s*[A-Z]{2}$/, '')
            .trim();
        };
        const municipioCandidates = rawMunicipio
          ? Array.from(
              new Set(
                [
                  rawMunicipio,
                  rawMunicipio.split(',')[0] || '',
                  rawMunicipio.split('-')[0] || '',
                  rawMunicipio.split('/')[0] || '',
                ]
                  .map((v) => normalizeMunicipioCandidate(v))
                  .filter(Boolean),
              ),
            )
          : [];
        if (!ufNorm) return;
        const signature = `${ufNorm}|${ibgeNorm}|${municipioCandidates.join('|')}`;
        if (lastResolveMunicipioKeyRef.current === signature) return;
        lastResolveMunicipioKeyRef.current = signature;

        const h =
          hierarquiaCacheRef.current ??
          (await usuarioGestaoService.getHierarquiaCompleta().then((data) => {
            hierarquiaCacheRef.current = data;
            return data;
          }));
        const estados = Array.isArray((h as any)?.estados) ? (h as any).estados : [];
        const ibgeUf = UF_SIGLA_TO_IBGE[ufNorm];
        const estado = estados.find((e: any) => {
          const sigla = normalizeAddressText(String(e?.sigla || ''));
          return sigla === ufNorm || (ibgeUf && sigla === ibgeUf);
        });
        if (!estado?.id) return;

        const estadoId = Number(estado.id);
        const currentEstadoId = Number(getValue('residencia.estado_id'));
        if (currentEstadoId !== estadoId) {
          setValue('residencia.estado_id', estadoId);
        }
        const ufExibir =
          IBGE_TO_UF_SIGLA[String(estado.sigla ?? '').trim()] ??
          (String(estado.sigla ?? '').length === 2 ? String(estado.sigla) : ufNorm);
        if (ufExibir && String(getValue('residencia.uf') ?? '').trim().toUpperCase() !== ufExibir) {
          setValue('residencia.uf', ufExibir);
        }

        const municipios =
          municipiosPorEstadoCacheRef.current.get(estadoId) ??
          (await usuarioGestaoService.getMunicipiosPorEstado(estadoId).then((data) => {
            const list = Array.isArray(data) ? data : [];
            municipiosPorEstadoCacheRef.current.set(estadoId, list);
            return list;
          }));
        const list = Array.isArray(municipios) ? municipios : [];

        let selected: any;
        if (ibgeNorm) {
          selected = list.find((m: any) =>
            matchMunicipioIbgeCodigo(String(m?.codigo ?? m?.codigo_ibge ?? ''), ibgeNorm),
          );
        }
        if (!selected && municipioCandidates.length) {
          const exact = list.find((m: any) => {
            const desc = normalizeMunicipioCandidate(String(m?.descricao || ''));
            return municipioCandidates.some((cand) => desc === cand);
          });
          selected = exact
            ? exact
            : list.find((m: any) => {
                const desc = normalizeMunicipioCandidate(String(m?.descricao || ''));
                return municipioCandidates.some(
                  (cand) =>
                    desc.includes(cand) ||
                    cand.includes(desc) ||
                    desc.startsWith(cand) ||
                    cand.startsWith(desc),
                );
              });
        }
        if (!selected) return;

        const municipioId = Number(selected.id ?? selected.idtipo_municipio);
        const codigo = String(selected.codigo ?? selected.codigo_ibge ?? '').replace(/\D/g, '');
        if (Number.isFinite(municipioId) && municipioId > 0) {
          const currentId = Number(getValue('residencia.municipio_id'));
          if (currentId !== municipioId) setValue('residencia.municipio_id', municipioId);
        }
        if (codigo) {
          const currentIbge = String(getValue('residencia.municipio_ibge') ?? '').replace(/\D/g, '');
          if (currentIbge !== codigo) setValue('residencia.municipio_ibge', codigo);
        }
      } catch {
        // Falha de matching não deve interromper preenchimento manual.
      }
    },
    [getValue, setValue],
  );

  const applyPendingResidenciaMapAddress = useCallback(
    (address: MiniMapaResolvedAddress | null) => {
      if (!address) return;
      const ufValue = resolveUfSigla(address.estadoUf) || resolveUfSigla(address.formattedAddress);
      if (address.cep) setValue('residencia.cep', String(address.cep).replace(/\D/g, '').slice(0, 8));
      if (ufValue) setValue('residencia.uf', ufValue);
      if (address.logradouro) setValue('residencia.logradouro', normalizeMaiusculo(address.logradouro));
      if (address.bairro) setValue('residencia.bairro', normalizeMaiusculo(address.bairro));
      if (address.numero) setValue('residencia.numero', String(address.numero));

      const municipioFromFormatted = (() => {
        const formatted = String(address.formattedAddress || '').trim();
        if (!formatted || !ufValue) return '';
        const ufRegex = new RegExp(`,\\s*([^,]+?)\\s*[-/]\\s*${ufValue}\\b`, 'i');
        const match = formatted.match(ufRegex);
        return String(match?.[1] || '').trim();
      })();

      const municipioCandidate = String(address.municipio || municipioFromFormatted || '').trim();
      if (municipioCandidate) {
        void resolveResidenciaMunicipioFromAddress(ufValue || String(getValue('residencia.uf') || ''), municipioCandidate);
      }

      if (address.paisCodigo === 'BR') {
        setValue('residencia.pais', '105');
      } else if (address.paisCodigo && address.paisCodigo !== 'BR') {
        setValue('residencia.uf', 'EX');
        // Endereço estrangeiro não deve manter vínculo com estado/município brasileiro.
        setValue('residencia.estado_id', undefined);
        setValue('residencia.municipio_id', undefined);
        setValue('residencia.municipio_ibge', '');
      }
    },
    [getValue, resolveResidenciaMunicipioFromAddress, setValue],
  );

  const resolveResidenciaMapCenterFromMunicipio = useCallback(
    async (ufSigla: string | undefined, municipioIdRaw: any) => {
      const municipioId = Number(municipioIdRaw);
      if (!Number.isFinite(municipioId) || municipioId <= 0) return;
      const ufNorm = normalizeAddressText(String(ufSigla || ''));
      if (!ufNorm) return;
      const signature = `${municipioId}|${ufNorm}`;
      if (lastMunicipioCenterSignatureRef.current === signature) return;
      lastMunicipioCenterSignatureRef.current = signature;

      const cached = municipioCenterCacheRef.current.get(signature);
      if (cached) {
        setValue('residencia.geolocalizacao', {
          latitude: cached.lat,
          longitude: cached.lng,
          source: 'auto-municipio',
          timestamp: new Date().toISOString(),
        });
        setValue('residencia.geo_campo_1', String(cached.lat));
        setValue('residencia.geo_campo_2', String(cached.lng));
        return;
      }

      try {
        const estadoIbge = UF_SIGLA_TO_IBGE[ufNorm];
        let municipioNome = '';
        if (estadoIbge) {
          const h =
            hierarquiaCacheRef.current ??
            (await usuarioGestaoService.getHierarquiaCompleta().then((data) => {
              hierarquiaCacheRef.current = data;
              return data;
            }));
          const estados = Array.isArray((h as any)?.estados) ? (h as any).estados : [];
          const estado = estados.find((e: any) => String(e?.sigla || '') === estadoIbge || String(e?.codigo || '') === estadoIbge);
          if (estado?.id) {
            const estadoId = Number(estado.id);
            const municipios =
              municipiosPorEstadoCacheRef.current.get(estadoId) ??
              (await usuarioGestaoService.getMunicipiosPorEstado(estadoId).then((data) => {
                const list = Array.isArray(data) ? data : [];
                municipiosPorEstadoCacheRef.current.set(estadoId, list);
                return list;
              }));
            const selected = (municipios || []).find((m: any) => Number(m?.id ?? m?.idtipo_municipio) === municipioId);
            municipioNome = String(selected?.descricao || '').trim();
          }
        }
        if (!municipioNome) {
          const mun = await usuarioGestaoService.getMunicipioComEstado(municipioId);
          municipioNome = String((mun as any)?.descricao || '').trim();
        }
        if (!municipioNome) return;

        const mapboxKey =
          localStorage.getItem('sp.ui.map.mapbox-api-key.v1') ||
          localStorage.getItem('mapbox-api-key') ||
          '';
        let lat: number | null = null;
        let lng: number | null = null;

        if (mapboxKey) {
          const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            `${municipioNome}, ${ufNorm}, Brasil`,
          )}.json?access_token=${encodeURIComponent(mapboxKey)}&autocomplete=false&limit=1&language=pt-BR&country=BR`;
          const response = await fetch(endpoint);
          if (response.ok) {
            const payload = await response.json();
            const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
            const center = Array.isArray(feature?.center) ? feature.center : null;
            if (center && center.length >= 2) {
              lng = Number(center[0]);
              lat = Number(center[1]);
            }
          }
        }

        // Fallback sem rede externa/CORS: centro da UF para manter o mapa útil.
        if (!Number.isFinite(lat as number) || !Number.isFinite(lng as number)) {
          const fallback = UF_MAP_CENTER[ufNorm];
          if (!fallback) return;
          lat = fallback.lat;
          lng = fallback.lng;
        }

        municipioCenterCacheRef.current.set(signature, { lat: Number(lat), lng: Number(lng) });
        setValue('residencia.geolocalizacao', {
          latitude: Number(lat),
          longitude: Number(lng),
          source: 'auto-municipio',
          timestamp: new Date().toISOString(),
        });
        setValue('residencia.geo_campo_1', String(lat));
        setValue('residencia.geo_campo_2', String(lng));
      } catch {
        // Falha de centralização automática não deve quebrar o preenchimento manual.
      }
    },
    [setValue],
  );

  const residenciaUfForMapCenter = String(getValue('residencia.uf') ?? '');
  const residenciaMunicipioIdForMapCenter = getValue('residencia.municipio_id');
  useEffect(() => {
    const ufRaw = String(residenciaUfForMapCenter ?? '').trim().toUpperCase();
    const ufNorm = ufRaw.length === 2 ? ufRaw : IBGE_TO_UF_SIGLA[String(ufRaw).replace(/\D/g, '')] ?? '';
    const municipioId = residenciaMunicipioIdForMapCenter;
    if (!ufNorm || !municipioId) return;
    void resolveResidenciaMapCenterFromMunicipio(ufNorm, municipioId);
  }, [residenciaMunicipioIdForMapCenter, residenciaUfForMapCenter, resolveResidenciaMapCenterFromMunicipio]);

  const showSinanDadosClinicosBlock = React.useMemo(
    () => shouldShowSinanDadosClinicosBlock(schema),
    [schema]
  );

    // Colunas fixas servem para persistência/indexação.
    // A UI só deve limitar para "somente fixos" quando explicitamente configurado no schema.
  const sectionsToRender = React.useMemo(() => {
    let sections = schema.sections ?? [];
    // Só remove campos clínicos quando NÃO for ficha SINAN.
    // Em fichas SINAN customizadas (como HBV criança), campos como agravo_cid
    // podem existir na seção 1 e devem continuar visíveis.
    if (context !== 'sinan' && !showSinanDadosClinicosBlock) {
      sections = stripSinanClinicalFieldsFromSections(sections);
    }

    // Mantém comportamento antigo apenas se um schema pedir de forma explícita.
    // Retrocompatibilidade: aceita `showOnlyFixedInForm` e alias `fixedOnly`.
    const cfg = (schema.fixedColumnsConfig || {}) as any;
    const useFixedOnly = cfg.showOnlyFixedInForm === true || cfg.fixedOnly === true;
    if (!useFixedOnly) return sections.sort((a, b) => a.order - b.order);

    return sections
      .map((section) => ({
        ...section,
        fields: (section.fields || []).filter((f) => f.isFixedColumn === true),
      }))
      .filter((section) => section.fields.length > 0)
      .sort((a, b) => a.order - b.order);
  }, [schema, showSinanDadosClinicosBlock]);

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

  const buildClinicaMultiSelectField = useCallback(
    (
      key: string,
      label: string,
      helpText: string,
      options: Array<{
        value: string;
        label: string;
        termoOficial?: string;
        aliases?: string[];
        sinonimos?: string[];
        observacao?: string;
        helpButton?: React.ReactNode;
      }>,
    ) => ({
      key,
      label,
      type: 'multi-select',
      options,
      helpText,
    }),
    [],
  );
  const normalizeClinicaSimNaoIgnorado = useCallback((value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    if (value === true || value === 1 || value === '1') return '1';
    if (value === '2') return '2';
    if (value === '9') return '9';
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'sim') return '1';
      if (normalized === 'nao' || normalized === 'não') return '2';
      if (normalized === 'ignorado') return '9';
    }
    if (value === false || value === 0) return '2';
    return '';
  }, []);
  const [clinicaAgravoOptions, setClinicaAgravoOptions] = useState<
    Array<{ value: string; label: string; cid10Lista: string[] }>
  >([]);
  const [clinicaSintomaBaseOptions, setClinicaSintomaBaseOptions] = useState<
    Array<{
      value: string;
      label: string;
      termoOficial?: string;
      aliases?: string[];
      sinonimos?: string[];
      observacao?: string;
    }>
  >([]);
  const [clinicaLoadingAgravos, setClinicaLoadingAgravos] = useState(false);
  const [clinicaLoadingSintomas, setClinicaLoadingSintomas] = useState(false);
  const [, setClinicaLoadingRanking] = useState(false);
  const [clinicaAgravosRankeados, setClinicaAgravosRankeados] = useState<SyndromicAgravoRanking[]>([]);
  const clinicaAgravosSelecionados = React.useMemo(() => {
    const raw = getValue('clinica.agravos_notificados');
    return Array.isArray(raw) ? raw.map((v) => String(v)) : [];
  }, [formData, getValue]);
  useEffect(() => {
    if (!showSinanDadosClinicosBlock) return;
    let cancelled = false;
    const load = async () => {
      try {
        setClinicaLoadingAgravos(true);
        const data = await fetchSyndromicAgravos();
        if (!cancelled) setClinicaAgravoOptions(data);
      } catch {
        if (!cancelled) setClinicaAgravoOptions([]);
      } finally {
        if (!cancelled) setClinicaLoadingAgravos(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showSinanDadosClinicosBlock]);
  useEffect(() => {
    if (!showSinanDadosClinicosBlock) return;
    let cancelled = false;
    const load = async () => {
      try {
        setClinicaLoadingSintomas(true);
        const data = await fetchSyndromicSintomas(clinicaAgravosSelecionados);
        if (!cancelled) setClinicaSintomaBaseOptions(data);
      } catch {
        if (!cancelled) setClinicaSintomaBaseOptions([]);
      } finally {
        if (!cancelled) setClinicaLoadingSintomas(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showSinanDadosClinicosBlock, clinicaAgravosSelecionados.join(',')]);
  const clinicaSintomaOptions = React.useMemo(() => {
    const withHelp = clinicaSintomaBaseOptions.map((item) => {
      const aliases = item.aliases ?? item.sinonimos ?? [];
      return {
        ...item,
        helpButton:
          aliases.length > 0 ? (
            <SyndromicSintomaHelpButton
              termoOficial={item.termoOficial ?? item.label}
              aliases={aliases}
              observacao={item.observacao}
            />
          ) : undefined,
      };
    });
    const hasOutro = withHelp.some((item) => item.value === SINTOMA_OUTRO_ID);
    return hasOutro
      ? withHelp
      : [...withHelp, { value: SINTOMA_OUTRO_ID, label: 'Outro, especifique' }];
  }, [clinicaSintomaBaseOptions]);
  const clinicaSintomasSelecionados = React.useMemo(() => {
    const raw = getValue('clinica.sinais_sintomas');
    return Array.isArray(raw) ? raw.map((v) => String(v)) : [];
  }, [formData, getValue]);
  const clinicaTemOutroSintoma = clinicaSintomasSelecionados.includes(SINTOMA_OUTRO_ID);
  useEffect(() => {
    if (!showSinanDadosClinicosBlock) return;
    const hasAgravoDoencaField = (schema.sections || []).some((s) =>
      (s.fields || []).some((f) => f.key === 'notificacao.agravo_doenca')
    );
    if (!hasAgravoDoencaField) return;
    const nomes = clinicaAgravoOptions
      .filter((item) => clinicaAgravosSelecionados.includes(item.value))
      .map((item) => item.label?.trim())
      .filter(Boolean) as string[];
    if (nomes.length === 0) return;
    const nextText = nomes.join('; ');
    const current = String(getValue('notificacao.agravo_doenca') ?? '').trim();
    if (current !== nextText) {
      setValue('notificacao.agravo_doenca', nextText);
    }
  }, [
    showSinanDadosClinicosBlock,
    schema,
    clinicaAgravoOptions,
    clinicaAgravosSelecionados,
    getValue,
    setValue,
  ]);
  useEffect(() => {
    if (!showSinanDadosClinicosBlock) return;
    const sintomaIds = clinicaSintomasSelecionados.filter((id) => id !== SINTOMA_OUTRO_ID);
    if (sintomaIds.length === 0) {
      setClinicaAgravosRankeados([]);
      setClinicaLoadingRanking(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setClinicaLoadingRanking(true);
        const data = await fetchSyndromicAgravosRanking(sintomaIds);
        if (!cancelled) setClinicaAgravosRankeados(data);
      } catch {
        if (!cancelled) setClinicaAgravosRankeados([]);
      } finally {
        if (!cancelled) setClinicaLoadingRanking(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showSinanDadosClinicosBlock, clinicaSintomasSelecionados.join(',')]);

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
      'clinica.relacionado_trabalho': {
        type: 'select',
        options: [
          { value: '1', label: 'SIM' },
          { value: '2', label: 'NÃO' },
          { value: '9', label: 'IGNORADO' },
        ],
      },
      'clinica.relacionado_desastre': {
        type: 'select',
        options: [
          { value: '1', label: 'SIM' },
          { value: '2', label: 'NÃO' },
          { value: '9', label: 'IGNORADO' },
        ],
      },
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

  const handleResidenciaCepFound = useCallback(
    (detail: CepFoundDetail) => {
      const uf = detail.uf ?? '';
      const ibge = detail.ibge ? String(detail.ibge).replace(/\D/g, '') : '';
      if (uf) setValue('residencia.uf', uf);
      if (ibge) setValue('residencia.municipio_ibge', ibge);
      if (detail.logradouro) {
        setValue('residencia.logradouro', normalizeMaiusculo(detail.logradouro));
      }
      if (detail.bairro) {
        setValue('residencia.bairro', normalizeMaiusculo(detail.bairro));
      }
      if (uf && (detail.localidade || ibge)) {
        lastResolveMunicipioKeyRef.current = '';
        void resolveResidenciaMunicipioFromAddress(uf, detail.localidade, ibge);
      }
    },
    [resolveResidenciaMunicipioFromAddress, setValue],
  );

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

    if (resolved.key === 'residencia.cep') {
      return (
        <CEPField
          field={{ ...resolved, type: 'cep' }}
          value={value}
          onChange={(val: any) => setValue(resolved.key, val)}
          error={error}
          required={required}
          disabled={disabled}
          onCepFound={handleResidenciaCepFound}
        />
      );
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
    } else if (resolved.key === 'crianca.numero_dnv') {
      textProps = {
        ...commonProps,
        onChange: (val: any) =>
          setValue(resolved.key, String(val ?? '').replace(/\D/g, '').slice(0, 9)),
      };
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
        if (resolved.key === 'crianca.numero_dnv') {
          return <TextField {...textProps} showCharCount={false} wrapperClassName="mb-0" />;
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
            calculadaPorDataNascimento={
              resolved.key === 'paciente.idade' && hasDataNascimento
            }
            disabled={disabled || (resolved.key === 'paciente.idade' && hasDataNascimento)}
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
          if (resolved.key === 'paciente.ocupacao_cbo' || resolved.key === 'mae.ocupacao_cbo') {
            return <CboSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.atividade_cnae') {
            return <CnaeSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.pais_nascimento_id' || resolved.key === 'residencia.pais') {
            return <ApiSelectSearchField {...commonProps} getValue={getValue} context={context} />;
          }
          if (resolved.key === 'paciente.qual_povo_tradicional') {
            return (
              <ApiSelectSearchField
                {...commonProps}
                context={context}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (val !== '39') setValue('paciente.outro_povo_tradicional', undefined);
                }}
              />
            );
          }
          if (resolved.key === 'paciente.etnia') {
            return <ApiSelectSearchField {...commonProps} getValue={getValue} context={context} />;
          }
          if (resolved.key === 'paciente.raca_cor') {
            return (
              <ApiSelectField
                {...commonProps}
                {...selectAux}
                context={context}
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
                context={context}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (val !== '4') setValue('paciente.outra_orientacao_sexual', undefined);
                }}
              />
            );
          }
        if (resolved.key === 'acao.programa_alcancado') {
          const semArea = !getValue('acao.area');
          return <ApiSelectField {...commonProps} {...selectAux} context={context} disabled={disabled || semArea} />;
        }
        if (resolved.key === 'acao.atividade') {
          return (
            <ApiSelectField
              {...commonProps}
              {...selectAux}
              context={context}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                clearDetalhamento();
              }}
            />
          );
        }
        return <ApiSelectField {...commonProps} {...selectAux} context={context} />;
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
              return <ApiSelectSearchField {...commonProps} getValue={getValue} context={context} />;
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
                  <ApiSelectSearchField {...commonProps} getValue={getValue} context={context} />
                </div>
              </div>
            );
          }
          return <ApiSelectSearchField {...commonProps} getValue={getValue} context={context} />;
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
        return (
          <CEPField
            {...commonProps}
            onCepFound={resolved.key === 'residencia.cep' ? handleResidenciaCepFound : undefined}
          />
        );
      case 'file':
        return <FileUploadField {...commonProps} onUploadingChange={handleUploadingChange} />;
      case 'signature':
        return <SignatureField {...commonProps} />;
      case 'geolocation':
        if (resolved.key === 'residencia.geolocalizacao') {
          return (
            <GeoLocationField
              {...commonProps}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                const lat = val?.latitude != null ? String(val.latitude) : '';
                const lng = val?.longitude != null ? String(val.longitude) : '';
                setValue('residencia.geo_campo_1', lat || undefined);
                setValue('residencia.geo_campo_2', lng || undefined);
              }}
            />
          );
        }
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
          const useHepatiteLayout = isHepatiteCriancaHBV && section.id === 'section_dados_gerais';
          // Layout com mapa/colunas só na ficha HBV criança (seção dedicada). Fichas SINAN padrão
          // ("Dados do indivíduo") mantêm grid simples, sem o bloco largo de endereço.
          const useEnhancedResidenciaBlock =
            isHepatiteCriancaHBV && section.id === 'section_dados_residencia';
          const hepatiteSpanClass = (key: string): string => {
            if (!useHepatiteLayout) return '';
            if (key === 'notificacao.tipo_notificacao') return 'lg:col-span-4';
            if (key === 'notificacao.agravo_doenca') return 'lg:col-span-6 lg:col-start-1';
            if (key === 'agravo_cid') return 'lg:col-span-3';
            if (key === 'notificacao.dt_notificacao') return 'lg:col-span-3';
            if (key === 'clinica.data_inicio_sintomas') return 'lg:col-span-4 lg:col-start-1';
            return '';
          };
          const isLegacyClinicaSection =
            showSinanDadosClinicosBlock &&
            !pageMode &&
            section.fields.length > 0 &&
            section.fields.some((f) => isSinanClinicalFieldKey(f.key)) &&
            section.fields.every((f) => isSinanClinicalFieldKey(f.key));
          if (isLegacyClinicaSection) {
            return null;
          }
          if (isHepatiteCriancaHBV && section.id === 'section_dados_complementares_caso') {
            return (
              <div key={section.id} className="mb-4">
                <div className="rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-center">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    Dados Complementares do Caso
                  </h2>
                </div>
              </div>
            );
          }
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
                  <div
                    className={
                      useHepatiteLayout
                        ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12'
                        : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    }
                  >
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
                  if (field.key === 'notificacao.agravo_doenca') {
                    const val = String(getValue(field.key) ?? '');
                    return (
                      <div key={field.key} className={useHepatiteLayout ? hepatiteSpanClass(field.key) : 'md:col-span-2'}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {isFieldRequired(field.key) ? <span className="text-red-500 ml-1">*</span> : null}
                        </label>
                        <textarea
                          value={val}
                          onChange={(event) => setValue(field.key, event.target.value)}
                          rows={1}
                          disabled={readOnly || field.disabled}
                          className={`w-full px-3 py-2 border rounded-md resize-none leading-6 ${
                            readOnly || field.disabled
                              ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                              : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          }`}
                        />
                        {(field as any).hint ? <p className="text-xs text-gray-500 mt-1">{(field as any).hint}</p> : null}
                      </div>
                    );
                  }
                  if (field.key === 'agravo_cid' && field.disabled) {
                    const val = String(getValue(field.key) ?? '');
                    return (
                      <div key={field.key} className={hepatiteSpanClass(field.key)}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {isFieldRequired(field.key) ? <span className="text-red-500 ml-1">*</span> : null}
                        </label>
                        <input
                          type="text"
                          value={val}
                          onChange={(event) => setValue(field.key, event.target.value)}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        />
                        {(field as any).hint ? <p className="text-xs text-gray-500 mt-1">{(field as any).hint}</p> : null}
                      </div>
                    );
                  }
                  if (field.key === 'notificacao.tipo_notificacao' && useHepatiteLayout) {
                    const content = renderField(field);
                    if (content == null) return null;
                    return (
                      <div key={field.key} className={hepatiteSpanClass(field.key)}>
                        {content}
                      </div>
                    );
                  }
                  // Bloco único: Estabelecimento de saúde de notificação (UF, Município, Estabelecimento). Data da notificação fica em Dados do paciente.
                  if (firstNotificationField && field.key === firstNotificationField.key) {
                    return (
                      <div
                        key="notificacao-estabelecimento-block"
                        className={useHepatiteLayout ? 'lg:col-span-12 mt-1' : 'md:col-span-2'}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.3fr)] md:items-start md:gap-3">
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
                  const firstResidenciaUfMunField = sortedFields.find((f) =>
                    RESIDENCIA_UF_MUNICIPIO_KEYS.has(f.key),
                  );
                  if (
                    !useEnhancedResidenciaBlock &&
                    firstResidenciaUfMunField &&
                    field.key === firstResidenciaUfMunField.key
                  ) {
                    return (
                      <div key="residencia-uf-mun-block" className="md:col-span-2">
                        <EstadoMunicipioResidencia
                          getValue={getValue}
                          setValue={setValue}
                          disabled={readOnly}
                          error={getError('residencia.uf') || getError('residencia.municipio_ibge')}
                          required={
                            isFieldRequired('residencia.uf') || isFieldRequired('residencia.municipio_ibge')
                          }
                        />
                      </div>
                    );
                  }
                  if (!useEnhancedResidenciaBlock && RESIDENCIA_UF_MUNICIPIO_KEYS.has(field.key)) {
                    return null;
                  }
                  const firstResidenciaField = sortedFields.find((f) => RESIDENCIA_BLOCK_KEYS.has(f.key));
                  if (
                    useEnhancedResidenciaBlock &&
                    firstResidenciaField &&
                    field.key === firstResidenciaField.key
                  ) {
                    const cepField = sortedFields.find((f) => f.key === 'residencia.cep');
                    const bairroField = sortedFields.find((f) => f.key === 'residencia.bairro');
                    const logradouroField = sortedFields.find((f) => f.key === 'residencia.logradouro');
                    const zonaField = sortedFields.find((f) => f.key === 'residencia.zona');
                    const numeroField = sortedFields.find((f) => f.key === 'residencia.numero');
                    const complementoField = sortedFields.find((f) => f.key === 'residencia.complemento');
                    const telefoneField = sortedFields.find((f) => f.key === 'residencia.telefone');
                    const pontoReferenciaField = sortedFields.find((f) => f.key === 'residencia.ponto_referencia');
                    const paisResidenciaField = sortedFields.find((f) => f.key === 'residencia.pais');
                    const geoLocationField = sortedFields.find((f) => f.key === 'residencia.geolocalizacao');
                    const geoCampo1Field = sortedFields.find((f) => f.key === 'residencia.geo_campo_1');
                    const geoCampo2Field = sortedFields.find((f) => f.key === 'residencia.geo_campo_2');
                    const geoValue = getValue('residencia.geolocalizacao');
                    const geoCampo1Value = getValue('residencia.geo_campo_1');
                    const geoCampo2Value = getValue('residencia.geo_campo_2');
                    const parseCoord = (val: any): number | null => {
                      const raw = String(val ?? '').replace(',', '.').trim();
                      if (!raw) return null;
                      const n = Number(raw);
                      return Number.isFinite(n) ? n : null;
                    };
                    const isValidCoordPair = (lat: number | null, lng: number | null): lat is number =>
                      lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                    const latFromGeo =
                      geoValue?.latitude != null ? Number(geoValue.latitude) : parseCoord(geoCampo1Value);
                    const lngFromGeo =
                      geoValue?.longitude != null ? Number(geoValue.longitude) : parseCoord(geoCampo2Value);
                    const ufRaw = String(getValue('residencia.uf') ?? '').trim().toUpperCase();
                    const ufNorm =
                      ufRaw.length === 2
                        ? ufRaw
                        : IBGE_TO_UF_SIGLA[String(ufRaw).replace(/\D/g, '')] ?? '';
                    const residenciaEstadoId = getValue('residencia.estado_id');
                    const residenciaMunicipioId = getValue('residencia.municipio_id');
                    const lockPaisBrasil =
                      ((ufNorm && ufNorm !== 'EX') || residenciaEstadoId || residenciaMunicipioId) ? true : false;
                    const resolvedPaisResidenciaField = paisResidenciaField
                      ? getResolvedField(paisResidenciaField)
                      : null;
                    const fallbackCenter = UF_MAP_CENTER[ufNorm];
                    const mapLat = isValidCoordPair(latFromGeo, lngFromGeo) ? latFromGeo : (fallbackCenter?.lat ?? null);
                    const mapLng = isValidCoordPair(latFromGeo, lngFromGeo) ? lngFromGeo : (fallbackCenter?.lng ?? null);
                    const googleMapsUrl =
                      mapLat != null && mapLng != null ? `https://www.google.com/maps?q=${mapLat},${mapLng}` : null;
                    const setGeoPoint = (
                      lat: number,
                      lng: number,
                      source: 'manual-map' | 'manual-search' | 'manual-gps' | 'auto-municipio' = 'manual-map',
                    ) => {
                      setValue('residencia.geolocalizacao', {
                        latitude: lat,
                        longitude: lng,
                        source,
                        timestamp: new Date().toISOString(),
                      });
                      setValue('residencia.geo_campo_1', String(lat));
                      setValue('residencia.geo_campo_2', String(lng));
                    };
                    const handleCepFound = handleResidenciaCepFound;
                    const residenciaCell = 'min-w-0 [&>div]:mb-0';
                    const addressFieldsColumn = (
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
                          <div className={residenciaCell}>
                            {renderField(getResolvedField(bairroField))}
                          </div>
                        )}
                        {logradouroField && (
                          <div className={residenciaCell}>
                            {renderField(getResolvedField(logradouroField))}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {numeroField && (
                            <div className={residenciaCell}>
                              {renderField(getResolvedField(numeroField))}
                            </div>
                          )}
                          {complementoField && (
                            <div className={residenciaCell}>
                              {renderField(getResolvedField(complementoField))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    const telefoneBlock = telefoneField ? (
                      <div className={residenciaCell}>
                        <InternationalPhoneField
                          field={getResolvedField(telefoneField)}
                          value={getValue(telefoneField.key)}
                          onChange={(v) => setValue(telefoneField.key, v)}
                          error={getError(telefoneField.key)}
                          required={isFieldRequired(telefoneField.key)}
                          disabled={readOnly}
                          wrapperClassName=""
                        />
                      </div>
                    ) : null;
                    const pontoReferenciaBlock = pontoReferenciaField ? (
                      <div className={residenciaCell}>
                        <TextField
                          field={getResolvedField(pontoReferenciaField)}
                          value={getValue(pontoReferenciaField.key)}
                          onChange={(v) => setValue(pontoReferenciaField.key, v)}
                          error={getError(pontoReferenciaField.key)}
                          required={isFieldRequired(pontoReferenciaField.key)}
                          disabled={readOnly}
                          wrapperClassName=""
                        />
                      </div>
                    ) : null;
                    const zonaBlock = zonaField ? (
                      <div className={residenciaCell}>
                        {renderField(getResolvedField(zonaField))}
                      </div>
                    ) : null;
                    const paisResidenciaControl = resolvedPaisResidenciaField ? (
                      <div className={residenciaCell}>
                        <ApiSelectSearchField
                          field={resolvedPaisResidenciaField}
                          value={getValue('residencia.pais')}
                          onChange={(val: any) => {
                            const paisValue = String(val ?? '');
                            setValue('residencia.pais', paisValue || undefined);
                            if (paisValue && paisValue !== '105') {
                              setValue('residencia.uf', 'EX');
                              setValue('residencia.estado_id', undefined);
                              setValue('residencia.municipio_id', undefined);
                              setValue('residencia.municipio_ibge', '');
                            }
                          }}
                          error={getError('residencia.pais')}
                          required={isFieldRequired('residencia.pais')}
                          disabled={readOnly || lockPaisBrasil}
                          getValue={getValue}
                          context={context}
                        />
                      </div>
                    ) : null;
                    const geoRow = (geoCampo1Field || geoCampo2Field) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {geoCampo1Field && (
                          <div className={residenciaCell}>
                            {renderField(getResolvedField(geoCampo1Field))}
                          </div>
                        )}
                        {geoCampo2Field && (
                          <div className={residenciaCell}>
                            {renderField(getResolvedField(geoCampo2Field))}
                          </div>
                        )}
                      </div>
                    ) : null;
                    const mapBlock = geoLocationField ? (
                          <div className="min-w-0">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {geoLocationField.label}
                                </label>
                                {(geoLocationField as any).hint ? (
                                  <p className="text-xs text-gray-500 mb-2">{(geoLocationField as any).hint}</p>
                                ) : null}
                                <div className="mb-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => {
                                      if (!navigator.geolocation) return;
                                      navigator.geolocation.getCurrentPosition(
                                        (position) => {
                                          setGeoPoint(position.coords.latitude, position.coords.longitude, 'manual-gps');
                                        },
                                        () => {},
                                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                                      );
                                    }}
                                    className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Usar minha localização
                                  </button>
                                  <a
                                    href={googleMapsUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => {
                                      if (!googleMapsUrl) event.preventDefault();
                                    }}
                                    className={`px-3 py-1.5 text-xs rounded ${
                                      googleMapsUrl
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    Ver no Google Maps
                                  </a>
                                  <button
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => {
                                      setValue('residencia.geolocalizacao', undefined);
                                      setValue('residencia.geo_campo_1', undefined);
                                      setValue('residencia.geo_campo_2', undefined);
                                      setPendingResidenciaMapAddress(null);
                                    }}
                                    className="px-3 py-1.5 text-xs rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                                  >
                                    Limpar ponto
                                  </button>
                                </div>
                                {pendingResidenciaMapAddress ? (
                                  <div className="mb-3 p-3 border border-blue-200 bg-blue-50 rounded-md">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">
                                      Sugestão do mapa pronta para aplicar
                                    </p>
                                    <p className="text-xs text-blue-800 mb-2">
                                      {pendingResidenciaMapAddress.formattedAddress || 'Local selecionado no mapa'}
                                    </p>
                                    <p className="text-[11px] text-blue-700 mb-3">
                                      Os campos de endereço só serão alterados quando você clicar em
                                      {' '}
                                      <span className="font-semibold">Aplicar endereço do mapa</span>.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={readOnly}
                                        onClick={() => {
                                          applyPendingResidenciaMapAddress(pendingResidenciaMapAddress);
                                          setPendingResidenciaMapAddress(null);
                                        }}
                                        className="px-3 py-1.5 text-xs rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50"
                                      >
                                        Aplicar endereço do mapa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingResidenciaMapAddress(null)}
                                        className="px-3 py-1.5 text-xs rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                      >
                                        Descartar sugestão
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                                <MiniMapa
                                  initialLat={mapLat != null ? String(mapLat) : undefined}
                                  initialLng={mapLng != null ? String(mapLng) : undefined}
                                  onLocationSelect={(lat: number, lng: number, meta) => {
                                    setGeoPoint(lat, lng, meta?.source ?? 'manual-map');
                                  }}
                                  onAddressResolved={(address) => {
                                    setPendingResidenciaMapAddress(address);
                                  }}
                                  className="h-[360px] w-full"
                                />
                          </div>
                    ) : null;
                    const residenciaPairRow = (left: React.ReactNode, right: React.ReactNode) =>
                      left || right ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                          <div className="min-w-0">{left}</div>
                          <div className="min-w-0">{right}</div>
                        </div>
                      ) : null;
                    return (
                      <div key="residencia-block" className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Endereço de residência</h3>
                        <div className="space-y-4">
                          {residenciaPairRow(addressFieldsColumn, mapBlock)}
                          {residenciaPairRow(telefoneBlock, geoRow)}
                          {residenciaPairRow(pontoReferenciaBlock, zonaBlock)}
                          {paisResidenciaControl ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                              <div className="min-w-0">{paisResidenciaControl}</div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  if (useEnhancedResidenciaBlock && RESIDENCIA_BLOCK_KEYS.has(field.key)) return null;
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_imunizacao_mae' &&
                    field.key === 'mae.imunizacao_hepatite_b_completa'
                  ) {
                    const imunizacaoCell = 'min-w-0 [&>div]:mb-0';
                    const hbCompleta = sortedFields.find((f) => f.key === 'mae.imunizacao_hepatite_b_completa');
                    const hbIncompleta = sortedFields.find((f) => f.key === 'mae.imunizacao_hepatite_b_incompleta');
                    const haCompleta = sortedFields.find((f) => f.key === 'mae.imunizacao_hepatite_a_completa');
                    const haIncompleta = sortedFields.find((f) => f.key === 'mae.imunizacao_hepatite_a_incompleta');
                    const confirmacaoCarteira = sortedFields.find((f) => f.key === 'mae.confirmacao_carteira');
                    return (
                      <div key="imunizacao-mae-bloco" className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hbCompleta ? (
                            <div className={imunizacaoCell}>{renderField(hbCompleta)}</div>
                          ) : null}
                          {hbIncompleta ? (
                            <div className={imunizacaoCell}>{renderField(hbIncompleta)}</div>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {haCompleta ? (
                            <div className={imunizacaoCell}>{renderField(haCompleta)}</div>
                          ) : null}
                          {haIncompleta ? (
                            <div className={imunizacaoCell}>{renderField(haIncompleta)}</div>
                          ) : null}
                        </div>
                        {confirmacaoCarteira ? (
                          <div className={imunizacaoCell}>{renderField(confirmacaoCarteira)}</div>
                        ) : null}
                      </div>
                    );
                  }
                  if (isHepatiteCriancaHBV && section.id === 'section_imunizacao_mae' && IMUNIZACAO_MAE_LAYOUT_KEYS.has(field.key)) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_dados_laboratoriais_mae' &&
                    field.key === 'mae.lab.sorologia_reagente_hepatite_b'
                  ) {
                    const labCell = 'min-w-0 [&>div]:mb-0';
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    const renderLab = (key: string) => {
                      const def = fieldByKey(key);
                      return def ? renderField(def) : null;
                    };
                    const renderQuandoCell = (key: string) => {
                      if (!isFieldVisible(key)) {
                        return <span className="text-sm text-gray-400">—</span>;
                      }
                      return renderLab(key);
                    };
                    const hbvMarkers = sortedFields.filter((f) => LAB_MAE_CAMPO39_KEYS.has(f.key));
                    const hcvMarkers = sortedFields.filter((f) => LAB_MAE_CAMPO40_KEYS.has(f.key));
                    const showQuando =
                      MAE_LAB_HBV_WHEN_KEYS.some((k) => isFieldVisible(k)) ||
                      MAE_LAB_HCV_WHEN_KEYS.some((k) => isFieldVisible(k));
                    const showHbvMarkers = hbvMarkers.some((f) => isFieldVisible(f.key));
                    const showHcvMarkers = hcvMarkers.some((f) => isFieldVisible(f.key));
                    const showColB = isFieldVisible('mae.lab.hepatite_b_quando_antes_prenatal');
                    const showColC = isFieldVisible('mae.lab.hepatite_c_quando_antes_prenatal');

                    const markerStep = showQuando ? 3 : 2;

                    return (
                      <div key="lab-mae-bloco" className="md:col-span-2 space-y-4">
                        <LabMaePanel
                          step={1}
                          variant="neutral"
                          title="Mãe apresentou sorologia reagente para"
                          subtitle="Informe Sim ou Não para cada vírus antes de detalhar momento e exames."
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`${labCell} ${LAB_MAE_HBV_SURFACE}`}>
                              {renderLab('mae.lab.sorologia_reagente_hepatite_b')}
                            </div>
                            <div className={`${labCell} ${LAB_MAE_HCV_SURFACE}`}>
                              {renderLab('mae.lab.sorologia_reagente_hepatite_c')}
                            </div>
                          </div>
                        </LabMaePanel>
                        {showQuando ? (
                          <LabMaePanel
                            step={2}
                            variant="quando"
                            title="Quando"
                            subtitle="Marque Sim nos momentos em que a sorologia foi reagente para cada vírus."
                          >
                            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-700">
                                    <th className="px-3 py-2 font-medium w-[28%] bg-slate-100/80">Momento</th>
                                    {showColB ? (
                                      <th className="px-3 py-2 font-medium bg-[#3b5bdb]/10 text-[#364fc7]">
                                        Hepatite B (HBsAg Reagente)
                                      </th>
                                    ) : null}
                                    {showColC ? (
                                      <th className="px-3 py-2 font-medium bg-[#5eafc6]/35 text-[#1e6f8c]">
                                        Hepatite C (Anti-HCV Reagente)
                                      </th>
                                    ) : null}
                                  </tr>
                                </thead>
                                <tbody>
                                  {LAB_MAE_QUANDO_ROWS.map((row) => (
                                    <tr key={row.label} className="border-t border-slate-100 align-top">
                                      <td className="px-3 py-3 font-medium text-gray-800 bg-slate-50/50">
                                        {row.label}
                                      </td>
                                      {showColB ? (
                                        <td className="px-3 py-2 bg-[#3b5bdb]/[0.04]">
                                          {renderQuandoCell(row.hbvKey)}
                                        </td>
                                      ) : null}
                                      {showColC ? (
                                        <td className="px-3 py-2 bg-[#06b6d4]/[0.06]">
                                          {renderQuandoCell(row.hcvKey)}
                                        </td>
                                      ) : null}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </LabMaePanel>
                        ) : null}
                        {showHbvMarkers ? (
                          <LabMaePanel
                            step={markerStep}
                            variant="hbv"
                            tag="Vírus B"
                            title="Marcadores HBV"
                            subtitle="Resultado de cada exame laboratorial da hepatite B."
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                              {hbvMarkers.map((f) =>
                                isFieldVisible(f.key) ? (
                                  <div
                                    key={f.key}
                                    className={`${labCell} ${LAB_MAE_HBV_SURFACE} bg-white/70`}
                                  >
                                    {renderField(f)}
                                  </div>
                                ) : null,
                              )}
                            </div>
                          </LabMaePanel>
                        ) : null}
                        {showHcvMarkers ? (
                          <LabMaePanel
                            step={markerStep}
                            variant="hcv"
                            tag="Vírus C"
                            title="Marcadores HCV"
                            subtitle="Resultado de cada exame laboratorial da hepatite C."
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                              {hcvMarkers.map((f) =>
                                isFieldVisible(f.key) ? (
                                  <div
                                    key={f.key}
                                    className={`${labCell} ${LAB_MAE_HCV_SURFACE} bg-white/70`}
                                  >
                                    {renderField(f)}
                                  </div>
                                ) : null,
                              )}
                            </div>
                          </LabMaePanel>
                        ) : null}
                      </div>
                    );
                  }
                  if (isHepatiteCriancaHBV && section.id === 'section_dados_laboratoriais_mae' && LAB_MAE_LAYOUT_KEYS.has(field.key)) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_antecedentes_epidemiologicos_crianca' &&
                    field.key === 'crianca.numero_dnv'
                  ) {
                    const criancaCell = 'min-w-0 [&>div]:mb-0';
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    const renderCrianca = (key: string) => {
                      const def = fieldByKey(key);
                      return def ? renderField(def) : null;
                    };
                    return (
                      <div key="crianca-antecedentes-bloco" className="md:col-span-2 space-y-4">
                        <LabMaePanel
                          step={1}
                          variant="neutral"
                          title="Declaração de Nascido Vivo"
                          subtitle="Número da DNV com 9 dígitos (8 + dígito verificador)."
                        >
                          <div className="max-w-sm">{renderCrianca('crianca.numero_dnv')}</div>
                        </LabMaePanel>
                        <LabMaePanel
                          step={2}
                          variant="quando"
                          title="Local de nascimento"
                          subtitle="UF, município e hospital onde ocorreu o nascimento."
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] md:items-start [&_label]:mb-2 [&_label]:min-h-[2.5rem] [&_label]:flex [&_label]:items-end [&_label]:leading-snug">
                            <EstadoMunicipioNascimento
                              getValue={getValue}
                              setValue={setValue}
                              disabled={readOnly}
                              error={
                                getError('crianca.nascimento_municipio_id') ||
                                getError('crianca.nascimento_uf')
                              }
                            />
                            <div className="min-w-0 self-start md:col-span-1">
                              <EstabelecimentoNascimento
                                getValue={getValue}
                                setValue={setValue}
                                disabled={readOnly}
                                error={
                                  getError('crianca.hospital_nascimento_unidade_id') ||
                                  getError('crianca.hospital_nascimento_cnes')
                                }
                              />
                            </div>
                          </div>
                        </LabMaePanel>
                        <LabMaePanel
                          step={3}
                          variant="hbv"
                          title="Vacina para Hepatite B na maternidade"
                          subtitle="Informe se a vacina foi aplicada antes ou após 24h de vida."
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className={criancaCell}>
                              {renderCrianca('crianca.vacina_hepatite_b_maternidade_antes_24h')}
                            </div>
                            <div className={criancaCell}>
                              {renderCrianca('crianca.vacina_hepatite_b_maternidade_apos_24h')}
                            </div>
                          </div>
                        </LabMaePanel>
                        <LabMaePanel
                          step={4}
                          variant="hbv"
                          title="Vacina para Hepatite B"
                          subtitle="Para cada dose: Sim/Não se foi aplicada e data (dd/mm/aaaa)."
                        >
                          <div className="space-y-3">
                            {CRIANCA_DOSE_ROWS.map(({ simKey, dataKey, label }) => {
                              const simDef = fieldByKey(simKey);
                              const dataDef = fieldByKey(dataKey);
                              if (!simDef || !dataDef) return null;
                              return (
                                <CriancaVacinaDoseRow
                                  key={simKey}
                                  doseLabel={label}
                                  simField={simDef}
                                  dataField={dataDef}
                                  getValue={getValue}
                                  setValue={setValue}
                                  getError={getError}
                                  disabled={readOnly}
                                />
                              );
                            })}
                          </div>
                        </LabMaePanel>
                        <LabMaePanel
                          step={5}
                          variant="hbv"
                          title="Imunoglobulina hiperimune Hepatite B"
                          subtitle="Se foi aplicada e data da aplicação."
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
                            <div className={criancaCell}>{renderCrianca('crianca.imunoglobulina_hbig')}</div>
                            <div className={criancaCell}>{renderCrianca('crianca.imunoglobulina_hbig_data')}</div>
                          </div>
                        </LabMaePanel>
                        <LabMaePanel
                          step={6}
                          variant="neutral"
                          title="Vacina para Hepatite A"
                          subtitle="Indique se a criança recebeu a vacina."
                        >
                          <div className={`max-w-md ${criancaCell}`}>
                            {renderCrianca('crianca.vacina_hepatite_a')}
                          </div>
                        </LabMaePanel>
                      </div>
                    );
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_antecedentes_epidemiologicos_crianca' &&
                    CRIANCA_ANTECEDENTES_LAYOUT_KEYS.has(field.key)
                  ) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_dados_laboratoriais_crianca' &&
                    field.key === CRIANCA_LAB_ESQUEMA1_FIRST_KEY
                  ) {
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    const renderLab = (key: string) => {
                      const def = fieldByKey(key);
                      return def ? renderField(def) : null;
                    };
                    const showEsquema2 =
                      isFieldVisible('crianca.lab.registrar_esquema_2') &&
                      String(getValue('crianca.lab.registrar_esquema_2') ?? '') === '1';

                    return (
                      <div key="crianca-lab-bloco" className="md:col-span-2 space-y-4">
                        <LabMaePanel
                          step={1}
                          variant="hbv"
                          title="Sorologia pós-vacinação — 1º Esquema Vacinal"
                          subtitle="Data da coleta e resultados da sorologia (HBsAg e Anti-HBs), 30-60 dias da terceira dose de vacina da Hepatite B (1º Esquema Vacinal)."
                        >
                          <CriancaLabSorologiaEsquemaPanel
                            esquema={1}
                            fieldByKey={fieldByKey}
                            renderField={renderField}
                            getValue={getValue}
                            readOnly={readOnly}
                          />
                        </LabMaePanel>
                        <LabMaePanel
                          step={2}
                          variant="neutral"
                          title="Repetição do esquema vacinal"
                          subtitle="Marque Sim para registrar o laboratório do 2º esquema, após preencher o 1º esquema acima."
                        >
                          <div className="max-w-lg">{renderLab('crianca.lab.registrar_esquema_2')}</div>
                        </LabMaePanel>
                        {showEsquema2 ? (
                          <LabMaePanel
                            step={3}
                            variant="hbv"
                            title="Sorologia pós-vacinação — 2º Esquema Vacinal"
                            subtitle="Data da coleta e resultados da sorologia (HBsAg e Anti-HBs), 30-60 dias da terceira dose de vacina da Hepatite B (2º Esquema Vacinal)."
                          >
                            <CriancaLabSorologiaEsquemaPanel
                              esquema={2}
                              fieldByKey={fieldByKey}
                              renderField={renderField}
                              getValue={getValue}
                              readOnly={readOnly}
                            />
                          </LabMaePanel>
                        ) : null}
                      </div>
                    );
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_dados_laboratoriais_crianca' &&
                    (CRIANCA_LAB_LAYOUT_KEYS.has(field.key) ||
                      CRIANCA_LAB_DEPRECATED_KEYS.has(field.key))
                  ) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_acompanhamento_crianca' &&
                    field.key === CRIANCA_ACOMP_FIRST_KEY
                  ) {
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    return (
                      <div key="crianca-acomp-bloco" className="md:col-span-2 space-y-4">
                        <LabMaePanel
                          step={1}
                          variant="hcv"
                          title="Avaliação laboratorial — Hepatite C"
                          subtitle="Anti-HCV e HCV-RNA na avaliação de acompanhamento da criança (18 meses de idade)."
                        >
                          <CriancaAcompanhamentoHcvPanel
                            fieldByKey={fieldByKey}
                            renderField={renderField}
                            getValue={getValue}
                            readOnly={readOnly}
                          />
                        </LabMaePanel>
                      </div>
                    );
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_acompanhamento_crianca' &&
                    CRIANCA_ACOMP_LAYOUT_KEYS.has(field.key)
                  ) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_conclusao' &&
                    field.key === CRIANCA_CONCLUSAO_FIRST_KEY
                  ) {
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    return (
                      <div key="crianca-conclusao-bloco" className="md:col-span-2">
                        <CriancaConclusaoPanel fieldByKey={fieldByKey} renderField={renderField} readOnly={readOnly} />
                      </div>
                    );
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_conclusao' &&
                    CRIANCA_CONCLUSAO_LAYOUT_KEYS.has(field.key)
                  ) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_dados_investigador' &&
                    field.key === CRIANCA_INVESTIGADOR_FIRST_KEY
                  ) {
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    return (
                      <div key="crianca-investigador-bloco" className="md:col-span-2">
                        <InvestigadorDadosPanel
                          fieldByKey={fieldByKey}
                          renderField={renderField}
                          getValue={getValue}
                          setValue={setValue}
                          getError={getError}
                          readOnly={readOnly}
                        />
                      </div>
                    );
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_dados_investigador' &&
                    CRIANCA_INVESTIGADOR_LAYOUT_KEYS.has(field.key)
                  ) {
                    return null;
                  }
                  if (
                    isHepatiteCriancaHBV &&
                    section.id === 'section_dados_prenatal' &&
                    field.key === 'prenatal.fez_prenatal'
                  ) {
                    const prenatalCell = 'min-w-0 [&>div]:mb-0';
                    const fieldByKey = (key: string) => sortedFields.find((f) => f.key === key);
                    const renderPrenatal = (key: string) => {
                      const def = fieldByKey(key);
                      return def ? renderField(def) : null;
                    };
                    const showLocal = isFieldVisible('prenatal.endereco');
                    return (
                      <div key="prenatal-bloco" className="md:col-span-2 space-y-4">
                        <LabMaePanel
                          step={1}
                          variant="neutral"
                          title="Fez Pré-Natal"
                          subtitle="Informe se a gestante realizou acompanhamento de pré-natal."
                        >
                          <div className="max-w-md">{renderPrenatal('prenatal.fez_prenatal')}</div>
                        </LabMaePanel>
                        {showLocal ? (
                          <LabMaePanel
                            step={2}
                            variant="quando"
                            title="Local de realização do pré-natal"
                            subtitle="UF, município, unidade de saúde, endereço e telefone do serviço."
                          >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.3fr)] md:items-start [&_label]:mb-2 [&_label]:min-h-[2.5rem] [&_label]:flex [&_label]:items-end [&_label]:leading-snug">
                              <EstadoMunicipioPrenatal
                                getValue={getValue}
                                setValue={setValue}
                                disabled={readOnly}
                                error={getError('prenatal.municipio_id') || getError('prenatal.uf')}
                              />
                              <div className="min-w-0 self-start">
                                <EstabelecimentoPrenatal
                                  getValue={getValue}
                                  setValue={setValue}
                                  disabled={readOnly}
                                  error={
                                    getError('prenatal.unidade_id') ||
                                    getError('prenatal.estabelecimento_cnes')
                                  }
                                />
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className={prenatalCell}>{renderPrenatal('prenatal.endereco')}</div>
                              <div className={prenatalCell}>{renderPrenatal('prenatal.telefone')}</div>
                            </div>
                          </LabMaePanel>
                        ) : null}
                        <LabMaePanel
                          step={showLocal ? 3 : 2}
                          variant="neutral"
                          title="Antecedentes relacionados à hepatite"
                          subtitle="Tratamento, prevenção da transmissão vertical, medicamentos e histórico familiar."
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className={`${prenatalCell} ${LAB_MAE_HBV_SURFACE}`}>
                              {renderPrenatal('prenatal.tratamento_hepatite_b')}
                            </div>
                            <div className={`${prenatalCell} ${LAB_MAE_HCV_SURFACE}`}>
                              {renderPrenatal('prenatal.prevencao_transmissao_vertical_b')}
                            </div>
                          </div>
                          <div className={`mt-4 ${prenatalCell}`}>
                            {renderPrenatal('prenatal.medicamento_utilizado')}
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className={`${prenatalCell} ${LAB_MAE_HBV_SURFACE}`}>
                              {renderPrenatal('prenatal.familia_portadora_hepatite_b')}
                            </div>
                            <div className={`${prenatalCell} ${LAB_MAE_HCV_SURFACE}`}>
                              {renderPrenatal('prenatal.familia_portadora_hepatite_c')}
                            </div>
                          </div>
                        </LabMaePanel>
                      </div>
                    );
                  }
                  if (isHepatiteCriancaHBV && section.id === 'section_dados_prenatal' && PRENATAL_LAYOUT_KEYS.has(field.key)) {
                    return null;
                  }
                  // Bloco Paciente - Identificação: quando Sim, Passaporte e País (ao lado) surgem embaixo de CNS/É estrangeiro e empurram Nome/Nome social pra baixo. País oculto quando Não; sem pré-seleção Brasil.
                  if (dtNotificacaoField && field.key === 'notificacao.dt_notificacao') {
                    const hasIdentificationGroupFields = Boolean(
                      cpfField ||
                        cnsField ||
                        estrangeiroField ||
                        nomeField ||
                        nomeSocialField ||
                        nomeMaeField ||
                        dataNascimentoField ||
                        idadeField ||
                        sexoField ||
                        passaporteField ||
                        paisField
                    );
                    if (!hasIdentificationGroupFields) {
                      const content = renderField(field);
                      if (content == null) return null;
                      return (
                        <div key={field.key} className={hepatiteSpanClass(field.key)}>
                          {content}
                        </div>
                      );
                    }
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
                  // Só oculta os campos do bloco de Identificação quando o bloco foi
                  // efetivamente montado nesta seção (dt_notificacao presente na seção atual).
                  // Em formulários customizados (ex.: HBV criança), esses campos podem estar
                  // em outra seção e não devem sumir da tela.
                  if (dtNotificacaoField && IDENTIFICACAO_BLOCK_KEYS.has(field.key)) return null;
                  if (showSinanDadosClinicosBlock && isSinanClinicalFieldKey(field.key)) return null;
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

      {!pageMode && showSinanDadosClinicosBlock ? (
        <div className="mb-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-blue-600 px-4 py-3 flex items-center gap-3 rounded-t-xl">
              <Activity className="h-5 w-5 text-white/95 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">Dados clínicos</h2>
            </div>
            <div className="p-4 rounded-b-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <MultiSelectField
                    field={buildClinicaMultiSelectField(
                      'clinica.sinais_sintomas',
                      'Sinais e sintomas',
                      clinicaLoadingSintomas
                        ? 'Carregando sintomas...'
                        : 'Selecione os sinais e sintomas (busca por nome ou sinônimo). Os agravos compatíveis serão rankeados automaticamente abaixo.',
                      clinicaSintomaOptions,
                    ) as any}
                    value={getValue('clinica.sinais_sintomas')}
                    onChange={(val: any) => {
                      setValue('clinica.sinais_sintomas', val);
                      const selected = Array.isArray(val) ? val.map((item) => String(item)) : [];
                      if (!selected.includes(SINTOMA_OUTRO_ID)) {
                        setValue('clinica.sintomas_outro', undefined);
                      }
                    }}
                    error={getError('clinica.sinais_sintomas')}
                    required
                    disabled={readOnly || clinicaLoadingSintomas}
                    getValue={getValue}
                  />
                </div>

                {clinicaTemOutroSintoma ? (
                  <div className="md:col-span-2">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outro sintoma (texto livre)
                      </label>
                      <input
                        type="text"
                        value={String(getValue('clinica.sintomas_outro') ?? '')}
                        onChange={(event) => setValue('clinica.sintomas_outro', event.target.value)}
                        disabled={readOnly}
                        placeholder="Descreva o sintoma não listado"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="md:col-span-2">
                  <AgravoMultiSelectField
                    label="Doenças/agravos notificados"
                    helpText={
                      clinicaLoadingAgravos
                        ? 'Carregando agravos...'
                        : clinicaSintomasSelecionados.length > 0
                          ? 'Agravos compatíveis aparecem no topo ordenados por %. Clique em 🩺 para ver os sintomas de cada doença.'
                          : 'Selecione sintomas acima para ver os agravos rankeados por compatibilidade.'
                    }
                    value={clinicaAgravosSelecionados}
                    onChange={(selectedIds) => {
                      setValue('clinica.agravos_notificados', selectedIds);
                      const cids = Array.from(
                        new Set(
                          clinicaAgravoOptions
                            .filter((item) => selectedIds.includes(item.value))
                            .flatMap((item) => item.cid10Lista)
                            .map((cid) => String(cid).trim())
                            .filter(Boolean),
                        ),
                      );
                      setValue('agravo_cid', cids.length > 0 ? cids.join('; ') : undefined);
                    }}
                    agravoOptions={clinicaAgravoOptions}
                    agravosRanking={clinicaAgravosRankeados}
                    sintomasSelecionados={clinicaSintomasSelecionados}
                    error={getError('clinica.agravos_notificados')}
                    required
                    disabled={readOnly || clinicaLoadingAgravos}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CID10 do Agravo
                      {isFieldRequired('agravo_cid') ? <span className="text-red-500 ml-1">*</span> : null}
                    </label>
                    <input
                      type="text"
                      value={String(getValue('agravo_cid') ?? '')}
                      onChange={(event) => setValue('agravo_cid', event.target.value)}
                      disabled={readOnly}
                      placeholder="Ex.: A90, B04, Z20.5"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getError('agravo_cid') ? 'border-red-500' : 'border-gray-300'
                      } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {getError('agravo_cid') ? (
                      <p className="text-red-500 text-sm mt-1">{getError('agravo_cid')}</p>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-0">
                  <DateField
                    field={{
                      key: 'clinica.data_inicio_sintomas',
                      label: 'Data de início dos sintomas',
                      type: 'date',
                    } as any}
                    value={getValue('clinica.data_inicio_sintomas')}
                    onChange={(val: any) => setValue('clinica.data_inicio_sintomas', val)}
                    error={getError('clinica.data_inicio_sintomas')}
                    required={isFieldRequired('clinica.data_inicio_sintomas')}
                    disabled={readOnly}
                  />
                </div>

                <div className="min-w-0">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doenças/agravos relacionados ao trabalho?
                      {isFieldRequired('clinica.relacionado_trabalho') ? <span className="text-red-500 ml-1">*</span> : null}
                    </label>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                      {CLINICA_RADIO_OPTIONS.map((option) => (
                        <label key={option.value} className="inline-flex items-center gap-2 text-sm text-gray-800">
                          <input
                            type="radio"
                            name="clinica-relacionado-trabalho"
                            checked={normalizeClinicaSimNaoIgnorado(getValue('clinica.relacionado_trabalho')) === option.value}
                            onChange={() => setValue('clinica.relacionado_trabalho', option.value)}
                            disabled={readOnly}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    {getError('clinica.relacionado_trabalho') && (
                      <p className="text-red-500 text-sm mt-1">{getError('clinica.relacionado_trabalho')}</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 min-w-0">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doenças/agravos relacionados ao desastre?
                      {isFieldRequired('clinica.relacionado_desastre') ? <span className="text-red-500 ml-1">*</span> : null}
                    </label>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                      {CLINICA_RADIO_OPTIONS.map((option) => (
                        <label key={option.value} className="inline-flex items-center gap-2 text-sm text-gray-800">
                          <input
                            type="radio"
                            name="clinica-relacionado-desastre"
                            checked={normalizeClinicaSimNaoIgnorado(getValue('clinica.relacionado_desastre')) === option.value}
                            onChange={() => setValue('clinica.relacionado_desastre', option.value)}
                            disabled={readOnly}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    {getError('clinica.relacionado_desastre') && (
                      <p className="text-red-500 text-sm mt-1">{getError('clinica.relacionado_desastre')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
