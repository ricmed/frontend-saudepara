import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/keycloak/AuthProvider';

// Importar as páginas administrativas
import AdminDashboard from './AdminDashboard';
import UsersList from './UsersList';
import UserForm from './UserForm';
import PasswordReset from './PasswordReset';
import RolesManagement from './RolesManagement';
import AdminReports from './AdminReports';

// Componente de proteção para verificar se o usuário tem role admin
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Verificar se o usuário tem a role 'admin'
  const isAdmin = user?.roles?.includes('admin') || false;
  
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

// Componente principal das rotas administrativas
const AdminRoutes: React.FC = () => {
  return (
    <AdminProtectedRoute>
      <Routes>
        {/* Dashboard principal */}
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        
        {/* Gestão de usuários */}
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/new" element={<UserForm />} />
        <Route path="/users/:id/edit" element={<UserForm />} />
        <Route path="/users/:id/reset-password" element={<PasswordReset />} />
        
        {/* Gestão de roles */}
        <Route path="/roles" element={<RolesManagement />} />
        
        {/* Relatórios */}
        <Route path="/reports" element={<AdminReports />} />
        
        {/* Configurações */}
        <Route path="/settings" element={<div>Configurações - Em desenvolvimento</div>} />
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminProtectedRoute>
  );
};

export default AdminRoutes;