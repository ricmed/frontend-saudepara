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

export const PublicDynamicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('t'), [searchParams]);

  const [payload, setPayload] = useState<PublicFormPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Após envio ou reenvio: id + payload completo para reabrir o formulário quando permitido. */
  const [lastSubmission, setLastSubmission] = useState<{ id: number; data_json: Record<string, any> } | null>(null);
  /** Quando não nulo, o formulário está reabrindo uma resposta já enviada para edição. */
  const [editingSubmissionId, setEditingSubmissionId] = useState<number | null>(null);
  const [formInitialData, setFormInitialData] = useState<Record<string, any>>({});
  const [formMountKey, setFormMountKey] = useState(0);
  const [quizSummary, setQuizSummary] = useState<{
    score: number;
    maxScore: number;
    items: Array<{ key: string; points: number; awarded: number; correct: boolean; expected?: string; answer?: string }>;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await FormService.getPublicForm(slug, token);
        setPayload(data);
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
  const formPageMode = Boolean((payload?.version?.ui_json as any)?.page_mode ?? true);

  useEffect(() => {
    if (!submitted || !redirectUrl) return;
    const t = window.setTimeout(() => {
      try {
        window.location.href = redirectUrl;
      } catch {
        // ignore
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [submitted, redirectUrl]);

  const handleContinueEditing = useCallback(() => {
    if (!lastSubmission) return;
    setFormInitialData(cloneFormData(lastSubmission.data_json ?? {}));
    setEditingSubmissionId(lastSubmission.id);
    setFormMountKey((k) => k + 1);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lastSubmission]);

  const handleSubmit = async (data: Record<string, any>) => {
    if (!slug) return;
    try {
      setSaving(true);
      if (editingSubmissionId != null) {
        const res = await FormService.updatePublicSubmission({
          slug,
          token,
          submissionId: editingSubmissionId,
          data_json: data,
        });
        setQuizSummary(res.quiz && typeof res.quiz === 'object' ? res.quiz : null);
        setLastSubmission({
          id: Number(res.id) || editingSubmissionId,
          data_json: (res.data_json as Record<string, any>) ?? {},
        });
        setEditingSubmissionId(null);
        setFormInitialData({});
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const res = await FormService.submitPublicForm({ slug, token, data_json: data });
      setQuizSummary(res.quiz && typeof res.quiz === 'object' ? res.quiz : null);
      setLastSubmission({
        id: Number(res.id),
        data_json: (res.data_json as Record<string, any>) ?? {},
      });
      setEditingSubmissionId(null);
      setFormInitialData({});
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Erro ao enviar resposta';
      alert(String(msg));
    } finally {
      setSaving(false);
    }
  };

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{formName}</h1>
          <p className="text-gray-700">{confirmationMsg || 'Resposta enviada com sucesso.'}</p>
          {allowEditAfterSubmit && lastSubmission ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleContinueEditing}
                className="inline-flex items-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Editar resposta
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Você pode alterar e salvar novamente enquanto o formulário permitir edição após o envio.
              </p>
            </div>
          ) : null}
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
          {redirectUrl ? (
            <p className="text-sm text-gray-500 mt-2">Redirecionando…</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white p-6 shadow-xl text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700">{editingSubmissionId != null ? 'Salvando…' : 'Enviando…'}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">{formName}</h1>
          {payload.form.descricao ? <p className="mt-2 text-gray-700">{payload.form.descricao}</p> : null}
        </div>

        <FormRenderer
          key={`public-${slug ?? 'form'}-${formMountKey}`}
          schema={{
            ...payload.version.schema_json,
            title: formName,
          }}
          showTitle={false}
          initialData={editingSubmissionId != null ? formInitialData : {}}
          onSubmit={handleSubmit}
          onCancel={undefined}
          submitLabel={editingSubmissionId != null ? 'Salvar alterações' : 'Enviar'}
          readOnly={false}
          showActions={true}
          context="public"
          pageMode={formPageMode}
          showProgress={formPageMode}
        />
      </div>
    </div>
  );
};
