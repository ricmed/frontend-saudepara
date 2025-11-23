"""
Dashboard de Notificações - Sistema de Vigilância em Saúde Círio de Nazaré 2025
==================================================================================

Dashboard interativo completo desenvolvido em Python com Dash/Plotly.
Conversão fiel do NotificationDashboardCirio.tsx (4384 linhas).

Features:
- 14 gráficos interativos com filtros cruzados (Power BI style)
- Sistema de auto-refresh (60s)
- 4 abas (Gráficos, Fluxo Temporal, Mapa, IA)
- Exportação em múltiplos formatos (CSV, Excel, JSON)
- Filtros avançados por data/período
- Mapa interativo com Folium
- Estatísticas em tempo real

Autor: Convertido de TypeScript para Python
Data: Novembro 2025
"""

import dash
from dash import dcc, html, Input, Output, State, callback_context, no_update
import dash_bootstrap_components as dbc
from datetime import datetime
import json
import pandas as pd
from io import StringIO

# Importar serviços
from services.notificacao_service import NotificacaoService

# Importar utilitários
from utils.filters import FilterState, apply_filters

# Importar componentes de features
from components.date_range_selector import (
    DateRangeState,
    render_date_range_selector,
    aplicar_filtro_data,
    obter_periodo_padrao
)
from components.global_filters import (
    GlobalFilterState,
    render_global_filter_panel,
    get_available_eventos,
    get_available_dates
)
from components.date_selector_row import (
    render_date_selector_row
)
from components.dashboard_tabs import (
    DashboardTabsState,
    render_dashboard_tabs,
    render_graficos_tab_content,
    render_fluxo_tab_content,
    render_mapa_tab_content,
    render_ia_tab_content
)
from components.export_menu import (
    render_dashboard_export_menu,
    export_to_csv,
    export_to_excel,
    export_to_json,
    create_export_metadata
)
from utils.auto_refresh import (
    AutoRefreshState,
    render_auto_refresh_control,
    render_refresh_notification
)

# Configurações
from config.colors import COLORS, BLUE_PALETTE, GREEN_PALETTE, PURPLE_PALETTE, ORANGE_PALETTE

# ============================================================================
# INICIALIZAÇÃO DO APP
# ============================================================================

app = dash.Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        'https://use.fontawesome.com/releases/v5.15.4/css/all.css'
    ],
    title="Dashboard Círio de Nazaré 2025 - Vigilância em Saúde",
    suppress_callback_exceptions=True,
    meta_tags=[
        {
            'name': 'viewport',
            'content': 'width=device-width, initial-scale=1.0'
        }
    ]
)

# CSS Customizado para efeitos e animações
app.index_string = '''
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
        <style>
            /* Efeito hover nos cards de estatísticas */
            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
            }
            
            /* Botões do header - Efeitos hover */
            .btn-refresh:hover {
                background-color: #15803d !important;
            }
            
            .btn-auto-refresh:hover {
                background-color: #ca8a04 !important;
            }
            
            .btn-auto-refresh.disabled {
                background-color: #9ca3af !important;
            }
            
            .btn-auto-refresh.disabled:hover {
                background-color: #6b7280 !important;
            }
            
            .btn-export:hover {
                background-color: #4f46e5 !important;
            }
            
            /* Animações suaves */
            * {
                transition: all 0.2s ease-in-out;
            }
            
            /* Scrollbar customizada */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            ::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb {
                background: #3b5bdb;
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: #2a49c4;
            }
            
            /* Cards responsivos */
            @media (max-width: 768px) {
                .stat-card {
                    margin-bottom: 12px;
                }
            }
            
            /* Card de total de notificações */
            .total-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 16px rgba(59,91,219,0.3) !important;
            }
            
            .total-notifications-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 16px rgba(59,130,246,0.4) !important;
            }
        </style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
'''

server = app.server  # Para deploy em produção

