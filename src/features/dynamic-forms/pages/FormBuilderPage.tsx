import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/keycloak/AuthProvider';
import FormService, { type FormSchema, type FormSection, type FormField, type FormRule, type RuleCondition, type RuleAction, type TableColumnDef, type XlsFormPreview } from '@/services/FormService';
import DatabaseService, { type TableColumn } from '@/services/DatabaseService';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import { Plus, Trash2, Save, Eye, Settings, GripVertical, X, Download, Upload, ChevronUp, ChevronDown, Code, FileEdit, Check, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { ClipboardList, Calendar, DollarSign, Target, Activity, Shield, Leaf, BarChart3, Wrench, Users } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { FormRenderer } from '../components/FormRenderer';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { TemplateGalleryModal } from '../components/TemplateGalleryModal';
import type { FormTemplate } from '../data/formTemplates';
import { FieldSourceConfig } from '../components/FieldSourceConfig';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { clampNoteInRange, normalizeScalePointLabelRows } from '@/utils/linearScaleNote';
import { resolveFormRendererContext } from '../utils/sinanClinicalFields';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function getLinearScaleBoundsInt(f: FormField): { loB: number; hiB: number } {
  const loB = Math.min(Math.floor(f.min ?? 1), Math.floor(f.max ?? 5));
  const hiB = Math.max(Math.floor(f.min ?? 1), Math.floor(f.max ?? 5));
  return { loB, hiB };
}

/**
 * Nota com `type="number"` (setas nativas do navegador) + rascunho local para poder apagar e digitar outro valor.
 */
const LinearBoundedNoteInput: React.FC<{
  value: number;
  minV: number;
  maxV: number;
  onCommit: (next: number) => void;
  className?: string;
}> = ({ value, minV, maxV, onCommit, className }) => {
  const safe = clampNoteInRange(value, minV, maxV, minV);
  const [draft, setDraft] = useState<string>(() => String(safe));
  useEffect(() => {
    setDraft(String(clampNoteInRange(value, minV, maxV, minV)));
  }, [value, minV, maxV]);

  const commitDraft = (raw: string) => {
    const parsed = raw === '' || raw === '-' ? NaN : Number(raw);
    const next = Number.isFinite(parsed) ? clampNoteInRange(parsed, minV, maxV, safe) : safe;
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <input
      type="number"
      min={minV}
      max={maxV}
      step={1}
      autoComplete="off"
      value={draft}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        const n = v === '' || v === '-' ? NaN : Number(v);
        if (Number.isFinite(n)) {
          const next = clampNoteInRange(n, minV, maxV, safe);
          onCommit(next);
        }
      }}
      onBlur={() => commitDraft(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={`w-16 px-1 py-1 text-xs border border-gray-300 rounded shrink-0 ${className ?? ''}`.trim()}
      title={`Nota de ${minV} a ${maxV}`}
    />
  );
};

// ─── Drag & Drop helpers ────────────────────────────────────────────────────

const FieldDragHandleCtx = React.createContext<ReturnType<typeof useSortable> | null>(null);
const SectionDragHandleCtx = React.createContext<ReturnType<typeof useSortable> | null>(null);

const SortableFieldItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const sortable = useSortable({ id });
  const { setNodeRef, transform, transition, isDragging } = sortable;
  return (
    <FieldDragHandleCtx.Provider value={sortable}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 10 : undefined,
        }}
      >
        {children}
      </div>
    </FieldDragHandleCtx.Provider>
  );
};

const FieldDragHandle: React.FC = () => {
  const sortable = React.useContext(FieldDragHandleCtx);
  return (
    <button
      type="button"
      {...(sortable?.listeners ?? {})}
      {...(sortable?.attributes ?? {})}
      className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing rounded touch-none"
      title="Arrastar para reordenar"
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
};

const SortableSectionItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const sortable = useSortable({ id });
  const { setNodeRef, transform, transition, isDragging } = sortable;
  return (
    <SectionDragHandleCtx.Provider value={sortable}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 20 : undefined,
        }}
      >
        {children}
      </div>
    </SectionDragHandleCtx.Provider>
  );
};

