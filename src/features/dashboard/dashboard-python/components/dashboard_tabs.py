"""
Sistema de Abas do Dashboard
=============================

Gerencia navegação entre diferentes visualizações do dashboard:
- Gráficos (estatísticas e distribuições)
- Fluxo Temporal (série temporal detalhada)
- Mapa Interativo (geolocalização)
- IA Preditiva (desativada temporariamente)

Baseado em: DashboardTabs.tsx (linhas 200-350)

Features:
- 4 abas principais
- Renderização condicional de conteúdo
- Ícones e badges informativos
- Contador de notificações por aba
- Navegação por teclado (Ctrl+1, Ctrl+2, etc)

Autor: Convertido de TypeScript para Python
Data: 2025
"""

from typing import Dict, Any, Optional, List
from dash import dcc, html
import dash_bootstrap_components as dbc


class DashboardTabsState:
    """
    Estado do sistema de abas.
    
    Attributes:
        active_tab: ID da aba ativa ('graficos', 'fluxo', 'mapa', 'ia')
        tab_counts: Dicionário com contadores por aba
    """
    
    def __init__(
        self,
        active_tab: str = 'graficos',
        tab_counts: Optional[Dict[str, int]] = None
    ):
        self.active_tab = active_tab
        self.tab_counts = tab_counts or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'active_tab': self.active_tab,
            'tab_counts': self.tab_counts
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DashboardTabsState':
        """Cria instância a partir de dicionário."""
        return cls(
            active_tab=data.get('active_tab', 'graficos'),
            tab_counts=data.get('tab_counts', {})
        )


def get_tab_icon(tab_id: str) -> str:
    """
    Retorna o ícone emoji para cada aba.
    
    Args:
        tab_id: ID da aba
        
    Returns:
        String com emoji
    """
    icons = {
        'graficos': '📊',
        'fluxo': '📈',
        'mapa': '🗺️',
        'ia': '🤖'
    }
    return icons.get(tab_id, '📋')


def get_tab_description(tab_id: str) -> str:
    """
    Retorna descrição curta de cada aba.
    
    Args:
        tab_id: ID da aba
        
    Returns:
        String com descrição
    """
    descriptions = {
        'graficos': 'Estatísticas e distribuições',
        'fluxo': 'Análise temporal detalhada',
        'mapa': 'Visualização geográfica',
        'ia': 'Predição e insights (em breve)'
    }
    return descriptions.get(tab_id, '')


def render_dashboard_tabs(
    tabs_state: Optional[DashboardTabsState] = None,
    dados: Optional[List[Dict[str, Any]]] = None
) -> html.Div:
    """
    Renderiza o componente Dash de abas do dashboard.
    
    Args:
        tabs_state: Estado atual das abas
        dados: Lista de notificações (para contadores)
        
    Returns:
        Componente html.Div com as abas
        
    Uso no Dash:
        ```python
        @app.callback(
            Output('tab-content', 'children'),
            Input('dashboard-tabs', 'active_tab')
        )
        def render_tab_content(active_tab):
            if active_tab == 'graficos':
                return render_graficos_tab()
            elif active_tab == 'fluxo':
                return render_fluxo_tab()
            # ...
        ```
    """
    if tabs_state is None:
        tabs_state = DashboardTabsState()
    
    # Calcula contadores
    total_notificacoes = len(dados) if dados else 0
    
    # Define as abas
    tabs = [
        {
            'id': 'graficos',
            'label': 'Gráficos',
            'icon': '📊',
            'description': 'Estatísticas e Distribuições',
            'count': total_notificacoes,
            'disabled': False
        },
        {
            'id': 'fluxo',
            'label': 'Fluxo Temporal',
            'icon': '📈',
            'description': 'Análise por Período',
            'count': None,
            'disabled': False
        },
        {
            'id': 'mapa',
            'label': 'Mapa',
            'icon': '🗺️',
            'description': 'Visualização Geográfica',
            'count': None,
            'disabled': False
        },
        {
            'id': 'ia',
            'label': 'IA Preditiva',
            'icon': '🤖',
            'description': 'Em Desenvolvimento',
            'count': None,
            'disabled': True
        }
    ]
    
    # Cria os componentes das abas
    tab_components = []
    
    for tab in tabs:
        # Label simples com ícone e texto (Bootstrap 2.0 não aceita componentes HTML no label)
        label_text = f"{tab['icon']} {tab['label']}"
        
        if tab['count'] is not None and tab['count'] > 0:
            label_text += f" ({tab['count']})"
        
        if tab['disabled']:
            label_text += " [Em Breve]"
        
        tab_components.append(
            dbc.Tab(
                label=label_text,
                tab_id=tab['id'],
                disabled=tab['disabled'],
                active_tab_class_name='fw-bold',
                label_style={
                    'padding': '12px 20px',
                    'cursor': 'pointer' if not tab['disabled'] else 'not-allowed'
                }
            )
        )
    
    return html.Div(
        children=[
            # Navegação das abas
            dbc.Tabs(
                tab_components,
                id='dashboard-tabs',
                active_tab=tabs_state.active_tab,
                className='mb-3',
                style={
                    'borderBottom': '2px solid #dee2e6'
                }
            ),
            
            # Descrição da aba ativa
            html.Div(
                id='tab-description',
                children=[
                    html.Small(
                        get_tab_description(tabs_state.active_tab),
                        style={
                            'color': '#666',
                            'fontStyle': 'italic',
                            'display': 'block',
                            'marginBottom': '15px'
                        }
                    )
                ]
            ),
            
            # Conteúdo da aba (será renderizado por callback)
            html.Div(
                id='tab-content',
                style={'minHeight': '500px'}
            )
        ],
        style={
            'backgroundColor': 'white',
            'borderRadius': '12px',
            'padding': '20px',
            'boxShadow': '0 2px 8px rgba(0,0,0,0.1)'
        }
    )


