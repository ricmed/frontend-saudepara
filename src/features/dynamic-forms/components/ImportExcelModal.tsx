import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import FormService, { type XlsFormPreview } from '@/services/FormService';

type Step = 'upload' | 'preview' | 'saving' | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Modo "criar": salva no banco e retorna o ID do formulário criado. */
  onImported?: (formId: number) => void;
  /** Modo "builder": não salva no banco — devolve o preview para o editor popular seus campos. */
  onSchema?: (preview: XlsFormPreview) => void;
}

export const ImportExcelModal: React.FC<Props> = ({ open, onClose, onImported, onSchema }) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<XlsFormPreview | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Limpa estado ao abrir
  useEffect(() => {
    if (open) {
      setStep('upload');
      setFile(null);
      setPreview(null);
      setExpandedSections({});
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleClose() {
    if (step === 'saving') return;
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
      setError(null);
    } else {
      setError('Formato inválido. Apenas arquivos .xlsx são aceitos.');
    }
  }

  async function handleDownloadTemplate() {
    try {
      setDownloading(true);
      await FormService.downloadImportTemplate();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erro ao baixar template.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) return;
    try {
      setAnalyzing(true);
      setError(null);
      const result = await FormService.previewImportExcel(file);
      setPreview(result);
      // expande todas as seções por padrão
      const expanded: Record<string, boolean> = {};
      result.schema_json.sections.forEach(s => { expanded[s.id] = true; });
      setExpandedSections(expanded);
      setStep('preview');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erro ao analisar o arquivo.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    if (onSchema) {
      onSchema(preview);
      setStep('done');
      setTimeout(() => onClose(), 800);
      return;
    }
    try {
      setStep('saving');
      setError(null);
      const { formId } = await FormService.confirmImportExcel(preview);
      setStep('done');
      setTimeout(() => {
        onImported?.(formId);
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erro ao importar formulário.');
      setStep('preview');
    }
  }

  function toggleSection(id: string) {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const totalFields = preview?.schema_json.sections.reduce((acc, s) => acc + s.fields.length, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Criar formulário via planilha</h2>
              <p className="text-xs text-gray-500">
                {step === 'upload' && 'Baixe o template, preencha no Excel e envie aqui'}
                {step === 'preview' && 'Revise os campos detectados antes de confirmar'}
                {step === 'saving' && 'Salvando formulário…'}
                {step === 'done' && (onSchema ? 'Campos carregados no editor!' : 'Formulário importado com sucesso!')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={step === 'saving'}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Corpo ───────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Erro global */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step: upload ──────────────────────────────────────────────── */}
          {step === 'upload' && (
            <>
              {/* Baixar template */}
              <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800 mb-1">1. Baixe o template</p>
                <p className="text-xs text-emerald-700 mb-3">
                  Planilha com 2 abas principais: <strong>Configurações</strong> (nome e categoria do
                  formulário) e <strong>Campos</strong> (lista de campos com tipo, seção e opções). Tudo
                  em português — sem nenhum código técnico.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                >
                  {downloading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />}
                  {downloading ? 'Baixando…' : 'Baixar template.xlsx'}
                </button>
              </div>

              {/* Upload do arquivo */}
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-800 mb-1">2. Envie o arquivo preenchido</p>
                <p className="text-xs text-gray-500 mb-3">Apenas arquivos <strong>.xlsx</strong> · Máx. 5 MB</p>

                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => inputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  {file ? (
                    <p className="text-sm font-medium text-blue-700">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">Arraste o arquivo aqui ou <span className="text-blue-600 underline">clique para selecionar</span></p>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Step: preview ─────────────────────────────────────────────── */}
          {(step === 'preview' || step === 'saving') && preview && (
            <>
              {/* Metadados do formulário */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Formulário detectado</span>
                  <span className="text-xs text-blue-500">{preview.schema_json.sections.length} seções · {totalFields} campos</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{preview.form.nome}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="bg-white border border-gray-200 rounded px-2 py-0.5">
                    <span className="text-gray-400">form_key:</span> {preview.form.form_key}
                  </span>
                  <span className="bg-white border border-gray-200 rounded px-2 py-0.5">
                    <span className="text-gray-400">agravo:</span> {preview.form.agravo}
                  </span>
                  {preview.form.categoria && (
                    <span className="bg-white border border-gray-200 rounded px-2 py-0.5">
                      <span className="text-gray-400">categoria:</span> {preview.form.categoria}
                    </span>
                  )}
                </div>
                {preview.form.descricao && (
                  <p className="text-xs text-gray-500 italic">{preview.form.descricao}</p>
                )}
              </div>

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {preview.warnings.length} aviso{preview.warnings.length > 1 ? 's' : ''} encontrado{preview.warnings.length > 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-0.5">
                    {preview.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-800">· {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CodeLists que serão criados */}
              {preview.codeLists.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Listas de opções ({preview.codeLists.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preview.codeLists.map(cl => (
                      <span key={cl.name} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs text-gray-700">
                        <span className="font-medium">{cl.name}</span>
                        <span className="text-gray-400">· {cl.items.length} opções</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seções e campos */}
              <div className="space-y-2">
                {preview.schema_json.sections.map(section => (
                  <div key={section.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{section.title}</span>
                        <span className="text-xs text-gray-400">{section.fields.length} campo{section.fields.length !== 1 ? 's' : ''}</span>
                      </div>
                      {expandedSections[section.id]
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {expandedSections[section.id] && (
                      <div className="divide-y divide-gray-100">
                        {section.fields.map(field => (
                          <div key={field.key} className="flex items-start gap-3 px-4 py-2">
                            <span className="mt-0.5 inline-block bg-blue-100 text-blue-700 text-xs font-mono rounded px-1.5 py-0.5 shrink-0">
                              {field.type}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-800 truncate">{field.label}</p>
                              <p className="text-xs text-gray-400 font-mono">{field.key}{field.required ? ' · obrigatório' : ''}{field.codeList ? ` · lista: ${field.codeList}` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Step: done ────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-base font-semibold text-gray-800">
                {onSchema ? 'Campos carregados!' : 'Formulário importado!'}
              </p>
              <p className="text-sm text-gray-500">
                {onSchema ? 'Os campos foram populados no editor.' : 'Redirecionando para o editor…'}
              </p>
            </div>
          )}

          {/* ── Step: saving ──────────────────────────────────────────────── */}
          {step === 'saving' && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando formulário no banco…
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {(step === 'upload' || step === 'preview') && (
          <div className="flex items-center justify-between border-t px-5 py-3 shrink-0 bg-gray-50">
            {step === 'upload' ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!file || analyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando…</>
                    : <><FileSpreadsheet className="h-4 w-4" /> Analisar arquivo</>}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setStep('upload'); setPreview(null); setError(null); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar importação
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