# Instância do serviço de notificações
notificacao_service = NotificacaoService()

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def criar_card_estatistica(titulo: str, valor: str, icone: str, cor: str = 'primary') -> dbc.Card:
    """Cria um card de estatística com estilo melhorado."""
    
    # Mapeamento de cores
    cores = {
        'primary': {'bg': '#3b5bdb', 'border': '#2a49c4', 'icon': '#e4e8fe'},
        'danger': {'bg': '#dc3545', 'border': '#c82333', 'icon': '#ffe5e7'},
        'success': {'bg': '#28a745', 'border': '#218838', 'icon': '#e5f7ea'},
        'warning': {'bg': '#ffc107', 'border': '#e0a800', 'icon': '#fff9e5'}
    }
    
    cor_config = cores.get(cor, cores['primary'])
    
    return dbc.Card(
        dbc.CardBody([
            html.Div([
                # Ícone
                html.Div([
                    html.I(
                        className=f'fas fa-{icone}',
                        style={
                            'fontSize': '32px',
                            'color': cor_config['icon'],
                            'opacity': '0.9'
                        }
                    )
                ], style={
                    'backgroundColor': 'rgba(255,255,255,0.15)',
                    'borderRadius': '50%',
                    'width': '60px',
                    'height': '60px',
                    'display': 'flex',
                    'alignItems': 'center',
                    'justifyContent': 'center',
                    'marginBottom': '12px'
                }),
                
                # Valor
                html.H2(
                    valor,
                    className='mb-1',
                    style={
                        'fontWeight': '700',
                        'color': 'white',
                        'fontSize': '36px'
                    }
                ),
                
                # Título
                html.P(
                    titulo,
                    className='mb-0',
                    style={
                        'fontSize': '13px',
                        'color': 'rgba(255,255,255,0.85)',
                        'fontWeight': '500',
                        'textTransform': 'uppercase',
                        'letterSpacing': '0.5px'
                    }
                )
            ], style={
                'textAlign': 'center',
                'display': 'flex',
                'flexDirection': 'column',
                'alignItems': 'center'
            })
        ], style={'padding': '20px'}),
        style={
            'background': f'linear-gradient(135deg, {cor_config["bg"]} 0%, {cor_config["border"]} 100%)',
            'border': 'none',
            'borderRadius': '12px',
            'boxShadow': '0 4px 6px rgba(0,0,0,0.1)',
            'transition': 'transform 0.2s, box-shadow 0.2s',
            'cursor': 'default'
        },
        className='stat-card'
    )


def calcular_estatisticas_dashboard(dados: list) -> dict:
    """Calcula estatísticas gerais do dashboard."""
    if not dados:
        return {
            'total': 0,
            'alarmantes': 0,
            'alta': 0,
            'obito': 0
        }
    
    total = len(dados)
    
    # Conta casos alarmantes
    alarmantes = sum(
        1 for n in dados
        if any(
            h.get('hipoteseDiagnostica', {}).get('isAlarmante', False)
            for h in n.get('hipotesesDiagnosticas', [])
        )
    )
    
    # Conta desfechos
    alta = sum(1 for n in dados if n.get('desfechoAtendimento', {}).get('id') == 1)
    obito = sum(1 for n in dados if n.get('desfechoAtendimento', {}).get('id') == 2)
    
    return {
        'total': total,
        'alarmantes': alarmantes,
        'alta': alta,
        'obito': obito
    }


# ============================================================================
# LAYOUT PRINCIPAL
# ============================================================================