def render_graficos_tab_content(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
) -> html.Div:
    """
    Renderiza o conteúdo da aba "Gráficos".
    ORDEM EXATA do NotificationDashboardCirio.tsx
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Filtro ativo
        
    Returns:
        Componente html.Div com grid de gráficos
    """
    from components.charts import (
        publico, tipo_atendimento, sexo, raca_cor,
        sintomas, trauma, hipoteses, geographic_panel,
        desfecho_casos, estabelecimentos, piramide_etaria
    )
    
    return html.Div(
        children=[
            # ========================================================
            # LINHA 3: Distribuição por Público, Tipo, Sexo e Raça/Cor
            # Grid 8 colunas: 2+2+2+2
            # ========================================================
            dbc.Row(
                [
                    # Público Atendido - 2/8 colunas = 3/12 cols Bootstrap
                    dbc.Col(
                        publico.render_publico_chart_component(dados, active_filter), 
                        width=12, lg=6, xl=3
                    ),
                    # Tipo de Atendimento - 2/8 colunas = 3/12 cols
                    dbc.Col(
                        tipo_atendimento.render_tipo_atendimento_chart_component(dados, active_filter), 
                        width=12, lg=6, xl=3
                    ),
                    # Identidade de Gênero - 2/8 colunas = 3/12 cols
                    dbc.Col(
                        sexo.render_sexo_chart_component(dados, active_filter), 
                        width=12, lg=6, xl=3
                    ),
                    # Raça/Cor - 2/8 colunas = 3/12 cols
                    dbc.Col(
                        raca_cor.render_raca_cor_chart_component(dados, active_filter), 
                        width=12, lg=6, xl=3
                    )
                ],
                className='mb-4'
            ),
            
            # ========================================================
            # LINHA 4: Localização Geográfica
            # Grid 8 colunas: 8 (largura total)
            # ========================================================
            dbc.Row(
                [
                    dbc.Col(
                        geographic_panel.render_geographic_panel_component(dados, active_filter), 
                        width=12
                    )
                ],
                className='mb-4'
            ),
            
            # ========================================================
            # LINHA 5: Estabelecimentos e Pirâmide Etária
            # Grid 8 colunas: 4+4
            # ========================================================
            dbc.Row(
                [
                    # Estabelecimentos - 4/8 colunas = 6/12 cols
                    dbc.Col(
                        estabelecimentos.render_estabelecimentos_chart_component(dados, active_filter), 
                        width=12, lg=6
                    ),
                    # Pirâmide Etária - 4/8 colunas = 6/12 cols
                    dbc.Col(
                        piramide_etaria.render_piramide_etaria_chart_component(dados, active_filter), 
                        width=12, lg=6
                    )
                ],
                className='mb-4'
            ),
            
            # ========================================================
            # LINHA 6: Sintomas, Trauma e Hipóteses
            # Grid 8 colunas: 2+2+4
            # ========================================================
            dbc.Row(
                [
                    # Sintomas - 2/8 colunas = 3/12 cols
                    dbc.Col(
                        sintomas.render_sintomas_chart_component(dados, active_filter), 
                        width=12, lg=6, xl=3
                    ),
                    # Trauma - 2/8 colunas = 3/12 cols
                    dbc.Col(
                        trauma.render_trauma_chart_component(dados, active_filter), 
                        width=12, lg=6, xl=3
                    ),
                    # Hipóteses - 4/8 colunas = 6/12 cols (maior para nomes longos)
                    dbc.Col(
                        hipoteses.render_hipoteses_chart_component(dados, active_filter), 
                        width=12, xl=6
                    )
                ],
                className='mb-4'
            ),
            
            # ========================================================
            # LINHA 7: Desfecho dos Casos (centralizado)
            # Grid 8 colunas: 1 offset + 6 gráfico + 1 offset
            # ========================================================
            dbc.Row(
                [
                    # Offset esquerdo - 1/8 = 1.5/12
                    dbc.Col(width=0, xl=2),
                    # Desfecho - 6/8 colunas = 9/12 cols (centralizado)
                    dbc.Col(
                        desfecho_casos.render_desfecho_chart_component(dados, active_filter), 
                        width=12, xl=8
                    ),
                    # Offset direito - 1/8 = 1.5/12
                    dbc.Col(width=0, xl=2)
                ],
                className='mb-4 mt-4'  # Adicionar margem superior
            )
        ]
    )


