# -*- coding: utf-8 -*-
"""
⚡ Sistema de Filtros Cruzados - Dashboard Círio
Baseado em NotificationDashboardCirio.tsx applyFilters() e toggleFilter()

Este módulo implementa o sistema de filtros cruzados estilo Power BI,
onde todos os elementos se comunicam entre si.
"""

import logging
from typing import List, Dict, Any, Optional, Callable
from copy import deepcopy

logger = logging.getLogger(__name__)

# ============================================================================
# ESTADO GLOBAL DE FILTROS
# ============================================================================

class FilterState:
    """
    Gerencia o estado dos filtros ativos.
    
    Funciona como o activeFilters do TypeScript, com 18+ categorias.
    """
    
    def __init__(self):
        self.active_filters: Dict[str, Optional[str]] = {
            'evento': None,
            'tipoAtendimento': None,
            'publico': None,
            'genero': None,
            'raca': None,
            'escolaridade': None,
            'unidade': None,
            'hipotese': None,
            'trauma': None,
            'sintoma': None,
            'faixaEtaria': None,
            'desfecho': None,
            'dataNotificacao': None,
            'pais': None,
            'estado': None,
            'municipio': None,
            'bairro': None,
            'categoria': None,  # Legacy
        }
        
        # Callbacks para notificar mudanças
        self.on_change_callbacks: List[Callable] = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o estado para dicionário para armazenamento."""
        return {
            'active_filters': self.active_filters
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FilterState':
        """Cria uma instância a partir de um dicionário."""
        state = cls()
        if 'active_filters' in data:
            state.active_filters = data['active_filters']
        return state
    
    def set_filter(self, category: str, value: Optional[str]) -> None:
        """Define um filtro."""
        if category in self.active_filters:
            self.active_filters[category] = value
            self._notify_change()
    
    def get_filter(self, category: str) -> Optional[str]:
        """Retorna o valor de um filtro."""
        return self.active_filters.get(category)
    
    def clear_filter(self, category: str) -> None:
        """Limpa um filtro específico."""
        if category in self.active_filters:
            self.active_filters[category] = None
            self._notify_change()
    
    def clear_all(self) -> None:
        """Limpa todos os filtros."""
        for key in self.active_filters:
            self.active_filters[key] = None
        self._notify_change()
    
    def has_active_filters(self) -> bool:
        """Verifica se há algum filtro ativo."""
        return any(v is not None for v in self.active_filters.values())
    
    def get_active_count(self) -> int:
        """Retorna o número de filtros ativos."""
        return sum(1 for v in self.active_filters.values() if v is not None)
    
    def register_callback(self, callback: Callable) -> None:
        """Registra um callback para mudanças."""
        self.on_change_callbacks.append(callback)
    
    def _notify_change(self) -> None:
        """Notifica todos os callbacks sobre mudanças."""
        for callback in self.on_change_callbacks:
            try:
                callback(self.active_filters)
            except Exception as e:
                logger.error(f"Erro ao executar callback: {e}")


# Instância global do estado de filtros
filter_state = FilterState()


# ============================================================================
# FUNÇÕES DE ACESSO A PROPRIEDADES
# ============================================================================

def get_prop_safely(obj: Any, path: str) -> Any:
    """
    Acessa propriedades aninhadas com segurança.
    Equivalente ao getPropSafely do TypeScript.
    
    Args:
        obj: Objeto para acessar
        path: Caminho da propriedade (ex: 'original.paciente.nome')
        
    Returns:
        Valor da propriedade ou None se não existir
    """
    if not obj:
        return None
    
    parts = path.split('.')
    value = obj
    
    for part in parts:
        if value and isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return None
    
    return value


def get_evento_desc(notificacao: Dict[str, Any]) -> Optional[str]:
    """Obtém a descrição do evento."""
    # Tentar múltiplos caminhos
    paths = [
        'original.tipo_evento.descricao',
        'tipo_evento.descricao',
        'evento.descricao',
    ]
    
    for path in paths:
        value = get_prop_safely(notificacao, path)
        if value:
            return str(value)
    
    return None


def get_tipo_atendimento(notificacao: Dict[str, Any]) -> Optional[str]:
    """Obtém o tipo de atendimento."""
    paths = [
        'original.tipo_atendimento.descricao',
        'tipo_atendimento.descricao',
        'tipoAtendimento',
    ]
    
    for path in paths:
        value = get_prop_safely(notificacao, path)
        if value:
            return str(value)
    
    return None


def get_publico(notificacao: Dict[str, Any]) -> Optional[str]:
    """Obtém o público atendido."""
    paths = [
        'original.tipo_publico.descricao',
        'tipo_publico.descricao',
        'publicoAtendido',
    ]
    
    for path in paths:
        value = get_prop_safely(notificacao, path)
        if value:
            return str(value)
    
    return None


def get_genero(notificacao: Dict[str, Any]) -> Optional[str]:
    """Obtém o gênero."""
    paths = [
        'original.paciente.tipo_genero.descricao',
        'paciente.tipo_genero.descricao',
        'genero',
        'identidadeGenero',
    ]
    
    for path in paths:
        value = get_prop_safely(notificacao, path)
        if value:
            return str(value)
    
    return None


def get_raca(notificacao: Dict[str, Any]) -> Optional[str]:
    """Obtém a raça/cor."""
    paths = [
        'original.paciente.tipo_raca.descricao',
        'paciente.tipo_raca.descricao',
        'raca',
    ]
    
    for path in paths:
        value = get_prop_safely(notificacao, path)
        if value:
            return str(value)
    
    return None


# ============================================================================
# FUNÇÃO PRINCIPAL: applyFilters()
# ============================================================================

def apply_filters(
    dados: List[Dict[str, Any]],
    exclude_category: Optional[str] = None,
    custom_filters: Optional[Dict[str, Optional[str]]] = None
) -> List[Dict[str, Any]]:
    """
    Aplica todos os filtros ativos, EXCETO o excludeCategory.
    
    POWER BI STYLE: Quando um gráfico é filtrado, os OUTROS gráficos mostram
    dados SEM o filtro desse gráfico específico, mas COM todos os outros filtros.
    
    Args:
        dados: Lista de notificações
        exclude_category: Categoria a ser excluída do filtro (cross-filtering)
        custom_filters: Filtros customizados (opcional, usa filter_state se None)
        
    Returns:
        Lista filtrada de notificações
    """
    if not dados:
        return []
    
    # Usar filtros customizados ou o estado global
    filters = custom_filters if custom_filters is not None else filter_state.active_filters
    
    resultado = dados[:]
    
    for category, value in filters.items():
        # Pular se não há valor ou é a categoria excluída
        if value is None or category == exclude_category:
            continue
        
        # Aplicar filtro baseado na categoria
        if category == 'evento':
            resultado = [n for n in resultado if get_evento_desc(n) == value]
        
        elif category == 'tipoAtendimento':
            # Suporta multi-select (valores separados por vírgula)
            if ',' in value:
                values = [v.strip() for v in value.split(',')]
                resultado = [n for n in resultado if get_tipo_atendimento(n) in values]
            else:
                resultado = [n for n in resultado if get_tipo_atendimento(n) == value]
        
        elif category == 'publico':
            if ',' in value:
                values = [v.strip() for v in value.split(',')]
                resultado = [n for n in resultado if get_publico(n) in values]
            else:
                resultado = [n for n in resultado if get_publico(n) == value]
        
        elif category == 'genero':
            if ',' in value:
                values = [v.strip() for v in value.split(',')]
                resultado = [n for n in resultado if get_genero(n) in values]
            else:
                resultado = [n for n in resultado if get_genero(n) == value]
        
        elif category == 'raca':
            if ',' in value:
                values = [v.strip() for v in value.split(',')]
                resultado = [n for n in resultado if get_raca(n) in values]
            else:
                resultado = [n for n in resultado if get_raca(n) == value]
        
        # ... Adicionar outros filtros conforme necessário
        
        elif category == 'dataNotificacao':
            # Filtrar por data específica
            resultado = [
                n for n in resultado
                if get_prop_safely(n, 'original.data_notificacao', '').startswith(value)
            ]
    
    return resultado


# ============================================================================
# FUNÇÃO: toggleFilter()
# ============================================================================

def toggle_filter(category: str, value: str, multi_select: bool = False) -> None:
    """
    Adiciona ou remove um filtro. Suporta multi-select (Ctrl pressionado).
    
    Args:
        category: Categoria do filtro (ex: 'genero')
        value: Valor do filtro (ex: 'Masculino')
        multi_select: Se True, adiciona ao filtro existente (Ctrl pressionado)
    """
    current = filter_state.get_filter(category)
    
    if multi_select and current:
        # Ctrl pressionado - adicionar/remover da lista
        current_list = [v.strip() for v in current.split(',')]
        
        if value in current_list:
            # Remover
            current_list.remove(value)
        else:
            # Adicionar
            current_list.append(value)
        
        # Atualizar filtro
        if current_list:
            filter_state.set_filter(category, ','.join(current_list))
        else:
            filter_state.clear_filter(category)
    else:
        # Sem Ctrl - substituir filtro
        if current == value:
            # Remover se já está selecionado
            filter_state.clear_filter(category)
        else:
            # Adicionar novo filtro
            filter_state.set_filter(category, value)
    
    logger.info(f"🎯 Filtro alterado: {category} = {filter_state.get_filter(category)}")


# ============================================================================
# FUNÇÕES DE CONVENIÊNCIA
# ============================================================================

def get_filtered_data(
    all_data: List[Dict[str, Any]],
    exclude_category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Obtém dados filtrados.
    
    Args:
        all_data: Todos os dados
        exclude_category: Categoria a excluir (cross-filtering)
        
    Returns:
        Dados filtrados
    """
    return apply_filters(all_data, exclude_category)


def clear_all_filters() -> None:
    """Limpa todos os filtros."""
    filter_state.clear_all()
    logger.info("🧹 Todos os filtros foram limpos")


def get_active_filters_dict() -> Dict[str, Optional[str]]:
    """Retorna dicionário com filtros ativos."""
    return deepcopy(filter_state.active_filters)


def has_active_filters() -> bool:
    """Verifica se há filtros ativos."""
    return filter_state.has_active_filters()


# ============================================================================
# EXPORTAÇÃO
# ============================================================================

__all__ = [
    'FilterState',
    'filter_state',
    'apply_filters',
    'toggle_filter',
    'get_filtered_data',
    'clear_all_filters',
    'get_active_filters_dict',
    'has_active_filters',
    'get_prop_safely',
    'get_evento_desc',
    'get_tipo_atendimento',
    'get_publico',
    'get_genero',
    'get_raca',
]
