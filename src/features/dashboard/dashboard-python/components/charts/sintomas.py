# -*- coding: utf-8 -*-
"""
📊 Gráfico de Principais Sintomas
Baseado em PrincipaisSintomasChart.tsx

Gráfico de barras horizontais mostrando os principais sintomas.
Suporta relacionamento N:N (notificacao_has_tipo_sintoma).
"""

import plotly.graph_objects as go
from typing import List, Dict, Any, Optional
import logging
from dash import dcc, html
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_sintomas_chart(
    data: List[Dict[str, Any]],
    active_filter: Optional[str] = None,
    height: int = 500,
    max_items: int = 10
) -> go.Figure:
    """
    Cria gráfico de barras dos principais sintomas.
    
    Args:
        data: Dados processados
        active_filter: Filtro ativo
        height: Altura do gráfico
        max_items: Número máximo de itens a mostrar
        
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
        if active_filter and item['name'] in active_filter.split(','):
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
        hovertemplate='<b>%{y}</b><br>Ocorrências: %{x}<extra></extra>',
    )])
    
    fig.update_layout(
        height=height,
        margin=dict(t=40, b=40, l=180, r=40),
        xaxis_title="Número de Ocorrências",
        yaxis_title="",
        yaxis=dict(autorange="reversed"),
        font=dict(size=11),
        showlegend=False,
    )
    
    return fig


def render_sintomas_chart_component(
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
    from utils.data_processing import process_sintomas_data
    chart_data = process_sintomas_data(dados)
    
    # Criar figura
    fig = create_sintomas_chart(chart_data, active_filter)
    
    # Retornar Card do Bootstrap com gráfico
    return dbc.Card([
        dbc.CardHeader(
            html.H6("Principais Sinais e Sintomas", className="mb-0 text-center"),
            className="bg-light"
        ),
        dbc.CardBody([
            dcc.Graph(
                id='chart-sintomas',
                figure=fig,
                config={'displayModeBar': False},
                style={'height': '320px'}
            )
        ], className="p-2")
    ], className="h-100 shadow-sm")


__all__ = [
    'create_sintomas_chart',
    'render_sintomas_chart_component',
]
