import React from 'react';
import { useAccessScope, useIsMaster, useUserScope } from '../hooks/useAccessScope';

/**
 * Componente de exemplo para demonstrar o uso dos hooks de escopo
 */
export const AccessScopeDemo: React.FC = () => {
  const { userInfo, isLoading, error, refetch } = useAccessScope();
  const { isMaster } = useIsMaster();
  const { scope } = useUserScope();

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          🔄 Carregando informações de escopo...
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ❌ Erro ao carregar escopo
        </h3>
        <p className="text-red-600 mb-3">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informações Básicas */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          👤 Informações do Usuário
        </h3>
        <div className="space-y-2">
          <p><strong>ID:</strong> {userInfo?.user_id}</p>
          <p>
            <strong>Tipo:</strong>{' '}
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              isMaster 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isMaster ? '👑 Master (Acesso Total)' : '🔒 Admin Limitado'}
            </span>
          </p>
        </div>
      </div>

      {/* Escopo de Acesso */}
      <div className="p-4 border rounded-lg bg-green-50">
        <h3 className="text-lg font-semibold text-green-800 mb-3">
          🎯 Escopo de Acesso
        </h3>
        
        {isMaster ? (
          <div className="text-green-700">
            <p className="font-medium">✨ Usuário Master</p>
            <p className="text-sm">Acesso total a todos os dados do sistema</p>
          </div>
        ) : scope ? (
          <div className="space-y-2">
            <p>
              <strong>Nível:</strong>{' '}
              <span className="capitalize font-medium text-green-700">
                {scope.tipo}
              </span>
            </p>
            
            {scope.tipo_estado_id && (
              <p><strong>Estado ID:</strong> {scope.tipo_estado_id}</p>
            )}
            
            {scope.tipo_municipio_id && (
              <p><strong>Município ID:</strong> {scope.tipo_municipio_id}</p>
            )}
            
            {scope.estabelecimento_id && (
              <p><strong>Estabelecimento ID:</strong> {scope.estabelecimento_id}</p>
            )}
            
            <div className="mt-3 p-2 bg-green-100 rounded text-sm">
              <p className="font-medium text-green-800">
                🔍 Filtros Aplicados:
              </p>
              <p className="text-green-700">
                Este usuário só pode ver dados dentro do seu escopo hierárquico
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum escopo definido</p>
        )}
      </div>

      {/* Ações de Teste */}
      <div className="p-4 border rounded-lg bg-yellow-50">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          🔧 Ações de Teste
        </h3>
        <div className="space-y-2">
          <button
            onClick={refetch}
            className="mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Recarregar Escopo
          </button>
          
          <button
            onClick={() => console.log('Dados completos:', { userInfo, isMaster, scope })}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            📋 Log no Console
          </button>
        </div>
      </div>

      {/* Dados JSON para Debugging */}
      <details className="p-4 border rounded-lg bg-gray-100">
        <summary className="cursor-pointer font-semibold text-gray-800">
          🔍 Dados JSON (Debug)
        </summary>
        <pre className="mt-3 p-3 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">
          {JSON.stringify({ userInfo, isMaster, scope }, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default AccessScopeDemo;
