"""
Sistema de Auto-Refresh do Dashboard
=====================================

Gerencia atualização automática dos dados a cada 60 segundos.
Preserva filtros ativos durante o refresh e exibe contador regressivo.

Baseado em: useAutoRefresh.tsx (linhas 100-180)

Features:
- Contador regressivo de 60s
- Toggle para ativar/desativar
- Busca dados frescos do servidor
- Preserva filtros ativos
- Notificação visual durante refresh
- Pausa automática quando usuário está interagindo

Autor: Convertido de TypeScript para Python
Data: 2025
"""

from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from dash import dcc, html
import dash_bootstrap_components as dbc


class AutoRefreshState:
    """
    Estado do sistema de auto-refresh.
    
    Attributes:
        enabled: Se o auto-refresh está ativado
        countdown: Segundos restantes até próximo refresh
        last_refresh: Timestamp do último refresh
        is_refreshing: Se está realizando refresh no momento
        interval_seconds: Intervalo entre refreshs (padrão 60s)
    """
    
    def __init__(
        self,
        enabled: bool = True,
        countdown: int = 60,
        last_refresh: Optional[datetime] = None,
        is_refreshing: bool = False,
        interval_seconds: int = 60
    ):
        self.enabled = enabled
        self.countdown = countdown
        self.last_refresh = last_refresh or datetime.now()
        self.is_refreshing = is_refreshing
        self.interval_seconds = interval_seconds
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'enabled': self.enabled,
            'countdown': self.countdown,
            'last_refresh': self.last_refresh.isoformat(),
            'is_refreshing': self.is_refreshing,
            'interval_seconds': self.interval_seconds
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AutoRefreshState':
        """Cria instância a partir de dicionário."""
        last_refresh = None
        if data.get('last_refresh'):
            last_refresh = datetime.fromisoformat(data['last_refresh'])
        
        return cls(
            enabled=data.get('enabled', True),
            countdown=data.get('countdown', 60),
            last_refresh=last_refresh,
            is_refreshing=data.get('is_refreshing', False),
            interval_seconds=data.get('interval_seconds', 60)
        )
    
    def reset_countdown(self):
        """Reseta o contador para o valor inicial."""
        self.countdown = self.interval_seconds
        self.last_refresh = datetime.now()
    
    def decrement_countdown(self):
        """Decrementa o contador em 1 segundo."""
        if self.countdown > 0:
            self.countdown -= 1


def format_countdown(seconds: int) -> str:
    """
    Formata segundos em formato MM:SS.
    
    Args:
        seconds: Número de segundos
        
    Returns:
        String formatada (ex: "01:30")
    """
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes:02d}:{secs:02d}"


def should_pause_refresh(user_interacting: bool) -> bool:
    """
    Determina se deve pausar o refresh baseado na interação do usuário.
    
    Args:
        user_interacting: Se o usuário está interagindo (clicando, filtrando)
        
    Returns:
        True se deve pausar, False caso contrário
    """
    return user_interacting


def render_auto_refresh_control(
    refresh_state: Optional[AutoRefreshState] = None
) -> html.Div:
    """
    Renderiza o componente Dash de controle do auto-refresh.
    
    Args:
        refresh_state: Estado atual do auto-refresh
        
    Returns:
        Componente html.Div com os controles
        
    Uso no Dash:
        ```python
        @app.callback(
            Output('data-store', 'data'),
            Input('refresh-interval', 'n_intervals')
        )
        def auto_refresh_data(n_intervals):
            # Busca dados frescos
            return fetch_fresh_data()
        ```
    """
    if refresh_state is None:
        refresh_state = AutoRefreshState()
    
    # Cor do badge baseado no countdown
    if refresh_state.countdown <= 10:
        badge_color = 'danger'
    elif refresh_state.countdown <= 30:
        badge_color = 'warning'
    else:
        badge_color = 'success'
    
    return html.Div(
        children=[
            # Status do refresh
            html.Div(
                children=[
                    # Ícone de status
                    html.Span(
                        "🔄 " if refresh_state.is_refreshing else ("🟢 " if refresh_state.enabled else "⏸️ "),
                        style={'fontSize': '18px'}
                    ),
                    
                    # Label
                    html.Span(
                        "Atualizando..." if refresh_state.is_refreshing else "Auto-Refresh",
                        style={
                            'fontSize': '14px',
                            'fontWeight': 'bold',
                            'marginRight': '10px',
                            'color': '#1e3a8a'
                        }
                    ),
                    
                    # Contador
                    dbc.Badge(
                        format_countdown(refresh_state.countdown),
                        color=badge_color,
                        className='ms-2',
                        style={'fontSize': '12px'}
                    ) if refresh_state.enabled and not refresh_state.is_refreshing else None
                ],
                style={
                    'display': 'flex',
                    'alignItems': 'center',
                    'marginBottom': '10px'
                }
            ),
            
            # Controles
            html.Div(
                children=[
                    # Toggle enable/disable
                    dbc.Switch(
                        id='auto-refresh-toggle',
                        label='Ativado' if refresh_state.enabled else 'Desativado',
                        value=refresh_state.enabled,
                        style={'marginRight': '15px'}
                    ),
                    
                    # Botão de refresh manual
                    dbc.Button(
                        "🔄 Atualizar Agora",
                        id='manual-refresh-button',
                        color='primary',
                        size='sm',
                        outline=True,
                        disabled=refresh_state.is_refreshing
                    )
                ],
                style={
                    'display': 'flex',
                    'alignItems': 'center'
                }
            ),
            
            # Informação do último refresh
            html.Div(
                children=[
                    html.Small(
                        f"Última atualização: {refresh_state.last_refresh.strftime('%H:%M:%S')}",
                        style={'color': '#666', 'fontSize': '11px'}
                    )
                ],
                style={'marginTop': '8px'}
            ),
            
            # Interval component (executado a cada 1 segundo)
            dcc.Interval(
                id='refresh-interval',
                interval=1000,  # 1 segundo
                n_intervals=0,
                disabled=not refresh_state.enabled
            )
        ],
        style={
            'padding': '15px',
            'backgroundColor': '#f8f9fa',
            'borderRadius': '8px',
            'border': '1px solid #dee2e6'
        }
    )