def criar_layout():
    """Cria o layout principal do dashboard."""
    
    # Dados iniciais
    dados_iniciais = []
    try:
        dados_iniciais = notificacao_service.fetch_all_notifications()
    except Exception as e:
        print(f"Erro ao carregar dados iniciais: {e}")
    
    # Estados iniciais
    filter_state = FilterState()
    date_range_state = obter_periodo_padrao(dados_iniciais) if dados_iniciais else DateRangeState()
    global_filter_state = GlobalFilterState()
    tabs_state = DashboardTabsState()
    refresh_state = AutoRefreshState()
    
    # Estatísticas iniciais
    stats = calcular_estatisticas_dashboard(dados_iniciais)
    
    return html.Div([
        # ====================================================================
        # HEADER FIXO COM GRADIENTE AZUL
        # ====================================================================
        html.Header([
            dbc.Container([
                dbc.Row([
                    # Coluna esquerda: Título
                    dbc.Col([
                        html.Div([
                            html.I(className='fas fa-clipboard-list', style={
                                'fontSize': '28px',
                                'color': 'white',
                                'marginRight': '12px'
                            }),
                            html.H1(
                                "Comunicação de Eventos",
                                className="mb-0",
                                style={
                                    'color': 'white',
                                    'fontWeight': '600',
                                    'fontSize': '20px',
                                    'display': 'inline-block'
                                }
                            ),
                        ], style={'display': 'flex', 'alignItems': 'center'})
                    ], width='auto'),
                    
                    # Coluna direita: Atualização e Botões
                    dbc.Col([
                        html.Div([
                            # Info de atualização
                            html.Div([
                                html.I(className='fas fa-clock', style={
                                    'fontSize': '14px',
                                    'color': 'white',
                                    'marginRight': '8px'
                                }),
                                html.Span(
                                    f"Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
                                    id='last-update-text',
                                    style={'color': 'white', 'fontSize': '13px'}
                                ),
                                html.Span(
                                    "Próxima em: 60s",
                                    id='countdown-text',
                                    style={
                                        'color': '#fef08a',
                                        'fontSize': '13px',
                                        'marginLeft': '12px',
                                        'whiteSpace': 'nowrap'
                                    }
                                )
                            ], style={
                                'display': 'flex',
                                'alignItems': 'center',
                                'backgroundColor': 'rgba(255,255,255,0.1)',
                                'padding': '8px 16px',
                                'borderRadius': '6px',
                                'marginRight': '12px'
                            }),
                            
                            # Botão Atualizar (Verde)
                            html.Button([
                                html.I(className='fas fa-sync-alt', style={'marginRight': '6px', 'fontSize': '14px'}),
                                html.Span("Atualizar", className='d-none d-sm-inline')
                            ],
                            id='manual-refresh-button',
                            className='btn-refresh',
                            style={
                                'backgroundColor': '#16a34a',
                                'color': 'white',
                                'border': 'none',
                                'padding': '8px 12px',
                                'borderRadius': '6px',
                                'fontSize': '13px',
                                'cursor': 'pointer',
                                'display': 'flex',
                                'alignItems': 'center',
                                'gap': '6px',
                                'whiteSpace': 'nowrap',
                                'marginRight': '8px',
                                'transition': 'background-color 0.2s'
                            }
                            ),
                            
                            # Botão Auto-Refresh (Amarelo/Cinza)
                            html.Button([
                                html.I(className='fas fa-clock', style={'marginRight': '6px', 'fontSize': '14px'}),
                                html.Span("Auto ON", id='auto-refresh-label', className='d-none d-sm-inline')
                            ],
                            id='auto-refresh-toggle-btn',
                            className='btn-auto-refresh',
                            style={
                                'backgroundColor': '#eab308',
                                'color': 'white',
                                'border': 'none',
                                'padding': '8px 12px',
                                'borderRadius': '6px',
                                'fontSize': '13px',
                                'cursor': 'pointer',
                                'display': 'flex',
                                'alignItems': 'center',
                                'gap': '6px',
                                'whiteSpace': 'nowrap',
                                'marginRight': '8px',
                                'transition': 'background-color 0.2s'
                            }
                            ),
                            
                            # Botão Exportar (Azul)
                            html.Button([
                                html.I(className='fas fa-download', style={'marginRight': '6px', 'fontSize': '14px'}),
                                html.Span("Exportar", className='d-none d-sm-inline')
                            ],
                            id='export-button',
                            className='btn-export',
                            style={
                                'backgroundColor': '#6366f1',
                                'color': 'white',
                                'border': 'none',
                                'padding': '8px 12px',
                                'borderRadius': '6px',
                                'fontSize': '13px',
                                'cursor': 'pointer',
                                'display': 'flex',
                                'alignItems': 'center',
                                'gap': '6px',
                                'whiteSpace': 'nowrap',
                                'transition': 'background-color 0.2s'
                            }
                            ),
                        ], style={
                            'display': 'flex',
                            'alignItems': 'center',
                            'justifyContent': 'flex-end',
                            'flexWrap': 'wrap',
                            'gap': '0'
                        })
                    ], width='auto', style={'marginLeft': 'auto'})
                ], align='center', justify='between', className='g-0')
            ], fluid=False, style={'maxWidth': '1920px'})
        ], style={
            'background': 'linear-gradient(to right, #1d4ed8, #1e3a8a)',
            'padding': '12px 24px',
            'boxShadow': '0 4px 6px rgba(0,0,0,0.1)',
            'position': 'sticky',
            'top': '0',
            'zIndex': '1000'
        }),
        
        # ====================================================================
        # CONTAINER PRINCIPAL COM FUNDO CINZA
        # ====================================================================
        dbc.Container([
        
        # ====================================================================
        # PAINEL DE FILTROS GLOBAIS (Evento + Período de Análise)
        # ====================================================================
        html.Div([
            render_global_filter_panel(dados_iniciais, global_filter_state)
        ], id='global-filters-panel', style={'paddingTop': '20px'}),
        
        # ====================================================================
        # LINHA 1: Seletor de Data + Total de Notificações
        # ====================================================================
        html.Div([
            render_date_selector_row(
                dados_iniciais,
                global_filter_state.selected_data,
                global_filter_state.enabled,
                stats['total']
            )
        ], id='date-selector-row'),
        
        # ====================================================================
        # CARDS DE ESTATÍSTICAS
        # ====================================================================
        dbc.Row([
            dbc.Col([
                criar_card_estatistica(
                    'Total de Notificações',
                    str(stats['total']),
                    'clipboard-list',
                    'primary'
                )
            ], width=3),
            
            dbc.Col([
                criar_card_estatistica(
                    'Casos Alarmantes',
                    str(stats['alarmantes']),
                    'exclamation-triangle',
                    'danger'
                )
            ], width=3),
            
            dbc.Col([
                criar_card_estatistica(
                    'Alta Hospitalar',
                    str(stats['alta']),
                    'check-circle',
                    'success'
                )
            ], width=3),
            
            dbc.Col([
                criar_card_estatistica(
                    'Óbitos',
                    str(stats['obito']),
                    'heart-broken',
                    'danger'
                )
            ], width=3)
        ], className='mb-4', id='stats-row'),
        
        # ====================================================================
        # NOTIFICAÇÃO DE REFRESH
        # ====================================================================
        html.Div(id='refresh-notification', style={'marginBottom': '16px'}),
        
        # ====================================================================
        # SISTEMA DE ABAS
        # ====================================================================
        html.Div([
            render_dashboard_tabs(tabs_state, dados_iniciais)
        ], id='dashboard-tabs-container'),
        
        # ====================================================================
        # STORES PARA GERENCIAMENTO DE ESTADO
        # ====================================================================
        dcc.Store(id='dados-raw-store', data=dados_iniciais),
        dcc.Store(id='dados-filtrados-store', data=dados_iniciais),
        dcc.Store(id='filter-state-store', data=filter_state.to_dict()),
        dcc.Store(id='global-filter-store', data=global_filter_state.to_dict(), storage_type='local'),
        dcc.Store(id='date-range-store', data=date_range_state.to_dict()),
        dcc.Store(id='tabs-state-store', data=tabs_state.to_dict()),
        dcc.Store(id='refresh-state-store', data=refresh_state.to_dict()),
        dcc.Store(id='auto-refresh-enabled', data=True),  # Estado do auto-refresh
        
        # ====================================================================
        # COMPONENTES DE DOWNLOAD
        # ====================================================================
        dcc.Download(id='download-dashboard'),
        
        # ====================================================================
        # MODAL DE EXPORTAÇÃO
        # ====================================================================
        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("Exportar Dashboard")),
            dbc.ModalBody([
                html.P("Escolha o formato de exportação:"),
                dbc.ButtonGroup([
                    dbc.Button("📄 CSV", id='export-csv-btn', color='primary', className='me-2'),
                    dbc.Button("📊 Excel", id='export-excel-btn', color='success', className='me-2'),
                    dbc.Button("📋 JSON", id='export-json-btn', color='info')
                ])
            ]),
            dbc.ModalFooter(
                dbc.Button("Fechar", id='close-export-modal', color='secondary')
            )
        ], id='export-modal', is_open=False),
        
        # ====================================================================
        # INTERVAL PARA AUTO-REFRESH
        # ====================================================================
        dcc.Interval(
            id='refresh-interval',
            interval=1000,  # 1 segundo
            n_intervals=0
        )
        
        ], fluid=False, style={'maxWidth': '1920px', 'paddingLeft': '16px', 'paddingRight': '16px'})
        
    ], style={'minHeight': '100vh', 'backgroundColor': '#f3f4f6', 'paddingBottom': '24px'})


