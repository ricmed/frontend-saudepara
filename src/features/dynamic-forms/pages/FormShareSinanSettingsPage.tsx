import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import FormService, { type Form } from '@/services/FormService';
import FormAclService, { type FormAclItem, type FormAclRole, type UserPick } from '@/services/FormAclService';
import FormScopeAclService, { type FormScopeAclItem, type FormScopeType } from '@/services/FormScopeAclService';
import { Shield, FileText, Plus, Trash2 } from 'lucide-react';

export const FormShareSinanSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formId = Number(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Form | null>(null);
  const [acl, setAcl] = useState<FormAclItem[]>([]);
  const [scopeAcl, setScopeAcl] = useState<FormScopeAclItem[]>([]);
  const [loading, setLoading] = useState(true);

  // user ACL add
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserPick[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPick | null>(null);
  const [selectedRole, setSelectedRole] = useState<FormAclRole>('VIEWER');
  const [savingUser, setSavingUser] = useState(false);

  // scope ACL add
  const [scopeType, setScopeType] = useState<FormScopeType>('CRS');
  const [scopeId, setScopeId] = useState<string>('');
  const [scopeRole, setScopeRole] = useState<FormAclRole>('VIEWER');
  const [savingScope, setSavingScope] = useState(false);

  const isSinan = useMemo(() => (form ? !form.owner_user_id : true), [form]);

  const load = async () => {
    try {
      setLoading(true);
      const [f, a, s] = await Promise.all([
        FormService.getFormById(formId),
        FormAclService.list(formId),
        FormScopeAclService.list(formId),
      ]);
      setForm(f);
      setAcl(a);
      setScopeAcl(s);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(formId)) return;
    load();
  }, [formId]);

  const searchUsers = async (q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      setUserResults([]);
      return;
    }
    try {
      const hits = await FormAclService.searchUsers(formId, term);
      setUserResults(hits);
    } catch (e: any) {
      setUserResults([]);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userQuery), 250);
    return () => clearTimeout(t);
  }, [userQuery]);

  const addOrUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setSavingUser(true);
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
      alert(e?.response?.data?.message || e?.message || 'Erro ao salvar permissão');
    } finally {
      setSavingUser(false);
    }
  };

  const removeUser = async (aclId: number) => {
    try {
      await FormAclService.remove(formId, aclId);
      setAcl((prev) => prev.filter((p) => p.id !== aclId));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao remover permissão');
    }
  };

  const addOrUpdateScope = async () => {
    const idNum = Number(scopeId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      alert('scope_id inválido');
      return;
    }
    try {
      setSavingScope(true);
      const item = await FormScopeAclService.upsert(formId, { scope_type: scopeType, scope_id: idNum, role: scopeRole });
      setScopeAcl((prev) => {
        const other = prev.filter(
          (p) => !(p.form_id === item.form_id && p.scope_type === item.scope_type && p.scope_id === item.scope_id)
        );
        return [...other, item].sort((a, b) => `${a.scope_type}:${a.scope_id}`.localeCompare(`${b.scope_type}:${b.scope_id}`));
      });
      setScopeId('');
      setScopeRole('VIEWER');
      setScopeType('CRS');
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao salvar permissão por escopo');
    } finally {
      setSavingScope(false);
    }
  };

  const removeScope = async (item: FormScopeAclItem) => {
    try {
      await FormScopeAclService.remove(formId, item.scope_type, item.scope_id);
      setScopeAcl((prev) => prev.filter((p) => !(p.scope_type === item.scope_type && p.scope_id === item.scope_id)));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao remover permissão');
    }
  };

  return (
    <AppPageLayout
      title="Permissões (SINAN)"
      subtitle={form?.nome || ''}
      icon={<Shield className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath="/private/formularios-admin"
      headerActions={
        <button
          onClick={() => navigate('/private/formularios-admin')}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
        >
          <FileText className="h-4 w-4" />
          Gerenciar Formulários
        </button>
      }
    >
      {loading || !form ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : !isSinan ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-800">
            Este formulário parece ser <strong>GERAL</strong>. Para formulários gerais, use a tela de compartilhar em{' '}
            <code>/private/meus-formularios</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Acesso por usuário (Form ACL)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Buscar usuário</label>
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="username, email, nome…"
                  className="w-full border rounded px-3 py-2"
                />

                {userResults.length > 0 && (
                  <div className="mt-2 border rounded bg-white max-h-56 overflow-auto">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserResults([]);
                          setUserQuery(u.username);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        <div className="text-xs text-gray-500">{u.email || u.name || u.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Papel</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as FormAclRole)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <button
                  type="button"
                  disabled={!selectedUser || savingUser}
                  onClick={addOrUpdateUser}
                  className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
            </div>

            <div className="mt-4 divide-y">
              {acl.length === 0 ? (
                <p className="text-sm text-gray-600">Nenhum usuário delegado ainda.</p>
              ) : (
                acl.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{a.user.username}</div>
                      <div className="text-xs text-gray-500">{a.user.email || a.user.name || a.user.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{a.role}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(a.id)}
                        className="px-2 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Acesso por escopo (Estado/CRS/Município/Unidade)</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                <select
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value as FormScopeType)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="STATE">STATE</option>
                  <option value="CRS">CRS</option>
                  <option value="MUNICIPIO">MUNICIPIO</option>
                  <option value="UNIDADE">UNIDADE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">ID</label>
                <input
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  placeholder="ex.: 12"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Papel</label>
                <select
                  value={scopeRole}
                  onChange={(e) => setScopeRole(e.target.value as FormAclRole)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={savingScope}
                  onClick={addOrUpdateScope}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
            </div>

            <div className="mt-4 divide-y">
              {scopeAcl.length === 0 ? (
                <p className="text-sm text-gray-600">Nenhum escopo delegado ainda.</p>
              ) : (
                scopeAcl.map((s) => (
                  <div key={`${s.scope_type}:${s.scope_id}`} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {s.scope_type} #{s.scope_id}
                      </div>
                      <div className="text-xs text-gray-500">Papel: {s.role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScope(s)}
                      className="px-2 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppPageLayout>
  );
};

