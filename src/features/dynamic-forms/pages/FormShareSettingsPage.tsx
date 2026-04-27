import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import FormService, { type Form } from '@/services/FormService';
import FormShareLinkService, { type FormShareLink } from '@/services/FormShareLinkService';
import FormAclService, { type FormAclItem, type FormAclRole, type UserPick } from '@/services/FormAclService';
import { Link2, Copy, Plus, Shield, FileText } from 'lucide-react';

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
  const [scheduleOpenAt, setScheduleOpenAt] = useState<string>('');
  const [scheduleCloseAt, setScheduleCloseAt] = useState<string>('');
  const [maxSubs, setMaxSubs] = useState<string>('');
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [showRevokedLinks, setShowRevokedLinks] = useState(false);

  const makeSlugFromName = (name: string) => {
    const raw = String(name || '').trim();
    if (!raw) return '';
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  };

  const publicUrl = useMemo(() => {
    if (!form?.slug) return null;
    if (form.visibility !== 'PUBLIC') return null;
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

  const createLink = async () => {
    try {
      // Link com token só funciona com visibilidade UNLISTED (ou PUBLIC).
      // Se estiver PRIVATE, mudamos para UNLISTED automaticamente para o link funcionar.
      if (form?.visibility === 'PRIVATE') {
        const ok = confirm('Para gerar link com token, a visibilidade precisa ser "Não listado (UNLISTED)". Deseja alterar agora?');
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
      alert('Copiado!');
    } catch {
      prompt('Copie o link:', text);
    }
  };

  const searchUsers = async () => {
    try {
      const q = userQuery.trim();
      if (q.length < 2) {
        setUserResults([]);
        return;
      }
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
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Visibilidade</label>
                <select
                  value={form.visibility || 'PRIVATE'}
                  disabled={saving}
                  onChange={(e) => update({ visibility: e.target.value as any })}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="PRIVATE">Privado</option>
                  <option value="UNLISTED">Não listado (quem tem o link acessa)</option>
                  <option value="PUBLIC">Público</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 leading-snug">
                  <strong>Privado</strong>: só você e colaboradores. <strong>Não listado</strong>: só quem tiver o link.
                  <strong> Público</strong>: qualquer pessoa com o link (e pode ser divulgado).
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Endereço do link (URL)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={form.slug || ''}
                    disabled={saving}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
                    onBlur={() => update({ slug: form.slug || null })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="ex: pesquisa-satisfacao"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      const suggested = makeSlugFromName(form?.nome || '');
                      if (!suggested) {
                        alert('Não foi possível gerar. Preencha o nome do formulário primeiro.');
                        return;
                      }
                      const current = String(form?.slug || '').trim();
                      if (current && current !== suggested) {
                        const ok = confirm(`Substituir o endereço atual?\n\nAtual: ${current}\nNovo: ${suggested}`);
                        if (!ok) return;
                      }
                      setForm((prev) => (prev ? { ...prev, slug: suggested } : prev));
                      await update({ slug: suggested });
                    }}
                    className="px-3 py-2 bg-white border rounded hover:bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap"
                    title="Gerar automaticamente a partir do nome"
                  >
                    Gerar
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 leading-snug">
                  Isso vira o link: <span className="font-mono">/f/seu-endereco</span>. Use letras/números e hífen.
                  <span className="block">
                    Para <strong>Público</strong> e <strong>Não listado</strong>, este campo é necessário para gerar o link.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.require_login}
                  disabled={saving}
                  onChange={(e) => update({ require_login: e.target.checked })}
                />
                Exigir login para responder
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.allow_edit_after_submit}
                  disabled={saving}
                  onChange={(e) => update({ allow_edit_after_submit: e.target.checked })}
                />
                Permitir editar após enviar
              </label>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Regras e comportamento</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Abrir em (opcional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleOpenAt}
                    disabled={saving}
                    onChange={(e) => setScheduleOpenAt(e.target.value)}
                    onBlur={() => update({ open_at: scheduleOpenAt ? new Date(scheduleOpenAt).toISOString() : null } as any)}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Encerrar em (opcional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleCloseAt}
                    disabled={saving}
                    onChange={(e) => setScheduleCloseAt(e.target.value)}
                    onBlur={() => update({ close_at: scheduleCloseAt ? new Date(scheduleCloseAt).toISOString() : null } as any)}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Limite de respostas (opcional)</label>
                  <input
                    type="number"
                    min={1}
                    value={maxSubs}
                    disabled={saving}
                    onChange={(e) => setMaxSubs(e.target.value)}
                    onBlur={() =>
                      update({ max_submissions: maxSubs.trim() ? Number(maxSubs) : null } as any)
                    }
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="ex.: 100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Controle de acesso</label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!(form as any).collect_email}
                      disabled={saving}
                      onChange={(e) => update({ collect_email: e.target.checked } as any)}
                    />
                    Coletar e-mail (precisa login)
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!(form as any).one_response_per_user}
                      disabled={saving}
                      onChange={(e) => update({ one_response_per_user: e.target.checked } as any)}
                    />
                    Uma resposta por pessoa (precisa login)
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Mensagem de confirmação (opcional)</label>
                <textarea
                  value={confirmMsg}
                  disabled={saving}
                  onChange={(e) => setConfirmMsg(e.target.value)}
                  onBlur={() => update({ confirmation_message: confirmMsg.trim() ? confirmMsg : null } as any)}
                  className="mt-1 w-full border rounded px-3 py-2 min-h-[80px]"
                  placeholder="Ex.: Obrigado por responder!"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Redirecionar após enviar (opcional)</label>
                <input
                  value={redirectUrl}
                  disabled={saving}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  onBlur={() => update({ redirect_url: redirectUrl.trim() ? redirectUrl.trim() : null } as any)}
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="https://exemplo.com/obrigado"
                />
              </div>
            </div>

            {form.visibility === 'PUBLIC' && !form.slug ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">Para ficar público</p>
                <p className="text-sm text-amber-800">Defina o <strong>endereço do link (URL)</strong> e salve.</p>
              </div>
            ) : null}

            {publicUrl ? (
              <div className="rounded-lg border bg-gray-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">Link público</p>
                  <p className="text-sm text-gray-600 truncate">{publicUrl}</p>
                </div>
                <button
                  onClick={() => copy(publicUrl)}
                  className="px-3 py-2 bg-white border rounded hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            ) : null}

            {form.visibility === 'PRIVATE' ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-800">Formulário privado</p>
                <p className="text-sm text-gray-600">
                  Para compartilhar com o público, altere a visibilidade para <strong>Público</strong> ou <strong>Não listado</strong>.
                </p>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Links para compartilhar
              </h3>
              <button
                onClick={createLink}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar link para compartilhar
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Use quando a visibilidade estiver em <strong>Não listado</strong> (ou <strong>Público</strong>). Envie este link para quem vai responder.
            </p>

            {links.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum link gerado.</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const active = links.filter((l) => !l.revoked_at);
                  const revoked = links.filter((l) => !!l.revoked_at);
                  const list = showRevokedLinks ? [...active, ...revoked] : active;
                  return (
                    <>
                      {revoked.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowRevokedLinks((v) => !v)}
                          className="px-3 py-2 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-700 inline-flex items-center gap-2"
                        >
                          {showRevokedLinks ? 'Ocultar revogados' : `Mostrar revogados (${revoked.length})`}
                        </button>
                      ) : null}
                      {list.map((l) => {
                  const url = form.slug ? `${window.location.origin}/f/${form.slug}?t=${l.token}` : null;
                  return (
                    <div key={l.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {l.kind} {l.revoked_at ? '· REVOGADO' : ''}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{url || l.token}</p>
                      </div>
                      <div className="flex gap-2">
                        {url && (
                          <button
                            onClick={() => copy(url)}
                            className="px-3 py-2 bg-white border rounded hover:bg-gray-50 flex items-center gap-2"
                            title="Copiar"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                        {!l.revoked_at && (
                          <button
                            onClick={() => revoke(l.id)}
                            className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                            title="Revogar"
                          >
                            Revogar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                      })}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Colaboradores (permissões)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Buscar usuário (username / email / nome)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="ex: joao, joao@, Maria"
                  />
                  <button
                    onClick={searchUsers}
                    className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    type="button"
                  >
                    Buscar
                  </button>
                </div>

                {userResults.length > 0 && (
                  <div className="mt-2 border rounded max-h-48 overflow-auto">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        <div className="text-xs text-gray-600">
                          {u.name || '-'} {u.email ? `· ${u.email}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <p className="mt-2 text-sm text-gray-700">
                    Selecionado: <strong>{selectedUser.username}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as FormAclRole)}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="VIEWER">VIEWER (ver respostas)</option>
                  <option value="EDITOR">EDITOR (editar)</option>
                  <option value="ADMIN">ADMIN (compartilhar)</option>
                </select>

                <button
                  onClick={addCollaborator}
                  disabled={!selectedUser}
                  className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  type="button"
                >
                  Adicionar / Atualizar
                </button>
              </div>
            </div>

            {acl.length === 0 ? (
              <p className="text-sm text-gray-600">Sem colaboradores.</p>
            ) : (
              <div className="space-y-2">
                {acl.map((a) => (
                  <div key={a.id} className="border rounded p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{a.user.username}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {a.user.name || '-'} {a.user.email ? `· ${a.user.email}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-800">
                        {a.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCollaborator(a.id)}
                        className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
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

