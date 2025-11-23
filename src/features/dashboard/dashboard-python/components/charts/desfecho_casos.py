# -*- coding: utf-8 -*-
"""
📊 Gráfico de Desfecho dos Casos
Baseado em DesfechoCasosChart.tsx

Gráfico com 3 colunas mostrando os desfechos (Alta, Internação, Óbito, etc).
"""

import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import List, Dict, Any, Optional
from collections import defaultdict
import logging
from dash import dcc, html
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_desfecho_chart(
    data: List[Dict[str, Any]],
    active_filter: Optional[str] = None,
    height: int = 400
) -> go.Figure:
    """
    Cria gráfico de desfecho dos casos.
    
    Args:
        data: Dados processados
        active_filter: Filtro ativo
        height: Altura do gráfico
        
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
    
    labels = [item['name'] for item in data]
    values = [item['value'] for item in data]
    colors = [item['fill'] for item in data]
    
    # Highlighting para filtro ativo
    marker_line_widths = []
    marker_line_colors = []
    
    for item in data:
        if active_filter and item['name'] in active_filter.split(','):
            marker_line_widths.append(3)
            marker_line_colors.append('#000000')
        else:
            marker_line_widths.append(0)
            marker_line_colors.append('#ffffff')
    
    # Criar gráfico de barras verticais
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=labels,
        y=values,
        marker=dict(
            color=colors,
            line=dict(
                color=marker_line_colors,
                width=marker_line_widths
            )
        ),
        text=values,
        textposition='outside',
        hovertemplate='<b>%{x}</b><br>Casos: %{y}<extra></extra>',
    ))
    
    fig.update_layout(
        height=height,
        margin=dict(t=60, b=100, l=60, r=40),
        xaxis_title="Tipo de Desfecho",
        yaxis_title="Número de Casos",
        xaxis=dict(tickangle=-45),
        font=dict(size=12),
        showlegend=False,
    )
    
    return fig


def render_desfecho_chart_component(
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
    from utils.data_processing import process_desfecho_data
    chart_data = process_desfecho_data(dados)
    
    # Criar figura
    fig = create_desfecho_chart(chart_data, active_filter)
    
    # Retornar Card do Bootstrap com gráfico
    return dbc.Card([
        dbc.CardHeader(
            html.H6("Desfecho dos Casos", className="mb-0 text-center"),
            className="bg-light"
        ),
        dbc.CardBody([
            dcc.Graph(
                id='chart-desfecho',
                figure=fig,
                config={'displayModeBar': False},
                style={'height': '320px'}
            )
        ], className="p-2")
    ], className="h-100 shadow-sm")


__all__ = [
    'create_desfecho_chart',
    'render_desfecho_chart_component',
]