app.layout = criar_layout()

# ============================================================================
# CALLBACKS
# ============================================================================

# ----------------------------------------------------------------------------
# Callback 1: Toggle Auto-Refresh
# ----------------------------------------------------------------------------
@app.callback(
    [Output('auto-refresh-enabled', 'data'),
     Output('auto-refresh-toggle-btn', 'style'),
     Output('auto-refresh-label', 'children')],
    [Input('auto-refresh-toggle-btn', 'n_clicks')],
    [State('auto-refresh-enabled', 'data')]
)
def toggle_auto_refresh(n_clicks, enabled):
    """Toggle do auto-refresh."""
    if n_clicks:
        enabled = not enabled
    
    # Estilo do botão
    style = {
        'backgroundColor': '#eab308' if enabled else '#9ca3af',
        'color': 'white',
        'border': 'none',
        'padding': '8px 12px',
        'borderRadius': '6px',
        'fontSize': '13px',
        'cursor': 'pointer',
        'display': 'flex',
        'alignItems': 'center',
        'gap': '6px',
        'whiteSpace': 'nowrap',
        'marginRight': '8px',
        'transition': 'background-color 0.2s'
    }
    
    label = 'Auto ON' if enabled else 'Auto OFF'
    
    return enabled, style, label


# ----------------------------------------------------------------------------
# Callback 2: Contador de Segundos
# ----------------------------------------------------------------------------
@app.callback(
    Output('countdown-text', 'children'),
    [Input('refresh-interval', 'n_intervals')],
    [State('auto-refresh-enabled', 'data')]
)
def update_countdown(n_intervals, auto_enabled):
    """Atualiza o contador de segundos."""
    if not auto_enabled:
        return ""
    
    # Calcula segundos restantes (60s - (n_intervals % 60))
    seconds_remaining = 60 - (n_intervals % 60)
    
    return f"Próxima em: {seconds_remaining}s"


