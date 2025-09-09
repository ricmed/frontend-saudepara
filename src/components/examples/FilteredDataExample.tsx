import React, { useState, useEffect } from 'react';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { usuarioGestaoService } from '../../services/UsuarioGestaoService';

/**
 * Exemplo de como usar os filtros de dados baseados no nível do usuário
 * Este componente demonstra como carregar dados filtrados para estabelecimentos
 */
export const FilteredDataExample: React.FC = () => {
  const permissions = useUserPermissions();
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (permissions.loading) return;

      try {
        setLoading(true);
        console.log('🔍 Carregando dados filtrados para:', permissions);

        // Carregar dados filtrados baseados no nível do usuário
        const [estabelecimentosData, comunicadosData, eventosData] = await Promise.all([
          usuarioGestaoService.getEstabelecimentosFiltrados(permissions),
          usuarioGestaoService.getComunicadosFiltrados(permissions),
          usuarioGestaoService.getEventosFiltrados(permissions)
        ]);

        setEstabelecimentos(estabelecimentosData);
        setComunicados(comunicadosData);
        setEventos(eventosData);
      } catch (error) {
        console.error('Erro ao carregar dados filtrados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [permissions.loading, permissions.estabelecimentoId, permissions.municipioId, permissions.estadoId]);

  if (permissions.loading || loading) {
    return <div className="p-4">Carregando dados...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Informações do Usuário</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Nível:</strong> {permissions.nivel}
          </div>
          <div>
            <strong>É Estabelecimento:</strong> {permissions.isEstabelecimento ? 'Sim' : 'Não'}
          </div>
          <div>
            <strong>É Município:</strong> {permissions.isMunicipio ? 'Sim' : 'Não'}
          </div>
          <div>
            <strong>É Estado:</strong> {permissions.isEstado ? 'Sim' : 'Não'}
          </div>
          <div>
            <strong>É Admin:</strong> {permissions.isAdmin ? 'Sim' : 'Não'}
          </div>
          <div>
            <strong>Estabelecimento ID:</strong> {permissions.estabelecimentoId || 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-semibold mb-3 text-gray-800">
            Estabelecimentos ({estabelecimentos.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {estabelecimentos.map((est) => (
              <div key={est.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                {est.nome}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-semibold mb-3 text-gray-800">
            Comunicados ({comunicados.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comunicados.slice(0, 5).map((com, index) => (
              <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                {com.titulo || com.assunto || 'Comunicado sem título'}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-semibold mb-3 text-gray-800">
            Eventos ({eventos.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {eventos.slice(0, 5).map((evento, index) => (
              <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                {evento.nome || evento.titulo || 'Evento sem nome'}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-md font-semibold mb-2 text-yellow-800">Como funciona o filtro:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Usuário de Estabelecimento:</strong> Vê apenas dados do seu estabelecimento</li>
          <li>• <strong>Usuário de Município:</strong> Vê dados de todos estabelecimentos do seu município</li>
          <li>• <strong>Usuário de Estado:</strong> Vê dados de todos estabelecimentos do seu estado</li>
          <li>• <strong>Admin:</strong> Vê todos os dados sem filtro</li>
        </ul>
      </div>
    </div>
  );
};

export default FilteredDataExample;
