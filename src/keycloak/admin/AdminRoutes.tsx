import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/keycloak/AuthProvider';
import { useAdminUrls } from './hooks/useAdminContext';
// TODO(reativar ObservaSUS): descomentar imports e rotas ObservaSUS
// import {
//   canEditObservaSusResources,
//   canManageObservaSusUsers,
// } from '@/features/observasus/admin/observasusAdminAccess';

// Importar as páginas administrativas
import AdminDashboard from './AdminDashboard';
import UsersList from './UsersList';
import UserForm from './UserForm';
import PasswordReset from './PasswordReset';
import RolesManagement from './RolesManagement';
import AdminReports from './AdminReports';
// import ObservaSusAdminPage from '@/features/observasus/admin/pages/ObservaSusAdminPage';
// import ObservaSusResourceFormPage from '@/features/observasus/admin/pages/ObservaSusResourceFormPage';

// Importar as páginas administrativas hierárquicas
import DashboardUnidade from './DashboardUnidade';
import DashboardMunicipio from './DashboardMunicipio';
import DashboardCrs from './DashboardCrs';
import DashboardEstado from './DashboardEstado';
import UserFormUnidade from './UserFormUnidade';
import UserFormMunicipio from './UserFormMunicipio';
import UserFormCrs from './UserFormCrs';
import UserFormEstado from './UserFormEstado';
import UserListUnidade from './UserListUnidade';
import UserListMunicipio from './UserListMunicipio';
import UserListCrs from './UserListCrs';
import UserListEstado from './UserListEstado';

