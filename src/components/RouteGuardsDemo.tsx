import React from 'react';
import { MasterOnlyRoute, ScopedAdminRoute, SpecificScopeRoute } from '../components/RouteGuards';
import { useAccessScope } from '../hooks/useAccessScope';

/**
 * Página que demonstra o uso dos Route Guards
 */
export const RouteGuardsDemo: React.FC = () => {
  const { userInfo } = useAccessScope();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🛡️ Demonstração dos Route Guards
        </h1>
        
        {/* Informações do usuário atual */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            👤 Usuário Atual
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID do Usuário</p>
              <p className="font-medium">{userInfo?.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className={`font-medium ${userInfo?.isMaster ? 'text-purple-600' : 'text-blue-600'}`}>
                {userInfo?.isMaster ? '👑 Master' : '🔒 Admin Limitado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Escopo</p>
              <p className="font-medium text-green-600">
                {userInfo?.scope?.tipo || 'Acesso Total'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* MasterOnlyRoute Demo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">👑 MasterOnlyRoute</h3>
              <p className="text-purple-100 text-sm">Apenas usuários Master</p>
            </div>
            <div className="p-6">
              <MasterOnlyRoute
                fallback={
                  <div className="text-center py-8">
                    <div className="text-yellow-500 text-4xl mb-2">🚫</div>
                    <p className="text-gray-600">Acesso negado - Apenas Masters</p>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <div className="text-purple-500 text-4xl mb-2">✨</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Painel Master
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Conteúdo exclusivo para usuários Master
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                      Gerenciar Todos os Usuários
                    </button>
                    <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                      Configurações Globais
                    </button>
                    <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                      Relatórios Completos
                    </button>
                  </div>
                </div>
              </MasterOnlyRoute>
            </div>
          </div>

          {/* ScopedAdminRoute Demo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">🎯 ScopedAdminRoute</h3>
              <p className="text-blue-100 text-sm">Masters + Admins com escopo</p>
            </div>
            <div className="p-6">
              <ScopedAdminRoute
                fallback={
                  <div className="text-center py-8">
                    <div className="text-red-500 text-4xl mb-2">❌</div>
                    <p className="text-gray-600">Sem permissões administrativas</p>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <div className="text-blue-500 text-4xl mb-2">🛡️</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Painel Administrativo
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Escopo: {userInfo?.scope?.tipo || 'Master (Todos)'}
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Gerenciar Usuários do Escopo
                    </button>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Relatórios Limitados
                    </button>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Configurações Locais
                    </button>
                  </div>
                </div>
              </ScopedAdminRoute>
            </div>
          </div>

          {/* SpecificScopeRoute Estado */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">🏛️ Estado Específico</h3>
              <p className="text-green-100 text-sm">Apenas admins de estado</p>
            </div>
            <div className="p-6">
              <SpecificScopeRoute
                requiredScope="estado"
                allowMaster={false}
                fallback={
                  <div className="text-center py-8">
                    <div className="text-orange-500 text-4xl mb-2">🏛️</div>
                    <p className="text-gray-600">Apenas para admins de estado</p>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <div className="text-green-500 text-4xl mb-2">🌟</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Painel do Estado
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Estado ID: {userInfo?.scope?.tipo_estado_id}
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Gerenciar Municípios
                    </button>
                    <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Relatórios Estaduais
                    </button>
                  </div>
                </div>
              </SpecificScopeRoute>
            </div>
          </div>

          {/* SpecificScopeRoute Município */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-orange-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">🏘️ Município Específico</h3>
              <p className="text-orange-100 text-sm">Apenas admins de município</p>
            </div>
            <div className="p-6">
              <SpecificScopeRoute
                requiredScope="municipio"
                allowMaster={false}
                fallback={
                  <div className="text-center py-8">
                    <div className="text-blue-500 text-4xl mb-2">🏘️</div>
                    <p className="text-gray-600">Apenas para admins de município</p>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <div className="text-orange-500 text-4xl mb-2">🎯</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Painel do Município
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Município ID: {userInfo?.scope?.tipo_municipio_id}
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                      Gerenciar Unidades
                    </button>
                    <button className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                      Relatórios Municipais
                    </button>
                  </div>
                </div>
              </SpecificScopeRoute>
            </div>
          </div>

          {/* SpecificScopeRoute Unidade */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">🏥 Unidade Específica</h3>
              <p className="text-red-100 text-sm">Apenas admins de unidade</p>
            </div>
            <div className="p-6">
              <SpecificScopeRoute
                requiredScope="unidade"
                allowMaster={false}
                fallback={
                  <div className="text-center py-8">
                    <div className="text-purple-500 text-4xl mb-2">🏥</div>
                    <p className="text-gray-600">Apenas para admins de unidade</p>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <div className="text-red-500 text-4xl mb-2">🎪</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Painel da Unidade
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Estabelecimento ID: {userInfo?.scope?.estabelecimento_id}
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                      Gerenciar Notificadores
                    </button>
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                      Relatórios da Unidade
                    </button>
                  </div>
                </div>
              </SpecificScopeRoute>
            </div>
          </div>

          {/* ScopedAdminRoute com escopo específico */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-indigo-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">🔒 Escopo Obrigatório</h3>
              <p className="text-indigo-100 text-sm">Requer escopo estado + Master</p>
            </div>
            <div className="p-6">
              <ScopedAdminRoute
                requiredScope="estado"
                allowMaster={true}
                fallback={
                  <div className="text-center py-8">
                    <div className="text-indigo-500 text-4xl mb-2">🔐</div>
                    <p className="text-gray-600">Requer escopo de estado ou Master</p>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <div className="text-indigo-500 text-4xl mb-2">💎</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Funcionalidade Estadual
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Permite Masters e Admins de Estado
                  </p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                      Funcionalidade Especial
                    </button>
                  </div>
                </div>
              </ScopedAdminRoute>
            </div>
          </div>
        </div>

        {/* Instruções de uso */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📚 Como Usar os Route Guards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-purple-600 mb-2">👑 MasterOnlyRoute</h3>
              <p className="text-sm text-gray-600 mb-2">
                Para funcionalidades que só Masters podem acessar.
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`<MasterOnlyRoute>
  <MasterPanel />
</MasterOnlyRoute>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-blue-600 mb-2">🎯 ScopedAdminRoute</h3>
              <p className="text-sm text-gray-600 mb-2">
                Para funcionalidades administrativas com escopo.
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`<ScopedAdminRoute 
  requiredScope="estado"
  allowMaster={true}>
  <AdminPanel />
</ScopedAdminRoute>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-green-600 mb-2">🏛️ SpecificScopeRoute</h3>
              <p className="text-sm text-gray-600 mb-2">
                Para funcionalidades de um nível específico.
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`<SpecificScopeRoute 
  requiredScope="unidade"
  allowMaster={false}>
  <UnitPanel />
</SpecificScopeRoute>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteGuardsDemo;
