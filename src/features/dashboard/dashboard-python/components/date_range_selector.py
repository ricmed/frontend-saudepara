"""
Componente de Seleção de Período de Datas
==========================================

Componente para filtrar notificações por período de data e hora.
Suporta modo "última data" (auto-update) e período customizado.

Baseado em: useDateRange.tsx (linhas 150-280) e DateRangeSelector.tsx

Features:
- Seleção de data inicial e final
- Seleção de hora inicial e final (0-23h)
- Modo "última data" (pega a data mais recente dos dados)
- Sincronização com activeFilters.dataNotificacao
- Estatísticas de distribuição temporal

Autor: Convertido de TypeScript para Python
Data: 2025
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, time, timedelta
from collections import defaultdict
from dash import dcc, html
import dash_bootstrap_components as dbc


class DateRangeState:
    """
    Estado do filtro de período de datas.
    
    Attributes:
        start_date: Data inicial (YYYY-MM-DD)
        end_date: Data final (YYYY-MM-DD)
        start_hour: Hora inicial (0-23)
        end_hour: Hora final (0-23)
        mode: 'custom' ou 'last-date' (última data disponível)
    """
    
    def __init__(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        start_hour: int = 0,
        end_hour: int = 23,
        mode: str = 'custom'
    ):
        self.start_date = start_date
        self.end_date = end_date
        self.start_hour = start_hour
        self.end_hour = end_hour
        self.mode = mode  # 'custom' ou 'last-date'
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'start_date': self.start_date,
            'end_date': self.end_date,
            'start_hour': self.start_hour,
            'end_hour': self.end_hour,
            'mode': self.mode
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DateRangeState':
        """Cria instância a partir de dicionário."""
        return cls(
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            start_hour=data.get('start_hour', 0),
            end_hour=data.get('end_hour', 23),
            mode=data.get('mode', 'custom')
        )


def extrair_datas_notificacao(dados: List[Dict[str, Any]]) -> List[datetime]:
    """
    Extrai todas as datas de notificação dos dados.
    
    Args:
        dados: Lista de notificações
        
    Returns:
        Lista de objetos datetime (ordenada)
    """
    datas = []
    
    for notificacao in dados:
        # API usa 'created_at'
        data_str = notificacao.get('created_at')
        if not data_str:
            continue
        
        try:
            # Parse ISO 8601
            if isinstance(data_str, str):
                dt = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
                datas.append(dt)
        except (ValueError, AttributeError):
            continue
    
    return sorted(datas)


def obter_data_atual(dados: List[Dict[str, Any]]) -> Optional[date]:
    """
    Obtém a data mais recente dos dados (modo "última data").
    
    Args:
        dados: Lista de notificações
        
    Returns:
        Objeto date com a data mais recente ou None
    """
    datas = extrair_datas_notificacao(dados)
    if not datas:
        return None
    
    return datas[-1].date()


def contar_notificacoes_por_data(
    dados: List[Dict[str, Any]]
) -> Dict[str, int]:
    """
    Conta notificações agrupadas por data (YYYY-MM-DD).
    
    Args:
        dados: Lista de notificações
        
    Returns:
        Dict com data (string) como chave e contagem como valor
        
    Exemplo:
        {
            '2025-11-20': 45,
            '2025-11-21': 67,
            '2025-11-22': 89
        }
    """
    contagem: Dict[str, int] = defaultdict(int)
    
    datas = extrair_datas_notificacao(dados)
    for dt in datas:
        data_str = dt.strftime('%Y-%m-%d')
        contagem[data_str] += 1
    
    return dict(contagem)


def aplicar_filtro_data(
    dados: List[Dict[str, Any]],
    date_range: DateRangeState
) -> List[Dict[str, Any]]:
    """
    Filtra notificações por período de data e hora.
    
    Args:
        dados: Lista de notificações
        date_range: Estado do filtro de data
        
    Returns:
        Lista filtrada de notificações
    """
    if not date_range.start_date and not date_range.end_date:
        return dados
    
    resultado = []
    
    for notificacao in dados:
        # API usa 'created_at'
        data_str = notificacao.get('created_at')
        if not data_str:
            continue
        
        try:
            # Parse data
            dt = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
            
            # Verifica data
            if date_range.start_date:
                start = datetime.strptime(date_range.start_date, '%Y-%m-%d').date()
                if dt.date() < start:
                    continue
            
            if date_range.end_date:
                end = datetime.strptime(date_range.end_date, '%Y-%m-%d').date()
                # Inclui o dia final completo
                if dt.date() > end:
                    continue
            
            # Verifica hora (apenas se for o mesmo dia)
            if date_range.start_date and dt.date() == datetime.strptime(date_range.start_date, '%Y-%m-%d').date():
                if dt.hour < date_range.start_hour:
                    continue
            
            if date_range.end_date and dt.date() == datetime.strptime(date_range.end_date, '%Y-%m-%d').date():
                if dt.hour > date_range.end_hour:
                    continue
            
            resultado.append(notificacao)
            
        except (ValueError, AttributeError):
            continue
    
    return resultado


def obter_periodo_padrao(dados: List[Dict[str, Any]]) -> DateRangeState:
    """
    Obtém período padrão baseado nos dados (do primeiro ao último dia).
    
    Args:
        dados: Lista de notificações
        
    Returns:
        DateRangeState com período padrão (todas as datas)
    """
    if not dados:
        # Sem dados, usa hoje
        hoje = date.today()
        return DateRangeState(
            start_date=hoje.strftime('%Y-%m-%d'),
            end_date=hoje.strftime('%Y-%m-%d'),
            start_hour=0,
            end_hour=23,
            mode='custom'
        )
    
    # Extrai todas as datas
    datas = extrair_datas_notificacao(dados)
    
    if not datas:
        # Sem datas válidas, usa hoje
        hoje = date.today()
        return DateRangeState(
            start_date=hoje.strftime('%Y-%m-%d'),
            end_date=hoje.strftime('%Y-%m-%d'),
            start_hour=0,
            end_hour=23,
            mode='custom'
        )
    
    # Do primeiro ao último dia (todas as notificações)
    data_inicio = datas[0].date()  # datas já vem ordenado
    data_fim = datas[-1].date()
    
    return DateRangeState(
        start_date=data_inicio.strftime('%Y-%m-%d'),
        end_date=data_fim.strftime('%Y-%m-%d'),
        start_hour=0,
        end_hour=23,
        mode='custom'
    )


def render_date_range_selector(
    dados: List[Dict[str, Any]],
    date_range: Optional[DateRangeState] = None,
    on_change_callback: Optional[str] = None
) -> html.Div:
    """
    Renderiza o componente Dash de seleção de período.
    
    Args:
        dados: Lista de notificações (para obter min/max)
        date_range: Estado atual do filtro
        on_change_callback: ID do callback para mudanças
        
    Returns:
        Componente html.Div com os controles
        
    Uso no Dash:
        ```python
        @app.callback(
            Output('filtered-data', 'data'),
            Input('date-range-selector', 'data')
        )
        def update_data(date_range_data):
            date_range = DateRangeState.from_dict(date_range_data)
            return aplicar_filtro_data(dados, date_range)
        ```
    """
    if date_range is None:
        date_range = obter_periodo_padrao(dados)
    
    # Extrai datas disponíveis
    datas = extrair_datas_notificacao(dados)
    
    min_date = datas[0].date() if datas else date.today() - timedelta(days=30)
    max_date = datas[-1].date() if datas else date.today()
    
    # Estatísticas
    contagem = contar_notificacoes_por_data(dados)
    total_dias = len(contagem)
    total_notificacoes = sum(contagem.values())
    media_por_dia = total_notificacoes / total_dias if total_dias > 0 else 0
    
    return html.Div(
        children=[
            # Cabeçalho
            html.Div(
                children=[
                    html.H5(
                        "📅 Período de Análise",
                        style={
                            'margin': '0',
                            'color': '#1e3a8a'
                        }
                    ),
                    html.Div(
                        [
                            html.Span(
                                f"{total_dias} dias • ",
                                style={'fontSize': '12px', 'color': '#666'}
                            ),
                            html.Span(
                                f"{total_notificacoes} notificações • ",
                                style={'fontSize': '12px', 'color': '#666'}
                            ),
                            html.Span(
                                f"Média: {media_por_dia:.1f}/dia",
                                style={'fontSize': '12px', 'color': '#666'}
                            )
                        ]
                    )
                ],
                style={
                    'marginBottom': '15px'
                }
            ),
            
            # Modo de seleção
            html.Div(
                children=[
                    dbc.RadioItems(
                        id='date-mode-selector',
                        options=[
                            {'label': ' Período Customizado', 'value': 'custom'},
                            {'label': ' Última Data Disponível', 'value': 'last-date'}
                        ],
                        value=date_range.mode,
                        inline=True,
                        style={'marginBottom': '15px'}
                    )
                ]
            ),
            
            # Seleção de datas (visível apenas em modo custom)
            html.Div(
                children=[
                    dbc.Row(
                        [
                            dbc.Col(
                                [
                                    html.Label("Data Inicial", style={'fontSize': '12px', 'fontWeight': 'bold'}),
                                    dcc.DatePickerSingle(
                                        id='start-date-picker',
                                        date=date_range.start_date,
                                        min_date_allowed=min_date,
                                        max_date_allowed=max_date,
                                        display_format='DD/MM/YYYY',
                                        style={'width': '100%'}
                                    )
                                ],
                                width=6
                            ),
                            dbc.Col(
                                [
                                    html.Label("Data Final", style={'fontSize': '12px', 'fontWeight': 'bold'}),
                                    dcc.DatePickerSingle(
                                        id='end-date-picker',
                                        date=date_range.end_date,
                                        min_date_allowed=min_date,
                                        max_date_allowed=max_date,
                                        display_format='DD/MM/YYYY',
                                        style={'width': '100%'}
                                    )
                                ],
                                width=6
                            )
                        ],
                        style={'marginBottom': '15px'}
                    ),
                    
                    dbc.Row(
                        [
                            dbc.Col(
                                [
                                    html.Label("Hora Inicial", style={'fontSize': '12px', 'fontWeight': 'bold'}),
                                    dcc.Dropdown(
                                        id='start-hour-dropdown',
                                        options=[{'label': f'{h:02d}:00', 'value': h} for h in range(24)],
                                        value=date_range.start_hour,
                                        clearable=False,
                                        style={'fontSize': '14px'}
                                    )
                                ],
                                width=6
                            ),
                            dbc.Col(
                                [
                                    html.Label("Hora Final", style={'fontSize': '12px', 'fontWeight': 'bold'}),
                                    dcc.Dropdown(
                                        id='end-hour-dropdown',
                                        options=[{'label': f'{h:02d}:00', 'value': h} for h in range(24)],
                                        value=date_range.end_hour,
                                        clearable=False,
                                        style={'fontSize': '14px'}
                                    )
                                ],
                                width=6
                            )
                        ]
                    )
                ],
                id='custom-date-controls',
                style={
                    'display': 'block' if date_range.mode == 'custom' else 'none'
                }
            ),
            
            # Botões de ação
            html.Div(
                children=[
                    dbc.Button(
                        "🔄 Resetar",
                        id='reset-date-button',
                        color='secondary',
                        size='sm',
                        outline=True,
                        style={'marginRight': '10px'}
                    ),
                    dbc.Button(
                        "✅ Aplicar Filtro",
                        id='apply-date-button',
                        color='primary',
                        size='sm'
                    )
                ],
                style={
                    'marginTop': '15px',
                    'textAlign': 'right'
                }
            )
        ],
        style={
            'padding': '20px',
            'backgroundColor': 'white',
            'borderRadius': '12px',
            'boxShadow': '0 2px 8px rgba(0,0,0,0.1)',
            'marginBottom': '20px'
        }
    )


def get_date_range_summary(date_range: DateRangeState) -> str:
    """
    Gera um texto resumido do período selecionado.
    
    Args:
        date_range: Estado do filtro de data
        
    Returns:
        String com resumo (ex: "20/11/2025 08:00 - 22/11/2025 18:00")
    """
    if date_range.mode == 'last-date':
        return "🔴 Última data disponível"
    
    if not date_range.start_date and not date_range.end_date:
        return "Todos os períodos"
    
    start = date_range.start_date or "início"
    end = date_range.end_date or "fim"
    
    if date_range.start_date:
        start_dt = datetime.strptime(date_range.start_date, '%Y-%m-%d')
        start = start_dt.strftime('%d/%m/%Y')
    
    if date_range.end_date:
        end_dt = datetime.strptime(date_range.end_date, '%Y-%m-%d')
        end = end_dt.strftime('%d/%m/%Y')
    
    return f"{start} {date_range.start_hour:02d}:00 - {end} {date_range.end_hour:02d}:00"


__all__ = [
    'DateRangeState',
    'extrair_datas_notificacao',
    'obter_data_atual',
    'contar_notificacoes_por_data',
    'aplicar_filtro_data',
    'obter_periodo_padrao',
    'render_date_range_selector',
    'get_date_range_summary'
]