# ----------------------------------------------------------------------------
# Callback 3: Refresh Manual e Automático
# ----------------------------------------------------------------------------
@app.callback(
    [Output('dados-raw-store', 'data'),
     Output('last-update-text', 'children'),
     Output('refresh-notification', 'children')],
    [Input('manual-refresh-button', 'n_clicks'),
     Input('refresh-interval', 'n_intervals')],
    [State('auto-refresh-enabled', 'data')]
)
def update_data(manual_clicks, n_intervals, auto_enabled):
    """Atualiza dados do dashboard."""
    ctx = callback_context
    
    if not ctx.triggered:
        return no_update, no_update, no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    # Só atualiza automaticamente se auto-refresh estiver ativo
    if trigger_id == 'refresh-interval':
        # Atualiza a cada 60 segundos (60 intervalos de 1s)
        if not auto_enabled or n_intervals % 60 != 0:
            return no_update, no_update, no_update
    
    # Busca dados frescos
    try:
        dados_frescos = notificacao_service.fetch_all_notifications()
        timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        
        notification = dbc.Alert(
            [html.I(className='fas fa-check-circle me-2'), "Dashboard atualizado com sucesso!"],
            color='success',
            dismissable=True,
            duration=3000
        )
        
        return dados_frescos, f"Última atualização: {timestamp}", notification
    except Exception as e:
        notification = dbc.Alert(
            [html.I(className='fas fa-exclamation-triangle me-2'), f"Erro ao atualizar: {str(e)}"],
            color='danger',
            dismissable=True,
            duration=5000
        )
        return no_update, no_update, notification