def render_fluxo_tab_content(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
) -> html.Div:
    """
    Renderiza o conteúdo da aba "Fluxo Temporal".
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Filtro ativo
        
    Returns:
        Componente html.Div com análises temporais
    """
    from components.charts import serie_temporal, atendimentos_hora, piramide_etaria
    
    return html.Div(
        children=[
            # Série temporal
            dbc.Row(
                [
                    dbc.Col(serie_temporal.render_serie_temporal_chart_component(dados, active_filter), width=12)
                ],
                className='mb-4'
            ),
            
            # Atendimentos por hora e pirâmide etária
            dbc.Row(
                [
                    dbc.Col(atendimentos_hora.render_atendimentos_hora_chart_component(dados, active_filter), width=6),
                    dbc.Col(piramide_etaria.render_piramide_etaria_chart_component(dados, active_filter), width=6)
                ],
                className='mb-4'
            )
        ]
    )


def render_mapa_tab_content(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
) -> html.Div:
    """
    Renderiza o conteúdo da aba "Mapa".
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Filtro ativo
        
    Returns:
        Componente html.Div com mapa interativo
    """
    from components.charts import mapa_estabelecimentos
    
    # Estatísticas do mapa
    stats = mapa_estabelecimentos.get_estatisticas_mapa(dados)
    
    return html.Div(
        children=[
            # Cards de estatísticas
            dbc.Row(
                [
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody([
                                html.H4(stats['total_estabelecimentos'], className='card-title'),
                                html.P('Estabelecimentos', className='card-text')
                            ]),
                            color='primary',
                            outline=True
                        ),
                        width=3
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody([
                                html.H4(stats['total_atendimentos'], className='card-title'),
                                html.P('Atendimentos', className='card-text')
                            ]),
                            color='info',
                            outline=True
                        ),
                        width=3
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody([
                                html.H4(stats['estabelecimentos_alarmantes'], className='card-title'),
                                html.P('Alarmantes', className='card-text')
                            ]),
                            color='danger',
                            outline=True
                        ),
                        width=3
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody([
                                html.H4(f"{stats['media_atendimentos']:.1f}", className='card-title'),
                                html.P('Média/Estabelecimento', className='card-text')
                            ]),
                            color='success',
                            outline=True
                        ),
                        width=3
                    )
                ],
                className='mb-4'
            ),
            
            # Mapa
            dbc.Row(
                [
                    dbc.Col(mapa_estabelecimentos.render_mapa_chart_component(dados, active_filter), width=12)
                ]
            )
        ]
    )


def render_ia_tab_content() -> html.Div:
    """
    Renderiza o conteúdo da aba "IA Preditiva" (placeholder).
    
    Returns:
        Componente html.Div com mensagem
    """
    return html.Div(
        children=[
            dbc.Alert(
                [
                    html.H4("🤖 IA Preditiva - Em Desenvolvimento", className='alert-heading'),
                    html.Hr(),
                    html.P(
                        "Esta funcionalidade está sendo desenvolvida e incluirá:",
                        className='mb-2'
                    ),
                    html.Ul([
                        html.Li("Predição de surtos epidemiológicos"),
                        html.Li("Análise de padrões anômalos"),
                        html.Li("Recomendações de ações preventivas"),
                        html.Li("Alertas inteligentes baseados em ML")
                    ])
                ],
                color='info',
                style={'margin': '50px auto', 'maxWidth': '600px'}
            )
        ],
        style={'textAlign': 'center', 'padding': '50px'}
    )


__all__ = [
    'DashboardTabsState',
    'get_tab_icon',
    'get_tab_description',
    'render_dashboard_tabs',
    'render_graficos_tab_content',
    'render_fluxo_tab_content',
    'render_mapa_tab_content',
    'render_ia_tab_content'
]
