import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Wifi, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { offlineAuthService } from '@/services/offlineAuthService';
import { toast } from 'react-toastify';
import { useAuth } from '@/keycloak/AuthProvider';

const OFFLINE_MODE_KEY = 'sp.auth.offline.mode.v1';
const OFFLINE_USER_DATA_KEY = 'sp.auth.offline.user-data.v1';
const LEGACY_OFFLINE_MODE_KEY = 'offline_mode';
const LEGACY_OFFLINE_USER_DATA_KEY = 'user_data';
const USER_IDENTIFIER_KEY = 'sp.user.id.v1';

/**
 * Página de Login Offline
 * Exibida quando o usuário não tem conexão e já configurou PIN
 */
const OfflineLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  
  // Usuário selecionado (pega o primeiro disponível)
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Se já estiver logado, redirecionar para home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const mostRecentUser = offlineAuthService.getMostRecentOfflineUserId();
    if (!mostRecentUser) {
      navigate('/login');
      return;
    }

    console.log('👤 Selecionando usuário:', mostRecentUser);
    setSelectedUserId(mostRecentUser);
    const info = offlineAuthService.getSessionInfo(mostRecentUser);
    setSessionInfo(info);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }

    if (pin.length !== 6) {
      toast.error('Digite um PIN de 6 dígitos');
      return;
    }

    setIsProcessing(true);

    try {
      console.log(`🔍 Validando PIN offline para usuário ${selectedUserId}...`);
      const result = await offlineAuthService.validateOfflineLogin(selectedUserId, pin);
      console.log('📊 Resultado da validação:', result);

      if (result.success) {
        // Login offline bem-sucedido!
        console.log('✅ PIN validado com sucesso!');
        console.log('👤 Dados do usuário:', result.userData);
        
        toast.success('✅ Login offline realizado com sucesso!');
        
        // Simular autenticação no sistema
        localStorage.setItem(OFFLINE_MODE_KEY, 'true');
        localStorage.setItem(OFFLINE_USER_DATA_KEY, JSON.stringify(result.userData));
        localStorage.removeItem(LEGACY_OFFLINE_MODE_KEY);
        localStorage.removeItem(LEGACY_OFFLINE_USER_DATA_KEY);
        if (selectedUserId) {
          sessionStorage.setItem(USER_IDENTIFIER_KEY, selectedUserId);
        }
        
        // Criar um evento customizado para notificar o AuthProvider
        window.dispatchEvent(new CustomEvent('offline-login-success', { 
          detail: result.userData 
        }));
        
        // Redirecionar após um pequeno delay
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 500);
        
      } else {
        console.error('❌ Erro na validação:', result.error);
        toast.error(result.error || 'PIN incorreto');
        setPin('');
        
        // Atualizar tentativas restantes
        if (result.error?.includes('tentativas restantes')) {
          const match = result.error.match(/(\d+) tentativas/);
          if (match) {
            setRemainingAttempts(parseInt(match[1], 10));
          }
        } else {
          setRemainingAttempts(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error: any) {
      console.error('💥 Erro no login offline:', error);
      toast.error('Erro ao validar PIN');
      setPin('');
      setRemainingAttempts(prev => Math.max(0, prev - 1));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOnlineLogin = () => {
    navigate('/login');
  };

  const handlePinInput = (value: string) => {
    // Aceitar apenas números e limitar a 6 dígitos
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleanValue);

    // Auto-submit quando completar 6 dígitos (opcional)
    if (cleanValue.length === 6 && !isProcessing && selectedUserId) {
      setTimeout(() => {
        handleSubmit(new Event('submit') as any);
      }, 100);
    }
  };

  if (!sessionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Offline
          </h1>
          <p className="text-gray-600">
            Digite seu PIN de 6 dígitos para continuar
          </p>
        </div>

        {/* Alert Offline */}
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-900 mb-1">
              Modo Offline
            </p>
            <p className="text-xs text-orange-800">
              {sessionInfo ? (
                <>
                  Você está sem conexão. Usando sessão local válida por mais{' '}
                  <strong>{sessionInfo.daysRemaining || 0} dia(s)</strong>.
                </>
              ) : (
                'Você está sem conexão. Selecione um usuário para acessar.'
              )}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  placeholder="••••••"
                  maxLength={6}
                  autoFocus
                  disabled={isProcessing}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-3xl tracking-[0.5em] font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isProcessing}
                >
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-all ${
                      i < pin.length ? 'bg-blue-600 scale-110' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Remaining Attempts */}
              {remainingAttempts < 5 && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-orange-600">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    {remainingAttempts} tentativa(s) restante(s)
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pin.length !== 6 || isProcessing}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg hover:shadow-xl"
            >
              {isProcessing ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Online Login Button */}
          <button
            onClick={handleOnlineLogin}
            className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Wifi className="h-5 w-5" />
            Fazer Login Online
          </button>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Esqueceu seu PIN? Você precisará fazer login online novamente.
            </p>
          </div>
        </div>

        {/* Session Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>
              Sessão criada em {sessionInfo.createdAt?.toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Último acesso: {sessionInfo.lastAccess?.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            🔐 Seus dados estão criptografados e protegidos com AES-256.
            <br />
            Apenas você com o PIN correto pode acessá-los.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineLoginPage;
