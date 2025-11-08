import React, { useEffect, useState } from 'react';
import { Shield, Lock, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Clock, Key } from 'lucide-react';
import { offlineAuthService } from '@/services/offlineAuthService';
import { toast } from 'react-toastify';
import SetupPinModal from '@/features/auth/components/SetupPinModal';
import { useAuth } from '@/keycloak/AuthProvider';

interface PinManagementTabProps {
  pinSessionInfo: any;
  setPinSessionInfo: (info: any) => void;
  showPinSetup: boolean;
  setShowPinSetup: (show: boolean) => void;
  showChangePinModal: boolean;
  setShowChangePinModal: (show: boolean) => void;
}

/**
 * Componente para gerenciar configurações de Login Offline com PIN
 */
const PinManagementTab: React.FC<PinManagementTabProps> = ({
  pinSessionInfo,
  setPinSessionInfo,
  showPinSetup,
  setShowPinSetup,
  showChangePinModal,
  setShowChangePinModal,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const { user } = useAuth(); // 🆕 Obter dados do usuário logado
  
  // Estados para armazenar token e userData quando configurar PIN
  const [currentToken, setCurrentToken] = useState('');
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  // Carregar informações da sessão ao montar
  useEffect(() => {
    loadSessionInfo();
  }, [user]);

  const loadSessionInfo = () => {
    if (!user) return;
    const userId = user.email || user.cpf || user.id || 'default';
    const info = offlineAuthService.getSessionInfo(userId);
    setPinSessionInfo(info);
  };

  // 🆕 Buscar token quando o componente montar
  useEffect(() => {
    // Tentar obter token do cookie ou localStorage
    const fetchToken = async () => {
      try {
        // Fazer requisição para obter token (ajuste conforme sua API)
        const response = await fetch('/api-auth/auth/token', { 
          credentials: 'include' 
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentToken(data.token || '');
        }
      } catch (error) {
        console.warn('Não foi possível obter token, usando fallback');
      }
      
      // Fallback: usar dados do usuário do contexto
      if (user) {
        setCurrentUserData(user);
      }
    };
    
    fetchToken();
  }, [user]);

  const handleSetupPin = () => {
    console.log('🔍 handleSetupPin chamado'); // Debug
    console.log('👤 User:', user); // Debug
    console.log('🔑 Token:', currentToken); // Debug
    
    // Para configurar PIN, usar dados do usuário logado
    if (!user) {
      toast.error('❌ Você precisa estar logado para configurar o PIN');
      return;
    }
    
    console.log('✅ Abrindo modal de configuração de PIN');
    setShowPinSetup(true);
  };

  const handleChangePin = async () => {
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast.error('O novo PIN deve ter 6 dígitos numéricos');
      return;
    }

    if (newPin !== confirmNewPin) {
      toast.error('Os novos PINs não coincidem');
      return;
    }

    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }

    setIsChangingPin(true);

    try {
      const userId = user.email || user.cpf || user.id || 'default';
      const result = await offlineAuthService.changePin(userId, oldPin, newPin);

      if (result.success) {
        toast.success('✅ PIN alterado com sucesso!');
        setOldPin('');
        setNewPin('');
        setConfirmNewPin('');
        setShowChangePinModal(false);
        loadSessionInfo();
      } else {
        toast.error(result.error || 'Erro ao alterar PIN');
      }
    } catch (error: any) {
      console.error('Erro ao alterar PIN:', error);
      toast.error('Erro ao alterar PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleClearOfflineAuth = () => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }

    if (window.confirm('⚠️ Tem certeza que deseja remover o login offline? Você precisará configurar um novo PIN.')) {
      const userId = user.email || user.cpf || user.id || 'default';
      offlineAuthService.clearOfflineAuth(userId);
      loadSessionInfo();
      toast.success('✅ Login offline removido');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Login Offline (PIN)</h2>
        </div>
        <p className="text-gray-600">
          Configure ou gerencie seu PIN de 6 dígitos para acessar o sistema sem conexão de internet.
        </p>
      </div>

      {/* Status do PIN */}
      {pinSessionInfo?.isEnabled ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">PIN Configurado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Sessão Criada */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Criado em</span>
              </div>
              <div className="text-sm text-blue-700">
                {pinSessionInfo.createdAt?.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Último Acesso */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Último Acesso</span>
              </div>
              <div className="text-sm text-green-700">
                {pinSessionInfo.lastAccess?.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Dias Restantes */}
            <div className={`p-4 rounded-lg border ${
              pinSessionInfo.daysRemaining > 3 
                ? 'bg-green-50 border-green-200' 
                : pinSessionInfo.daysRemaining > 1
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-5 w-5 ${
                  pinSessionInfo.daysRemaining > 3 
                    ? 'text-green-600' 
                    : pinSessionInfo.daysRemaining > 1
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`} />
                <span className={`font-medium ${
                  pinSessionInfo.daysRemaining > 3 
                    ? 'text-green-900' 
                    : pinSessionInfo.daysRemaining > 1
                      ? 'text-yellow-900'
                      : 'text-red-900'
                }`}>Expira em</span>
              </div>
              <div className={`text-2xl font-bold ${
                pinSessionInfo.daysRemaining > 3 
                  ? 'text-green-600' 
                  : pinSessionInfo.daysRemaining > 1
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {pinSessionInfo.daysRemaining} dia(s)
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowChangePinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Key className="h-4 w-4" />
              Alterar PIN
            </button>
            <button
              onClick={handleClearOfflineAuth}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Remover PIN
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">PIN Não Configurado</h3>
          </div>

          <p className="text-gray-600 mb-6">
            Você ainda não configurou um PIN para login offline. Configure agora para poder acessar o sistema sem conexão de internet.
          </p>

          <button
            onClick={handleSetupPin}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Shield className="h-5 w-5" />
            Configurar PIN Agora
          </button>
        </div>
      )}

      {/* Informações sobre o PIN */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Como Funciona o Login Offline?
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Configure um PIN de 6 dígitos após fazer login online</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Use o PIN para acessar quando estiver sem internet</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Válido por 7 dias sem conexão</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Seus dados ficam criptografados com AES-256</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Após 5 tentativas incorretas, bloqueio por 15 minutos</p>
          </div>
        </div>
      </div>

      {/* Informações de Segurança */}
      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
        <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Dicas de Segurança
        </h3>
        <div className="space-y-2 text-sm text-yellow-800">
          <p>• Não compartilhe seu PIN com ninguém</p>
          <p>• Use números variados, evite sequências como 123456</p>
          <p>• Evite usar datas de nascimento ou números óbvios</p>
          <p>• Se esquecer o PIN, faça login online novamente</p>
          <p>• Altere seu PIN regularmente para maior segurança</p>
        </div>
      </div>

      {/* Modal de Alterar PIN */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Alterar PIN</h2>
              <button
                onClick={() => {
                  setShowChangePinModal(false);
                  setOldPin('');
                  setNewPin('');
                  setConfirmNewPin('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* PIN Atual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Atual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest font-mono"
                  />
                </div>
              </div>

              {/* Novo PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novo PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest font-mono"
                  />
                </div>
              </div>

              {/* Confirmar Novo PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Novo PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest font-mono"
                  />
                </div>
                {confirmNewPin.length === 6 && newPin === confirmNewPin && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">PINs coincidem!</span>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChangePinModal(false);
                    setOldPin('');
                    setNewPin('');
                    setConfirmNewPin('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isChangingPin}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePin}
                  disabled={
                    oldPin.length !== 6 ||
                    newPin.length !== 6 ||
                    newPin !== confirmNewPin ||
                    isChangingPin
                  }
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isChangingPin ? 'Alterando...' : 'Alterar PIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Setup PIN */}
      {showPinSetup && user && (
        <SetupPinModal
          isOpen={showPinSetup}
          onClose={() => setShowPinSetup(false)}
          onSuccess={() => {
            setShowPinSetup(false);
            loadSessionInfo();
            toast.success('✅ PIN configurado! Agora você pode fazer login offline.');
          }}
          token={currentToken || 'session_token_' + Date.now()}
          userData={currentUserData || user}
        />
      )}
    </div>
  );
};

export default PinManagementTab;
