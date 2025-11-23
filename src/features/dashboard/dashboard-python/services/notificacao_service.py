# -*- coding: utf-8 -*-
"""
🎯 Serviço de Notificações - Dashboard Círio
Baseado em NotificationDashboardCirio.tsx fetchFreshData()

Este módulo gerencia a comunicação com a API do backend-saudepara,
incluindo paginação, cache e filtros por eventos ativos.
"""

import requests
import logging
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
import time

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# URL base da API do backend (mesma do backend .env)
API_BASE_URL = "http://localhost:3000"  # SEM /notificacoes - será adicionado nas rotas

# Configurações de paginação
PAGE_SIZE = 200          # Registros por página
MAX_PAGES = 100          # Máximo de páginas (segurança: 100 * 200 = 20.000)

# Configurações de timeout
REQUEST_TIMEOUT = 30     # Timeout em segundos

# ============================================================================
# CLASSE PRINCIPAL
# ============================================================================

class NotificacaoService:
    """
    Serviço para buscar e gerenciar notificações da API.
    
    Funcionalidades:
    - Paginação automática (200 registros por página)
    - Filtro por eventos ativos
    - Cache local
    - Tratamento de erros
    - Performance logging
    """
    
    def __init__(self, base_url: str = API_BASE_URL):
        """
        Inicializa o serviço.
        
        Args:
            base_url: URL base da API
        """
        self.base_url = base_url
        self.cache: Dict[str, Any] = {}
        self.cache_timestamp: Optional[datetime] = None
        self.cache_ttl = 60  # Cache válido por 60 segundos
        
        # Headers padrão (sem autenticação para rota pública)
        self.headers = {
            'Content-Type': 'application/json'
        }
        
    def get_all(self, page: int = 1, page_size: int = PAGE_SIZE) -> Dict[str, Any]:
        """
        Busca notificações com paginação.
        
        Args:
            page: Número da página (1-indexed)
            page_size: Tamanho da página (default: 200)
            
        Returns:
            Dicionário com:
            {
                'data': [notificacoes],
                'meta': {
                    'total': int,
                    'totalPages': int,
                    'currentPage': int,
                    'pageSize': int,
                }
            }
        """
        try:
            url = f"{self.base_url}/api/notificacoes/dashboard"
            params = {
                'page': page,
                'pageSize': page_size,
            }
            
            logger.info(f"📄 Buscando página {page} (tamanho: {page_size})...")
            
            response = requests.get(
                url,
                params=params,
                timeout=REQUEST_TIMEOUT,
                headers=self.headers
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Estrutura de resposta esperada
            # Backend retorna: { data: [...], meta: { total, page, limit, totalPages } }
            meta = data.get('meta', {})
            result = {
                'data': data.get('data', []),
                'meta': {
                    'total': meta.get('total', len(data.get('data', []))),
                    'totalPages': meta.get('totalPages', 1),
                    'currentPage': meta.get('page', page),
                    'pageSize': meta.get('limit', page_size),
                }
            }
            
            logger.info(f"✅ Página {page}: {len(result['data'])} registros")
            
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ Timeout ao buscar página {page}")
            return {'data': [], 'meta': {'total': 0, 'totalPages': 0, 'currentPage': page, 'pageSize': page_size}}
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro ao buscar página {page}: {e}")
            return {'data': [], 'meta': {'total': 0, 'totalPages': 0, 'currentPage': page, 'pageSize': page_size}}
            
        except Exception as e:
            logger.error(f"❌ Erro inesperado ao buscar página {page}: {e}")
            return {'data': [], 'meta': {'total': 0, 'totalPages': 0, 'currentPage': page, 'pageSize': page_size}}
    
    def fetch_all_notifications(self, eventos_ativos_ids: Optional[Set[int]] = None) -> List[Dict[str, Any]]:
        """
        Busca TODAS as notificações com paginação automática.
        Baseado em fetchFreshData() do TypeScript.
        
        Args:
            eventos_ativos_ids: Set de IDs de eventos ativos (para filtrar)
            
        Returns:
            Lista completa de notificações
        """
        start_time = time.time()
        all_data = []
        page = 1
        has_more = True
        total_expected = 0
        
        logger.info(f"🔍 Iniciando busca de notificações com paginação...")
        if eventos_ativos_ids:
            logger.info(f"   📋 Filtro de eventos ativos: {len(eventos_ativos_ids)} eventos")
        
        while has_more and page <= MAX_PAGES:
            try:
                response = self.get_all(page, PAGE_SIZE)
                
                if response['data']:
                    # Armazenar total esperado da primeira página
                    if page == 1 and response['meta']:
                        total_expected = response['meta']['total']
                        total_pages = response['meta']['totalPages']
                        logger.info(f"📊 Total no servidor: {total_expected} notificações")
                        logger.info(f"📄 Total de páginas: {total_pages}")
                    
                    all_data.extend(response['data'])
                    logger.info(
                        f"✅ Página {page}: {len(response['data'])} registros | "
                        f"Total acumulado: {len(all_data)}/{total_expected}"
                    )
                    
                    # Verificar se há mais páginas
                    if len(response['data']) < PAGE_SIZE or page >= response['meta'].get('totalPages', 0):
                        logger.info(f"🏁 Última página alcançada ({page}/{response['meta'].get('totalPages', 0)})")
                        has_more = False
                    else:
                        page += 1
                else:
                    logger.warning(f"⚠️ Página {page} retornou vazia - finalizando")
                    has_more = False
                    
            except Exception as e:
                logger.error(f"❌ Erro ao buscar página {page}: {e}")
                logger.warning(f"⚠️ Parando na página {page} devido a erro. Total carregado: {len(all_data)}")
                has_more = False
        
        if page > MAX_PAGES:
            logger.warning(
                f"⚠️ AVISO: Limite de segurança atingido ({MAX_PAGES} páginas). "
                f"Total carregado: {len(all_data)}"
            )
        
        # Filtrar por eventos ativos se fornecido
        if eventos_ativos_ids:
            original_count = len(all_data)
            all_data = self._filter_by_active_events(all_data, eventos_ativos_ids)
            logger.info(
                f"✅ Filtro aplicado: {original_count} → {len(all_data)} notificações "
                f"(apenas eventos ativos)"
            )
        
        # Performance logging
        duration = time.time() - start_time
        logger.info(
            f"⚡ Busca completa em {duration:.2f}s - "
            f"{len(all_data)} notificações carregadas"
        )
        
        return all_data
    
    def _filter_by_active_events(
        self,
        notificacoes: List[Dict[str, Any]],
        eventos_ativos_ids: Set[int]
    ) -> List[Dict[str, Any]]:
        """
        Filtra notificações por eventos ativos.
        
        Args:
            notificacoes: Lista de notificações
            eventos_ativos_ids: Set de IDs de eventos ativos
            
        Returns:
            Lista filtrada
        """
        filtered = []
        
        for notificacao in notificacoes:
            # Tentar múltiplos caminhos para encontrar o ID do evento
            id_evento = None
            
            if 'original' in notificacao:
                original = notificacao['original']
                
                # Caminho 1: original.tipo_evento.idtipo_evento
                if 'tipo_evento' in original and isinstance(original['tipo_evento'], dict):
                    id_evento = original['tipo_evento'].get('idtipo_evento')
                
                # Caminho 2: original.tipo_evento_idtipo_evento
                if not id_evento:
                    id_evento = original.get('tipo_evento_idtipo_evento')
            
            # Caminho 3: notificacao.idtipo_evento
            if not id_evento:
                id_evento = notificacao.get('idtipo_evento')
            
            # Caminho 4: notificacao.tipo_evento.idtipo_evento
            if not id_evento and 'tipo_evento' in notificacao:
                if isinstance(notificacao['tipo_evento'], dict):
                    id_evento = notificacao['tipo_evento'].get('idtipo_evento')
            
            # Verificar se o evento está ativo
            if id_evento and id_evento in eventos_ativos_ids:
                filtered.append(notificacao)
        
        return filtered
    
    def get_export_options(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Busca as opções de exportação (tipos, estabelecimentos, etc.).
        
        Returns:
            Dicionário com todas as opções disponíveis
        """
        try:
            url = f"{self.base_url}/export-options"
            
            logger.info("📋 Buscando opções de exportação...")
            
            response = requests.get(
                url,
                timeout=REQUEST_TIMEOUT,
                headers={'Content-Type': 'application/json'}
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"✅ Opções carregadas: {len(data.keys())} categorias")
            
            return data
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar opções de exportação: {e}")
            return {}
    
    def refresh_cache(self, eventos_ativos_ids: Optional[Set[int]] = None) -> List[Dict[str, Any]]:
        """
        Atualiza o cache com dados frescos do servidor.
        
        Args:
            eventos_ativos_ids: Set de IDs de eventos ativos
            
        Returns:
            Lista de notificações
        """
        logger.info("🔄 Atualizando cache...")
        
        # Buscar dados frescos
        fresh_data = self.fetch_all_notifications(eventos_ativos_ids)
        
        # Atualizar cache
        self.cache['notificacoes'] = fresh_data
        self.cache_timestamp = datetime.now()
        
        logger.info(f"✅ Cache atualizado: {len(fresh_data)} notificações")
        
        return fresh_data
    
    def get_cached_data(self) -> Optional[List[Dict[str, Any]]]:
        """
        Retorna dados do cache se ainda estiverem válidos.
        
        Returns:
            Lista de notificações ou None se cache inválido
        """
        if not self.cache_timestamp:
            return None
        
        # Verificar se cache ainda é válido
        age = (datetime.now() - self.cache_timestamp).total_seconds()
        
        if age > self.cache_ttl:
            logger.info("⏰ Cache expirado")
            return None
        
        logger.info(f"✅ Usando cache ({age:.0f}s de idade)")
        return self.cache.get('notificacoes')


# ============================================================================
# INSTÂNCIA GLOBAL (Singleton)
# ============================================================================

# Criar instância global do serviço
notificacao_service = NotificacaoService()


# ============================================================================
# FUNÇÕES DE CONVENIÊNCIA
# ============================================================================

def get_all_notifications(
    eventos_ativos_ids: Optional[Set[int]] = None,
    use_cache: bool = True
) -> List[Dict[str, Any]]:
    """
    Função de conveniência para buscar todas as notificações.
    
    Args:
        eventos_ativos_ids: Set de IDs de eventos ativos
        use_cache: Se deve usar cache quando disponível
        
    Returns:
        Lista de notificações
    """
    if use_cache:
        cached = notificacao_service.get_cached_data()
        if cached is not None:
            return cached
    
    return notificacao_service.fetch_all_notifications(eventos_ativos_ids)


def get_export_options() -> Dict[str, List[Dict[str, Any]]]:
    """
    Função de conveniência para buscar opções de exportação.
    
    Returns:
        Dicionário com opções
    """
    return notificacao_service.get_export_options()


# ============================================================================
# EXPORTAÇÃO
# ============================================================================

__all__ = [
    'NotificacaoService',
    'notificacao_service',
    'get_all_notifications',
    'get_export_options',
]
