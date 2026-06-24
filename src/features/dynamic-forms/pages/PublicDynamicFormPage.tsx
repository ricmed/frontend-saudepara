import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FormService, { type PublicFormPayload } from '@/services/FormService';
import { FormRenderer } from '../components/FormRenderer';

function cloneFormData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

const STORAGE_KEY = (slug: string) => `sp.form-sub.v1.${slug}`;

type StoredSub = { id: number; submittedAt: string };

function readStoredSub(slug: string): StoredSub | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'id' in parsed) return parsed as StoredSub;
    return null;
  } catch {
    return null;
  }
}

function saveStoredSub(slug: string, sub: StoredSub) {
  try {
    localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(sub));
  } catch {
    // ignore — private browsing or storage full
  }
}

function clearStoredSub(slug: string) {
  try {
    localStorage.removeItem(STORAGE_KEY(slug));
  } catch {
    // ignore
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

type ViewMode =
  | 'banner'     // formulário já respondido — mostrando opções
  | 'loading-sub' // carregando dados da resposta anterior
  | 'readonly'   // exibindo resposta em modo leitura
  | 'editing'    // editando resposta existente
  | 'new'        // preenchendo novo envio
  | 'submitted'; // tela de confirmação pós-envio

export const PublicDynamicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('t'), [searchParams]);

  const [payload, setPayload] = useState<PublicFormPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Controle de navegação principal
  const [viewMode, setViewMode] = useState<ViewMode>('new');

  // Resposta persistida no localStorage
  const [storedSub, setStoredSub] = useState<StoredSub | null>(null);

  // Dados da resposta carregada do servidor
  const [loadedData, setLoadedData] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formMountKey, setFormMountKey] = useState(0);

  const [lastSubmitted, setLastSubmitted] = useState<StoredSub | null>(null);
  const [quizSummary, setQuizSummary] = useState<{
    score: number;
    maxScore: number;
    items: Array<{ key: string; points: number; awarded: number; correct: boolean; expected?: string; answer?: string }>;
  } | null>(null);

  // Carregar formulário
  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await FormService.getPublicForm(slug, token);
        setPayload(data);

        // Verificar localStorage por resposta anterior
        const stored = readStoredSub(slug);
        if (stored) {
          setStoredSub(stored);
          setViewMode('banner');
        } else {
          setViewMode('new');
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Erro ao carregar formulário';
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slug, token]);

  const formName = (payload?.form as any)?.nome ? String((payload as any).form.nome) : 'Formulário';
  const redirectUrl = (payload?.form?.redirect_url ?? '').trim();
  const confirmationMsg = (payload?.form?.confirmation_message ?? '').trim();
  const allowEditAfterSubmit = Boolean(payload?.form?.allow_edit_after_submit);
  const oneResponsePerUser = Boolean((payload?.form as any)?.one_response_per_user);
  const formPageMode = Boolean((payload?.version?.ui_json as any)?.page_mode ?? true);

  // Redirecionar após envio (quando configurado)
  useEffect(() => {
    if (viewMode !== 'submitted' || !redirectUrl) return;
    const t = window.setTimeout(() => {
      try { window.location.href = redirectUrl; } catch { /* ignore */ }
    }, 1200);
    return () => window.clearTimeout(t);
  }, [viewMode, redirectUrl]);

  // --- Ações do banner ---

  const handleViewResponse = useCallback(async () => {
    if (!storedSub || !slug) return;
    setViewMode('loading-sub');
    try {
      const res = await FormService.getPublicSubmission(slug, storedSub.id, token);
      setLoadedData(cloneFormData(res.data_json ?? {}));
      setEditingId(null);
      setFormMountKey((k) => k + 1);
      setViewMode('readonly');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Não foi possível carregar a resposta';
      alert(String(msg));
      setViewMode('banner');
    }
  }, [storedSub, slug, token]);

  const handleEditResponse = useCallback(async () => {
    if (!storedSub || !slug) return;
    setViewMode('loading-sub');
    try {
      const res = await FormService.getPublicSubmission(slug, storedSub.id, token);
      setLoadedData(cloneFormData(res.data_json ?? {}));
      setEditingId(storedSub.id);
      setFormMountKey((k) => k + 1);
      setViewMode('editing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Não foi possível carregar a resposta para edição';
      alert(String(msg));
      setViewMode('banner');
    }
  }, [storedSub, slug, token]);

  const handleNewResponse = useCallback(() => {
    clearStoredSub(slug!);
    setStoredSub(null);
    setLoadedData({});
    setEditingId(null);
    setFormMountKey((k) => k + 1);
    setViewMode('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // --- Envio do formulário ---
  const handleSubmit = useCallback(async (data: Record<string, any>) => {
    if (!slug) return;
    try {
      setSaving(true);
      if (editingId != null) {
        const res = await FormService.updatePublicSubmission({
          slug, token, submissionId: editingId, data_json: data,
        });
        setQuizSummary(res.quiz && typeof res.quiz === 'object' ? res.quiz : null);
        const sub: StoredSub = { id: Number(res.id) || editingId, submittedAt: new Date().toISOString() };
        saveStoredSub(slug, sub);
        setStoredSub(sub);
        setLastSubmitted(sub);
        setEditingId(null);
        setLoadedData({});
        setViewMode('submitted');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const res = await FormService.submitPublicForm({ slug, token, data_json: data });
      setQuizSummary(res.quiz && typeof res.quiz === 'object' ? res.quiz : null);
      const sub: StoredSub = { id: Number(res.id), submittedAt: new Date().toISOString() };
      saveStoredSub(slug, sub);
      setStoredSub(sub);
      setLastSubmitted(sub);
      setEditingId(null);
      setLoadedData({});
      setViewMode('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Erro ao enviar resposta';
      alert(String(msg));
    } finally {
      setSaving(false);
    }
  }, [slug, token, editingId]);

  // --- Renders ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-center text-gray-600">Carregando formulário…</p>
        </div>
      </div>
    );
  }

  if (error || !payload || !payload.form || !payload.version) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">Não foi possível abrir o formulário</h2>
          <p className="text-red-700">{error || 'Formulário não encontrado ou payload inválido'}</p>
        </div>
      </div>
    );
  }

  // Carregando dados da resposta anterior
  if (viewMode === 'loading-sub') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-center text-gray-600">Carregando sua resposta…</p>
        </div>
      </div>
    );
  }

  // Banner: formulário já respondido
  if (viewMode === 'banner' && storedSub) {
    const date = formatDate(storedSub.submittedAt);
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{formName}</h1>
            {payload.form.descricao ? <p className="text-gray-600 text-sm">{payload.form.descricao}</p> : null}
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <p className="text-green-800 font-semibold text-base">Você já respondeu este formulário</p>
            {date ? <p className="text-green-700 text-sm mt-1">Enviado em {date}</p> : null}
            <p className="text-green-700 text-xs mt-1">
              O acesso à sua resposta está disponível neste navegador.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleViewResponse}
                className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
              >
                Ver minha resposta
              </button>

              {allowEditAfterSubmit && (
                <button
                  type="button"
                  onClick={handleEditResponse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Editar resposta
                </button>
              )}

              {!oneResponsePerUser && (
                <button
                  type="button"
                  onClick={handleNewResponse}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Enviar nova resposta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de confirmação após envio
  if (viewMode === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{formName}</h1>
          <p className="text-gray-700">{confirmationMsg || 'Resposta enviada com sucesso.'}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleViewResponse}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
            >
              Ver minha resposta
            </button>

            {allowEditAfterSubmit && lastSubmitted && (
              <button
                type="button"
                onClick={handleEditResponse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Editar resposta
              </button>
            )}
          </div>

          {quizSummary ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Pontuação: {quizSummary.score} / {quizSummary.maxScore}
              </p>
              {quizSummary.items?.length ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-950">
                  {quizSummary.items.map((it) => (
                    <li key={it.key}>
                      <span className="font-mono text-amber-800">{it.key}</span>
                      {' — '}
                      {it.awarded}/{it.points} pts
                      {it.correct ? ' ✓' : ' ✗'}
                      {it.expected !== undefined ? (
                        <span className="block text-amber-800/90 pl-2">
                          Gabarito: {String(it.expected)} | Sua resposta: {String(it.answer ?? '')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {redirectUrl ? <p className="text-sm text-gray-500 mt-3">Redirecionando…</p> : null}
        </div>
      </div>
    );
  }

  // Modo leitura / edição / novo preenchimento
  const isReadonly = viewMode === 'readonly';
  const isEditing = viewMode === 'editing';
  const showInitialData = isReadonly || isEditing;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white p-6 shadow-xl text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700">{isEditing ? 'Salvando…' : 'Enviando…'}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-4">
        {/* Header do formulário */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">{formName}</h1>
          {payload.form.descricao ? <p className="mt-2 text-gray-700">{payload.form.descricao}</p> : null}
          {isReadonly && (
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                Visualizando sua resposta
              </span>
              {allowEditAfterSubmit && (
                <button
                  type="button"
                  onClick={handleEditResponse}
                  className="text-xs text-blue-600 underline hover:text-blue-800"
                >
                  Editar
                </button>
              )}
              {!oneResponsePerUser && (
                <button
                  type="button"
                  onClick={handleNewResponse}
                  className="text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Enviar nova resposta
                </button>
              )}
            </div>
          )}
          {isEditing && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                Editando sua resposta
              </span>
            </div>
          )}
        </div>

        <FormRenderer
          key={`public-${slug ?? 'form'}-${formMountKey}`}
          schema={{ ...payload.version.schema_json, title: formName }}
          showTitle={false}
          initialData={showInitialData ? loadedData : {}}
          onSubmit={handleSubmit}
          onCancel={undefined}
          submitLabel={isEditing ? 'Salvar alterações' : 'Enviar'}
          readOnly={isReadonly}
          showActions={!isReadonly}
          context="public"
          pageMode={isReadonly ? false : formPageMode}
          showProgress={!isReadonly && formPageMode}
        />
      </div>
    </div>
  );
};
