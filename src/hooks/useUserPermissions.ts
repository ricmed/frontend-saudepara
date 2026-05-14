import { useAuth } from '@/keycloak/AuthProvider';
import { useState, useEffect } from 'react';
import { usuarioGestaoService } from '../services/UsuarioGestaoService';
import { STORAGE_KEYS, readStringWithLegacy } from '@/utils/storageKeys';

// ✅ Cache global em memória para evitar múltiplas chamadas API
let cachedPermissions: any = null;
let loadingPromise: Promise<any> | null = null;

export interface UserPermissions {
  // Níveis de acesso
  isEstabelecimento: boolean;
  isMunicipio: boolean;
  isCrs: boolean;
  isEstado: boolean;
  isAdmin: boolean;
  
  // Roles específicos
  isQualificador: boolean;
  isNotificador: boolean;
  isDashboard: boolean; // ✅ NOVO: Role apenas para visualizar Dashboard
  
  // Dados do usuário
  estabelecimentoId?: number;
  municipioId?: number;
  crsId?: number;
  estadoId?: number;
  nivel?: string;
  
  // Estado de carregamento
  loading: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  const { user } = useAuth();
  const [accessData, setAccessData] = useState<any>(cachedPermissions); // ✅ Inicializar com cache global
  const [loading, setLoading] = useState(!cachedPermissions); // ✅ Não está loading se já tem cache

