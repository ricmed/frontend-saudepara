import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import FormService, { type Form } from '@/services/FormService';
import FormShareLinkService, { type FormShareLink } from '@/services/FormShareLinkService';
import FormAclService, { type FormAclItem, type FormAclRole, type UserPick } from '@/services/FormAclService';
import {
  Copy, Plus, Shield, FileText, Lock, Globe, Link2,
  ChevronDown, ChevronUp, Users, Check, Settings,
} from 'lucide-react';

type Visibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';

const VISIBILITY_OPTIONS: { value: Visibility; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    value: 'PRIVATE',
    icon: <Lock className="h-5 w-5" />,
    label: 'Privado',
    desc: 'Só você e os colaboradores',
  },
  {
    value: 'UNLISTED',
    icon: <Link2 className="h-5 w-5" />,
    label: 'Compartilhável',
    desc: 'Quem receber o link pode responder',
  },
];

const ROLE_LABELS: Record<FormAclRole, string> = {
  VIEWER: 'Ver respostas',
  EDITOR: 'Editar',
  ADMIN: 'Gerenciar',
};

export const FormShareSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formId = Number(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Form | null>(null);
  const [links, setLinks] = useState<FormShareLink[]>([]);
  const [acl, setAcl] = useState<FormAclItem[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserPick[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPick | null>(null);
  const [selectedRole, setSelectedRole] = useState<FormAclRole>('VIEWER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRevokedLinks, setShowRevokedLinks] = useState(false);
  const [copied, setCopied] = useState(false);

  const [scheduleOpenAt, setScheduleOpenAt] = useState<string>('');
  const [scheduleCloseAt, setScheduleCloseAt] = useState<string>('');
  const [maxSubs, setMaxSubs] = useState<string>('');
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  const makeSlugFromName = (name: string) => {
    const raw = String(name || '').trim();
    if (!raw) return '';
    return raw
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  };

  const shareUrl = useMemo(() => {
    if (!form?.slug) return null;
    if ((form.visibility || 'PRIVATE') === 'PRIVATE') return null;
    return `${window.location.origin}/f/${form.slug}`;
  }, [form?.slug, form?.visibility]);

  const toLocalInputValue = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const load = async () => {
    try {
      setLoading(true);
      const [f, l, a] = await Promise.all([
        FormService.getFormById(formId),
        FormShareLinkService.list(formId),
        FormAclService.list(formId),
      ]);
      setForm(f);
      setLinks(l);
      setAcl(a);
      setScheduleOpenAt(toLocalInputValue((f as any).open_at ?? null));
      setScheduleCloseAt(toLocalInputValue((f as any).close_at ?? null));
      setMaxSubs((f as any).max_submissions != null ? String((f as any).max_submissions) : '');
      setConfirmMsg(String((f as any).confirmation_message ?? ''));
      setRedirectUrl(String((f as any).redirect_url ?? ''));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(formId)) return;
    load();
  }, [formId]);

  const update = async (patch: Partial<Form>) => {
    try {
      setSaving(true);
      const updated = await FormService.updateMyForm(formId, patch as any);
      setForm(updated);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const changeVisibility = async (vis: Visibility) => {
    if (vis === (form?.visibility || 'PRIVATE')) return;
    const patch: any = { visibility: vis };
    if (vis !== 'PRIVATE' && !form?.slug) {
      const suggested = makeSlugFromName(form?.nome || '');
      if (suggested) patch.slug = suggested;
    }
    await update(patch);
  };

  const createLink = async () => {
    try {
      if ((form?.visibility || 'PRIVATE') === 'PRIVATE') {
        const ok = confirm('Para gerar um link, a visibilidade precisa ser "Com link". Deseja alterar agora?');
        if (!ok) return;
        const updated = await FormService.updateMyForm(formId, { visibility: 'UNLISTED' } as any);
        setForm(updated);
      }
      const link = await FormShareLinkService.createRespond(formId);
      setLinks((prev) => [link, ...prev]);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao gerar link');
    }
  };

  const revoke = async (linkId: number) => {
    try {
      const updated = await FormShareLinkService.revoke(formId, linkId);
      setLinks((prev) => prev.map((l) => (l.id === linkId ? updated : l)));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao revogar link');
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copie o link:', text);
    }
  };

  const searchUsers = async () => {
    try {
      const q = userQuery.trim();
      if (q.length < 2) { setUserResults([]); return; }
      const res = await FormAclService.searchUsers(formId, q);
      setUserResults(res);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao buscar usuários');
    }
  };

  const addCollaborator = async () => {
    if (!selectedUser) return;
    try {
      const item = await FormAclService.upsert(formId, { user_id: selectedUser.id, role: selectedRole });
      setAcl((prev) => {
        const other = prev.filter((p) => p.id !== item.id && p.user_id !== item.user_id);
        return [...other, item].sort((a, b) => a.user.username.localeCompare(b.user.username));
      });
      setSelectedUser(null);
      setUserQuery('');
      setUserResults([]);
      setSelectedRole('VIEWER');
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao adicionar permissão');
    }
  };

  const removeCollaborator = async (aclId: number) => {
    try {
      await FormAclService.remove(formId, aclId);
      setAcl((prev) => prev.filter((p) => p.id !== aclId));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao remover permissão');
    }
  };

  const activeLinks = links.filter((l) => !l.revoked_at);
  const revokedLinks = links.filter((l) => !!l.revoked_at);
  const currentVisibility: Visibility = (form?.visibility || 'PRIVATE') as Visibility;

  const hasAdvancedConfig = !!(
    scheduleOpenAt || scheduleCloseAt || maxSubs || confirmMsg || redirectUrl ||
    form?.require_login || (form as any)?.collect_email ||
    (form as any)?.one_response_per_user || form?.allow_edit_after_submit ||
    form?.slug || activeLinks.length > 0 || currentVisibility === 'PUBLIC'
  );

  return (
    <AppPageLayout
      title="Compartilhar"
      subtitle={form?.nome || ''}
      icon={<Shield className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath="/private/meus-formularios"
      headerActions={
        <button
          onClick={() => navigate('/private/meus-formularios')}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
        >
          <FileText className="h-4 w-4" />
          Meus formulários
        </button>
      }
    >
      {loading || !form ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Visibilidade ─────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Quem pode responder?</h2>
            <p className="text-sm text-gray-500 mb-4">Escolha como este formulário será acessado.</p>
            <div className="grid grid-cols-2 gap-3">
              {VISIBILITY_OPTIONS.map((opt) => {
                // PUBLIC também marca o card "Compartilhável" (UNLISTED) como ativo
                const active = currentVisibility === opt.value
                  || (opt.value === 'UNLISTED' && currentVisibility === 'PUBLIC');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={saving}
                    onClick={() => changeVisibility(opt.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center
                      ${active
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {active && (
                      <span className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-blue-600" />
                      </span>
                    )}
                    <span className={active ? 'text-blue-600' : 'text-gray-400'}>{opt.icon}</span>
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-xs leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Link de compartilhamento ──────────────────────── */}
          {currentVisibility !== 'PRIVATE' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Link para compartilhar</h2>
              <p className="text-sm text-gray-500 mb-4">Envie este link para quem vai responder o formulário.</p>

              {shareUrl ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                  <span className="flex-1 text-sm text-gray-700 truncate font-mono">{shareUrl}</span>
                  <button
                    onClick={() => copy(shareUrl)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0
                      ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar link'}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-amber-800">Este formulário ainda não tem um endereço gerado.</p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      const suggested = makeSlugFromName(form?.nome || '');
                      if (!suggested) { alert('Não foi possível gerar. Verifique o nome do formulário.'); return; }
                      await update({ slug: suggested });
                    }}
                    className="shrink-0 px-3 py-1.5 bg-amber-700 text-white text-sm rounded-lg hover:bg-amber-800 disabled:opacity-50"
                  >
                    Gerar endereço
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ── Configurações avançadas (colapsável) ─────────── */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Configurações avançadas</span>
                {hasAdvancedConfig && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">configurado</span>
                )}
              </div>
              {showAdvanced
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 space-y-5 border-t pt-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Abrir em</label>
                    <input
                      type="datetime-local"
                      value={scheduleOpenAt}
                      disabled={saving}
                      onChange={(e) => setScheduleOpenAt(e.target.value)}
                      onBlur={() => update({ open_at: scheduleOpenAt ? new Date(scheduleOpenAt).toISOString() : null } as any)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Encerrar em</label>
                    <input
                      type="datetime-local"
                      value={scheduleCloseAt}
                      disabled={saving}
                      onChange={(e) => setScheduleCloseAt(e.target.value)}
                      onBlur={() => update({ close_at: scheduleCloseAt ? new Date(scheduleCloseAt).toISOString() : null } as any)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Limite de respostas</label>
                  <input
                    type="number"
                    min={1}
                    value={maxSubs}
                    disabled={saving}
                    onChange={(e) => setMaxSubs(e.target.value)}
                    onBlur={() => update({ max_submissions: maxSubs.trim() ? Number(maxSubs) : null } as any)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Sem limite"
                  />
                </div>

                {currentVisibility !== 'PRIVATE' && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={currentVisibility === 'PUBLIC'}
                      disabled={saving}
                      onChange={(e) => update({ visibility: e.target.checked ? 'PUBLIC' : 'UNLISTED' } as any)}
                      className="rounded"
                    />
                    <div>
                      <span className="font-medium">Tornar público</span>
                      <span className="text-xs text-gray-500 block">Qualquer pessoa pode encontrar este formulário, mesmo sem ter recebido o link</span>
                    </div>
                  </label>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Controle de acesso</label>
                  {([
                    { key: 'require_login', label: 'Exigir login para responder' },
                    { key: 'collect_email', label: 'Coletar e-mail do respondente' },
                    { key: 'one_response_per_user', label: 'Limitar a uma resposta por pessoa' },
                    { key: 'allow_edit_after_submit', label: 'Permitir editar após enviar' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!(form as any)[key]}
                        disabled={saving}
                        onChange={(e) => update({ [key]: e.target.checked } as any)}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Mensagem ao final</label>
                  <textarea
                    value={confirmMsg}
                    disabled={saving}
                    onChange={(e) => setConfirmMsg(e.target.value)}
                    onBlur={() => update({ confirmation_message: confirmMsg.trim() ? confirmMsg : null } as any)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Ex.: Obrigado por responder!"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Redirecionar após envio</label>
                  <input
                    value={redirectUrl}
                    disabled={saving}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    onBlur={() => update({ redirect_url: redirectUrl.trim() ? redirectUrl.trim() : null } as any)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="https://exemplo.com/obrigado"
                  />
                </div>

                {/* Links com token — para quem precisa revogar acesso por grupo */}
                {currentVisibility !== 'PRIVATE' && (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Links com código</label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Gere links individuais para cada grupo — permite revogar o acesso de um grupo sem afetar os outros.
                        </p>
                      </div>
                      <button
                        onClick={createLink}
                        className="shrink-0 flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                        Novo
                      </button>
                    </div>

                    {activeLinks.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Nenhum link gerado.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeLinks.map((l) => {
                          const url = form.slug ? `${window.location.origin}/f/${form.slug}?t=${l.token}` : null;
                          return (
                            <div key={l.id} className="flex items-center gap-2 p-2 bg-gray-50 border rounded-lg">
                              <span className="flex-1 text-xs text-gray-600 truncate font-mono">{url || l.token}</span>
                              <div className="flex gap-1 shrink-0">
                                {url && (
                                  <button onClick={() => copy(url)} className="p-2 border rounded-lg hover:bg-white" title="Copiar">
                                    <Copy className="h-3.5 w-3.5 text-gray-600" />
                                  </button>
                                )}
                                <button
                                  onClick={() => revoke(l.id)}
                                  className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                >
                                  Revogar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {revokedLinks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowRevokedLinks((v) => !v)}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        {showRevokedLinks ? 'Ocultar revogados' : `Ver revogados (${revokedLinks.length})`}
                      </button>
                    )}
                    {showRevokedLinks && (
                      <div className="space-y-1">
                        {revokedLinks.map((l) => {
                          const url = form.slug ? `${window.location.origin}/f/${form.slug}?t=${l.token}` : null;
                          return (
                            <div key={l.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-dashed rounded-lg opacity-50">
                              <span className="flex-1 text-xs text-gray-500 truncate font-mono">{url || l.token}</span>
                              <span className="text-xs text-red-500 font-medium shrink-0">Revogado</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Endereço personalizado (URL)</label>
                  <div className="mt-1 flex gap-0">
                    <span className="flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 rounded-l-lg">
                      /f/
                    </span>
                    <input
                      value={form.slug || ''}
                      disabled={saving}
                      onChange={(e) => setForm((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
                      onBlur={() => update({ slug: form.slug || null })}
                      className="flex-1 border rounded-none px-3 py-2 text-sm"
                      placeholder="pesquisa-satisfacao"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        const suggested = makeSlugFromName(form?.nome || '');
                        if (!suggested) { alert('Não foi possível gerar. Verifique o nome do formulário.'); return; }
                        const current = String(form?.slug || '').trim();
                        if (current && current !== suggested) {
                          const ok = confirm(`Substituir o endereço atual?\n\nAtual: ${current}\nNovo: ${suggested}`);
                          if (!ok) return;
                        }
                        setForm((prev) => (prev ? { ...prev, slug: suggested } : prev));
                        await update({ slug: suggested });
                      }}
                      className="px-3 py-2 bg-white border border-l-0 rounded-r-lg hover:bg-gray-50 text-sm text-gray-700"
                    >
                      Gerar
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Use letras, números e hífens.</p>
                </div>

              </div>
            )}
          </div>

          {/* ── Colaboradores ─────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-900">Colaboradores</h2>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Buscar por nome, e-mail ou usuário..."
                />
                <button
                  onClick={searchUsers}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  type="button"
                >
                  Buscar
                </button>
              </div>

              {userResults.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setSelectedUser(u); setUserResults([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{u.username}</div>
                      <div className="text-xs text-gray-500">
                        {u.name || '-'}{u.email ? ` · ${u.email}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">{selectedUser.username}</p>
                    {selectedUser.email && (
                      <p className="text-xs text-blue-700">{selectedUser.email}</p>
                    )}
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as FormAclRole)}
                    className="border rounded-lg px-2 py-1.5 text-sm bg-white"
                  >
                    {(Object.entries(ROLE_LABELS) as [FormAclRole, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <button
                    onClick={addCollaborator}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              )}
            </div>

            {acl.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400 italic">Nenhum colaborador adicionado.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {acl.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{a.user.username}</div>
                      <div className="text-xs text-gray-500">
                        {a.user.name || '-'}{a.user.email ? ` · ${a.user.email}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {ROLE_LABELS[a.role] || a.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCollaborator(a.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </AppPageLayout>
  );
};