# ----------------------------------------------------------------------------
# Callback 4: Atualizar Filtros Globais
# ----------------------------------------------------------------------------
@app.callback(
    [Output('global-filter-store', 'data'),
     Output('global-date-config', 'style')],
    [Input('filtro-global-toggle', 'value'),
     Input('evento-filter', 'value'),
     Input('data-individual-filter', 'value'),
     Input('global-start-date', 'date'),
     Input('global-start-hour', 'value'),
     Input('global-start-minute', 'value'),
     Input('global-end-date', 'date'),
     Input('global-end-hour', 'value'),
     Input('global-end-minute', 'value'),
     Input('clear-data-button', 'n_clicks')],
    [State('global-filter-store', 'data')]
)
def update_global_filters(toggle_value, evento, data_individual, start_date, start_hour, start_minute, 
                         end_date, end_hour, end_minute, clear_clicks, filter_data):
    """Atualiza o estado dos filtros globais."""
    from dash import callback_context
    
    global_filter = GlobalFilterState.from_dict(filter_data)
    ctx = callback_context
    
    # Verificar se foi o botão de limpar
    if ctx.triggered and ctx.triggered[0]['prop_id'] == 'clear-data-button.n_clicks':
        global_filter.selected_data = None
        return global_filter.to_dict(), {'display': 'inline-flex' if global_filter.enabled else 'none', 'alignItems': 'center', 'gap': '4px'}
    
    # Atualizar enabled
    global_filter.enabled = 'enabled' in (toggle_value or [])
    
    # Atualizar evento
    if evento:
        global_filter.selected_evento = evento
    
    # Atualizar data individual (apenas se filtro global não estiver ativo)
    if not global_filter.enabled and data_individual and data_individual != 'todos':
        global_filter.selected_data = data_individual
    elif global_filter.enabled:
        global_filter.selected_data = None
    
    # Atualizar datas e horas do filtro global
    if start_date:
        global_filter.start_date = start_date
    if start_hour is not None:
        global_filter.start_hour = int(start_hour)
    if start_minute is not None:
        global_filter.start_minute = int(start_minute)
    if end_date:
        global_filter.end_date = end_date
    if end_hour is not None:
        global_filter.end_hour = int(end_hour)
    if end_minute is not None:
        global_filter.end_minute = int(end_minute)
    
    # Estilo do config de datas
    config_style = {'display': 'inline-flex' if global_filter.enabled else 'none', 'alignItems': 'center', 'gap': '4px'}
    
    return global_filter.to_dict(), config_style


# ----------------------------------------------------------------------------
# Callback 4.5: Atualizar Painel de Filtros Globais
# ----------------------------------------------------------------------------
@app.callback(
    Output('global-filters-panel', 'children'),
    [Input('dados-raw-store', 'data'),
     Input('global-filter-store', 'data')],
)
def update_global_filters_panel(dados_raw, filter_data):
    """Atualiza o painel de filtros globais com eventos disponíveis."""
    if not dados_raw:
        return render_global_filter_panel([], GlobalFilterState())
    
    global_filter = GlobalFilterState.from_dict(filter_data)
    return render_global_filter_panel(dados_raw, global_filter)


# ----------------------------------------------------------------------------
# Callback 4.6: Atualizar Linha do Seletor de Data
# ----------------------------------------------------------------------------
@app.callback(
    Output('date-selector-row', 'children'),
    [Input('dados-raw-store', 'data'),
     Input('global-filter-store', 'data')],
)
def update_date_selector_row(dados_raw, filter_data):
    """Atualiza a linha do seletor de data e total de notificações."""
    if not dados_raw:
        return html.Div("Carregando...", className='text-center text-gray-500')
    
    global_filter = GlobalFilterState.from_dict(filter_data)
    
    # Aplicar filtro de evento diretamente na lista
    dados_filtrados = dados_raw
    if global_filter.selected_evento and global_filter.selected_evento not in ['todos', 'Todos', None]:
        dados_filtrados = [
            n for n in dados_filtrados
            if (n.get('tipo_evento', {}).get('nome') == global_filter.selected_evento or
                n.get('tipo_evento', {}).get('descricao') == global_filter.selected_evento)
        ]
    
    total_notifications = len(dados_filtrados)
    
    return render_date_selector_row(
        dados_filtrados, 
        global_filter.selected_data,
        global_filter.enabled,
        total_notifications
    )


# ----------------------------------------------------------------------------
# Callback 5: Modal de Exportação
# ----------------------------------------------------------------------------
@app.callback(
    Output('export-modal', 'is_open'),
    [Input('export-button', 'n_clicks'),
     Input('close-export-modal', 'n_clicks')],
    [State('export-modal', 'is_open')]
)
def toggle_export_modal(export_clicks, close_clicks, is_open):
    """Abre/fecha modal de exportação."""
    if export_clicks or close_clicks:
        return not is_open
    return is_open


