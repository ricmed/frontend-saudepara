import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/keycloak/AuthProvider';

export const useChatSuporte = () => {
  const { user } = useAuth();
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Verificar se é admin master
  const isAdminMaster = user?.roles?.includes('admin');

  // Buscar contador de não lidas (apenas para usuários não-admin)
  const buscarNaoLidas = useCallback(async () => {
    // Admin master não precisa de notificações no menu (usa dashboard)
    if (isAdminMaster) {
      setMensagensNaoLidas(0);
      return;
    }

    try {
      const response = await axios.get('/api/chat/nao-lidas', {
        withCredentials: true
      });

      if (response.data.success) {
        setMensagensNaoLidas(response.data.data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar não lidas:', error);
    }
  }, [isAdminMaster]);

  // Polling para atualizar contador
  useEffect(() => {
    buscarNaoLidas();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      buscarNaoLidas();
    }, 30000);

    return () => clearInterval(interval);
  }, [buscarNaoLidas]);

  const abrirChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const fecharChat = useCallback(() => {
    setIsOpen(false);
    // Atualizar contador ao fechar (caso tenha lido novas mensagens)
    setTimeout(() => buscarNaoLidas(), 500);
  }, [buscarNaoLidas]);

  return {
    mensagensNaoLidas,
    isOpen,
    abrirChat,
    fecharChat,
    buscarNaoLidas
  };
};
