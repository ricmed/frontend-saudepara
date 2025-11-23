"""
Componente de Filtros Globais
====================================
Implementação dos filtros globais do dashboard:
- Período de Análise (filtro global com data/hora início e fim)
- Filtro de Evento
- Seletor de Data Individual (desabilitado quando filtro global ativo)
"""

from dash import html, dcc
import dash_bootstrap_components as dbc
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class GlobalFilterState:
    """Estado do filtro global."""
    enabled: bool = False
    start_date: str = date.today().strftime('%Y-%m-%d')
    start_hour: int = 0
    start_minute: int = 0
    end_date: str = date.today().strftime('%Y-%m-%d')
    end_hour: int = 23
    end_minute: int = 59
    selected_evento: str = "Todos"
    selected_data: Optional[str] = None  # Data individual selecionada
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GlobalFilterState':
        """Cria instância a partir de dicionário."""
        return cls(**data)


def get_available_eventos(dados: List[Dict[str, Any]]) -> List[str]:
    """Extrai lista de eventos únicos das notificações."""
    eventos = set()
    
    for notificacao in dados:
        # O campo correto é 'tipo_evento', não 'evento'
        evento = notificacao.get('tipo_evento')
        
        if evento:
            if isinstance(evento, dict):
                # Tentar diferentes campos para o nome do evento
                nome = (evento.get('nome') or 
                       evento.get('descricao') or 
                       evento.get('nometipo_evento') or
                       evento.get('tipo'))
            else:
                nome = str(evento)
            
            if nome:
                eventos.add(nome)
    
    # Ordenar e adicionar "Todos" no início
    eventos_list = sorted(list(eventos))
    
    return ["Todos"] + eventos_list


def get_available_dates(dados: List[Dict[str, Any]]) -> List[str]:
    """Extrai lista de datas únicas das notificações (YYYY-MM-DD)."""
    datas = set()
    
    for notificacao in dados:
        data_str = notificacao.get('created_at')
        if not data_str:
            continue
        
        try:
            dt = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
            datas.add(dt.strftime('%Y-%m-%d'))
        except (ValueError, AttributeError):
            continue
    
    return sorted(list(datas), reverse=True)


def count_notifications_by_date(dados: List[Dict[str, Any]], target_date: str) -> int:
    """Conta notificações em uma data específica."""
    count = 0
    
    for notificacao in dados:
        data_str = notificacao.get('created_at')
        if not data_str:
            continue
        
        try:
            dt = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
            if dt.strftime('%Y-%m-%d') == target_date:
                count += 1
        except (ValueError, AttributeError):
            continue
    
    return count


def render_global_filter_panel(
    dados: List[Dict[str, Any]],
    filter_state: GlobalFilterState
) -> html.Div:
    """
    Renderiza o painel completo de filtros globais.
    
    Layout: Filtro de Evento + Período de Análise (inline, compacto)
    """
    eventos = get_available_eventos(dados)
    
    return html.Div([
        dbc.Card([
            dbc.CardBody([
                dbc.Row([
                    # ========================================
                    # COLUNA 1: Filtro de Evento
                    # ========================================
                    dbc.Col([
                        html.Div([
                            html.I(className='fas fa-filter', style={
                                'color': '#3b5bdb',
                                'fontSize': '16px',
                                'marginRight': '8px'
                            }),
                            html.Span("Filtro:", style={
                                'fontWeight': '600',
                                'fontSize': '14px',
                                'color': '#374151',
                                'marginRight': '12px'
                            }),
                            
                            dcc.Dropdown(
                                id='evento-filter',
                                options=[{'label': e, 'value': e} for e in eventos],
                                value=filter_state.selected_evento,
                                clearable=False,
                                style={'fontSize': '13px', 'minWidth': '200px'},
                                className='d-inline-block'
                            )
                        ], style={'display': 'flex', 'alignItems': 'center'})
                    ], width='auto'),
                    
                    # ========================================
                    # COLUNA 2: Período de Análise
                    # ========================================
                    dbc.Col([
                        html.Div([
                            dbc.Checklist(
                                id='filtro-global-toggle',
                                options=[{'label': ' Período de Análise', 'value': 'enabled'}],
                                value=['enabled'] if filter_state.enabled else [],
                                switch=True,
                                style={'fontSize': '13px', 'marginRight': '12px'},
                                inline=True
                            ),
                            
                            # Datas e horas (aparecem inline quando ativo)
                            html.Div([
                                # Data início
                                dcc.DatePickerSingle(
                                    id='global-start-date',
                                    date=filter_state.start_date,
                                    display_format='DD/MM/YYYY',
                                    disabled=not filter_state.enabled,
                                    style={'marginRight': '4px', 'width': '120px'}
                                ),
                                # Hora início
                                dcc.Input(
                                    id='global-start-hour',
                                    type='number',
                                    min=0,
                                    max=23,
                                    value=filter_state.start_hour,
                                    disabled=not filter_state.enabled,
                                    placeholder='HH',
                                    style={'width': '50px', 'marginRight': '2px', 'textAlign': 'center'}
                                ),
                                html.Span(':', style={'marginRight': '2px'}),
                                # Minuto início
                                dcc.Input(
                                    id='global-start-minute',
                                    type='number',
                                    min=0,
                                    max=59,
                                    value=filter_state.start_minute,
                                    disabled=not filter_state.enabled,
                                    placeholder='MM',
                                    style={'width': '50px', 'marginRight': '8px', 'textAlign': 'center'}
                                ),
                                html.Span('até', style={
                                    'fontSize': '13px',
                                    'color': '#6b7280',
                                    'marginRight': '8px'
                                }),
                                # Data fim
                                dcc.DatePickerSingle(
                                    id='global-end-date',
                                    date=filter_state.end_date,
                                    display_format='DD/MM/YYYY',
                                    disabled=not filter_state.enabled,
                                    style={'marginRight': '4px', 'width': '120px'}
                                ),
                                # Hora fim
                                dcc.Input(
                                    id='global-end-hour',
                                    type='number',
                                    min=0,
                                    max=23,
                                    value=filter_state.end_hour,
                                    disabled=not filter_state.enabled,
                                    placeholder='HH',
                                    style={'width': '50px', 'marginRight': '2px', 'textAlign': 'center'}
                                ),
                                html.Span(':', style={'marginRight': '2px'}),
                                # Minuto fim
                                dcc.Input(
                                    id='global-end-minute',
                                    type='number',
                                    min=0,
                                    max=59,
                                    value=filter_state.end_minute,
                                    disabled=not filter_state.enabled,
                                    placeholder='MM',
                                    style={'width': '50px', 'textAlign': 'center'}
                                )
                            ], id='global-date-config', style={
                                'display': 'inline-flex' if filter_state.enabled else 'none',
                                'alignItems': 'center',
                                'gap': '4px'
                            })
                        ], style={'display': 'flex', 'alignItems': 'center'})
                    ], width='auto')
                ], justify='between', align='center')
            ], style={'padding': '12px 16px'})
        ], style={
            'border': '1px solid #e5e7eb',
            'borderRadius': '8px',
            'marginBottom': '16px'
        })
    ])


__all__ = [
    'GlobalFilterState',
    'render_global_filter_panel',
    'get_available_eventos',
    'get_available_dates',
    'count_notifications_by_date'
]
