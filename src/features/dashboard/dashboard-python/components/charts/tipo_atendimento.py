# -*- coding: utf-8 -*-
"""
📊 Gráfico de Distribuição por Tipo de Atendimento
Baseado em DistribuicaoTipoAtendimentoChart.tsx

Gráfico de barras mostrando tipos de atendimento.
"""

import plotly.graph_objects as go
from typing import List, Dict, Any, Optional
import logging
from dash import dcc, html
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_tipo_atendimento_chart(
    data: List[Dict[str, Any]],
    active_filter: Optional[str] = None,
    height: int = 400
) -> go.Figure:
    """
    Cria gráfico de barras de tipos de atendimento.
    
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
    
    # Extrair dados
    labels = [item['name'] for item in data]
    values = [item['value'] for item in data]
    colors = [item['fill'] for item in data]
    
    # Criar destaque para filtro ativo
    marker_line_widths = []
    marker_line_colors = []
    
    for item in data:
        if active_filter and item['name'] in active_filter.split(','):
            marker_line_widths.append(3)
            marker_line_colors.append('#000000')
        else:
            marker_line_widths.append(0)
            marker_line_colors.append('#ffffff')
    
    # Criar gráfico de barras
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
        margin=dict(t=40, b=40, l=150, r=40),
        xaxis_title="Número de Casos",
        yaxis_title="",
        yaxis=dict(autorange="reversed"),  # Top to bottom
        font=dict(size=12),
        showlegend=False,
    )
    
    return fig


def render_tipo_atendimento_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente completo do gráfico para Dash."""
    from utils.data_processing import process_tipo_atendimento_data
    chart_data = process_tipo_atendimento_data(dados)
    fig = create_tipo_atendimento_chart(chart_data, active_filter)
    
    return dbc.Card([
        dbc.CardHeader(
            html.H6("Tipo de Atendimento", className="mb-0 text-center"),
            className="bg-light"
        ),
        dbc.CardBody([
            dcc.Graph(
                id='chart-tipo-atendimento',
                figure=fig,
                config={'displayModeBar': False},
                style={'height': '320px'}
            )
        ], className="p-2")
    ], className="h-100 shadow-sm")


__all__ = [
    'create_tipo_atendimento_chart',
    'render_tipo_atendimento_chart_component',
]