// Componente de proteção para verificar se o usuário tem role admin hierárquica
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin =
    roles.includes('admin') ||
    roles.includes('admin.unidade') ||
    roles.includes('admin.municipio') ||
    roles.includes('admin.crs') ||
    roles.includes('admin.estado');
    // || canEditObservaSusResources(roles)
    // || canManageObservaSusUsers(roles);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso Negado
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Você não tem permissão para acessar esta área. É necessário ter privilégios de administrador.
          </p>
          <div className="text-xs text-gray-400 mb-4">
            Roles disponíveis: {user?.roles?.join(', ') || 'Nenhuma'}
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const PlatformAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isPlatformAdmin =
    roles.includes('admin') ||
    roles.includes('admin.unidade') ||
    roles.includes('admin.municipio') ||
    roles.includes('admin.crs') ||
    roles.includes('admin.estado');

  if (!isPlatformAdmin) {
    // ObservaSUS desativado: antes redirecionava para /admin/master/observasus
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

// const ObservaSusEditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { user } = useAuth();
//
//   if (!canEditObservaSusResources(user?.roles)) {
//     return <Navigate to="/admin/master/observasus" replace />;
//   }
//
//   return <>{children}</>;
// };

// const ObservaSusUserManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { user } = useAuth();
//
//   if (!canManageObservaSusUsers(user?.roles)) {
//     return <Navigate to="/admin/master/observasus" replace />;
//   }
//
//   return <>{children}</>;
// };

// Componente principal das rotas administrativas com redirecionamento inteligente
const AdminRedirect: React.FC = () => {
  const { user } = useAuth();
  const { dashboard } = useAdminUrls();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ObservaSUS — desativado temporariamente
  // if (canManageObservaSusUsers(user.roles) && !user.roles?.some((r) => r === 'admin' || r.startsWith('admin.'))) {
  //   return <Navigate to="/admin/master/observasus" replace />;
  // }

  return <Navigate to={dashboard} replace />;
};

const AdminRoutes: React.FC = () => {
  return (
    <AdminProtectedRoute>
      <Routes>
        {/* Redirecionamento automático baseado no nível do admin */}
        <Route path="/" element={<AdminRedirect />} />
        <Route path="/dashboard" element={<AdminRedirect />} />
        
        {/* Dashboard principal - admin master */}
        <Route
          path="/master"
          element={
            <PlatformAdminRoute>
              <AdminDashboard />
            </PlatformAdminRoute>
          }
        />
        <Route path="/master/dashboard" element={<Navigate to="/admin/master" replace />} />

        {/* Gestão de usuários */}
        <Route
          path="/master/users"
          element={
            <PlatformAdminRoute>
              <UsersList />
            </PlatformAdminRoute>
          }
        />
        <Route
          path="/master/users/new"
          element={
            <PlatformAdminRoute>
              <UserForm />
            </PlatformAdminRoute>
          }
        />
        <Route
          path="/master/users/:id/edit"
          element={
            <PlatformAdminRoute>
              <UserForm />
            </PlatformAdminRoute>
          }
        />
        <Route
          path="/master/users/:id/reset-password"
          element={
            <PlatformAdminRoute>
              <PasswordReset />
            </PlatformAdminRoute>
          }
        />

        {/* Gestão de roles */}
        <Route
          path="/master/roles"
          element={
            <PlatformAdminRoute>
              <RolesManagement />
            </PlatformAdminRoute>
          }
        />

        {/* ObservaSUS — catálogo de recursos (desativado temporariamente)
        <Route path="/master/observasus" element={<ObservaSusAdminPage />} />
        <Route
          path="/master/observasus/new"
          element={
            <ObservaSusEditorRoute>
              <ObservaSusResourceFormPage />
            </ObservaSusEditorRoute>
          }
        />
        <Route
          path="/master/observasus/:id/edit"
          element={
            <ObservaSusEditorRoute>
              <ObservaSusResourceFormPage />
            </ObservaSusEditorRoute>
          }
        />
        */}

        {/* Relatórios - admin master */}
        <Route
          path="/master/reports"
          element={
            <PlatformAdminRoute>
              <AdminReports />
            </PlatformAdminRoute>
          }
        />
        
        {/* Rotas legacy do admin master (para compatibilidade) */}
        <Route path="/users" element={<Navigate to="/admin/master/users" replace />} />
        <Route path="/users/new" element={<Navigate to="/admin/master/users/new" replace />} />
        <Route path="/roles" element={<Navigate to="/admin/master/roles" replace />} />
        <Route path="/reports" element={<Navigate to="/admin/master/reports" replace />} />
        
        {/* =============================================== */}
        {/* ROTAS HIERÁRQUICAS - ADMIN.UNIDADE */}
        {/* =============================================== */}
        <Route path="/unidade" element={<DashboardUnidade />} />
        <Route path="/unidade/dashboard" element={<Navigate to="/admin/unidade" replace />} />
        <Route path="/unidade/users" element={<UserListUnidade />} />
        <Route path="/unidade/users/new" element={<UserFormUnidade />} />
        <Route path="/unidade/users/:id/edit" element={<UserFormUnidade />} />
        <Route path="/unidade/users/:id/reset-password" element={<PasswordReset />} />
        
        {/* =============================================== */}
        {/* ROTAS HIERÁRQUICAS - ADMIN.MUNICIPIO */}
        {/* =============================================== */}
        <Route path="/municipio" element={<DashboardMunicipio />} />
        <Route path="/municipio/dashboard" element={<Navigate to="/admin/municipio" replace />} />
        <Route path="/municipio/users" element={<UserListMunicipio />} />
        <Route path="/municipio/users/new" element={<UserFormMunicipio />} />
        <Route path="/municipio/users/:id/edit" element={<UserFormMunicipio />} />
        <Route path="/municipio/users/:id/reset-password" element={<PasswordReset />} />
        
        {/* =============================================== */}
        {/* ROTAS HIERÁRQUICAS - ADMIN.CRS */}
        {/* =============================================== */}
        <Route path="/crs" element={<DashboardCrs />} />
        <Route path="/crs/dashboard" element={<Navigate to="/admin/crs" replace />} />
        <Route path="/crs/users" element={<UserListCrs />} />
        <Route path="/crs/users/new" element={<UserFormCrs />} />
        <Route path="/crs/users/:id/edit" element={<UserFormCrs />} />
        <Route path="/crs/users/:id/reset-password" element={<PasswordReset />} />
        
        {/* =============================================== */}
        {/* ROTAS HIERÁRQUICAS - ADMIN.ESTADO */}
        {/* =============================================== */}
        <Route path="/estado" element={<DashboardEstado />} />
        <Route path="/estado/dashboard" element={<Navigate to="/admin/estado" replace />} />
        <Route path="/estado/users" element={<UserListEstado />} />
        <Route path="/estado/users/new" element={<UserFormEstado />} />
        <Route path="/estado/users/:id/edit" element={<UserFormEstado />} />
        <Route path="/estado/users/:id/reset-password" element={<PasswordReset />} />
        
        {/* Configurações */}
        <Route path="/settings" element={<div>Configurações - Em desenvolvimento</div>} />
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminProtectedRoute>
  );
};

export default AdminRoutes;
