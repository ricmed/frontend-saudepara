import { useAuth } from '@/keycloak/AuthProvider';
import { useState, useEffect } from 'react';
import { usuarioGestaoService } from '../services/UsuarioGestaoService';
import syncService from '@/services/syncService';

export interface UserPermissions {
  // Níveis de acesso
  isEstabelecimento: boolean;
  isMunicipio: boolean;
  isEstado: boolean;
  isAdmin: boolean;
  
  // Roles específicos
  isQualificador: boolean;
  isNotificador: boolean;
  isDashboard: boolean; // ✅ NOVO: Role apenas para visualizar Dashboard
  
  // Dados do usuário
  estabelecimentoId?: number;
  municipioId?: number;
  estadoId?: number;
  nivel?: string;
  
  // Estado de carregamento
  loading: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  const { user } = useAuth();
  const [accessData, setAccessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados de acesso do usuário
  useEffect(() => {
    const loadUserAccess = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // ✅ Verificar se pode usar modo online antes de fazer chamada API
      const canUseOnline = await syncService.canUseOnlineMode();
      if (!canUseOnline) {
        console.log('🔒 Modo offline - não carregando permissões de usuário');
        setLoading(false);
        return;
      }

      try {
        // Chamar sem parâmetro para usar o endpoint /current
        const access = await usuarioGestaoService.getUserAccess();
        console.log('🔑 Dados de acesso carregados:', access);
        setAccessData(access);
      } catch (error) {
        console.warn('Não foi possível carregar dados de acesso:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAccess();
  }, [user?.id]);
  
  if (!user) {
    return {
      isEstabelecimento: false,
      isMunicipio: false,
      isEstado: false,
      isAdmin: false,
      isQualificador: false,
      isNotificador: false,
      isDashboard: false,
      loading: false,
    };
  }

  // Verificar roles do Keycloak
  const roles = user.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('administrator');
  const isQualificador = roles.includes('qualificador');
  const isNotificador = roles.includes('notificador');
  const isDashboard = roles.includes('dashboard'); // ✅ NOVO: Verificar role dashboard

  // Verificar nível de acesso baseado nos dados de usuario_acesso
  // Primeiro tenta usar os dados do backend, depois fallback para os dados do Keycloak
  let userAccess = accessData;
  if (!userAccess && user.usuario_acesso?.[0]) {
    userAccess = {
      estabelecimentoId: user.usuario_acesso[0].estabelecimento_id,
      municipioId: user.usuario_acesso[0].tipo_municipio_id,
      estadoId: user.usuario_acesso[0].tipo_estado_id,
      nivel: user.usuario_acesso[0].nivel_acesso
    };
  }
  
  const isEstabelecimento = userAccess?.nivel === 'estabelecimento' || 
                           userAccess?.nivel === 'unidade' || 
                           (!isAdmin && !userAccess?.nivel);
  const isMunicipio = userAccess?.nivel === 'municipio';
  const isEstado = userAccess?.nivel === 'estado';

  return {
    isEstabelecimento,
    isMunicipio,
    isEstado,
    isAdmin,
    isQualificador,
    isNotificador,
    isDashboard,
    estabelecimentoId: userAccess?.estabelecimentoId,
    municipioId: userAccess?.municipioId,
    estadoId: userAccess?.estadoId,
    nivel: userAccess?.nivel || 'estabelecimento',
    loading,
  };
};

export default useUserPermissions;
