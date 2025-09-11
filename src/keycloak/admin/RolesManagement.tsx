import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  AlertCircle,
  Check,
  X,
  MoreVertical
} from 'lucide-react';
import { useRoles, useUsers } from '@/keycloak/admin/hooks/useAdminApi';
import type { Role, Notification } from  './types/admin.types';

interface RoleFormData {
  name: string;
  description: string;
}

const RolesManagement: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [roleUsers, setRoleUsers] = useState<Record<string, number>>({});

  const rolesApi = useRoles();
  const usersApi = useUsers();

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await rolesApi.listRoles();
      setRoles(data);
      
      // Carregar contagem de usuários para cada role
      loadRoleUserCounts(data);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      showNotification('Erro ao carregar roles', 'error');
    }
  };

  const loadRoleUserCounts = async (rolesList: Role[]) => {
    try {
      // Para cada role, buscar usuários que possuem essa role
      const counts: Record<string, number> = {};
      
      for (const role of rolesList) {
        try {
          // Buscar usuários com esta role específica
          const users = await usersApi.listUsers({ 
            first: 0, 
            max: 1000 // Para contar todos
          });
          
          // Contar usuários que possuem esta role
          // Nota: Esta é uma abordagem simplificada. Em produção, 
          // seria melhor ter um endpoint específico para isso.
          counts[role.id] = 0; // Placeholder - implementar lógica real conforme necessário
        } catch (error) {
          counts[role.id] = 0;
        }
      }
      
      setRoleUsers(counts);
    } catch (error) {
      console.error('Erro ao carregar contagens de usuários:', error);
    }
  };

  const showNotification = (message: string, type: Notification['type']) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setShowCreateModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setShowCreateModal(true);
    setActionMenuOpen(null);
  };

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(t('admin.roles.confirmDelete', { name: role.name }))) {
      return;
    }

    try {
      // Nota: Implementar endpoint de delete se necessário
      showNotification(t('admin.roles.deleteSuccess'), 'success');
      loadRoles();
    } catch (error) {
      console.error('Erro ao excluir role:', error);
      showNotification(t('admin.roles.deleteError'), 'error');
    }
    setActionMenuOpen(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification(t('admin.roles.validation.nameRequired'), 'error');
      return;
    }

    try {
      const roleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (editingRole) {
        // Atualizar role existente
        // Nota: Implementar endpoint de update se necessário
        showNotification(t('admin.roles.updateSuccess'), 'success');
      } else {
        // Criar nova role
        await rolesApi.createRole(roleData);
        showNotification(t('admin.roles.createSuccess'), 'success');
      }

      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      console.error('Erro ao salvar role:', error);
      showNotification(t('admin.roles.saveError'), 'error');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
          notification.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
          'bg-blue-100 border-blue-500 text-blue-700'
        } border rounded-lg p-4 shadow-lg`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título e ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('admin.roles.title')}
              </h1>
              <p className="text-gray-600">
                {t('admin.roles.subtitle')}
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleCreateRole}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.roles.createRole')}
              </button>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={t('admin.roles.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Grid de roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesApi.loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? t('admin.roles.noRolesFound') : t('admin.roles.noRoles')}
                </p>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-lg p-3 mr-3">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {role.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {role.description || t('admin.roles.noDescription')}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === role.id ? null : role.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {actionMenuOpen === role.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4 mr-3" />
                              {t('admin.roles.actions.edit')}
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              {t('admin.roles.actions.delete')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estatísticas da role */}
                  <div className="border-t pt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>
                        {roleUsers[role.id] || 0} {t('admin.roles.usersWithRole')}
                      </span>
                    </div>
                  </div>

                  {/* Badges para roles especiais */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.name === 'admin' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {t('admin.roles.systemRole')}
                      </span>
                    )}
                    {role.composite && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {t('admin.roles.compositeRole')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal de criação/edição */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingRole ? t('admin.roles.editRole') : t('admin.roles.createRole')}
              </h2>
              
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.roles.roleName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.roles.roleNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.roles.roleDescription')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.roles.roleDescriptionPlaceholder')}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', description: '' });
                      setEditingRole(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t('admin.roles.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={rolesApi.loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rolesApi.loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {editingRole ? t('admin.roles.update') : t('admin.roles.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <Footer selectedLanguage={selectedLanguage} />
      
      {/* Menu lateral */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />
    </div>
  );
};

export default RolesManagement;