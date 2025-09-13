import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, MapPin, Globe, Users, Calendar, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { 
  useNotificacoesByUserAccess, 
  useNotificacoesPaginated,
  useNotificacoesStats
} from '../../hooks/useNotificacoesHierarquicas';
import { NotificacaoHierarquica } from '../../services/notificacoesHierarquicasService';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { usuarioGestaoService } from '../../services/UsuarioGestaoService';

interface NotificationHierarchyPanelProps {
  className?: string;
}

interface LocationInfo {
  id: number;
  nome: string;
  type: 'estabelecimento' | 'municipio' | 'estado';
}

export function NotificationHierarchyPanel({ className }: NotificationHierarchyPanelProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'custom'>('current');
  const [estabelecimentos, setEstabelecimentos] = useState<Array<{id: number; nome: string}>>([]);
  const [municipios, setMunicipios] = useState<Array<{id: number; descricao: string}>>([]);
  const [estados, setEstados] = useState<Array<{id: number; descricao: string}>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Hook para permissões do usuário atual
  const { userPermissions, loading: permissionsLoading } = useUserPermissions();

  // Hook para notificações baseado no nível de acesso do usuário atual
  const currentUserNotifications = useNotificacoesByUserAccess(
    userPermissions ? {
      nivel: userPermissions.nivel,
      estabelecimentoId: userPermissions.estabelecimentoId,
      municipioId: userPermissions.municipioId,
      estadoId: userPermissions.estadoId
    } : null,
    { page: 1, limit: 50 }
  );

  // Hook para notificações customizadas (quando admin seleciona uma localização específica)
  const customNotifications = useNotificacoesPaginated(
    selectedLocation?.type || 'estabelecimento',
    selectedLocation?.id || null,
    1,
    50
  );

  // Escolher qual resultado usar baseado no modo de visualização
  const activeNotifications = viewMode === 'current' ? currentUserNotifications : customNotifications;
  const stats = useNotificacoesStats(
    Array.isArray(activeNotifications.data) ? activeNotifications.data : 
    activeNotifications.data?.data || null
  );

  // Carregar opções de localização quando necessário
  useEffect(() => {
    if (viewMode === 'custom' && (userPermissions?.isAdmin || userPermissions?.nivel === 'estado')) {
      loadLocationOptions();
    }
  }, [viewMode, userPermissions]);

  const loadLocationOptions = async () => {
    setLoadingOptions(true);
    try {
      const [estabelecimentosData, municipiosData, estadosData] = await Promise.all([
        usuarioGestaoService.getEstabelecimentos(),
        usuarioGestaoService.getMunicipios(),
        usuarioGestaoService.getEstados()
      ]);

      setEstabelecimentos(estabelecimentosData);
      setMunicipios(municipiosData);
      setEstados(estadosData);
    } catch (error) {
      console.error('Erro ao carregar opções de localização:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleLocationSelect = (value: string) => {
    const [type, id] = value.split(':');
    let nome = '';
    
    if (type === 'estabelecimento') {
      const est = estabelecimentos.find(e => e.id === parseInt(id));
      nome = est?.nome || '';
    } else if (type === 'municipio') {
      const mun = municipios.find(m => m.id === parseInt(id));
      nome = mun?.descricao || '';
    } else if (type === 'estado') {
      const est = estados.find(e => e.id === parseInt(id));
      nome = est?.descricao || '';
    }

    setSelectedLocation({
      id: parseInt(id),
      nome,
      type: type as 'estabelecimento' | 'municipio' | 'estado'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'estabelecimento':
        return <Building2 className="w-4 h-4" />;
      case 'municipio':
        return <MapPin className="w-4 h-4" />;
      case 'estado':
        return <Globe className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getLocationLabel = (nivel: string) => {
    switch (nivel) {
      case 'unidade':
        return 'Estabelecimento';
      case 'municipio':
        return 'Município';
      case 'estado':
        return 'Estado';
      default:
        return 'Localização';
    }
  };

  if (permissionsLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getLocationIcon(activeNotifications.nivel || 'estabelecimento')}
                Painel de Notificações Hierárquico
              </CardTitle>
              <CardDescription>
                Visualize notificações por {getLocationLabel(userPermissions?.nivel || 'unidade')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={activeNotifications.refetch}
                disabled={activeNotifications.loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${activeNotifications.loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Seletor de modo de visualização (apenas para admins) */}
          {(userPermissions?.isAdmin || userPermissions?.nivel === 'estado') && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="current-view"
                  name="viewMode"
                  checked={viewMode === 'current'}
                  onChange={() => setViewMode('current')}
                  className="w-4 h-4"
                />
                <label htmlFor="current-view" className="text-sm font-medium">
                  Minha Visualização Atual
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="custom-view"
                  name="viewMode"
                  checked={viewMode === 'custom'}
                  onChange={() => setViewMode('custom')}
                  className="w-4 h-4"
                />
                <label htmlFor="custom-view" className="text-sm font-medium">
                  Visualização Personalizada
                </label>
              </div>
            </div>
          )}

          {/* Seletor de localização personalizada */}
          {viewMode === 'custom' && (userPermissions?.isAdmin || userPermissions?.nivel === 'estado') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Localização:</label>
              <Select onValueChange={handleLocationSelect} disabled={loadingOptions}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingOptions ? "Carregando opções..." : "Escolha um estabelecimento, município ou estado"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {estabelecimentos.map((est) => (
                    <SelectItem key={`estabelecimento:${est.id}`} value={`estabelecimento:${est.id}`}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {est.nome}
                      </div>
                    </SelectItem>
                  ))}
                  {municipios.map((mun) => (
                    <SelectItem key={`municipio:${mun.id}`} value={`municipio:${mun.id}`}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {mun.descricao}
                      </div>
                    </SelectItem>
                  ))}
                  {estados.map((est) => (
                    <SelectItem key={`estado:${est.id}`} value={`estado:${est.id}`}>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {est.descricao}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLocation && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                  {getLocationIcon(selectedLocation.type)}
                  <span className="text-sm font-medium">
                    Visualizando: {selectedLocation.nome}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {selectedLocation.type}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total de Notificações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.recentes}</p>
                  <p className="text-sm text-gray-600">Últimos 7 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-lg font-bold">{stats.eventoMaisFrequente}</p>
                  <p className="text-sm text-gray-600">Evento Mais Frequente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.eventosCounts).length}
                  </p>
                  <p className="text-sm text-gray-600">Tipos de Eventos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Notificações</CardTitle>
          <CardDescription>
            {activeNotifications.loading ? 'Carregando...' : 
             Array.isArray(activeNotifications.data) ? 
               `${activeNotifications.data.length} notificações encontradas` :
               `${activeNotifications.data?.data?.length || 0} notificações encontradas`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {activeNotifications.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : activeNotifications.error ? (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Erro ao carregar notificações</p>
              <p className="text-sm text-gray-600 mt-2">{activeNotifications.error}</p>
              <Button
                variant="outline"
                onClick={activeNotifications.refetch}
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(activeNotifications.data) ? 
                  activeNotifications.data : 
                  activeNotifications.data?.data || []
                ).map((notification: NotificacaoHierarquica) => (
                <div 
                  key={notification.idnotificacao} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          ID: {notification.idnotificacao}
                        </Badge>
                        <Badge>
                          {notification.tipo_evento.descricao}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="font-medium">
                          {notification.paciente.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {notification.paciente.idade !== undefined && 
                            `${notification.paciente.idade} anos`
                          }
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Estabelecimento:</strong> {
                            notification.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento.nome
                          }
                        </p>
                        {notification.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento.tipo_municipio && (
                          <p>
                            <strong>Município:</strong> {
                              notification.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento.tipo_municipio.descricao
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-600">
                      <p>
                        <strong>Atendimento:</strong><br />
                        {formatDate(notification.data_atendimento)}
                      </p>
                      <p className="mt-2">
                        <strong>Criado em:</strong><br />
                        {formatDate(notification.created_at)}
                      </p>
                      <Badge 
                        variant={notification.tipo_encerramento.descricao === 'Aberto' ? 'default' : 'secondary'}
                        className="mt-2"
                      >
                        {notification.tipo_encerramento.descricao}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {(Array.isArray(activeNotifications.data) ? 
                  activeNotifications.data : 
                  activeNotifications.data?.data || []
                ).length === 0 && (
                <div className="text-center p-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma notificação encontrada</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationHierarchyPanel;