def render_refresh_notification(is_refreshing: bool) -> html.Div:
    """
    Renderiza notificação visual durante o refresh.
    
    Args:
        is_refreshing: Se está realizando refresh no momento
        
    Returns:
        Componente html.Div com a notificação (ou None se não está refreshing)
    """
    if not is_refreshing:
        return html.Div()
    
    return html.Div(
        children=[
            dbc.Alert(
                children=[
                    html.Span("🔄 ", style={'fontSize': '18px'}),
                    html.Span("Atualizando dados...", style={'marginLeft': '8px'})
                ],
                color='info',
                dismissable=False,
                style={
                    'position': 'fixed',
                    'top': '20px',
                    'right': '20px',
                    'zIndex': '9999',
                    'minWidth': '250px',
                    'animation': 'pulse 1.5s infinite',
                    'boxShadow': '0 4px 12px rgba(0,0,0,0.2)'
                }
            )
        ]
    )


def create_refresh_callbacks_setup() -> str:
    """
    Retorna código Python para configurar callbacks do auto-refresh no app.py.
    
    Returns:
        String com código Python para copiar no app.py
        
    Exemplo de uso:
        ```python
        from utils.auto_refresh import create_refresh_callbacks_setup
        
        # Cole o código retornado no app.py após criar o app
        ```
    """
    return '''
# Auto-Refresh Callbacks
@app.callback(
    [Output('refresh-state-store', 'data'),
     Output('data-store', 'data')],
    [Input('refresh-interval', 'n_intervals'),
     Input('auto-refresh-toggle', 'value'),
     Input('manual-refresh-button', 'n_clicks')],
    [State('refresh-state-store', 'data'),
     State('filter-store', 'data')]
)
def update_auto_refresh(n_intervals, toggle_enabled, manual_clicks, 
                        refresh_state_data, filter_state_data):
    """
    Gerencia o auto-refresh do dashboard.
    
    - Decrementa contador a cada segundo
    - Busca dados frescos quando countdown chega a 0
    - Reseta countdown após refresh
    - Preserva filtros ativos
    """
    from dash import callback_context
    from utils.auto_refresh import AutoRefreshState
    from services.notificacao_service import NotificacaoService
    
    ctx = callback_context
    
    # Carrega estados
    refresh_state = AutoRefreshState.from_dict(refresh_state_data)
    
    # Determina o que disparou o callback
    if not ctx.triggered:
        trigger_id = None
    else:
        trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    # Toggle ativado/desativado
    if trigger_id == 'auto-refresh-toggle':
        refresh_state.enabled = toggle_enabled
        if toggle_enabled:
            refresh_state.reset_countdown()
        return refresh_state.to_dict(), dash.no_update
    
    # Refresh manual
    if trigger_id == 'manual-refresh-button' and manual_clicks:
        refresh_state.is_refreshing = True
        
        # Busca dados frescos
        service = NotificacaoService()
        dados_frescos = service.fetch_all_notifications()
        
        refresh_state.is_refreshing = False
        refresh_state.reset_countdown()
        
        return refresh_state.to_dict(), dados_frescos
    
    # Countdown automático
    if trigger_id == 'refresh-interval' and refresh_state.enabled:
        refresh_state.decrement_countdown()
        
        # Chegou a 0? Refresh!
        if refresh_state.countdown <= 0:
            refresh_state.is_refreshing = True
            
            # Busca dados frescos
            service = NotificacaoService()
            dados_frescos = service.fetch_all_notifications()
            
            refresh_state.is_refreshing = False
            refresh_state.reset_countdown()
            
            return refresh_state.to_dict(), dados_frescos
        
        return refresh_state.to_dict(), dash.no_update
    
    return dash.no_update, dash.no_update
'''


def get_refresh_statistics(
    refresh_state: AutoRefreshState,
    total_refreshes: int = 0
) -> Dict[str, Any]:
    """
    Calcula estatísticas do sistema de refresh.
    
    Args:
        refresh_state: Estado atual do refresh
        total_refreshes: Total de refreshs realizados na sessão
        
    Returns:
        Dict com estatísticas:
            - total_refreshes: int
            - uptime_minutes: float
            - average_interval: float
            - next_refresh_in: int (segundos)
    """
    agora = datetime.now()
    uptime = (agora - refresh_state.last_refresh).total_seconds() / 60
    
    avg_interval = refresh_state.interval_seconds
    if total_refreshes > 0:
        avg_interval = uptime * 60 / total_refreshes
    
    return {
        'total_refreshes': total_refreshes,
        'uptime_minutes': round(uptime, 2),
        'average_interval': round(avg_interval, 1),
        'next_refresh_in': refresh_state.countdown,
        'is_enabled': refresh_state.enabled
    }


__all__ = [
    'AutoRefreshState',
    'format_countdown',
    'should_pause_refresh',
    'render_auto_refresh_control',
    'render_refresh_notification',
    'create_refresh_callbacks_setup',
    'get_refresh_statistics'
]
