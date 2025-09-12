import React from 'react';
import { useAccessScope } from '../hooks/useAccessScope';

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Guard que permite acesso apenas para usuários Master
 * Usuários com escopo limitado verão o fallback ou mensagem de acesso negado
 */
export const MasterOnlyRoute: React.FC<RouteGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { userInfo, isLoading, error } = useAccessScope();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">🔍 Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erro de Autenticação
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Check if user is master
  if (!userInfo?.isMaster) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            👑 Acesso Restrito - Apenas Masters
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Esta funcionalidade está disponível apenas para usuários com privilégios de Master.
            Você possui acesso limitado ao nível{' '}
            <span className="font-medium text-blue-600">
              {userInfo?.scope?.tipo || 'limitado'}
            </span>.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => window.location.href = '/admin'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🏠 Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is master, render children
  return <>{children}</>;
};

/**
 * Guard que permite acesso para usuários com escopo administrativo
 * Bloqueia apenas usuários sem permissões administrativas
 */
export const ScopedAdminRoute: React.FC<RouteGuardProps & {
  requiredScope?: 'estado' | 'municipio' | 'unidade';
  allowMaster?: boolean;
}> = ({ 
  children, 
  fallback,
  requiredScope,
  allowMaster = true 
}) => {
  const { userInfo, isLoading, error } = useAccessScope();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">🔍 Verificando escopo de acesso...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erro de Autenticação
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Allow master users if allowMaster is true
  if (allowMaster && userInfo?.isMaster) {
    return <>{children}</>;
  }

  // Check if user has admin scope
  if (!userInfo?.scope) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🚫 Acesso Negado
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Você não possui escopo administrativo válido para acessar esta funcionalidade.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check required scope if specified
  if (requiredScope && userInfo.scope.tipo !== requiredScope) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🎯 Escopo Incompatível
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Esta funcionalidade requer acesso de nível{' '}
            <span className="font-medium text-orange-600">{requiredScope}</span>.
            Seu escopo atual é{' '}
            <span className="font-medium text-blue-600">{userInfo.scope.tipo}</span>.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => window.location.href = '/admin'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🏠 Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has valid scope, render children
  return <>{children}</>;
};

/**
 * Guard que permite acesso apenas para usuários de um nível específico
 * Útil para páginas específicas de estado, município ou unidade
 */
export const SpecificScopeRoute: React.FC<RouteGuardProps & {
  requiredScope: 'estado' | 'municipio' | 'unidade';
  allowMaster?: boolean;
}> = ({ children, fallback, requiredScope, allowMaster = false }) => {
  return (
    <ScopedAdminRoute
      requiredScope={requiredScope}
      allowMaster={allowMaster}
      fallback={fallback}
    >
      {children}
    </ScopedAdminRoute>
  );
};

export default {
  MasterOnlyRoute,
  ScopedAdminRoute,
  SpecificScopeRoute
};