  // Carregar dados de acesso do usuário
  useEffect(() => {
    const getUserAccessKey = (userId: string) => `${STORAGE_KEYS.auth.userAccessPrefix}.${userId}`;
    const getLegacyUserAccessKey = (userId: string) => `user_access_${userId}`;

    const loadUserAccess = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // ✅ Se já tem cache global em memória, usar imediatamente
      if (cachedPermissions) {
        console.log('⚡ Usando cache global em memória (sem chamada API)');
        setAccessData(cachedPermissions);
        setLoading(false);
        return;
      }

      // ✅ Se já existe uma requisição em andamento, esperar por ela
      if (loadingPromise) {
        console.log('⏳ Aguardando requisição em andamento...');
        try {
          const result = await loadingPromise;
          setAccessData(result);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Erro ao aguardar requisição:', error);
        }
      }

      // ✅ Verificar conexão de rede antes de fazer chamada API
      console.log('🔍 useUserPermissions: navigator.onLine =', navigator.onLine);
      
      if (!navigator.onLine) {
        console.log('🔒 Modo offline - carregando permissões do cache local');
        
        // ✅ FALLBACK: Tentar carregar do localStorage
        try {
          const cachedAccess = readStringWithLegacy(
            getUserAccessKey(user.id),
            [getLegacyUserAccessKey(user.id)]
          );
          console.log('🔍 Cache encontrado:', cachedAccess ? 'SIM' : 'NÃO');
          
          if (cachedAccess) {
            const parsedAccess = JSON.parse(cachedAccess);
            console.log('✅ Permissões carregadas do cache local:', parsedAccess);
            cachedPermissions = parsedAccess; // ✅ Salvar no cache global
            setAccessData(parsedAccess);
          } else {
            console.warn('⚠️ Nenhuma permissão em cache - você precisa conectar online primeiro para baixar os dados');
          }
        } catch (error) {
          console.error('Erro ao carregar permissões do cache:', error);
        }
        
        setLoading(false);
        return;
      }

      console.log('🌐 Modo ONLINE detectado - tentando buscar permissões da API...');

      // ✅ SEMPRE tentar carregar do cache primeiro (mais rápido)
      let hasCache = false;
      try {
        const cachedAccess = readStringWithLegacy(
          getUserAccessKey(user.id),
          [getLegacyUserAccessKey(user.id)]
        );
        if (cachedAccess) {
          const parsedAccess = JSON.parse(cachedAccess);
          console.log('✅ Permissões carregadas do cache (será atualizado em background):', parsedAccess);
          cachedPermissions = parsedAccess; // ✅ Salvar no cache global
          setAccessData(parsedAccess);
          hasCache = true;
        }
      } catch (cacheError) {
        console.error('Erro ao carregar cache:', cacheError);
      }

      // ✅ Criar promise compartilhada para evitar múltiplas chamadas simultâneas
      loadingPromise = (async () => {
        try {
          const access = await usuarioGestaoService.getUserAccess();
          console.log('🔑 Dados de acesso atualizados da API:', access);
          
          // ✅ Atualizar cache global
          cachedPermissions = access;
          setAccessData(access);
          
          // ✅ SALVAR no localStorage para uso offline
          if (access && user.id) {
            localStorage.setItem(getUserAccessKey(user.id), JSON.stringify(access));
            localStorage.removeItem(getLegacyUserAccessKey(user.id));
            console.log('💾 Permissões salvas no cache local');
          }
          
          return access;
        } catch (error: any) {
          console.warn('⚠️ Erro ao buscar dados de acesso da API:', error?.response?.status || error?.message);
          
          // Se não tinha cache antes, tentar carregar agora
          if (!hasCache) {
            try {
              const cachedAccess = readStringWithLegacy(
                getUserAccessKey(user.id),
                [getLegacyUserAccessKey(user.id)]
              );
              if (cachedAccess) {
                const parsedAccess = JSON.parse(cachedAccess);
                console.log('✅ Usando permissões do cache após erro na API:', parsedAccess);
                cachedPermissions = parsedAccess; // ✅ Salvar no cache global
                setAccessData(parsedAccess);
                return parsedAccess;
              } else {
                console.error('❌ Sem cache e sem conexão - não é possível carregar permissões');
              }
            } catch (cacheError) {
              console.error('Erro ao carregar permissões do cache:', cacheError);
            }
          } else {
            console.log('✅ Mantendo permissões do cache (erro ao atualizar da API)');
          }
          
          return cachedPermissions;
        } finally {
          loadingPromise = null; // ✅ Limpar promise global
          setLoading(false);
        }
      })();

      // Aguardar conclusão
      await loadingPromise;
    };

    loadUserAccess();
  }, [user?.id]);
  
  if (!user) {
    return {
      isEstabelecimento: false,
      isMunicipio: false,
      isCrs: false,
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
      crsId: user.usuario_acesso[0].crs_id,
      estadoId: user.usuario_acesso[0].tipo_estado_id,
      nivel: user.usuario_acesso[0].nivel_acesso
    };
  }
  
  const nivelAcesso = String(userAccess?.nivel ?? '').toLowerCase();
  const crsIdNum = userAccess?.crsId != null ? Number(userAccess.crsId) : NaN;
  const hasCrsId = Number.isFinite(crsIdNum) && crsIdNum > 0;

  const isEstabelecimento = userAccess?.nivel === 'estabelecimento' || 
                           userAccess?.nivel === 'unidade' || 
                           (!isAdmin && !userAccess?.nivel);
  const isMunicipio = userAccess?.nivel === 'municipio';
  /** Nível CRS explícito ou vínculo a uma CRS (ex.: acesso regional sem role `notificador`). */
  const isCrs = nivelAcesso === 'crs' || (hasCrsId && nivelAcesso !== 'estado');
  const isEstado = userAccess?.nivel === 'estado';

  return {
    isEstabelecimento,
    isMunicipio,
    isCrs,
    isEstado,
    isAdmin,
    isQualificador,
    isNotificador,
    isDashboard,
    estabelecimentoId: userAccess?.estabelecimentoId,
    municipioId: userAccess?.municipioId,
    crsId: userAccess?.crsId,
    estadoId: userAccess?.estadoId,
    // ✅ CORREÇÃO: Retornar o nível REAL do backend, não normalizado
    nivel: userAccess?.nivel,
    loading,
  };
};

export default useUserPermissions;
