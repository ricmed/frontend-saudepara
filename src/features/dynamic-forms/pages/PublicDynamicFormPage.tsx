import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FormService, { type PublicFormPayload } from '@/services/FormService';
import { FormRenderer } from '../components/FormRenderer';

export const PublicDynamicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('t'), [searchParams]);

  const [payload, setPayload] = useState<PublicFormPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const redirectUrl = (payload?.form?.redirect_url ?? '').trim();
  const confirmationMsg = (payload?.form?.confirmation_message ?? '').trim();

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

  const handleSubmit = async (data: Record<string, any>) => {
    if (!slug) return;
    try {
      setSaving(true);
      const res = await FormService.submitPublicForm({ slug, token, data_json: data });
      setQuizSummary(res.quiz && typeof res.quiz === 'object' ? res.quiz : null);
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

  if (error || !payload) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">Não foi possível abrir o formulário</h2>
          <p className="text-red-700">{error || 'Formulário não encontrado'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{payload.form.nome}</h1>
          <p className="text-gray-700">{confirmationMsg || 'Resposta enviada com sucesso.'}</p>
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
            <p className="text-gray-700">Enviando…</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">{payload.form.nome}</h1>
          {payload.form.descricao ? <p className="mt-2 text-gray-700">{payload.form.descricao}</p> : null}
        </div>

        <FormRenderer
          schema={{
            ...payload.version.schema_json,
            title: payload.form.nome,
          }}
          showTitle={false}
          initialData={{}}
          onSubmit={handleSubmit}
          onSaveDraft={undefined}
          onCancel={undefined}
          submitLabel="Enviar"
          readOnly={false}
          showActions={true}
          context="public"
          pageMode={true}
          showProgress={true}
        />
      </div>
    </div>
  );
};

