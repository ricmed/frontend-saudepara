"""
Componente da Linha 1: Seletor de Data + Total de Notificações
================================================================
Réplica exata do Dashboard Cirio TypeScript
"""

from dash import html, dcc
import dash_bootstrap_components as dbc
from datetime import datetime, date
from typing import List, Dict, Any, Optional


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


def render_date_selector_row(
    dados: List[Dict[str, Any]],
    selected_data: Optional[str],
    is_global_active: bool,
    total_notifications: int
) -> dbc.Row:
    """
    Renderiza a LINHA 1 do dashboard:
    - Seletor de Data (4 colunas)
    - Total de Notificações (4 colunas)
    """
    datas_disponiveis = get_available_dates(dados)
    hoje = date.today().strftime('%Y-%m-%d')
    
    # Formatar data selecionada para exibição
    data_formatada = "Todas as Datas"
    total_dia = 0
    
    if selected_data and selected_data != 'todos':
        try:
            dt = datetime.strptime(selected_data, '%Y-%m-%d')
            data_formatada = dt.strftime('%A, %d de %B').title()
            total_dia = count_notifications_by_date(dados, selected_data)
        except ValueError:
            pass
    
    return dbc.Row([
        # ========================================
        # SELETOR DE DATA (4 colunas)
        # ========================================
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        # Ícone e Info
                        html.Div([
                            html.Div([
                                html.I(className='fas fa-calendar-alt', style={
                                    'fontSize': '24px',
                                    'color': 'white'
                                })
                            ], style={
                                'backgroundColor': 'rgba(255,255,255,0.2)',
                                'borderRadius': '50%',
                                'padding': '12px',
                                'marginRight': '12px'
                            }),
                            
                            html.Div([
                                html.H2(
                                    data_formatada,
                                    style={
                                        'fontSize': '18px',
                                        'fontWeight': '700',
                                        'color': 'white',
                                        'marginBottom': '4px'
                                    }
                                ),
                                html.P(
                                    f"{total_dia:,} casos neste dia" if selected_data and selected_data != 'todos' else "Visualizando todos os registros",
                                    style={
                                        'fontSize': '12px',
                                        'color': 'rgba(255,255,255,0.85)',
                                        'margin': '0'
                                    }
                                )
                            ])
                        ], style={
                            'display': 'flex',
                            'alignItems': 'center',
                            'marginBottom': '12px'
                        }),
                        
                        # Dropdown de Data
                        html.Div([
                            dcc.Dropdown(
                                id='data-individual-filter',
                                options=[
                                    {'label': '🔒 Filtro Global Ativo' if is_global_active else '📊 Todas as Datas', 
                                     'value': 'todos'}
                                ] + ([
                                    {
                                        'label': f"{'🕐' if d == hoje else '📅'} {datetime.strptime(d, '%Y-%m-%d').strftime('%d/%m/%Y')} ({count_notifications_by_date(dados, d):,})",
                                        'value': d
                                    } for d in datas_disponiveis
                                ] if not is_global_active else []),
                                value=selected_data or 'todos',
                                disabled=is_global_active,
                                clearable=False,
                                style={
                                    'fontSize': '12px',
                                    'minWidth': '200px'
                                }
                            ),
                            
                            # Botão limpar (quando tem data selecionada)
                            html.Button([
                                html.I(className='fas fa-times')
                            ],
                            id='clear-data-button',
                            style={
                                'backgroundColor': 'rgba(255,255,255,0.2)',
                                'border': 'none',
                                'color': 'white',
                                'padding': '8px 12px',
                                'borderRadius': '6px',
                                'marginLeft': '8px',
                                'cursor': 'pointer',
                                'display': 'inline-block' if (selected_data and selected_data != 'todos' and not is_global_active) else 'none'
                            })
                        ], style={'display': 'flex', 'alignItems': 'center'})
                    ])
                ], style={'padding': '16px'})
            ], style={
                'background': 'linear-gradient(to right, #6366f1, #3b82f6)',
                'border': 'none',
                'borderRadius': '8px',
                'boxShadow': '0 4px 6px rgba(0,0,0,0.1)'
            })
        ], width=12, sm=6, lg=4, xl=4, className='mb-3'),
        
        # ========================================
        # TOTAL DE NOTIFICAÇÕES (4 colunas)
        # ========================================
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        html.Div([
                            html.I(className='fas fa-file-alt', style={
                                'fontSize': '32px',
                                'color': 'white'
                            })
                        ], style={
                            'backgroundColor': 'rgba(255,255,255,0.2)',
                            'borderRadius': '50%',
                            'padding': '12px',
                            'marginRight': '16px',
                            'flexShrink': '0'
                        }),
                        
                        html.Div([
                            html.H3(
                                "TOTAL DE NOTIFICAÇÕES",
                                style={
                                    'fontSize': '11px',
                                    'color': 'rgba(255,255,255,0.85)',
                                    'fontWeight': '600',
                                    'textTransform': 'uppercase',
                                    'letterSpacing': '0.5px',
                                    'marginBottom': '4px'
                                }
                            ),
                            html.P(
                                f"{total_notifications:,}",
                                style={
                                    'fontSize': '40px',
                                    'fontWeight': '700',
                                    'color': 'white',
                                    'margin': '0',
                                    'lineHeight': '1'
                                }
                            ),
                            html.P(
                                "👆 Clique para ver as fichas",
                                style={
                                    'fontSize': '11px',
                                    'color': 'rgba(255,255,255,0.8)',
                                    'margin': '4px 0 0 0'
                                }
                            )
                        ], style={'flex': '1', 'minWidth': '0'})
                    ], style={
                        'display': 'flex',
                        'alignItems': 'center'
                    })
                ], style={'padding': '16px'})
            ], style={
                'background': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                'border': 'none',
                'borderRadius': '8px',
                'boxShadow': '0 4px 6px rgba(0,0,0,0.1)',
                'cursor': 'pointer',
                'transition': 'transform 0.2s, box-shadow 0.2s'
            }, className='total-notifications-card', id='total-notifications-card')
        ], width=12, sm=6, lg=4, xl=4, className='mb-3')
    ])


__all__ = [
    'render_date_selector_row',
    'get_available_dates',
    'count_notifications_by_date'
]
