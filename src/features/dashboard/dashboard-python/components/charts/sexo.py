# -*- coding: utf-8 -*-
"""
📊 Gráfico de Distribuição por Sexo/Gênero
Baseado em DistribuicaoSexoChart.tsx

Gráfico de pizza mostrando distribuição por identidade de gênero.
"""

import plotly.graph_objects as go
from typing import List, Dict, Any, Optional
import logging
from dash import dcc, html
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_sexo_chart(
    data: List[Dict[str, Any]],
    active_filter: Optional[str] = None,
    height: int = 400
) -> go.Figure:
    """
    Cria gráfico de pizza de distribuição por sexo/gênero.
    
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
    
    line_widths = []
    line_colors = []
    
    for item in data:
        if active_filter and item['name'] in active_filter.split(','):
            line_widths.append(3)
            line_colors.append('#000000')
        else:
            line_widths.append(1)
            line_colors.append('#ffffff')
    
    # Gráfico de pizza (sem hole = pizza completa)
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        marker=dict(
            colors=colors,
            line=dict(
                color=line_colors,
                width=line_widths
            )
        ),
        textinfo='label+percent',
        textposition='auto',
        hovertemplate='<b>%{label}</b><br>Casos: %{value}<br>Percentual: %{percent}<extra></extra>',
    )])
    
    fig.update_layout(
        height=height,
        margin=dict(t=40, b=40, l=20, r=20),
        showlegend=True,
        legend=dict(
            orientation="v",
            yanchor="middle",
            y=0.5,
            xanchor="left",
            x=1.05
        ),
        font=dict(size=12),
    )
    
    return fig


def render_sexo_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente completo do gráfico para Dash."""
    from utils.data_processing import process_sexo_data
    chart_data = process_sexo_data(dados)
    fig = create_sexo_chart(chart_data, active_filter)
    
    return dbc.Card([
        dbc.CardHeader(
            html.H6("Identidade de Gênero", className="mb-0 text-center"),
            className="bg-light"
        ),
        dbc.CardBody([
            dcc.Graph(
                id='chart-genero',
                figure=fig,
                config={'displayModeBar': False},
                style={'height': '320px'}
            )
        ], className="p-2")
    ], className="h-100 shadow-sm")


__all__ = [
    'create_sexo_chart',
    'render_sexo_chart_component',
]