# ----------------------------------------------------------------------------
# Callback 6: Exportação de Dados
# ----------------------------------------------------------------------------
@app.callback(
    Output('download-dashboard', 'data'),
    [Input('export-csv-btn', 'n_clicks'),
     Input('export-excel-btn', 'n_clicks'),
     Input('export-json-btn', 'n_clicks')],
    [State('dados-filtrados-store', 'data')]
)
def export_data(csv_clicks, excel_clicks, json_clicks, dados):
    """Exporta dados em diferentes formatos."""
    ctx = callback_context
    
    if not ctx.triggered or not dados:
        return no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == 'export-csv-btn' and csv_clicks:
        return export_to_csv(dados, create_export_metadata(dados))
    elif trigger_id == 'export-excel-btn' and excel_clicks:
        return export_to_excel(dados, create_export_metadata(dados))
    elif trigger_id == 'export-json-btn' and json_clicks:
        return export_to_json(dados, create_export_metadata(dados))
    
    return no_update


# ----------------------------------------------------------------------------
# Callback 7: Filtros de Data
# ----------------------------------------------------------------------------
@app.callback(
    Output('date-range-store', 'data'),
    [Input('date-mode-selector', 'value'),
     Input('start-date-picker', 'date'),
     Input('end-date-picker', 'date'),
     Input('start-hour-dropdown', 'value'),
     Input('end-hour-dropdown', 'value'),
     Input('apply-date-button', 'n_clicks'),
     Input('reset-date-button', 'n_clicks')],
    [State('date-range-store', 'data'),
     State('dados-raw-store', 'data')]
)
def update_date_range(mode, start_date, end_date, start_hour, end_hour, 
                      apply_clicks, reset_clicks, date_range_data, dados_raw):
    """Atualiza o estado do filtro de data."""
    ctx = callback_context
    
    if not ctx.triggered:
        return no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    date_range = DateRangeState.from_dict(date_range_data)
    
    # Reset
    if trigger_id == 'reset-date-button' and reset_clicks:
        return obter_periodo_padrao(dados_raw).to_dict()
    
    # Atualiza campos
    if trigger_id == 'date-mode-selector':
        date_range.mode = mode
    elif trigger_id == 'start-date-picker':
        date_range.start_date = start_date
    elif trigger_id == 'end-date-picker':
        date_range.end_date = end_date
    elif trigger_id == 'start-hour-dropdown':
        date_range.start_hour = start_hour
    elif trigger_id == 'end-hour-dropdown':
        date_range.end_hour = end_hour
    
    return date_range.to_dict()


# ----------------------------------------------------------------------------
# Callback 8: Aplicar Filtros (incluindo filtros globais)
# ----------------------------------------------------------------------------
@app.callback(
    Output('dados-filtrados-store', 'data'),
    [Input('dados-raw-store', 'data'),
     Input('global-filter-store', 'data'),
     Input('date-range-store', 'data'),
     Input('filter-state-store', 'data')]
)
def apply_all_filters(dados_raw, global_filter_data, date_range_data, filter_state_data):
    """Aplica todos os filtros aos dados."""
    from datetime import datetime as dt_parser
    
    if not dados_raw:
        return []
    
    dados_filtrados = dados_raw
    
    # 1. Aplicar filtro de evento
    global_filter = GlobalFilterState.from_dict(global_filter_data)
    if global_filter.selected_evento and global_filter.selected_evento != "Todos":
        dados_filtrados = [
            n for n in dados_filtrados
            if (n.get('tipo_evento', {}).get('nome') == global_filter.selected_evento or
                n.get('tipo_evento', {}).get('descricao') == global_filter.selected_evento)
        ]
    
    # 2. Aplicar filtro global de período OU data individual
    if global_filter.enabled:
        # Filtro global ativo - usar start_date e end_date
        start_dt = dt_parser.strptime(f"{global_filter.start_date} {global_filter.start_hour:02d}:{global_filter.start_minute:02d}:00", '%Y-%m-%d %H:%M:%S')
        end_dt = dt_parser.strptime(f"{global_filter.end_date} {global_filter.end_hour:02d}:{global_filter.end_minute:02d}:59", '%Y-%m-%d %H:%M:%S')
        
        resultado = []
        for notificacao in dados_filtrados:
            data_str = notificacao.get('created_at')
            if not data_str:
                continue
            try:
                dt = dt_parser.fromisoformat(data_str.replace('Z', '+00:00'))
                if start_dt <= dt <= end_dt:
                    resultado.append(notificacao)
            except (ValueError, AttributeError):
                continue
        dados_filtrados = resultado
    elif global_filter.selected_data:
        # Filtro de data individual
        resultado = []
        for notificacao in dados_filtrados:
            data_str = notificacao.get('created_at')
            if not data_str:
                continue
            try:
                dt = dt_parser.fromisoformat(data_str.replace('Z', '+00:00'))
                if dt.strftime('%Y-%m-%d') == global_filter.selected_data:
                    resultado.append(notificacao)
            except (ValueError, AttributeError):
                continue
        dados_filtrados = resultado
    
    # 3. Aplicar filtros cruzados
    filter_state = FilterState.from_dict(filter_state_data)
    dados_filtrados = apply_filters(dados_filtrados, filter_state)
    
    return dados_filtrados


