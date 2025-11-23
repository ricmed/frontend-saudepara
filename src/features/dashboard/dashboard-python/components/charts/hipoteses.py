# -*- coding: utf-8 -*-
"""
📊 Gráfico de Hipóteses Diagnósticas
Baseado em HipotesesDiagnosticasChart.tsx

Gráfico de barras com bordas vermelhas para hipóteses alarmantes.
"""

import plotly.graph_objects as go
from typing import List, Dict, Any, Optional
import logging
from dash import dcc, html
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_hipoteses_chart(
    data: List[Dict[str, Any]],
    active_filter: Optional[str] = None,
    height: int = 500,
    max_items: int = 15
) -> go.Figure:
    """
    Cria gráfico de barras de hipóteses diagnósticas.
    
    Hipóteses alarmantes recebem bordas vermelhas grossas.
    
    Args:
        data: Dados processados (com campo 'isAlarmante')
        active_filter: Filtro ativo
        height: Altura do gráfico
        max_items: Número máximo de itens
        
    Returns:
        Figura Plotly
    """
    if not data:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhum dado disponível",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        fig.update_layout(height=height)
        return fig
    
    # Limitar ao top N
    data_limited = data[:max_items]
    
    labels = [item['name'] for item in data_limited]
    values = [item['value'] for item in data_limited]
    colors = [item['fill'] for item in data_limited]
    
    marker_line_widths = []
    marker_line_colors = []
    
    for item in data_limited:
        # Prioridade: alarmante > filtro ativo
        if item.get('isAlarmante', False):
            marker_line_widths.append(4)
            marker_line_colors.append('#f44336')  # Vermelho alarmante
        elif active_filter and item['name'] in active_filter.split(','):
            marker_line_widths.append(3)
            marker_line_colors.append('#000000')
        else:
            marker_line_widths.append(0)
            marker_line_colors.append('#ffffff')
    
    fig = go.Figure(data=[go.Bar(
        x=values,
        y=labels,
        orientation='h',
        marker=dict(
            color=colors,
            line=dict(
                color=marker_line_colors,
                width=marker_line_widths
            )
        ),
        text=values,
        textposition='auto',
        hovertemplate='<b>%{y}</b><br>Casos: %{x}<extra></extra>',
    )])
    
    fig.update_layout(
        height=height,
        margin=dict(t=40, b=40, l=200, r=40),
        xaxis_title="Número de Casos",
        yaxis_title="",
        yaxis=dict(autorange="reversed"),
        font=dict(size=11),
        showlegend=False,
    )
    
    return fig


def render_hipoteses_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente completo do gráfico para Dash.
    
    Args:
        dados: Lista de notificações (dados brutos)
        active_filter: Filtro ativo para highlighting
        
    Returns:
        Componente dbc.Card com o gráfico
    """
    # Processar dados para o gráfico
    from utils.data_processing import process_hipoteses_data
    chart_data = process_hipoteses_data(dados)
    
    # Criar figura
    fig = create_hipoteses_chart(chart_data, active_filter)
    
    # Retornar Card do Bootstrap com gráfico
    return dbc.Card([
        dbc.CardHeader(
            html.H6("Hipóteses Diagnósticas", className="mb-0 text-center"),
            className="bg-light"
        ),
        dbc.CardBody([
            dcc.Graph(
                id='chart-hipoteses',
                figure=fig,
                config={'displayModeBar': False},
                style={'height': '320px'}
            )
        ], className="p-2")
    ], className="h-100 shadow-sm")


__all__ = [
    'create_hipoteses_chart',
    'render_hipoteses_chart_component',
]
