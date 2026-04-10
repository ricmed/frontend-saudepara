import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { offlineAuthService } from '@/services/offlineAuthService';
import { toast } from 'react-toastify';

interface SetupPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  userData: any;
}

/**
 * Modal para configurar PIN de login offline
 * Exibido após o primeiro login online bem-sucedido
 */
const SetupPinModal: React.FC<SetupPinModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  token,
  userData 
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'intro' | 'setup' | 'success'>('intro');

  if (!isOpen) return null;

  const handleSetupPin = async () => {
    // Validações
    if (pin.length !== 6) {
      toast.error('O PIN deve ter exatamente 6 dígitos');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      toast.error('O PIN deve conter apenas números');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('Os PINs não coincidem');
      return;
    }

    // Verificar se é um PIN fraco
    if (isWeakPin(pin)) {
      if (!window.confirm('⚠️ Este PIN pode ser facilmente adivinhado (ex: 123456, 000000). Deseja usar mesmo assim?')) {
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Usar o ID do usuário (email, CPF, ou qualquer identificador único)
      const userId = userData.email || userData.cpf || userData.id || 'default';
      const result = await offlineAuthService.setupOfflineAuth(userId, pin, token, userData);
      
      if (result.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        toast.error(result.error || 'Erro ao configurar PIN');
      }
    } catch (error: any) {
      console.error('Erro ao configurar PIN:', error);
      toast.error('Erro ao configurar login offline');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    setShowPin(false);
    setStep('intro');
    onClose();
  };

  const handleSkip = () => {
    if (window.confirm('Tem certeza que deseja pular? Você não poderá usar o app offline.')) {
      handleClose();
    }
  };

  const isWeakPin = (pin: string): boolean => {
    // Verificar padrões fracos comuns
    const weakPatterns = [
      '123456', '000000', '111111', '222222', '333333',
      '444444', '555555', '666666', '777777', '888888', '999999',
      '654321', '012345', '543210'
    ];
    return weakPatterns.includes(pin);
  };

  const getPinStrength = (): { label: string; color: string } => {
    if (pin.length < 6) return { label: 'Incompleto', color: 'text-gray-400' };
    if (isWeakPin(pin)) return { label: 'Fraco', color: 'text-red-500' };
    
    // Verificar se tem números variados
    const uniqueDigits = new Set(pin.split('')).size;
    if (uniqueDigits >= 5) return { label: 'Forte', color: 'text-green-500' };
    if (uniqueDigits >= 4) return { label: 'Médio', color: 'text-yellow-500' };
    return { label: 'Fraco', color: 'text-orange-500' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Intro */}
        {step === 'intro' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Login Offline</h2>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Como funciona?</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Configure um PIN de 6 dígitos</li>
                  <li>• Use o PIN para acessar offline</li>
                  <li>• Válido por 7 dias sem internet</li>
                  <li>• Seus dados ficam criptografados</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">✅ Benefícios</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Trabalhe sem conexão de internet</li>
                  <li>• Acesso rápido com PIN</li>
                  <li>• Segurança com criptografia AES-256</li>
                  <li>• Sincronização automática quando online</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Importante</h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• Não compartilhe seu PIN</li>
                  <li>• Após 5 tentativas erradas, será bloqueado por 15 minutos</li>
                  <li>• Se esquecer o PIN, precisará fazer login online novamente</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                data-testid="setup-pin-later"
                onClick={handleSkip}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Agora Não
              </button>
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Configurar PIN
              </button>
            </div>
          </div>
        )}

        {/* Setup PIN */}
        {step === 'setup' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Configure seu PIN</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (6 dígitos)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {pin.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Força:</span>
                    <span className={`text-sm font-medium ${getPinStrength().color}`}>
                      {getPinStrength().label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmar PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirme o PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                {confirmPin.length === 6 && pin === confirmPin && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">PINs coincidem!</span>
                  </div>
                )}
                {confirmPin.length === 6 && pin !== confirmPin && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">PINs não coincidem</span>
                  </div>
                )}
              </div>

              {/* Dicas */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                  💡 <strong>Dica:</strong> Use números variados para um PIN mais seguro. 
                  Evite sequências como 123456 ou repetições como 111111.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isProcessing}
                >
                  Voltar
                </button>
                <button
                  onClick={handleSetupPin}
                  disabled={pin.length !== 6 || pin !== confirmPin || isProcessing}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isProcessing ? 'Configurando...' : 'Confirmar PIN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                PIN Configurado!
              </h2>
              <p className="text-gray-600">
                Agora você pode acessar o sistema offline usando seu PIN de 6 dígitos.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✅ Login offline válido por <strong>7 dias</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPinModal;