# ----------------------------------------------------------------------------
# Callback 9: Atualizar Estatísticas
# ----------------------------------------------------------------------------
@app.callback(
    [Output('stats-row', 'children')],
    [Input('dados-filtrados-store', 'data')]
)
def update_statistics(dados_filtrados):
    """Atualiza os cards de estatísticas."""
    stats = calcular_estatisticas_dashboard(dados_filtrados)
    
    return [[
        dbc.Col([
            criar_card_estatistica(
                'Total de Notificações',
                str(stats['total']),
                'clipboard-list',
                'primary'
            )
        ], width=3),
        
        dbc.Col([
            criar_card_estatistica(
                'Casos Alarmantes',
                str(stats['alarmantes']),
                'exclamation-triangle',
                'danger'
            )
        ], width=3),
        
        dbc.Col([
            criar_card_estatistica(
                'Alta Hospitalar',
                str(stats['alta']),
                'check-circle',
                'success'
            )
        ], width=3),
        
        dbc.Col([
            criar_card_estatistica(
                'Óbitos',
                str(stats['obito']),
                'heart-broken',
                'danger'
            )
        ], width=3)
    ]]


# ----------------------------------------------------------------------------
# Callback 10: Renderizar Conteúdo das Abas
# ----------------------------------------------------------------------------
@app.callback(
    Output('tab-content', 'children'),
    [Input('dashboard-tabs', 'active_tab'),
     Input('dados-filtrados-store', 'data'),
     Input('filter-state-store', 'data')]
)
def render_tab_content(active_tab, dados_filtrados, filter_state_data):
    """Renderiza o conteúdo da aba ativa."""
    # Dados já vêm filtrados, não precisamos do filter_state aqui
    
    if active_tab == 'graficos':
        return render_graficos_tab_content(dados_filtrados, active_filter=None)
    elif active_tab == 'fluxo':
        return render_fluxo_tab_content(dados_filtrados, active_filter=None)
    elif active_tab == 'mapa':
        return render_mapa_tab_content(dados_filtrados, active_filter=None)
    elif active_tab == 'ia':
        return render_ia_tab_content()
    
    return html.Div()




# ============================================================================
# EXECUTAR APP
# ============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("🏥 Dashboard de Vigilância em Saúde - Círio de Nazaré 2025")
    print("=" * 80)
    print("")
    print("Dashboard iniciado com sucesso!")
    print("")
    print("📊 Recursos disponíveis:")
    print("  • 14 gráficos interativos")
    print("  • Filtros cruzados (Power BI style)")
    print("  • Auto-refresh (60s)")
    print("  • 4 abas (Gráficos, Fluxo, Mapa, IA)")
    print("  • Exportação (CSV, Excel, JSON)")
    print("")
    print("🌐 Acesse: http://localhost:8050")
    print("")
    print("=" * 80)
    
    app.run(debug=True, host='0.0.0.0', port=8050)

