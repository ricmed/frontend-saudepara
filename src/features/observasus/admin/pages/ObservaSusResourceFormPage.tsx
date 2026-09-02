import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import { AdminHeader } from '@/keycloak/admin/components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/keycloak/AuthProvider';
import { canGovernObservaSusResources } from '../observasusAdminAccess';
import { OBSERVASUS_DOWNLOAD_ROLE_OPTIONS } from '../observasusAdminConstants';
import {
  createObservaSusAdminResource,
  deleteObservaSusAdminFile,
  getObservaSusAdminResource,
  updateObservaSusAdminResource,
  uploadObservaSusAdminFile,
  type ObservaSusAdminPayload,
} from '../../services/observasusService';

const emptyForm: ObservaSusAdminPayload = {
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  type: 'DATASET',
  system: 'SINAN',
  status: 'MIGRATING',
  visibility: 'RESTRICTED',
  route: '',
  externalUrl: '',
  sortOrder: 0,
  isFeatured: false,
  isActive: true,
  requiredRoles: [],
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function ObservaSusResourceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const resourceId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canGovern = canGovernObservaSusResources(user?.roles);
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [form, setForm] = useState<ObservaSusAdminPayload>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['observasus', 'admin', 'resource', resourceId],
    queryFn: () => getObservaSusAdminResource(resourceId!),
    enabled: isEdit && Number.isFinite(resourceId),
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      slug: existing.slug,
      title: existing.title,
      subtitle: existing.subtitle ?? '',
      description: existing.description ?? '',
      type: existing.type,
      system: existing.system,
      status: existing.status,
      visibility: existing.visibility,
      route: existing.route ?? '',
      externalUrl: existing.externalUrl ?? '',
      sortOrder: existing.sortOrder,
      isFeatured: existing.isFeatured,
      isActive: true,
      requiredRoles: existing.requiredRoles ?? [],
    });
    setSlugTouched(true);
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: ObservaSusAdminPayload = {
        ...form,
        subtitle: form.subtitle || null,
        description: form.description || null,
        route: form.route || null,
        externalUrl: form.externalUrl || null,
        visibility: canGovern ? form.visibility : 'RESTRICTED',
        requiredRoles:
          canGovern && form.visibility === 'RESTRICTED' ? form.requiredRoles ?? [] : [],
      };

      if (isEdit && resourceId) {
        const updated = await updateObservaSusAdminResource(resourceId, payload);
        if (file && canGovern) {
          return uploadObservaSusAdminFile(updated.id, file);
        }
        return updated;
      }

      const created = await createObservaSusAdminResource(payload);
      if (file && canGovern) {
        return uploadObservaSusAdminFile(created.id, file);
      }
      return created;
    },
    onSuccess: (resource) => {
      setSuccess('Recurso salvo com sucesso.');
      setError(null);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['observasus', 'admin'] });
      navigate(`/admin/master/observasus/${resource.id}/edit`, { replace: true });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Não foi possível salvar o recurso.';
      setError(message);
      setSuccess(null);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: () => deleteObservaSusAdminFile(resourceId!),
    onSuccess: () => {
      setSuccess('Arquivo removido.');
      queryClient.invalidateQueries({ queryKey: ['observasus', 'admin', 'resource', resourceId] });
    },
    onError: () => setError('Não foi possível remover o arquivo.'),
  });

  const selectedRoles = useMemo(() => new Set(form.requiredRoles ?? []), [form.requiredRoles]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.slug.trim()) {
      setError('Título e slug são obrigatórios.');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        selectedLanguage={selectedLanguage}
      />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              to="/admin/master/observasus"
              className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Editar recurso' : 'Novo recurso ObservaSUS'}
              </h1>
              <p className="text-sm text-gray-600">
                Para arquivos restritos, selecione as roles de download (ex.: SINAN / dengue).
              </p>
            </div>
          </div>

          {isEdit && isLoading ? (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
              Carregando recurso...
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                  {success}
                </div>
              )}

              <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Identificação</h2>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Título</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title,
                        slug: slugTouched ? prev.slug : slugify(title),
                      }));
                    }}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Slug</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                    }}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Subtítulo</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.subtitle ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Descrição</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[100px]"
                    value={form.description ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </label>
              </section>

              <section className="rounded-xl border bg-white p-5 shadow-sm grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Tipo</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    {['PANEL', 'DATASET', 'DOCUMENT', 'MANUAL', 'LINK', 'PUBLICATION'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Sistema</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.system}
                    onChange={(e) => setForm((prev) => ({ ...prev, system: e.target.value }))}
                  >
                    {[
                      'SIM',
                      'SINASC',
                      'SINAN',
                      'ESUS_NOTIFICA',
                      'COVID_19',
                      'DEMOGRAFICO',
                      'PQAVS',
                      'GERAL',
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {['AVAILABLE', 'MIGRATING', 'COMING_SOON', 'ARCHIVED'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                {canGovern && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Visibilidade</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.visibility}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, visibility: e.target.value }))
                    }
                  >
                    <option value="PUBLIC">PUBLIC — qualquer visitante</option>
                    <option value="AUTHENTICATED">AUTHENTICATED — exige login</option>
                    <option value="RESTRICTED">RESTRICTED — exige role específica</option>
                  </select>
                </label>
                )}
                {!canGovern && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Painéis cadastrados por editor permanecem <strong>RESTRICTED</strong> até o admin
                    master publicar.
                  </p>
                )}
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Ordem</span>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.sortOrder ?? 0}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 mt-7">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isFeatured)}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                    }
                  />
                  <span className="text-sm text-gray-700">Destaque na home</span>
                </label>
              </section>

              {canGovern && form.visibility === 'RESTRICTED' && (
                <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
                  <h2 className="font-semibold text-gray-900 mb-2">Roles de download exigidas</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Quem tiver a role pai (ex.: <code>observasus.download.sinan</code>) também
                    acessa filhos (ex.: dengue). Cadastre as roles em Gerenciar Roles.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {OBSERVASUS_DOWNLOAD_ROLE_OPTIONS.map((role) => {
                      const checked = selectedRoles.has(role.name);
                      return (
                        <label
                          key={role.name}
                          className="flex items-start gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(e) => {
                              setForm((prev) => {
                                const current = new Set(prev.requiredRoles ?? []);
                                if (e.target.checked) current.add(role.name);
                                else current.delete(role.name);
                                return { ...prev, requiredRoles: Array.from(current) };
                              });
                            }}
                          />
                          <span>
                            <span className="block text-sm font-medium text-gray-900">
                              {role.label}
                            </span>
                            <span className="block text-xs font-mono text-gray-500">{role.name}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Arquivo / link</h2>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">URL externa (opcional)</span>
                  <input
                    type="url"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={form.externalUrl ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>
                {canGovern && (
                <>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Upload de arquivo</span>
                  <input
                    type="file"
                    className="mt-1 block w-full text-sm"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {existing?.hasFile && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span>
                      Arquivo atual: <strong>{existing.originalFileName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Remover o arquivo deste recurso?')) {
                          deleteFileMutation.mutate();
                        }
                      }}
                      className="inline-flex items-center gap-1 text-red-700 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </button>
                  </div>
                )}
                </>
                )}
              </section>

              <div className="flex justify-end gap-3">
                <Link
                  to="/admin/master/observasus"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
                >
                  {file ? <Upload className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
}

export default ObservaSusResourceFormPage;