const SectionDragHandle: React.FC = () => {
  const sortable = React.useContext(SectionDragHandleCtx);
  return (
    <button
      type="button"
      {...(sortable?.listeners ?? {})}
      {...(sortable?.attributes ?? {})}
      className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded touch-none flex-shrink-0"
      title="Arrastar seção para reordenar"
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
};

// ─── Dados estáticos de tipos de campo ──────────────────────────────────────

const fieldTypeGroups = [
  {
    label: 'Básicos',
    options: [
      { value: 'text', label: '📝 Texto' },
      { value: 'textarea', label: '📄 Texto longo' },
      { value: 'number', label: '🔢 Número' },
      { value: 'currency', label: '💰 Moeda (R$)' },
      { value: 'accounting', label: '🧾 Contábil (R$)' },
      { value: 'date', label: '📅 Data' },
      { value: 'month', label: '📅 Mês/Ano (input mês)' },
      { value: 'month-year', label: '📅 Mês/Ano (select + ano)' },
      { value: 'datetime', label: '🕐 Data e hora' },
      { value: 'time', label: '⏰ Hora' },
    ],
  },
  {
    label: 'Contato / Documentos',
    options: [
      { value: 'email', label: '📧 E-mail' },
      { value: 'phone', label: '📱 Telefone' },
      { value: 'international-phone', label: '🌍 Tel. internacional' },
      { value: 'cpf', label: '🆔 CPF' },
      { value: 'cns', label: '🏥 Cartão SUS (CNS)' },
      { value: 'passaporte', label: '🛂 Passaporte' },
      { value: 'cep', label: '📮 CEP' },
      { value: 'idade', label: '🎂 Idade' },
    ],
  },
  {
    label: 'Escolha / Opções',
    options: [
      { value: 'checkbox', label: '☑️ Sim / Não' },
      { value: 'checkbox-group', label: '☑️ Múltiplas caixas' },
      { value: 'radio', label: '🔘 Uma resposta' },
      { value: 'select', label: '📋 Seleção' },
      { value: 'select-search', label: '🔍 Seleção c/ busca' },
      { value: 'multi-select', label: '📋 Seleção múltipla' },
      { value: 'autocomplete', label: '🔍 Autocomplete' },
    ],
  },
  {
    label: 'Anexos',
    options: [
      { value: 'file', label: '📁 Arquivo' },
      { value: 'signature', label: '✍️ Assinatura' },
    ],
  },
  {
    label: 'Avançados',
    options: [
      { value: 'geolocation', label: '🌍 Geolocalização' },
      { value: 'color', label: '🎨 Cor' },
      { value: 'slider', label: '🎚️ Slider' },
      { value: 'rating', label: '⭐ Estrelas' },
      { value: 'linear_scale', label: '📊 Escala linear' },
      { value: 'address', label: '🏠 Endereço completo' },
      { value: 'google-address', label: '🗺️ End. Google Maps' },
      { value: 'table', label: '📊 Tabela / Grid' },
    ],
  },
  {
    label: 'SINAN / Especiais',
    options: [
      { value: 'estabelecimento-search', label: '🏥 Estabelecimento (CNES)' },
    ],
  },
] as const;

// ─── Seletor visual de tipo de campo ────────────────────────────────────────

const FieldTypePicker: React.FC<{
  value: string;
  onChange: (type: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  const flat = fieldTypeGroups.flatMap((g) => g.options);
  const current = flat.find((t) => t.value === value);
  const [emoji = '', ...rest] = (current?.label ?? value).split(' ');
  const name = rest.join(' ') || value;

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropW = 296;
      const rawLeft = rect.left;
      const left = Math.max(8, Math.min(rawLeft, window.innerWidth - dropW - 8));
      setDropStyle({ top: rect.bottom + 4, left, width: dropW });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!(btnRef.current?.contains(t) ?? false) && !(dropRef.current?.contains(t) ?? false)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openPicker}
        className={`w-full px-2 py-1 text-xs border rounded flex items-center gap-1 bg-white text-left transition-colors ${
          open ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-300 hover:border-gray-400'
        }`}
        title={current?.label ?? value}
      >
        <span className="text-base leading-none flex-shrink-0" aria-hidden>{emoji}</span>
        <span className="flex-1 truncate text-gray-700">{name}</span>
        <ChevronDown className={`h-3 w-3 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropRef}
            style={{ ...dropStyle, position: 'fixed', zIndex: 9999, maxHeight: 360 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto"
          >
            {fieldTypeGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white border-b border-gray-100">
                  {group.label}
                </p>
                <div className="p-2 grid grid-cols-2 gap-1">
                  {group.options.map((type) => {
                    const [ico = '', ...typeRest] = type.label.split(' ');
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(type.value);
                          setOpen(false);
                        }}
                        className={`text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                          type.value === value
                            ? 'bg-blue-50 text-blue-800 font-semibold ring-1 ring-blue-200'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="text-base leading-none flex-shrink-0" aria-hidden>{ico}</span>
                        <span className="truncate">{typeRest.join(' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

// ─── Menu de ações técnicas (somente admins) ────────────────────────────────

const DevActionsMenu: React.FC<{
  onExportJSON: () => void;
  onImportJSON: () => void;
  /** "down" para header (padrão), "up" para rodapé */
  direction?: 'down' | 'up';
}> = ({ onExportJSON, onImportJSON, direction = 'down' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`px-3 py-2 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
          open ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        title="Ações técnicas: exportar / importar JSON e planilha"
      >
        <Code className="h-4 w-4" />
        <span>Dev</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[210px] py-1 ${
            direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Ações técnicas
          </p>
          <button
            type="button"
            onClick={() => { onExportJSON(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
          >
            <Download className="h-4 w-4 text-blue-500" />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => { onImportJSON(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
          >
            <Upload className="h-4 w-4 text-blue-500" />
            Importar JSON
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main builder component ──────────────────────────────────────────────────

export const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGeneralBuilder = typeof window !== 'undefined' && window.location.pathname.includes('/private/meus-formularios/');
  const [loading, setLoading] = useState(false);

  // ── Dirty / autosave ──────────────────────────────────────────────────────
  // null = não inicializado ainda (carregando form existente ou montando novo)
  const [lastSavedState, setLastSavedState] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{
    savedAt: string;
    formName: string; formDescription: string;
    formKey: string; categoria: string; schema: FormSchema;
  } | null>(null);
  // skipBlockerRef: garante que navigate após save bem-sucedido não dispare beforeunload
  const skipBlockerRef = useRef(false);
  // ──────────────────────────────────────────────────────────────────────────

  const canSeeAdvanced = Array.isArray((user as any)?.roles) && (user as any).roles.includes('admin');
  const [showTechnicalNames, setShowTechnicalNames] = useState(false);
  const [rulesSimpleMode, setRulesSimpleMode] = useState(true);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formKey, setFormKey] = useState('');
  const [existingUiJson, setExistingUiJson] = useState<Record<string, unknown>>({});
  const [categoria, setCategoria] = useState('notificacao');
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Array<{ key: string; label: string }>>([]);
  const [schema, setSchema] = useState<FormSchema>({
    agravo: '',
    sections: []
  });

  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<{ sectionIdx: number; fieldIdx: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'rules'>('fields');
  const [previewMode, setPreviewMode] = useState<'interactive' | 'readonly'>('interactive');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewPanel, setPreviewPanel] = useState<'form' | 'json'>('form');
  /** Versão publicada ativa do formulário (para abrir a tela de colunas fixas SINAN). */
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importExcelOpen, setImportExcelOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = schema.sections.findIndex((s) => s.id === String(active.id));
    const toIdx = schema.sections.findIndex((s) => s.id === String(over.id));
    if (fromIdx < 0 || toIdx < 0) return;
    const newSections = arrayMove([...schema.sections], fromIdx, toIdx);
    newSections.forEach((s, i) => (s.order = i + 1));
    setSchema({ ...schema, sections: newSections });
    if (activeSection === fromIdx) setActiveSection(toIdx);
  };

  const handleFieldDragEnd = (sectionIdx: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fields = schema.sections[sectionIdx]?.fields ?? [];
    const fromIdx = fields.findIndex((f) => f.key === String(active.id));
    const toIdx = fields.findIndex((f) => f.key === String(over.id));
    if (fromIdx < 0 || toIdx < 0) return;
    const newSections = [...schema.sections];
    const newFields = arrayMove([...fields], fromIdx, toIdx);
    newFields.forEach((f, i) => (f.order = i + 1));
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields: newFields };
    setSchema({ ...schema, sections: newSections });
    if (activeField?.sectionIdx === sectionIdx && activeField.fieldIdx === fromIdx) {
      setActiveField({ sectionIdx, fieldIdx: toIdx });
    }
  };

  // Estados para configuração de banco de dados
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<Record<string, TableColumn[]>>({});
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const builderTipoEstadoLoadedRef = useRef(false);
  const [builderTipoEstadoOptions, setBuilderTipoEstadoOptions] = useState<Array<{ value: string; label: string }>>([]);

  const ensureBuilderTipoEstadoOptions = () => {
    if (builderTipoEstadoLoadedRef.current) return;
    builderTipoEstadoLoadedRef.current = true;
    void axios
      .get(`${getRuntimeApiRoot()}/tipo-estado/select`, { withCredentials: true })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setBuilderTipoEstadoOptions(
          list
            .map((row: any) => ({
              value: String(row.value ?? row.idtipo_estado ?? row.id ?? ''),
              label: String(row.label ?? row.descricao ?? row.nome ?? ''),
            }))
            .filter((o) => o.value && o.label),
        );
      })
      .catch(() => setBuilderTipoEstadoOptions([]));
  };

  // isDirty: true quando o estado atual difere do último save/load
  // Declarado antes dos effects para evitar TDZ com useBlocker
  const isDirty = useMemo(() => {
    if (lastSavedState === null) return false;
    return (
      JSON.stringify({ formName, formDescription, formKey, categoria, schema }) !== lastSavedState
    );
  }, [lastSavedState, formName, formDescription, formKey, categoria, schema]);

  // Chave do localStorage para este formulário
  const draftKey = id ? `form-draft-${id}` : 'form-draft-new';

  useEffect(() => {
    if (id) {
      loadForm();
    }
    loadTables();
    loadCategorias();
    builderTipoEstadoLoadedRef.current = false;
    setBuilderTipoEstadoOptions([]);
  }, [id]);

  // ── Inicializar snapshot "salvo" para formulários NOVOS ───────────────────
  useEffect(() => {
    if (id) return; // formulários existentes são inicializados no loadForm
    const initialCategoria = isGeneralBuilder ? 'eventos_inscricoes' : 'notificacao';
    setLastSavedState(
      JSON.stringify({ formName: '', formDescription: '', formKey: '', categoria: initialCategoria, schema: { agravo: '', sections: [] } })
    );
    // Verificar rascunho salvo
    try {
      const raw = localStorage.getItem('form-draft-new');
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.savedAt && d?.schema) setPendingDraft(d);
      }
    } catch { /* ignore */ }
  }, []); // Só no mount

  // ── Bloquear fechamento de aba com alterações não salvas ─────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Autosave para localStorage (debounce 5s após última mudança) ─────────
  useEffect(() => {
    if (!isDirty || lastSavedState === null) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          savedAt: new Date().toISOString(),
          formName, formDescription, formKey, categoria, schema,
        }));
      } catch { /* quota errors: ignorar silenciosamente */ }
    }, 5_000);
    return () => clearTimeout(timer);
  }, [isDirty, formName, formDescription, formKey, categoria, schema]);

  const makeFormKeyFromName = (name: string) => {
    const raw = String(name || '').trim();
    if (!raw) return '';
    const normalized = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const cleaned = normalized
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50);
    return cleaned;
  };

  // Auto-gerar o "código" a partir do nome para usuários não-TI.
  // Por padrão o usuário não edita isso na UI; preservamos apenas ao editar formulário existente.
  useEffect(() => {
    if (id) return; // ao editar existente, respeitar o form_key persistido
    const next = makeFormKeyFromName(formName);
    setFormKey(next);
  }, [formName, id]);

  useEffect(() => {
    // no contexto "Meus formulários", default é categoria geral
    if (isGeneralBuilder && !id) {
      setCategoria('eventos_inscricoes');
    }
  }, [isGeneralBuilder, id]);

  const loadCategorias = async () => {
    try {
      const cats = await FormService.getCategories();
      const generalKeys = new Set([
        'eventos_inscricoes',
        'ouvidoria_atendimento',
        'pesquisas_avaliacoes',
        'capacitacoes_educacao_permanente',
        'gestao_administrativo',
        'comunicacao',
        'outros_geral',
      ]);
      const sinanKeys = new Set(['notificacao', 'investigacao', 'encerramento']);
      const filtered = (cats || []).filter((c) => (isGeneralBuilder ? generalKeys.has(c.key) : sinanKeys.has(c.key)));
      setCategoriasDisponiveis(filtered);
      // Se categoria atual não existe mais, zera para forçar seleção válida (sem fallback)
      if (filtered.length > 0 && !filtered.some((c) => c.key === categoria)) {
        setCategoria('');
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setCategoriasDisponiveis([]);
      setCategoria('');
    }
  };

  const loadForm = async () => {
    try {
      setLoading(true);
      const form = await FormService.getFormById(parseInt(id!));

      const nome = form.nome;
      const descricao = form.descricao || '';
      const fKey = form.form_key;
      const cat = form.categoria || (isGeneralBuilder ? 'eventos_inscricoes' : 'notificacao');

      setFormName(nome);
      setFormDescription(descricao);
      setFormKey(fKey);
      setCategoria(cat);
      setActiveVersionId(
        form.active_version_id != null ? Number(form.active_version_id) : null
      );

      let loadedSchema: FormSchema = { agravo: '', sections: [] };
      if (form.active_version_id && form.versions) {
        const activeVersion = form.versions.find(v => v.id === form.active_version_id);
        if (activeVersion?.schema_json) loadedSchema = activeVersion.schema_json;
        if (activeVersion?.ui_json) {
          setExistingUiJson(activeVersion.ui_json as Record<string, unknown>);
        }
      }
      setSchema(loadedSchema);

      // Definir snapshot "limpo" com os valores exatos da API
      const snap = JSON.stringify({ formName: nome, formDescription: descricao, formKey: fKey, categoria: cat, schema: loadedSchema });
      setLastSavedState(snap);

      // Verificar se há rascunho local mais recente que o estado carregado
      try {
        const raw = localStorage.getItem(`form-draft-${id}`);
        if (raw) {
          const d = JSON.parse(raw);
          if (d?.savedAt && d?.schema) setPendingDraft(d);
        }
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Erro ao carregar formulário:', err);
      toast.error('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      console.log('Carregando tabelas do banco...');
      const tables = await DatabaseService.getTables();
      console.log('Tabelas carregadas:', tables);
      setAvailableTables(tables);
    } catch (error) {
      console.error('Erro ao carregar tabelas:', error);
      toast.error('Erro ao carregar tabelas do banco de dados. Verifique se o backend está rodando.');
    } finally {
      setLoadingTables(false);
    }
  };

  const databaseTableLabels: Record<string, string> = {
    tipo_estado: 'Estados (UF)',
    tipo_municipio: 'Municípios',
    tipo_bairro: 'Bairros',
    tipo_genero: 'Gênero / Sexo',
    tipo_raca: 'Raça/Cor',
    tipo_escolaridade: 'Escolaridade',
    tipo_cbo: 'Ocupação (CBO)',
    tipo_cnae: 'Atividade econômica (CNAE)',
    tipo_pais: 'Países',
    code_list: 'Listas (Code lists)',
    code_list_item: 'Itens de lista (Code lists)',
    crs: 'CRS',
    nhe: 'NHE',
  };

  const prettyTableName = (t: string) => databaseTableLabels[t] || t;

  const databaseTableDefaults: Record<string, { value: string; label: string }> = {
    // Tipos: normalmente salva "codigo" e exibe "descricao"
    tipo_estado: { value: 'codigo', label: 'descricao' },
    tipo_municipio: { value: 'codigo', label: 'descricao' },
    tipo_bairro: { value: 'idtipo_bairro', label: 'descricao' },
    tipo_genero: { value: 'codigo', label: 'descricao' },
    tipo_raca: { value: 'codigo', label: 'descricao' },
    tipo_escolaridade: { value: 'codigo', label: 'descricao' },
    tipo_cbo: { value: 'codigo', label: 'descricao' },
    tipo_cnae: { value: 'codigo', label: 'descricao' },
    tipo_pais: { value: 'codigo', label: 'descricao' },
    // Code list
    code_list: { value: 'key', label: 'name' },
    code_list_item: { value: 'value', label: 'label' },
    // Outras
    crs: { value: 'codigo', label: 'descricao' },
    nhe: { value: 'codigo', label: 'nome' },
  };

  const filteredTables = useMemo(() => {
    const q = (tableSearch || '').trim().toLowerCase();
    const list = availableTables || [];
    if (!q) return list;
    return list.filter((t) => `${t} ${prettyTableName(t)}`.toLowerCase().includes(q));
  }, [availableTables, tableSearch]);

  const loadColumns = async (table: string) => {
    if (availableColumns[table]) return; // Já carregou
    
    try {
      const columns = await DatabaseService.getColumns(table);
      setAvailableColumns(prev => ({ ...prev, [table]: columns }));
    } catch (error) {
      console.error('Erro ao carregar colunas:', error);
    }
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: 'Nova Seção',
      order: schema.sections.length + 1,
      fields: []
    };
    setSchema({ ...schema, sections: [...schema.sections, newSection] });
    setActiveSection(schema.sections.length);
  };

  const updateSection = (idx: number, updates: Partial<FormSection>) => {
    const newSections = [...schema.sections];
    newSections[idx] = { ...newSections[idx], ...updates };
    setSchema({ ...schema, sections: newSections });
  };

  const deleteSection = (idx: number) => {
    const newSections = schema.sections.filter((_, i) => i !== idx);
    setSchema({ ...schema, sections: newSections });
    if (activeSection === idx) setActiveSection(null);
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    const newSections = [...schema.sections];
    [newSections[idx - 1], newSections[idx]] = [newSections[idx], newSections[idx - 1]];
    // Atualizar order
    newSections.forEach((section, i) => section.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const moveSectionDown = (idx: number) => {
    if (idx === schema.sections.length - 1) return;
    const newSections = [...schema.sections];
    [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
    // Atualizar order
    newSections.forEach((section, i) => section.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const moveSectionTo = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newSections = [...schema.sections];
    const [moved] = newSections.splice(fromIdx, 1);
    if (!moved) return;
    const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
    newSections.splice(insertAt, 0, moved);
    newSections.forEach((section, i) => (section.order = i + 1));
    setSchema({ ...schema, sections: newSections });
    setActiveSection(insertAt);
  };

  const moveFieldUp = (sectionIdx: number, fieldIdx: number) => {
    if (fieldIdx === 0) return;
    const newSections = [...schema.sections];
    const fields = newSections[sectionIdx].fields;
    [fields[fieldIdx - 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx - 1]];
    // Atualizar order
    fields.forEach((field, i) => field.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const moveFieldDown = (sectionIdx: number, fieldIdx: number) => {
    const newSections = [...schema.sections];
    const fields = newSections[sectionIdx].fields;
    if (fieldIdx === fields.length - 1) return;
    [fields[fieldIdx], fields[fieldIdx + 1]] = [fields[fieldIdx + 1], fields[fieldIdx]];
    // Atualizar order
    fields.forEach((field, i) => field.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const createFieldByType = (type: string, order: number): FormField => {
    const base = {
      key: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      label: 'Novo Campo',
      required: false,
      order,
      addressFields: ['cep', 'state', 'city', 'street', 'neighborhood', 'number', 'complement', 'reference'] as const,
    };
    if (type === 'text') return { ...base, maxLength: 255 };
    if (type === 'textarea') return { ...base, maxLength: 1500 };
    if (type === 'table') {
      return {
        ...base,
        label: 'Nova Tabela',
        tableColumns: [
          { key: 'coluna_1', label: 'Coluna 1', type: 'text' },
          { key: 'coluna_2', label: 'Coluna 2', type: 'number' },
        ],
        addRowLabel: 'Adicionar linha',
      } as FormField;
    }
    if (type === 'linear_scale') {
      const lo = 1;
      const hi = 5;
      return {
        ...base,
        label: 'Nova pergunta em escala',
        min: lo,
        max: hi,
        step: 1,
        scalePointLabels: [
          { value: lo, label: '' },
          { value: hi, label: '' },
        ],
      } as FormField;
    }
    return base as FormField;
  };

  const addField = (sectionIdx: number, fieldType?: string, atIndex?: number) => {
    const section = schema.sections[sectionIdx];
    const order = atIndex != null ? atIndex + 1 : section.fields.length + 1;
    const newField = createFieldByType(fieldType || 'text', order);

    const newSections = [...schema.sections];
    const fields = [...newSections[sectionIdx].fields];
    const insertAt = atIndex != null ? Math.min(atIndex, fields.length) : fields.length;
    fields.splice(insertAt, 0, newField);
    fields.forEach((f, i) => (f.order = i + 1));
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields };
    setSchema({ ...schema, sections: newSections });
    setActiveField({ sectionIdx, fieldIdx: insertAt });
  };

  /**
   * Encontra a posição (seção, índice) de um campo pelo key.
   */
  const locateField = (key: string): { sectionIdx: number; fieldIdx: number } | null => {
    for (let s = 0; s < schema.sections.length; s++) {
      const idx = (schema.sections[s].fields || []).findIndex((f) => f.key === key);
      if (idx >= 0) return { sectionIdx: s, fieldIdx: idx };
    }
    return null;
  };

  /**
   * Cria um campo de seleção relacionado a outro existente, abaixo (filho cascata) ou
   * acima (pai cascata). Usado pelas sugestões do `FieldSourceConfig`.
   */
  const addRelatedField = (
    req:
      | {
          kind: 'addChildBelow';
          parentField: FormField;
          childSource: { endpoint: string; defaultStaticParams?: Record<string, string> };
          childLabel: string;
        }
      | {
          kind: 'addParentAbove';
          childField: FormField;
          parentSource: {
            endpoint: string;
            defaultStaticParams?: Record<string, string>;
            acceptedParentKeys?: string[];
          };
          parentLabel: string;
        },
  ): void => {
    if (req.kind === 'addChildBelow') {
      const pos = locateField(req.parentField.key);
      if (!pos) return;
      const parentType = req.parentField.type;
      const childType: string =
        parentType === 'select-search' || parentType === 'multi-select' ? parentType : 'select';

      const base = createFieldByType(childType, pos.fieldIdx + 2);
      const childField: FormField = {
        ...base,
        label: req.childLabel,
        dataSource: 'api',
        apiSelectEndpoint: req.childSource.endpoint,
        apiSelectEndpointParams: [req.parentField.key],
        apiSelectStaticParams: req.childSource.defaultStaticParams,
        apiListGuidedPreset: undefined,
        options: undefined,
      };

      const newSections = [...schema.sections];
      const fields = [...newSections[pos.sectionIdx].fields];
      const insertAt = Math.min(pos.fieldIdx + 1, fields.length);
      fields.splice(insertAt, 0, childField);
      fields.forEach((f, i) => (f.order = i + 1));
      newSections[pos.sectionIdx] = { ...newSections[pos.sectionIdx], fields };
      setSchema({ ...schema, sections: newSections });
      setActiveField({ sectionIdx: pos.sectionIdx, fieldIdx: insertAt });
      return;
    }

    // addParentAbove
    const pos = locateField(req.childField.key);
    if (!pos) return;
    const childType = req.childField.type;
    const parentType: string =
      childType === 'select-search' || childType === 'multi-select' ? childType : 'select';

    // O backend só reconhece nomes de query param específicos pra essa cascata
    // (ex.: 'crs_id' pra Regional). Sem isso, a lista do filho não filtra.
    // Forçamos o key do campo pai a ser o nome aceito; se já existir, sufixamos —
    // mas nesse caso a cascata pode não funcionar pro segundo pai (limitação do backend).
    const allKeys = new Set<string>();
    for (const s of schema.sections) for (const f of s.fields) if (f.key) allKeys.add(f.key);

    const preferredKey = req.parentSource.acceptedParentKeys?.[0];
    let parentKey: string;
    if (preferredKey && !allKeys.has(preferredKey)) {
      parentKey = preferredKey;
    } else if (preferredKey) {
      let n = 2;
      while (allKeys.has(`${preferredKey}_${n}`)) n++;
      parentKey = `${preferredKey}_${n}`;
    } else {
      parentKey = `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    const base = createFieldByType(parentType, pos.fieldIdx + 1);
    const parentField: FormField = {
      ...base,
      key: parentKey,
      label: req.parentLabel,
      dataSource: 'api',
      apiSelectEndpoint: req.parentSource.endpoint,
      apiSelectStaticParams: req.parentSource.defaultStaticParams,
      apiSelectEndpointParams: undefined,
      apiListGuidedPreset: undefined,
      options: undefined,
    };

    const newSections = [...schema.sections];
    const fields = [...newSections[pos.sectionIdx].fields];
    const insertAt = pos.fieldIdx; // acima
    fields.splice(insertAt, 0, parentField);

    // Vincula o filho ao novo pai
    const childIdxAfterInsert = pos.fieldIdx + 1;
    fields[childIdxAfterInsert] = {
      ...fields[childIdxAfterInsert],
      apiSelectEndpointParams: [parentKey],
      apiListGuidedPreset: undefined,
    };

    fields.forEach((f, i) => (f.order = i + 1));
    newSections[pos.sectionIdx] = { ...newSections[pos.sectionIdx], fields };
    setSchema({ ...schema, sections: newSections });
    setActiveField({ sectionIdx: pos.sectionIdx, fieldIdx: insertAt });
  };

  /** Linhas exibidas no editor da escala linear (persistido em `scalePointLabels` ou legado nos dois extremos). */
  const getLinearScaleEditorRows = (f: FormField): Array<{ value: number; label: string }> => {
    const loB = Math.min(Math.floor(f.min ?? 1), Math.floor(f.max ?? 5));
    const hiB = Math.max(Math.floor(f.min ?? 1), Math.floor(f.max ?? 5));
    if (f.scalePointLabels && f.scalePointLabels.length > 0) {
      return normalizeScalePointLabelRows(
        f.scalePointLabels.map((r) => ({
          value: Number(r.value),
          label: String(r.label ?? ''),
        })),
        f.min,
        f.max
      );
    }
    if (loB === hiB) {
      const merged = [f.scaleLowLabel, f.scaleHighLabel].filter(Boolean).join(' / ');
      return [{ value: loB, label: merged || String(f.scaleLowLabel ?? '') }];
    }
    return [
      { value: loB, label: String(f.scaleLowLabel ?? '') },
      { value: hiB, label: String(f.scaleHighLabel ?? '') },
    ];
  };

  const persistScalePointLabelRows = (rows: Array<{ value: number; label: string }>, f: FormField) =>
    normalizeScalePointLabelRows(rows, f.min, f.max);

  const updateField = (sectionIdx: number, fieldIdx: number, updates: Partial<FormField>) => {
    const newSections = [...schema.sections];
    const current = newSections[sectionIdx].fields[fieldIdx];
    const next: FormField = {
      ...current,
      ...updates,
    };

    // Campos fixos (modelo híbrido): permitir customização sem o backend "voltar pro canônico".
    // A UI continua usando label/type normais, mas persistimos também os overrides.
    if (current?.isFixedColumn) {
      if (Object.prototype.hasOwnProperty.call(updates, 'label')) {
        next.customLabel = (updates as any).label ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
        next.customType = (updates as any).type ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'apiSelectEndpoint')) {
        next.customApiSelectEndpoint = (updates as any).apiSelectEndpoint ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'codeList')) {
        next.customCodeList = (updates as any).codeList ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'maxLength')) {
        next.customMaxLength = (updates as any).maxLength ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'options')) {
        next.customOptions = (updates as any).options ?? null;
      }
    }

    newSections[sectionIdx].fields[fieldIdx] = next;
    setSchema({ ...schema, sections: newSections });
  };

  const deleteField = (sectionIdx: number, fieldIdx: number) => {
    const newSections = [...schema.sections];
    newSections[sectionIdx].fields = newSections[sectionIdx].fields.filter((_, i) => i !== fieldIdx);
    setSchema({ ...schema, sections: newSections });
    if (activeField?.sectionIdx === sectionIdx && activeField?.fieldIdx === fieldIdx) {
      setActiveField(null);
    }
  };

  /** Copia o campo logo abaixo, com nova chave e rótulo “(cópia)”. Coluna fixa SINAN não é duplicada (evita conflito no banco). */
  const duplicateField = (sectionIdx: number, fieldIdx: number) => {
    const source = schema.sections[sectionIdx]?.fields[fieldIdx];
    if (!source) return;

    const allKeys = new Set<string>();
    for (const s of schema.sections) {
      for (const f of s.fields) {
        if (f.key) allKeys.add(f.key);
      }
    }

    let newKey = `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let n = 2;
    while (allKeys.has(newKey)) {
      newKey = `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${n++}`;
    }

    const cloned = JSON.parse(JSON.stringify(source)) as FormField;
    cloned.key = newKey;
    const baseLabel = String(source.label ?? 'Campo').replace(/\s*\(cópia\)\s*$/i, '').trim();
    cloned.label = `${baseLabel || 'Campo'} (cópia)`;

    if (cloned.isFixedColumn) {
      cloned.isFixedColumn = false;
      cloned.fixedColumnName = undefined;
    }

    const newSections = [...schema.sections];
    const fields = [...newSections[sectionIdx].fields];
    const insertAt = fieldIdx + 1;
    fields.splice(insertAt, 0, cloned);
    fields.forEach((f, i) => {
      f.order = i + 1;
    });
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields };
    setSchema({ ...schema, sections: newSections });
    setActiveField({ sectionIdx, fieldIdx: insertAt });
  };

  const moveFieldTo = (fromSectionIdx: number, fromFieldIdx: number, toSectionIdx: number, toIndex: number) => {
    const newSections = schema.sections.map(s => ({ ...s, fields: [...s.fields] }));
    const [moved] = newSections[fromSectionIdx].fields.splice(fromFieldIdx, 1);
    if (!moved) return;
    const targetFields = newSections[toSectionIdx].fields;
    const insertAt = Math.min(toIndex, targetFields.length);
    targetFields.splice(insertAt, 0, moved);
    newSections.forEach((section, si) => {
      section.fields.forEach((f, i) => (f.order = i + 1));
    });
    setSchema({ ...schema, sections: newSections });
    setActiveField({ sectionIdx: toSectionIdx, fieldIdx: insertAt });
  };

  /**
   * Cria ou atualiza o formulário, grava uma nova versão do schema e publica.
   * Usado pelo Salvar e pelo fluxo “Campos Fixos” antes de existir versão ativa.
   */
  const persistFormAndPublish = async (): Promise<{ formId: number; versionId: number } | null> => {
    const userId = user?.sub || user?.id;
    if (!userId) {
      toast.error('Usuário não autenticado');
      console.error('user object:', user);
      return null;
    }

    const computedKey =
      (formKey || '').trim() ||
      makeFormKeyFromName(formName) ||
      (isGeneralBuilder ? `FORM_${Date.now().toString(36).toUpperCase()}`.slice(0, 50) : '');

    if (!computedKey && !id) {
      toast.error('Informe um código do formulário (form_key).');
      return null;
    }

    const formData = {
      nome: (formName || '').trim(),
      form_key: computedKey,
      descricao: (formDescription || '').trim(),
      categoria: (categoria || '').trim(),
      created_by: userId
    };
    if (!formData.nome) {
      toast.error('Informe o nome do formulário.');
      return null;
    }
    if (!formData.categoria) {
      toast.error('Selecione uma categoria para o formulário antes de salvar.');
      return null;
    }

    let formId: number;
    if (id) {
      if (isGeneralBuilder) {
        await FormService.updateMyForm(parseInt(id), {
          nome: formData.nome,
          descricao: formData.descricao,
          categoria: formData.categoria,
        });
      } else {
        await FormService.updateForm(parseInt(id), formData);
      }
      formId = parseInt(id);
    } else {
      if (isGeneralBuilder) {
        const newForm = await FormService.createMyForm({
          form_key: formData.form_key,
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          categoria: formData.categoria,
          visibility: 'PRIVATE',
          require_login: false,
          is_active: true,
        });
        formId = newForm.id;
        navigate(`/private/meus-formularios/${formId}/editar`, { replace: true });
      } else {
        const newForm = await FormService.createForm(formData);
        formId = newForm.id;
      }
    }

    const schemaToSave = {
      ...schema,
      agravo: computedKey,
      title: (formData.nome || '').trim() || undefined,
    };

    const version = await FormService.createVersion(formId, {
      schema_json: schemaToSave,
      ui_json: existingUiJson,
      rules_json: {},
      published_by: userId
    });

    await FormService.publishVersion(formId, version.id, userId);

    return { formId, versionId: version.id };
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const result = await persistFormAndPublish();
      if (!result) return;

      // Marcar como limpo e limpar rascunho ANTES de navegar
      setLastSavedState(JSON.stringify({ formName, formDescription, formKey, categoria, schema }));
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      skipBlockerRef.current = true;

      toast.success('Formulário salvo e publicado com sucesso!');
      navigate(isGeneralBuilder ? '/private/meus-formularios' : '/private/formularios-admin');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      toast.error(`Erro ao salvar formulário: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const openFixedColumns = async () => {
    if (isGeneralBuilder) return;
    if (id && activeVersionId != null) {
      navigate(`/private/formularios-admin/${id}/versoes/${activeVersionId}/campos-fixos`);
      return;
    }
    try {
      setLoading(true);
      const result = await persistFormAndPublish();
      if (!result) return;
      setActiveVersionId(result.versionId);
      navigate(
        `/private/formularios-admin/${result.formId}/versoes/${result.versionId}/campos-fixos`,
        { replace: !id }
      );
    } catch (err: any) {
      console.error('Erro ao preparar campos fixos:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      toast.error(`Não foi possível abrir campos fixos: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      metadata: {
        formName,
        formKey,
        formDescription,
        categoria,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      },
      schema
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formulario_${formKey || 'novo'}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validar estrutura básica
        if (!importedData.schema || !importedData.metadata) {
          toast.error('Arquivo JSON inválido! Deve conter "schema" e "metadata".');
          return;
        }

        // Carregar dados
        setFormName(importedData.metadata.formName || '');
        setFormKey(importedData.metadata.formKey || importedData.metadata.agravoKey || '');
        setFormDescription(importedData.metadata.formDescription || '');
        setCategoria(importedData.metadata.categoria || 'notificacao');
        setSchema(importedData.schema);

        toast.success('Formulário importado com sucesso!');
      } catch (err) {
        console.error('Erro ao importar JSON:', err);
        toast.error('Erro ao ler arquivo JSON. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);

    // Limpar input para permitir reimportar o mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportFromExcel = (xlsPreview: XlsFormPreview) => {
    // Build a lookup for codeList items so we can inline them (no DB write needed in builder mode)
    const codeListMap: Record<string, { value: string; label: string }[]> = {};
    xlsPreview.codeLists.forEach((cl) => {
      codeListMap[cl.name] = cl.items.map(i => ({ value: i.code, label: i.label }));
    });

    const populatedSchema: FormSchema = {
      ...xlsPreview.schema_json,
      sections: xlsPreview.schema_json.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          if (field.codeList && codeListMap[field.codeList]) {
            const { codeList: _removed, ...rest } = field as any;
            return { ...rest, options: codeListMap[field.codeList] } as FormField;
          }
          return field;
        }),
      })),
    };

    setFormName(xlsPreview.form.nome);
    setFormKey(xlsPreview.form.form_key);
    setFormDescription(xlsPreview.form.descricao || '');
    setCategoria(xlsPreview.form.categoria || (isGeneralBuilder ? 'eventos_inscricoes' : 'notificacao'));
    setSchema(populatedSchema);
  };

  const handleApplyTemplate = (template: FormTemplate) => {
    const regeneratedSections = template.schema.sections.map((sec) => ({
      ...sec,
      id: `s${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    setSchema({ ...template.schema, sections: regeneratedSections });
    if (!formName || formName === 'Novo Formulário' || formName === '') {
      setFormName(template.name);
    }
    if (!formDescription) {
      setFormDescription(template.description);
    }
    if (isGeneralBuilder && !categoria) {
      setCategoria(template.category);
    }
  };

  // ========== FUNÇÕES DE REGRAS ==========

  const addRule = () => {
    const newRule: FormRule = {
      id: `rule_${Date.now()}`,
      description: '',
      when: {
        op: 'eq',
        left: '',
        right: ''
      },
      then: [],
      else: []
    };
    setSchema({
      ...schema,
      rules: [...(schema.rules || []), newRule]
    });
  };

  const updateRule = (idx: number, updates: Partial<FormRule>) => {
    const newRules = [...(schema.rules || [])];
    newRules[idx] = { ...newRules[idx], ...updates };
    setSchema({ ...schema, rules: newRules });
  };

  const deleteRule = (idx: number) => {
    const newRules = (schema.rules || []).filter((_, i) => i !== idx);
    setSchema({ ...schema, rules: newRules });
  };

  const updateRuleCondition = (ruleIdx: number, updates: Partial<RuleCondition>) => {
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx].when = { ...newRules[ruleIdx].when, ...updates };
    setSchema({ ...schema, rules: newRules });
  };

  const addRuleAction = (ruleIdx: number, type: 'then' | 'else') => {
    const newAction: RuleAction = {
      action: 'show',
      target: ''
    };
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx][type] = [...(newRules[ruleIdx][type] || []), newAction];
    setSchema({ ...schema, rules: newRules });
  };

  const addQuickRuleAction = (ruleIdx: number, type: 'then' | 'else', action: RuleAction['action']) => {
    const newAction: RuleAction = { action, target: '' };
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx][type] = [...(newRules[ruleIdx][type] || []), newAction];
    setSchema({ ...schema, rules: newRules });
  };

  const updateRuleAction = (ruleIdx: number, type: 'then' | 'else', actionIdx: number, updates: Partial<RuleAction>) => {
    const newRules = [...(schema.rules || [])];
    const actions = [...(newRules[ruleIdx][type] || [])];
    actions[actionIdx] = { ...actions[actionIdx], ...updates };
    newRules[ruleIdx][type] = actions;
    setSchema({ ...schema, rules: newRules });
  };

  const deleteRuleAction = (ruleIdx: number, type: 'then' | 'else', actionIdx: number) => {
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx][type] = (newRules[ruleIdx][type] || []).filter((_, i) => i !== actionIdx);
    setSchema({ ...schema, rules: newRules });
  };

  // Obter lista de todos os campos (key) para usar nas regras
  const getAllFieldKeys = (): string[] => {
    const keys: string[] = [];
    schema.sections?.forEach(section => {
      section.fields?.forEach(field => {
        if (field.key) keys.push(field.key);
      });
    });
    return keys;
  };

  // Lista de campos com key, label e tipo/opções (para regras: dropdown com nome legível)
  const getFieldsForRules = (): Array<{ key: string; label: string; type?: string; options?: Array<{ value: string; label: string }> }> => {
    const list: Array<{ key: string; label: string; type?: string; options?: Array<{ value: string; label: string }> }> = [];
    schema.sections?.forEach(section => {
      section.fields?.forEach(field => {
        if (field.key) {
          list.push({
            key: field.key,
            label: field.label || field.key,
            type: field.type,
            options: field.options
          });
        }
      });
    });
    return list;
  };

  const getSectionsForRules = (): Array<{ id: string; title: string }> => {
    return (schema.sections || []).map((s) => ({ id: String(s.id), title: String(s.title || s.id) }));
  };

  // Dado o key do campo da condição (left), retorna o campo do schema para pegar opções
  const getConditionField = (fieldKey: string): FormField | undefined => {
    for (const section of schema.sections || []) {
      const found = section.fields?.find(f => f.key === fieldKey);
      if (found) return found;
    }
    return undefined;
  };

  const fieldTypesFlat = fieldTypeGroups.flatMap((g) => g.options);

  const allLucideIconNames = useMemo(() => Object.keys(dynamicIconImports).sort(), []);

  const LucideIconPreview: React.FC<{ name?: string; className?: string }> = ({ name, className }) => {
    const key = (name || '').trim();
    const importer = (dynamicIconImports as any)[key] as undefined | (() => Promise<any>);
    if (!key || !importer) return <span className={className} />;
    const Icon = React.lazy(importer);
    return (
      <Suspense fallback={<span className={className} />}>
        <Icon className={className} />
      </Suspense>
    );
  };

  const IconPicker: React.FC<{
    value?: string;
    onChange: (next?: string) => void;
    canSeeAll?: boolean;
  }> = ({ value, onChange, canSeeAll }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [limit, setLimit] = useState(120);
    const [showAll, setShowAll] = useState(false);
    const current = (value || '').trim();
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;

      const onPointerDown = (ev: MouseEvent | TouchEvent) => {
        const root = rootRef.current;
        const target = ev.target as Node | null;
        if (!root || !target) return;
        if (root.contains(target)) return;
        setOpen(false);
      };

      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') setOpen(false);
      };

      document.addEventListener('mousedown', onPointerDown);
      document.addEventListener('touchstart', onPointerDown, { passive: true });
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('mousedown', onPointerDown);
        document.removeEventListener('touchstart', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [open]);

    const normalizeQuery = (s: string) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // Mapa de sinônimos PT-BR -> termos prováveis no Lucide (inglês / kebab-case)
    // Ajuda usuários leigos a encontrar ícones sem saber o nome em inglês.
    const ptToLucideHints: Record<string, string[]> = {
      gato: ['cat', 'paw', 'paw-print'],
      cachorro: ['dog', 'paw', 'paw-print'],
      pata: ['paw', 'paw-print'],
      coracao: ['heart'],
      coração: ['heart'],
      calendario: ['calendar', 'date'],
      agenda: ['calendar'],
      relogio: ['clock', 'timer'],
      relógio: ['clock', 'timer'],
      hora: ['clock', 'time', 'timer'],
      telefone: ['phone', 'mobile'],
      celular: ['phone', 'mobile'],
      email: ['mail', 'email'],
      mapa: ['map', 'pin', 'location'],
      localizacao: ['map', 'pin', 'location'],
      localização: ['map', 'pin', 'location'],
      endereco: ['map', 'pin', 'home'],
      endereço: ['map', 'pin', 'home'],
      pessoas: ['users', 'user', 'person'],
      pessoa: ['user', 'person'],
      usuario: ['user', 'person'],
      usuários: ['users', 'user', 'person'],
      usuarioS: ['users'],
      equipe: ['users'],
      seguranca: ['shield', 'lock', 'key'],
      segurança: ['shield', 'lock', 'key'],
      arquivo: ['file', 'folder', 'archive'],
      pasta: ['folder'],
      baixar: ['download'],
      enviar: ['upload', 'send'],
      buscar: ['search'],
      lupa: ['search'],
      imprimir: ['printer'],
      grafico: ['chart', 'bar-chart', 'pie-chart', 'line-chart'],
      gráfico: ['chart', 'bar-chart', 'pie-chart', 'line-chart'],
      dinheiro: ['dollar', 'coins', 'wallet', 'credit-card'],
      dinheiroS: ['dollar'],
      saude: ['heart', 'activity', 'stethoscope', 'hospital', 'cross'],
      saúde: ['heart', 'activity', 'stethoscope', 'hospital', 'cross'],
    };

    const curatedIcons = useMemo(
      () =>
        [
          { name: 'calendar', label: 'Calendário', terms: ['data', 'agenda', 'evento'] },
          { name: 'clock', label: 'Relógio', terms: ['hora', 'tempo', 'prazo'] },
          { name: 'users', label: 'Pessoas / Equipe', terms: ['usuários', 'usuario', 'pessoa', 'grupo', 'servidores'] },
          { name: 'user', label: 'Pessoa', terms: ['perfil', 'usuario'] },
          { name: 'phone', label: 'Telefone', terms: ['celular', 'contato'] },
          { name: 'mail', label: 'E-mail', terms: ['email', 'correio'] },
          { name: 'map-pin', label: 'Localização', terms: ['mapa', 'endereço', 'local'] },
          { name: 'home', label: 'Início', terms: ['casa', 'principal'] },
          { name: 'building-2', label: 'Instituição', terms: ['prédio', 'unidade', 'hospital'] },
          { name: 'hospital', label: 'Hospital', terms: ['saúde', 'unidade'] },
          { name: 'stethoscope', label: 'Saúde', terms: ['atendimento', 'médico'] },
          { name: 'activity', label: 'Atividade', terms: ['saúde', 'monitoramento'] },
          { name: 'shield', label: 'Segurança', terms: ['proteção', 'vigilância'] },
          { name: 'lock', label: 'Cadeado', terms: ['senha', 'restrito'] },
          { name: 'file-text', label: 'Documento', terms: ['arquivo', 'ficha', 'formulário'] },
          { name: 'folder', label: 'Pasta', terms: ['arquivos'] },
          { name: 'upload', label: 'Enviar', terms: ['upload', 'anexar'] },
          { name: 'download', label: 'Baixar', terms: ['download', 'exportar'] },
          { name: 'search', label: 'Buscar', terms: ['pesquisar', 'lupa'] },
          { name: 'clipboard-list', label: 'Lista', terms: ['checklist', 'tarefas'] },
          { name: 'check', label: 'Confirmar', terms: ['ok', 'certo'] },
          { name: 'x', label: 'Fechar', terms: ['cancelar'] },
          { name: 'trash', label: 'Lixeira', terms: ['excluir', 'apagar'] },
          { name: 'edit', label: 'Editar', terms: ['alterar', 'lápis'] },
          { name: 'plus', label: 'Adicionar', terms: ['novo', 'mais'] },
          { name: 'bell', label: 'Notificação', terms: ['alerta', 'aviso'] },
          { name: 'alert-triangle', label: 'Alerta', terms: ['atenção', 'aviso'] },
          { name: 'bar-chart-3', label: 'Gráfico', terms: ['indicador', 'estatística'] },
          { name: 'printer', label: 'Imprimir', terms: ['impressão'] },
          { name: 'badge-check', label: 'Certificado', terms: ['conclusão', 'aprovado'] },
          { name: 'ticket', label: 'Inscrição', terms: ['credenciamento', 'evento'] },
        ] as Array<{ name: string; label: string; terms: string[] }>,
      []
    );

    const ptKeywordsForIcon = (name: string): string[] => {
      const n = normalizeQuery(name);
      const keywords: string[] = [];

      // Regras rápidas (PT-BR) para facilitar busca por leigos
      if (n.includes('calendar') || n.includes('date')) keywords.push('calendario', 'data', 'agenda');
      if (n.includes('clock') || n.includes('time')) keywords.push('relogio', 'hora', 'tempo');
      if (n.includes('mail') || n.includes('email')) keywords.push('email', 'e-mail', 'correio');
      if (n.includes('phone') || n.includes('mobile')) keywords.push('telefone', 'celular', 'contato');
      if (n.includes('map') || n.includes('pin') || n.includes('location')) keywords.push('mapa', 'local', 'localizacao', 'endereco');
      if (n.includes('user') || n.includes('users') || n.includes('person')) keywords.push('pessoa', 'pessoas', 'usuario', 'usuarios', 'equipe');
      if (n.includes('shield') || n.includes('lock') || n.includes('key')) keywords.push('seguranca', 'protecao', 'vigilancia', 'senha');
      if (n.includes('file') || n.includes('folder') || n.includes('archive')) keywords.push('arquivo', 'pasta', 'documento');
      if (n.includes('download')) keywords.push('baixar', 'download');
      if (n.includes('upload')) keywords.push('enviar', 'upload');
      if (n.includes('search')) keywords.push('buscar', 'pesquisar', 'lupa');
      if (n.includes('trash') || n.includes('delete')) keywords.push('lixeira', 'excluir', 'apagar');
      if (n.includes('check') || n.includes('circle-check')) keywords.push('ok', 'confirmar', 'certo', 'marcar');
      if (n.includes('x') || n.includes('close')) keywords.push('fechar', 'cancelar');
      if (n.includes('edit') || n.includes('pencil')) keywords.push('editar', 'alterar', 'lapis');
      if (n.includes('plus') || n.includes('add')) keywords.push('adicionar', 'novo', 'mais');
      if (n.includes('minus') || n.includes('remove')) keywords.push('remover', 'menos');
      if (n.includes('info')) keywords.push('informacao', 'ajuda');
      if (n.includes('alert') || n.includes('warning') || n.includes('triangle')) keywords.push('alerta', 'atencao', 'aviso');
      if (n.includes('home') || n.includes('house')) keywords.push('casa', 'inicio');
      if (n.includes('building') || n.includes('hospital')) keywords.push('predio', 'instituicao', 'hospital', 'unidade');
      if (n.includes('chart') || n.includes('bar') || n.includes('pie')) keywords.push('grafico', 'indicador', 'estatistica');
      if (n.includes('camera') || n.includes('image') || n.includes('photo')) keywords.push('foto', 'imagem', 'camera');
      if (n.includes('printer')) keywords.push('imprimir', 'impressao');

      return keywords;
    };

    const matches = (name: string, query: string) => {
      const nq = normalizeQuery(query);
      if (!nq) return true;

      // suporta múltiplas palavras: todas devem bater em algum indício
      const terms = nq.split(/\s+/g).filter(Boolean);
      const nn = normalizeQuery(name);
      const hayBase = `${nn} ${nn.replace(/-/g, ' ')} ${ptKeywordsForIcon(name).join(' ')}`;

      return terms.every((t) => {
        if (hayBase.includes(t)) return true;
        const hints = ptToLucideHints[t];
        if (!hints?.length) return false;
        return hints.some((h) => nn.includes(normalizeQuery(h)));
      });
    };

    const filtered = useMemo(() => {
      const query = q.trim();

      if (!showAll) {
        const nq = normalizeQuery(query);
        const list = !nq
          ? curatedIcons
          : curatedIcons.filter((it) => {
              const hay = [it.name, it.label, ...(it.terms || [])]
                .map((x) => normalizeQuery(x))
                .join(' ');
              return hay.includes(nq);
            });
        return list.map((it) => it.name);
      }

      const base = allLucideIconNames;
      const list = query ? base.filter((n) => matches(n, query)) : base;
      return list.slice(0, Math.max(40, limit));
    }, [q, allLucideIconNames, limit, showAll, curatedIcons]);

    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-2 py-1 border border-blue-300 rounded text-sm bg-white inline-flex items-center gap-2 hover:bg-blue-50"
          title="Escolher ícone"
        >
          <LucideIconPreview name={current} className="h-4 w-4 text-blue-700" />
          <span className="text-gray-700">{current ? current : 'Ícone'}</span>
        </button>

        {open ? (
          <div className="absolute z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ícone… (ex: calendário, pessoas)"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              autoFocus
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-gray-500">
                {showAll ? 'Lista completa' : 'Sugestões (mais fácil)'}
              </p>
              {canSeeAll ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAll((v) => !v);
                    setLimit(120);
                  }}
                  className="px-2 py-1 text-[11px] rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
                  title="Alternar entre sugestões e lista completa"
                >
                  {showAll ? 'Mostrar sugestões' : 'Ver todos'}
                </button>
              ) : null}
            </div>

            <div
              className="mt-2 max-h-64 overflow-auto"
              onScroll={(e) => {
                if (!showAll) return;
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                  setLimit((v) => v + 120);
                }
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="h-4 w-4 inline-block" />
                <span>Sem ícone</span>
              </button>

              {filtered.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-blue-50 flex items-center gap-2 ${
                    name === current ? 'bg-blue-50' : ''
                  }`}
                >
                  <LucideIconPreview name={name} className="h-4 w-4 text-gray-700" />
                  <span className="font-mono text-xs text-gray-800">{name}</span>
                </button>
              ))}
              {!filtered.length ? <p className="px-2 py-2 text-xs text-gray-500">Nenhum ícone encontrado.</p> : null}
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const sectionsForRules = getSectionsForRules();
  return (
    <AppPageLayout
      title={id ? 'Editar Formulário' : 'Novo Formulário'}
      subtitle={isGeneralBuilder ? 'Construtor de Formulários (geral)' : 'Construtor visual de formulários SINAN/e-SUS'}
      icon={<FileEdit className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath={isGeneralBuilder ? '/private/meus-formularios' : '/private/formularios-admin'}
      headerActions={
        <div className="flex flex-wrap items-center justify-center gap-2">
          {canSeeAdvanced && (
            <DevActionsMenu
              onExportJSON={handleExportJSON}
              onImportJSON={() => fileInputRef.current?.click()}
            />
          )}
          <button
            type="button"
            onClick={() => setImportExcelOpen(true)}
            className="px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-2"
            title="Importar formulário de planilha Excel"
          >
            <Upload className="h-4 w-4" />
            Importar Planilha
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-3 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={schema.sections.length === 0}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          {isDirty && (
            <span className="flex items-center gap-1 text-xs text-amber-600 px-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
              Não salvo
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`px-4 py-2 rounded-md flex items-center gap-2 font-medium border disabled:opacity-50 transition-colors ${
              isDirty
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
            }`}
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
      }
    >
      {/* ── Banner de rascunho salvo automaticamente ────────────────────── */}
      {pendingDraft && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="flex-1 text-amber-800">
            Rascunho salvo automaticamente em{' '}
            <strong>
              {new Date(pendingDraft.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </strong>
            . Deseja restaurá-lo?
          </span>
          <button
            type="button"
            onClick={() => {
              setFormName(pendingDraft.formName);
              setFormDescription(pendingDraft.formDescription);
              setFormKey(pendingDraft.formKey);
              setCategoria(pendingDraft.categoria);
              setSchema(pendingDraft.schema);
              setPendingDraft(null);
              try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
            }}
            className="px-3 py-1 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700 flex-shrink-0"
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingDraft(null);
              try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
            }}
            className="px-3 py-1 text-xs text-amber-700 border border-amber-300 rounded-md hover:bg-amber-100 flex-shrink-0"
          >
            Descartar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações Gerais */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="form-builder-nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Formulário *
                  </label>
                  <input
                    id="form-builder-nome"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: Dengue"
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">{(formName || '').length}/500</p>
                </div>

                <div>
                  <label htmlFor="form-builder-descricao" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    id="form-builder-descricao"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="form-builder-categoria" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    id="form-builder-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="" disabled>
                      Selecione...
                    </option>
                    {categoriasDisponiveis.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isGeneralBuilder && categoria === 'capacitacoes_educacao_permanente' && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 space-y-2">
                    <p className="text-sm font-semibold text-amber-900">Prova / Quiz (com pontuação)</p>
                    <p className="text-xs text-amber-900/80 leading-snug">
                      Use isso quando você quiser avaliar conhecimento (ex.: pré/pós-teste em capacitações).
                    </p>
                    <label className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={!!schema.quiz?.enabled}
                        onChange={(e) =>
                          setSchema((s) => ({
                            ...s,
                            quiz: {
                              ...s.quiz,
                              enabled: e.target.checked,
                              showScoreAfter: s.quiz?.showScoreAfter ?? true,
                              showCorrectAnswers: s.quiz?.showCorrectAnswers ?? false,
                            },
                          }))
                        }
                        className="rounded"
                      />
                      Ativar pontuação (definir respostas corretas)
                    </label>
                    {schema.quiz?.enabled ? (
                      <div className="space-y-2 pl-1 border-l-2 border-amber-300">
                        <label className="flex items-center gap-2 text-xs text-gray-800">
                          <input
                            type="checkbox"
                            checked={schema.quiz?.showScoreAfter !== false}
                            onChange={(e) =>
                              setSchema((s) => ({
                                ...s,
                                quiz: { ...s.quiz, enabled: true, showScoreAfter: e.target.checked },
                              }))
                            }
                            className="rounded"
                          />
                          Mostrar pontuação após o envio
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-800">
                          <input
                            type="checkbox"
                            checked={!!schema.quiz?.showCorrectAnswers}
                            onChange={(e) =>
                              setSchema((s) => ({
                                ...s,
                                quiz: { ...s.quiz, enabled: true, showCorrectAnswers: e.target.checked },
                              }))
                            }
                            className="rounded"
                          />
                          Mostrar respostas corretas na tela de confirmação
                        </label>
                        <p className="text-[11px] text-amber-900/80 leading-snug">
                          Depois, em cada pergunta, marque como “vale pontos” e informe a resposta correta.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                <button
                  onClick={addSection}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Seção
                </button>
              </div>
            </div>
          </div>

          {/* Editor de Seções e Campos */}
          <div className="lg:col-span-2 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            {/* Tabs de Navegação */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px items-center w-full min-w-0">
                  <button
                    onClick={() => setActiveTab('fields')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'fields'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="inline h-4 w-4 mr-2" />
                    Campos ({schema.sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0)})
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'rules'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Code className="inline h-4 w-4 mr-2" />
                    Regras ({(schema.rules || []).length})
                  </button>
                  {!isGeneralBuilder && (
                    <button
                      type="button"
                      onClick={() => void openFixedColumns()}
                      className="px-6 py-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Colunas fixas SINAN: se o formulário ainda não foi salvo, gravamos e publicamos uma versão ao abrir."
                      disabled={loading}
                    >
                      Campos Fixos
                    </button>
                  )}
                  <span className="flex-1 min-w-0 shrink" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={addSection}
                    className="shrink-0 px-4 py-2 my-2 mr-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar seção
                  </button>
                </nav>
              </div>
            </div>

            {/* Conteúdo da Aba de Campos */}
            {activeTab === 'fields' && (
              <>
            {schema.sections.length === 0 ? (
              <div className="bg-white rounded-xl shadow border-2 border-dashed border-blue-100 p-10 text-center">
                {/* Ícone */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                    <ClipboardList className="h-8 w-8 text-blue-400" />
                  </div>
                </div>

                {/* Título */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Seu formulário está em branco
                </h3>
                <p className="text-sm text-gray-500 mb-7 max-w-sm mx-auto">
                  Comece criando uma seção. Dentro de cada seção você adiciona os campos
                  (texto, data, seleção e muito mais).
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setTemplateGalleryOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-base font-medium shadow-sm transition-colors"
                  >
                    ✨ Escolher um template
                  </button>
                  <button
                    onClick={addSection}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 text-base font-medium transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Começar do zero
                  </button>
                </div>

                {/* Passos guiados */}
                <div className="mt-10 grid grid-cols-3 gap-4 text-left max-w-lg mx-auto">
                  {[
                    { num: '1', title: 'Crie uma seção', desc: 'Agrupe perguntas relacionadas' },
                    { num: '2', title: 'Adicione campos', desc: 'Texto, data, seleção e mais' },
                    { num: '3', title: 'Visualize e salve', desc: 'Use o Preview antes de publicar' },
                  ].map(({ num, title, desc }) => (
                    <div key={num} className="flex gap-2.5 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {num}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sectionSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
              >
                <SortableContext
                  items={schema.sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {schema.sections.map((section, sectionIdx) => (
                    <SortableSectionItem key={section.id} id={section.id}>
                      <div className="bg-white rounded-lg shadow">
                  {/* Cabeçalho da Seção */}
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <SectionDragHandle />
                      {activeSection === sectionIdx ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(sectionIdx, { title: e.target.value })}
                            className="flex-1 px-2 py-1 border border-blue-300 rounded"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <IconPicker
                              value={(section as any).icon ?? ''}
                              onChange={(next) => updateSection(sectionIdx, { icon: next || undefined } as any)}
                              canSeeAll={canSeeAdvanced}
                            />
                          </div>
                        </div>
                      ) : (
                        <h3 
                          className="font-semibold text-gray-900 cursor-pointer flex-1"
                          onClick={() => setActiveSection(sectionIdx)}
                        >
                          {section.title}
                        </h3>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveSectionUp(sectionIdx)}
                        disabled={sectionIdx === 0}
                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveSectionDown(sectionIdx)}
                        disabled={sectionIdx === schema.sections.length - 1}
                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addField(sectionIdx)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Campo
                      </button>
                      <button
                        onClick={() => deleteSection(sectionIdx)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Campos da Seção */}
                  <div className="p-4 space-y-1">
                    {section.fields.length === 0 ? (
                      <div className="min-h-[56px] rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                        <span className="text-sm">Nenhum campo nesta seção</span>
                      </div>
                    ) : (
                      <DndContext
                        sensors={fieldSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleFieldDragEnd(sectionIdx)}
                      >
                        <SortableContext
                          items={section.fields.map((f) => f.key)}
                          strategy={verticalListSortingStrategy}
                        >
                          {section.fields.map((field, fieldIdx) => (
                            <SortableFieldItem key={field.key} id={field.key}>
                              <div
                                className={`border rounded-lg p-3 ${
                                  activeField?.sectionIdx === sectionIdx && activeField?.fieldIdx === fieldIdx
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200'
                                }`}
                                onClick={() => setActiveField({ sectionIdx, fieldIdx })}
                              >
                          <div className="grid grid-cols-12 gap-3">
                            <div className={showTechnicalNames ? 'col-span-4' : 'col-span-7'}>
                              <label className="text-xs text-gray-600">Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(sectionIdx, fieldIdx, { label: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            {showTechnicalNames && (
                              <div className="col-span-3">
                                <label className="text-xs text-gray-600">Nome técnico</label>
                                <input
                                  type="text"
                                  value={field.key}
                                  onChange={(e) => updateField(sectionIdx, fieldIdx, { key: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            )}
                            <div className="col-span-2">
                              <label className="text-xs text-gray-600">Tipo</label>
                              <FieldTypePicker
                                value={field.type}
                                onChange={(t) => updateField(sectionIdx, fieldIdx, { type: t as any })}
                              />
                            </div>
                            <div className="col-span-3 flex items-end gap-1">
                              <FieldDragHandle />
                              {canSeeAdvanced ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTechnicalNames((v) => !v);
                                  }}
                                  className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
                                  title="Mostrar/ocultar campos avançados"
                                >
                                  {showTechnicalNames ? 'Ocultar avançado' : 'Avançado'}
                                </button>
                              ) : null}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveFieldUp(sectionIdx, fieldIdx);
                                }}
                                disabled={fieldIdx === 0}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover para cima"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveFieldDown(sectionIdx, fieldIdx);
                                }}
                                disabled={fieldIdx === section.fields.length - 1}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover para baixo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateField(sectionIdx, fieldIdx);
                                }}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Duplicar campo"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteField(sectionIdx, fieldIdx);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Excluir campo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {isGeneralBuilder &&
                            schema.quiz?.enabled &&
                            [
                              'text',
                              'textarea',
                              'number',
                              'select',
                              'radio',
                              'select-search',
                              'linear_scale',
                            ].includes(field.type) && (
                              <div
                                className="mt-2 rounded border border-amber-200 bg-amber-50/50 p-2 text-xs space-y-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <label className="flex items-center gap-2 font-medium text-amber-900">
                                  <input
                                    type="checkbox"
                                    checked={!!field.quiz?.enabled}
                                    onChange={(e) =>
                                      updateField(sectionIdx, fieldIdx, {
                                        quiz: e.target.checked
                                          ? {
                                              enabled: true,
                                              points: field.quiz?.points ?? 1,
                                              correctValue: field.quiz?.correctValue ?? '',
                                            }
                                          : { enabled: false },
                                      })
                                    }
                                    className="rounded"
                                  />
                                  Contar pontos neste campo
                                </label>
                                {field.quiz?.enabled ? (
                                  <div className="flex flex-wrap items-end gap-2">
                                    <div>
                                      <span className="block text-[10px] text-gray-600 mb-0.5">Pontos</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={field.quiz?.points ?? 1}
                                        onChange={(e) =>
                                          updateField(sectionIdx, fieldIdx, {
                                            quiz: {
                                              enabled: true,
                                              points: e.target.value ? Number(e.target.value) : 1,
                                              correctValue: field.quiz?.correctValue ?? '',
                                            },
                                          })
                                        }
                                        className="w-16 px-2 py-1 border border-gray-300 rounded"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-[140px]">
                                      <span className="block text-[10px] text-gray-600 mb-0.5">Resposta correta (value / texto)</span>
                                      <input
                                        type="text"
                                        value={field.quiz?.correctValue ?? ''}
                                        onChange={(e) =>
                                          updateField(sectionIdx, fieldIdx, {
                                            quiz: {
                                              enabled: true,
                                              points: field.quiz?.points ?? 1,
                                              correctValue: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded font-mono"
                                        placeholder="ex: sim ou valor da opção"
                                      />
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          
                          <div className="mt-2 flex items-center gap-4">
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required || false}
                                onChange={(e) => updateField(sectionIdx, fieldIdx, { required: e.target.checked })}
                                className="rounded"
                              />
                              Obrigatório
                            </label>
                            {field.type === 'date' && (
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.defaultCurrentDate || false}
                                  onChange={(e) =>
                                    updateField(sectionIdx, fieldIdx, { defaultCurrentDate: e.target.checked })
                                  }
                                  className="rounded"
                                />
                                Preencher com data atual
                              </label>
                            )}
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(sectionIdx, fieldIdx, { placeholder: e.target.value })}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="Placeholder..."
                            />
                            {(field.type === 'text' || field.type === 'textarea') && (
                              <div className="flex items-center gap-1">
                                <label className="text-xs text-gray-600 whitespace-nowrap">Máx. caracteres:</label>
                                <input
                                  type="number"
                                  value={field.maxLength ?? ''}
                                  onChange={(e) => updateField(sectionIdx, fieldIdx, { maxLength: e.target.value ? Number(e.target.value) : undefined })}
                                  onBlur={(e) => {
                                    if (!e.target.value) {
                                      const defaultValue = field.type === 'text' ? 255 : 1500;
                                      updateField(sectionIdx, fieldIdx, { maxLength: defaultValue });
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                  min="1"
                                  max="5000"
                                  placeholder={field.type === 'text' ? '255' : '1500'}
                                />
                              </div>
                            )}
                            {field.type === 'number' && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">Min:</label>
                                  <input
                                    type="number"
                                    value={field.min ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { min: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">Max:</label>
                                  <input
                                    type="number"
                                    value={field.max ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { max: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                    placeholder="999999"
                                  />
                                </div>
                              </div>
                            )}
                            {field.type === 'linear_scale' && (
                              <div className="flex flex-col gap-2 w-full min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">Mín:</label>
                                    <input
                                      type="number"
                                      value={field.min ?? 1}
                                      onChange={(e) => {
                                        const minNext = e.target.value === '' ? 1 : Number(e.target.value);
                                        const maxCur = field.max ?? 5;
                                        const patch: Partial<FormField> = { min: minNext };
                                        if (field.scalePointLabels?.length) {
                                          patch.scalePointLabels = normalizeScalePointLabelRows(
                                            field.scalePointLabels.map((r) => ({
                                              value: Number(r.value),
                                              label: String(r.label ?? ''),
                                            })),
                                            minNext,
                                            maxCur
                                          );
                                        }
                                        updateField(sectionIdx, fieldIdx, patch);
                                      }}
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">Máx:</label>
                                    <input
                                      type="number"
                                      value={field.max ?? 5}
                                      onChange={(e) => {
                                        const maxNext = e.target.value === '' ? 5 : Number(e.target.value);
                                        const minCur = field.min ?? 1;
                                        const patch: Partial<FormField> = { max: maxNext };
                                        if (field.scalePointLabels?.length) {
                                          patch.scalePointLabels = normalizeScalePointLabelRows(
                                            field.scalePointLabels.map((r) => ({
                                              value: Number(r.value),
                                              label: String(r.label ?? ''),
                                            })),
                                            minCur,
                                            maxNext
                                          );
                                        }
                                        updateField(sectionIdx, fieldIdx, patch);
                                      }}
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">Passo:</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={field.step ?? 1}
                                      onChange={(e) =>
                                        updateField(sectionIdx, fieldIdx, {
                                          step: e.target.value === '' ? 1 : Math.max(1, Math.floor(Number(e.target.value))),
                                        })
                                      }
                                      className="w-14 px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                                <div className="rounded-md border border-gray-200 bg-gray-50 p-2 space-y-2">
                                  <p className="text-xs font-medium text-gray-700">Rótulos por nota</p>
                                  <p className="text-[11px] text-gray-500 leading-snug">
                                    Cada nota deve estar entre o <span className="font-medium text-gray-700">mínimo</span> e o{' '}
                                    <span className="font-medium text-gray-700">máximo</span> da escala (
                                    {getLinearScaleBoundsInt(field).loB} a {getLinearScaleBoundsInt(field).hiB}). Não pode repetir
                                    a mesma nota; ao salvar, duplicatas são ajustadas para a próxima livre.
                                  </p>
                                  {getLinearScaleEditorRows(field).map((row, ri) => (
                                    <div key={`${sectionIdx}-${fieldIdx}-sln-${ri}`} className="flex flex-wrap items-center gap-2">
                                      <label className="text-[10px] text-gray-500 w-8 shrink-0">Nota</label>
                                      <LinearBoundedNoteInput
                                        value={row.value}
                                        minV={getLinearScaleBoundsInt(field).loB}
                                        maxV={getLinearScaleBoundsInt(field).hiB}
                                        onCommit={(next) => {
                                          const nextRows = [...getLinearScaleEditorRows(field)];
                                          nextRows[ri] = { ...nextRows[ri], value: next };
                                          updateField(sectionIdx, fieldIdx, {
                                            scalePointLabels: persistScalePointLabelRows(nextRows, field),
                                            scaleLowLabel: '',
                                            scaleHighLabel: '',
                                          });
                                        }}
                                      />
                                      <input
                                        type="text"
                                        value={row.label}
                                        onChange={(e) => {
                                          const next = [...getLinearScaleEditorRows(field)];
                                          next[ri] = { ...next[ri], label: e.target.value };
                                          updateField(sectionIdx, fieldIdx, {
                                            scalePointLabels: persistScalePointLabelRows(next, field),
                                            scaleLowLabel: '',
                                            scaleHighLabel: '',
                                          });
                                        }}
                                        className="flex-1 min-w-[100px] px-2 py-1 text-xs border border-gray-300 rounded"
                                        placeholder="Texto acima desta nota"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cur = getLinearScaleEditorRows(field);
                                          const next = cur.filter((_, i) => i !== ri);
                                          const { loB } = getLinearScaleBoundsInt(field);
                                          updateField(sectionIdx, fieldIdx, {
                                            scalePointLabels: persistScalePointLabelRows(
                                              next.length ? next : [{ value: loB, label: '' }],
                                              field
                                            ),
                                            scaleLowLabel: '',
                                            scaleHighLabel: '',
                                          });
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded shrink-0"
                                        title="Remover rótulo"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const { loB, hiB } = getLinearScaleBoundsInt(field);
                                      const rows = getLinearScaleEditorRows(field);
                                      const used = new Set(rows.map((r) => r.value));
                                      let candidate = loB;
                                      for (let x = loB; x <= hiB; x++) {
                                        if (!used.has(x)) {
                                          candidate = x;
                                          break;
                                        }
                                      }
                                      updateField(sectionIdx, fieldIdx, {
                                        scalePointLabels: persistScalePointLabelRows(
                                          [...rows, { value: candidate, label: '' }],
                                          field
                                        ),
                                        scaleLowLabel: '',
                                        scaleHighLabel: '',
                                      });
                                    }}
                                    disabled={
                                      getLinearScaleEditorRows(field).length >=
                                      getLinearScaleBoundsInt(field).hiB - getLinearScaleBoundsInt(field).loB + 1
                                    }
                                    className="text-xs px-2 py-1 border border-dashed border-gray-300 rounded text-gray-700 hover:bg-gray-100 flex items-center gap-1 w-fit disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Adicionar rótulo
                                  </button>
                                </div>
                              </div>
                            )}
                            {field.type === 'file' && (
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">Tamanho máx. total:</label>
                                  <select
                                    value={field.maxSize != null ? field.maxSize / (1024 * 1024) : 10}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { maxSize: Number(e.target.value) * 1024 * 1024 })}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mb => (
                                      <option key={mb} value={mb}>{mb} MB</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">Máx. arquivos:</label>
                                  <select
                                    value={field.maxFiles ?? 10}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { maxFiles: Number(e.target.value) })}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                      <option key={n} value={n}>{n}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                            {field.type === 'table' && (
                              <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 w-full">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-medium text-gray-700">Colunas da tabela</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cols = field.tableColumns ?? [];
                                      const newCol: TableColumnDef = {
                                        key: `col_${Date.now()}`,
                                        label: `Coluna ${cols.length + 1}`,
                                        type: 'text',
                                      };
                                      updateField(sectionIdx, fieldIdx, { tableColumns: [...cols, newCol] });
                                    }}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    <Plus className="h-3 w-3 inline mr-1" />
                                    Adicionar coluna
                                  </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {(field.tableColumns ?? []).map((col, colIdx) => (
                                    <div key={colIdx} className="flex flex-wrap items-center gap-2 p-2 bg-white border rounded">
                                      <input
                                        type="text"
                                        value={col.key}
                                        onChange={(e) => {
                                          const next = [...(field.tableColumns ?? [])];
                                          next[colIdx] = { ...next[colIdx], key: e.target.value };
                                          updateField(sectionIdx, fieldIdx, { tableColumns: next });
                                        }}
                                        placeholder="Chave (ex: tubos_com_larvas)"
                                        className="w-32 px-2 py-1 text-xs border border-gray-300 rounded"
                                      />
                                      <input
                                        type="text"
                                        value={col.label}
                                        onChange={(e) => {
                                          const next = [...(field.tableColumns ?? [])];
                                          next[colIdx] = { ...next[colIdx], label: e.target.value };
                                          updateField(sectionIdx, fieldIdx, { tableColumns: next });
                                        }}
                                        placeholder="Rótulo"
                                        className="w-28 px-2 py-1 text-xs border border-gray-300 rounded"
                                      />
                                      <select
                                        value={col.type}
                                        onChange={(e) => {
                                          const next = [...(field.tableColumns ?? [])];
                                          next[colIdx] = { ...next[colIdx], type: e.target.value as 'text' | 'number' | 'select' | 'computed' | 'computedPct' };
                                          updateField(sectionIdx, fieldIdx, { tableColumns: next });
                                        }}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                                      >
                                        <option value="text">Texto</option>
                                        <option value="number">Número</option>
                                        <option value="select">Seleção</option>
                                        <option value="computed">Calculada (soma)</option>
                                        <option value="computedPct">Calculada (%)</option>
                                      </select>
                                      {col.type === 'select' && (
                                        <input
                                          type="text"
                                          value={col.apiSelectEndpoint ?? ''}
                                          onChange={(e) => {
                                            const next = [...(field.tableColumns ?? [])];
                                            next[colIdx] = { ...next[colIdx], apiSelectEndpoint: e.target.value || undefined };
                                            updateField(sectionIdx, fieldIdx, { tableColumns: next });
                                          }}
                                          placeholder="API (ex: crs/select)"
                                          className="w-28 px-2 py-1 text-xs border border-gray-300 rounded"
                                        />
                                      )}
                                      {col.type === 'computed' && (
                                        <input
                                          type="text"
                                          value={(col.sumKeys ?? []).join(', ')}
                                          onChange={(e) => {
                                            const next = [...(field.tableColumns ?? [])];
                                            const sumKeys = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                            next[colIdx] = { ...next[colIdx], sumKeys };
                                            updateField(sectionIdx, fieldIdx, { tableColumns: next });
                                          }}
                                          placeholder="Chaves a somar (ex: larv_aeg, pupa_aeg, exuv_aeg)"
                                          className="w-48 px-2 py-1 text-xs border border-gray-300 rounded"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = (field.tableColumns ?? []).filter((_, i) => i !== colIdx);
                                          updateField(sectionIdx, fieldIdx, { tableColumns: next });
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Remover coluna"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <input
                                    type="text"
                                    value={field.addRowLabel ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { addRowLabel: e.target.value })}
                                    placeholder="Texto do botão (ex: Adicionar linha)"
                                    className="flex-1 min-w-[120px] px-2 py-1 text-xs border border-gray-300 rounded"
                                  />
                                  <span className="text-xs text-gray-500">Máx. linhas:</span>
                                  <input
                                    type="number"
                                    value={field.maxRows ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { maxRows: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                    placeholder="500"
                                  />
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <label className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={field.tableShowTotalRow ?? false}
                                      onChange={(e) => updateField(sectionIdx, fieldIdx, { tableShowTotalRow: e.target.checked })}
                                      className="rounded"
                                    />
                                    Linha TOTAL
                                  </label>
                                  <input
                                    type="text"
                                    value={field.tableTotalRowLabel ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { tableTotalRowLabel: e.target.value })}
                                    placeholder="Rótulo (ex: TOTAL MÊS)"
                                    className="w-32 px-2 py-1 text-xs border border-gray-300 rounded"
                                  />
                                </div>
                                <div className="mt-2 p-2 bg-white border rounded text-xs">
                                  <span className="font-medium text-gray-700">Validação (total %):</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <input
                                      type="text"
                                      value={field.tableValidations?.totalColumnKey ?? ''}
                                      onChange={(e) => updateField(sectionIdx, fieldIdx, {
                                        tableValidations: { ...field.tableValidations, totalColumnKey: e.target.value || undefined },
                                      })}
                                      placeholder="Coluna (ex: total)"
                                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                                    />
                                    <input
                                      type="number"
                                      value={field.tableValidations?.totalMin ?? ''}
                                      onChange={(e) => updateField(sectionIdx, fieldIdx, {
                                        tableValidations: { ...field.tableValidations, totalMin: e.target.value ? Number(e.target.value) : undefined },
                                      })}
                                      placeholder="Mín %"
                                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                                    />
                                    <input
                                      type="number"
                                      value={field.tableValidations?.totalMax ?? ''}
                                      onChange={(e) => updateField(sectionIdx, fieldIdx, {
                                        tableValidations: { ...field.tableValidations, totalMax: e.target.value ? Number(e.target.value) : undefined },
                                      })}
                                      placeholder="Máx %"
                                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            {(field.type === 'checkbox-group' || field.type === 'radio') && (
                              <div
                                className="mt-2 flex flex-wrap items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <label className="text-xs text-gray-600 whitespace-nowrap">Disposição das opções:</label>
                                <select
                                  value={field.gridCols === 1 ? 1 : field.gridCols === 3 ? 3 : 2}
                                  onChange={(e) =>
                                    updateField(sectionIdx, fieldIdx, {
                                      gridCols: Number(e.target.value) as 1 | 2 | 3,
                                    })
                                  }
                                  className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                                >
                                  <option value={1}>1 coluna</option>
                                  <option value={2}>2 colunas</option>
                                  <option value={3}>3 colunas</option>
                                </select>
                              </div>
                            )}
                            {field.type === 'select' && (
                              <div
                                className="mt-2 flex flex-wrap items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <label className="text-xs text-gray-600 whitespace-nowrap">Disposição das opções:</label>
                                <select
                                  value={
                                    field.gridCols === 1
                                      ? '1'
                                      : field.gridCols === 3
                                        ? '3'
                                        : field.gridCols === 2
                                          ? '2'
                                          : 'dropdown'
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === 'dropdown') {
                                      updateField(sectionIdx, fieldIdx, { gridCols: undefined });
                                    } else {
                                      updateField(sectionIdx, fieldIdx, {
                                        gridCols: Number(v) as 1 | 2 | 3,
                                      });
                                    }
                                  }}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded bg-white min-w-[10rem]"
                                >
                                  <option value="dropdown">Lista suspensa (padrão)</option>
                                  <option value="1">1 coluna (cartões)</option>
                                  <option value="2">2 colunas (cartões)</option>
                                  <option value="3">3 colunas (cartões)</option>
                                </select>
                              </div>
                            )}
                            {(field.type === 'checkbox-group' || field.type === 'radio' || field.type === 'select' || field.type === 'select-search' || field.type === 'multi-select') && (
                              <FieldSourceConfig
                                field={field}
                                schema={schema}
                                onChange={(updates) => updateField(sectionIdx, fieldIdx, updates)}
                                onAddRelatedField={addRelatedField}
                              />
                            )}
                            {field.type === 'address' && (
                              <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Campos do Endereço a Exibir:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: 'cep', label: 'CEP' },
                                    { value: 'state', label: 'Estado' },
                                    { value: 'city', label: 'Cidade' },
                                    { value: 'street', label: 'Rua' },
                                    { value: 'neighborhood', label: 'Bairro' },
                                    { value: 'number', label: 'Número' },
                                    { value: 'complement', label: 'Complemento' },
                                    { value: 'reference', label: 'Ponto de Referência' },
                                  ].map((option) => (
                                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer text-xs">
                                      <input
                                        type="checkbox"
                                        checked={(field.addressFields || []).includes(option.value)}
                                        onChange={(e) => {
                                          const current = field.addressFields || [];
                                          const updated = e.target.checked
                                            ? [...current, option.value]
                                            : current.filter(f => f !== option.value);
                                          updateField(sectionIdx, fieldIdx, { addressFields: updated });
                                        }}
                                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-gray-700">{option.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                            </SortableFieldItem>
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
                    </SortableSectionItem>
                  ))}
                </SortableContext>
              </DndContext>
            )}
            </>
            )}

            {/* Conteúdo da Aba de Regras */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                {/* Header de Regras */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Regras Condicionais</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Controle visibilidade, obrigatoriedade e valores baseado em condições
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRulesSimpleMode((v) => !v)}
                        className="px-3 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        title="Alternar modo simples/avançado"
                      >
                        {rulesSimpleMode ? 'Avançado' : 'Modo simples'}
                      </button>
                      <button
                        onClick={addRule}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Nova Regra
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de Regras */}
                {(schema.rules || []).length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma regra criada ainda</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Regras permitem: mostrar/ocultar campos, tornar obrigatórios, desabilitar, definir valores
                    </p>
                    <button
                      onClick={addRule}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Primeira Regra
                    </button>
                  </div>
                ) : (
                  (schema.rules || []).map((rule, ruleIdx) => {
                    const fieldsForRules = getFieldsForRules();
                    const conditionField = getConditionField(rule.when?.left || '');
                    const needsNoValue = ['isEmpty', 'isNotEmpty'].includes(rule.when?.op || '');
                    
                    return (
                      <div key={ruleIdx} className="bg-white rounded-lg shadow">
                        {/* Cabeçalho da Regra */}
                        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900">
                              Regra #{ruleIdx + 1}
                              {rule.description && <span className="text-sm font-normal text-gray-600 ml-2">- {rule.description}</span>}
                            </h4>
                          </div>
                          <button
                            onClick={() => deleteRule(ruleIdx)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Descrição da Regra */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição (opcional)
                            </label>
                            <input
                              type="text"
                              value={rule.description || ''}
                              onChange={(e) => updateRule(ruleIdx, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Ex: Mostra campo gestante apenas para sexo feminino"
                            />
                          </div>

                          {/* Condição WHEN */}
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">
                              {rulesSimpleMode ? 'SE (condição)' : 'QUANDO (Condição)'}
                            </h5>
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-4">
                                <label className="block text-xs text-gray-600 mb-1">Campo</label>
                                <select
                                  value={rule.when.left || ''}
                                  onChange={(e) => updateRuleCondition(ruleIdx, { left: e.target.value, right: '' })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Selecione o campo...</option>
                                  {fieldsForRules.map(f => (
                                    <option key={f.key} value={f.key}>
                                      {rulesSimpleMode ? f.label : `${f.label} (${f.key})`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <label className="block text-xs text-gray-600 mb-1">Operador</label>
                                <select
                                  value={rule.when.op}
                                  onChange={(e) => updateRuleCondition(ruleIdx, { op: e.target.value as any })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                >
                                  {rulesSimpleMode ? (
                                    <>
                                      <option value="eq">É igual a</option>
                                      <option value="neq">É diferente de</option>
                                      <option value="isEmpty">Está vazio</option>
                                      <option value="isNotEmpty">Não está vazio</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="eq">= (igual)</option>
                                      <option value="neq">≠ (diferente)</option>
                                      <option value="gt">&gt; (maior)</option>
                                      <option value="gte">≥ (maior/igual)</option>
                                      <option value="lt">&lt; (menor)</option>
                                      <option value="lte">≤ (menor/igual)</option>
                                      <option value="in">∈ (contém em lista)</option>
                                      <option value="notIn">∉ (não contém)</option>
                                      <option value="contains">contém texto</option>
                                      <option value="startsWith">começa com</option>
                                      <option value="endsWith">termina com</option>
                                      <option value="isEmpty">está vazio</option>
                                      <option value="isNotEmpty">não está vazio</option>
                                    </>
                                  )}
                                </select>
                              </div>
                              <div className="col-span-5">
                                <label className="block text-xs text-gray-600 mb-1">
                                  {rulesSimpleMode ? 'Valor' : `Valor ${['in', 'notIn'].includes(rule.when.op) && '(separado por vírgula)'}`}
                                  {needsNoValue && <span className="text-gray-400 font-normal"> — não precisa preencher</span>}
                                </label>
                                {needsNoValue ? (
                                  <input type="text" readOnly className="w-full px-2 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-500" value="—" />
                                ) : conditionField?.type === 'checkbox' ? (
                                  <select
                                    value={rule.when.right === true || rule.when.right === 'true' ? 'true' : rule.when.right === false || rule.when.right === 'false' ? 'false' : ''}
                                    onChange={(e) => updateRuleCondition(ruleIdx, { right: e.target.value === 'true' ? true : e.target.value === 'false' ? false : '' })}
                                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    <option value="true">Sim (marcado)</option>
                                    <option value="false">Não (desmarcado)</option>
                                  </select>
                                ) : conditionField?.options?.length ? (
                                  <select
                                    value={Array.isArray(rule.when.right) ? '' : (rule.when.right ?? '')}
                                    onChange={(e) => updateRuleCondition(ruleIdx, { right: e.target.value })}
                                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {conditionField.options.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={
                                      rulesSimpleMode &&
                                      [
                                        'number',
                                        'currency',
                                        'accounting',
                                        'slider',
                                        'rating',
                                        'linear_scale',
                                        'idade',
                                      ].includes(String(conditionField?.type || ''))
                                        ? 'number'
                                        : rulesSimpleMode && String(conditionField?.type || '') === 'date'
                                          ? 'date'
                                          : rulesSimpleMode && String(conditionField?.type || '') === 'datetime'
                                            ? 'datetime-local'
                                            : rulesSimpleMode && String(conditionField?.type || '') === 'time'
                                              ? 'time'
                                              : 'text'
                                    }
                                    value={
                                      Array.isArray(rule.when.right)
                                        ? rule.when.right.join(', ')
                                        : (rule.when.right ?? '')
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const newValue = ['in', 'notIn'].includes(rule.when.op)
                                        ? value.split(',').map(v => v.trim()).filter(v => v)
                                        : value;
                                      updateRuleCondition(ruleIdx, { right: newValue });
                                    }}
                                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                    placeholder={rulesSimpleMode ? 'Digite o valor...' : (['in', 'notIn'].includes(rule.when.op) ? 'a, b, c' : 'valor...')}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Ações THEN */}
                          <div className="border-l-4 border-green-500 pl-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-sm font-semibold text-gray-700">
                                {rulesSimpleMode ? 'ENTÃO (se a condição for verdadeira)' : 'ENTÃO (Ações se verdadeiro)'}
                              </h5>
                              {rulesSimpleMode ? (
                                <div className="flex flex-wrap gap-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'then', 'show')}
                                    className="px-2 py-1 text-[11px] bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Mostrar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'then', 'hide')}
                                    className="px-2 py-1 text-[11px] bg-slate-700 text-white rounded hover:bg-slate-800"
                                  >
                                    Ocultar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'then', 'require')}
                                    className="px-2 py-1 text-[11px] bg-amber-600 text-white rounded hover:bg-amber-700"
                                  >
                                    Obrigatório
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'then', 'unrequire')}
                                    className="px-2 py-1 text-[11px] bg-gray-600 text-white rounded hover:bg-gray-700"
                                  >
                                    Opcional
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'then', 'enable')}
                                    className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                  >
                                    Habilitar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'then', 'disable')}
                                    className="px-2 py-1 text-[11px] bg-rose-600 text-white rounded hover:bg-rose-700"
                                  >
                                    Desabilitar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addRuleAction(ruleIdx, 'then')}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar Ação
                                </button>
                              )}
                            </div>
                            
                            {(rule.then || []).length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Nenhuma ação definida</p>
                            ) : (
                              <div className="space-y-2">
                                {(rule.then || []).map((action, actionIdx) => (
                                  <div key={actionIdx} className="flex gap-2 items-start">
                                    {rulesSimpleMode ? (
                                      <span className="px-2 py-1 rounded bg-green-50 text-green-800 text-xs border border-green-200 min-w-[92px] text-center">
                                        {action.action === 'show'
                                          ? 'Mostrar'
                                          : action.action === 'hide'
                                            ? 'Ocultar'
                                            : action.action === 'require'
                                              ? 'Obrigatório'
                                              : action.action === 'unrequire'
                                                ? 'Opcional'
                                                : action.action === 'enable'
                                                  ? 'Habilitar'
                                                  : action.action === 'disable'
                                                    ? 'Desabilitar'
                                                    : String(action.action)}
                                      </span>
                                    ) : (
                                      <select
                                        value={action.action}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { action: e.target.value as any })}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="show">Mostrar</option>
                                        <option value="hide">Ocultar</option>
                                        <option value="require">Tornar obrigatório</option>
                                        <option value="unrequire">Tornar opcional</option>
                                        <option value="enable">Habilitar</option>
                                        <option value="disable">Desabilitar</option>
                                        {!rulesSimpleMode && <option value="setValue">Definir valor</option>}
                                        {!rulesSimpleMode && <option value="clear">Limpar valor</option>}
                                        {!rulesSimpleMode && <option value="gotoSection">Ir para seção (página)</option>}
                                      </select>
                                    )}
                                    
                                    {!rulesSimpleMode && action.action === 'gotoSection' ? (
                                      <select
                                        value={action.target}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { target: e.target.value })}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="">Selecione seção...</option>
                                        {sectionsForRules.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.title} ({s.id})
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <select
                                        value={action.target}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { target: e.target.value })}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="">Selecione campo...</option>
                                        {fieldsForRules.map(f => (
                                          <option key={f.key} value={f.key}>
                                            {rulesSimpleMode ? f.label : `${f.label} (${f.key})`}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {!rulesSimpleMode && action.action === 'setValue' && (
                                      <input
                                        type="text"
                                        value={action.value || ''}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { value: e.target.value })}
                                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Valor..."
                                      />
                                    )}
                                    
                                    <button
                                      onClick={() => deleteRuleAction(ruleIdx, 'then', actionIdx)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Ações ELSE */}
                          <div className="border-l-4 border-orange-500 pl-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-sm font-semibold text-gray-700">
                                {rulesSimpleMode ? 'CASO CONTRÁRIO (se a condição for falsa)' : 'SENÃO (Ações se falso)'}
                              </h5>
                              {rulesSimpleMode ? (
                                <div className="flex flex-wrap gap-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'else', 'show')}
                                    className="px-2 py-1 text-[11px] bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Mostrar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'else', 'hide')}
                                    className="px-2 py-1 text-[11px] bg-slate-700 text-white rounded hover:bg-slate-800"
                                  >
                                    Ocultar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'else', 'require')}
                                    className="px-2 py-1 text-[11px] bg-amber-600 text-white rounded hover:bg-amber-700"
                                  >
                                    Obrigatório
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'else', 'unrequire')}
                                    className="px-2 py-1 text-[11px] bg-gray-600 text-white rounded hover:bg-gray-700"
                                  >
                                    Opcional
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'else', 'enable')}
                                    className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                  >
                                    Habilitar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addQuickRuleAction(ruleIdx, 'else', 'disable')}
                                    className="px-2 py-1 text-[11px] bg-rose-600 text-white rounded hover:bg-rose-700"
                                  >
                                    Desabilitar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addRuleAction(ruleIdx, 'else')}
                                  className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar Ação
                                </button>
                              )}
                            </div>
                            
                            {(rule.else || []).length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Nenhuma ação definida</p>
                            ) : (
                              <div className="space-y-2">
                                {(rule.else || []).map((action, actionIdx) => (
                                  <div key={actionIdx} className="flex gap-2 items-start">
                                    {rulesSimpleMode ? (
                                      <span className="px-2 py-1 rounded bg-orange-50 text-orange-800 text-xs border border-orange-200 min-w-[92px] text-center">
                                        {action.action === 'show'
                                          ? 'Mostrar'
                                          : action.action === 'hide'
                                            ? 'Ocultar'
                                            : action.action === 'require'
                                              ? 'Obrigatório'
                                              : action.action === 'unrequire'
                                                ? 'Opcional'
                                                : action.action === 'enable'
                                                  ? 'Habilitar'
                                                  : action.action === 'disable'
                                                    ? 'Desabilitar'
                                                    : String(action.action)}
                                      </span>
                                    ) : (
                                      <select
                                        value={action.action}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { action: e.target.value as any })}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="show">Mostrar</option>
                                        <option value="hide">Ocultar</option>
                                        <option value="require">Tornar obrigatório</option>
                                        <option value="unrequire">Tornar opcional</option>
                                        <option value="enable">Habilitar</option>
                                        <option value="disable">Desabilitar</option>
                                        {!rulesSimpleMode && <option value="setValue">Definir valor</option>}
                                        {!rulesSimpleMode && <option value="clear">Limpar valor</option>}
                                        {!rulesSimpleMode && <option value="gotoSection">Ir para seção (página)</option>}
                                      </select>
                                    )}
                                    
                                    {!rulesSimpleMode && action.action === 'gotoSection' ? (
                                      <select
                                        value={action.target}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { target: e.target.value })}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="">Selecione seção...</option>
                                        {sectionsForRules.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.title} ({s.id})
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <select
                                        value={action.target}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { target: e.target.value })}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="">Selecione campo...</option>
                                        {fieldsForRules.map(f => (
                                          <option key={f.key} value={f.key}>
                                            {rulesSimpleMode ? f.label : `${f.label} (${f.key})`}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {!rulesSimpleMode && action.action === 'setValue' && (
                                      <input
                                        type="text"
                                        value={action.value || ''}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { value: e.target.value })}
                                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Valor..."
                                      />
                                    )}
                                    
                                    <button
                                      onClick={() => deleteRuleAction(ruleIdx, 'else', actionIdx)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow border border-gray-100 px-4 py-4 flex flex-wrap items-center justify-center gap-2">
              {canSeeAdvanced && (
                <DevActionsMenu
                  onExportJSON={handleExportJSON}
                  onImportJSON={() => fileInputRef.current?.click()}
                  direction="up"
                />
              )}
              <button
                type="button"
                onClick={() => setImportExcelOpen(true)}
                className="px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-2 text-sm"
                title="Importar formulário de planilha Excel"
              >
                <Upload className="h-4 w-4" />
                Importar Planilha
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="px-3 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={schema.sections.length === 0}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 transition-colors ${
                  isDirty
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Save className="h-4 w-4" />
                {isDirty ? 'Salvar*' : 'Salvar'}
              </button>
            </div>
          </div>
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{formName || 'Preview do Formulário'}</h2>
                <p className="text-sm text-gray-500 mt-1">Visualização de como o formulário será exibido</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Corpo do Modal com Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white rounded-lg shadow p-6">
                {schema.sections.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Adicione seções e campos para visualizar o formulário</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPanel('form')}
                          className={`px-3 py-1.5 rounded-md text-sm border ${
                            previewPanel === 'form'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Formulário
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPanel('json')}
                          className={`px-3 py-1.5 rounded-md text-sm border ${
                            previewPanel === 'json'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          JSON
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700">
                          <span className="mr-2">Modo:</span>
                          <select
                            value={previewMode}
                            onChange={(e) => setPreviewMode(e.target.value as 'interactive' | 'readonly')}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="interactive">Interativo</option>
                            <option value="readonly">Somente leitura</option>
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => setPreviewData({})}
                          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>

                    {previewPanel === 'json' ? (
                      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-4 overflow-auto max-h-[60vh]">
                        {JSON.stringify(previewData, null, 2)}
                      </pre>
                    ) : (
                      <FormRenderer
                        schema={{
                          ...schema,
                          title: (formName || '').trim() || schema.title,
                        }}
                        initialData={previewData}
                        onDataChange={setPreviewData}
                        readOnly={previewMode === 'readonly'}
                        showTitle={false}
                        showActions={false}
                        context={resolveFormRendererContext(formKey, schema)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleSave();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Formulário
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportExcelModal
        open={importExcelOpen}
        onClose={() => setImportExcelOpen(false)}
        onSchema={handleImportFromExcel}
      />

      <TemplateGalleryModal
        open={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        onApply={handleApplyTemplate}
      />

    </AppPageLayout>
  );
};

export default FormBuilderPage;
