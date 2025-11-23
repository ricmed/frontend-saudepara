# -*- coding: utf-8 -*-
"""
📊 Gráfico de Série Temporal
Baseado em SerieTemporalChart.tsx

Gráfico de linha mostrando evolução diária do número de notificações.
"""

import plotly.graph_objects as go
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
import logging
from dash import html, dcc
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_serie_temporal_chart(
    notificacoes: List[Dict[str, Any]],
    height: int = 400
) -> go.Figure:
    """
    Cria gráfico de série temporal por dia.
    
    Args:
        notificacoes: Lista de notificações (não processadas)
        height: Altura do gráfico
        
    Returns:
        Figura Plotly
    """
    if not notificacoes:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhum dado disponível",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        fig.update_layout(height=height)
        return fig
    
    # Contar notificações por data
    contagem_por_data = defaultdict(int)
    
    for notif in notificacoes:
        # Tentar múltiplos caminhos para a data
        data_str = None
        
        if 'original' in notif and 'data_notificacao' in notif['original']:
            data_str = notif['original']['data_notificacao']
        elif 'data_notificacao' in notif:
            data_str = notif['data_notificacao']
        
        if data_str:
            try:
                # Extrair apenas a data (YYYY-MM-DD)
                data_apenas = data_str.split('T')[0] if 'T' in data_str else data_str[:10]
                contagem_por_data[data_apenas] += 1
            except:
                continue
    
    if not contagem_por_data:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhuma data válida encontrada",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        fig.update_layout(height=height)
        return fig
    
    # Ordenar por data
    datas_ordenadas = sorted(contagem_por_data.keys())
    valores = [contagem_por_data[data] for data in datas_ordenadas]
    
    # Criar gráfico de linha
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=datas_ordenadas,
        y=valores,
        mode='lines+markers',
        name='Notificações',
        line=dict(color='#3b82f6', width=2),
        marker=dict(size=6, color='#3b82f6'),
        hovertemplate='<b>%{x}</b><br>Notificações: %{y}<extra></extra>',
    ))
    
    fig.update_layout(
        height=height,
        margin=dict(t=60, b=60, l=60, r=40),
        xaxis_title="Data",
        yaxis_title="Número de Notificações",
        xaxis=dict(
            tickangle=-45,
            tickmode='auto',
            nticks=20,
        ),
        font=dict(size=12),
        showlegend=False,
        hovermode='x unified',
    )
    
    return fig


def render_serie_temporal_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente de série temporal com card.
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Filtro ativo (não usado neste gráfico)
        
    Returns:
        dbc.Card com o gráfico
    """
    fig = create_serie_temporal_chart(dados, height=350)
    
    return dbc.Card(
        dbc.CardBody([
            html.H5("📈 Evolução Temporal das Notificações", className="card-title mb-3"),
            html.Hr(),
            dcc.Graph(
                figure=fig,
                config={'displayModeBar': True, 'displaylogo': False}
            )
        ]),
        className='shadow-sm mb-4',
        style={'borderLeft': '4px solid #3b82f6'}
    )


__all__ = [
    'create_serie_temporal_chart',
    'render_serie_temporal_chart_component',
]
