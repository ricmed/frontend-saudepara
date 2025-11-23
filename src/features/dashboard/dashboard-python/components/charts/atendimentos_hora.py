# -*- coding: utf-8 -*-
"""
📊 Gráfico de Atendimentos por Hora
Baseado em AtendimentosPorHoraChart.tsx

Gráfico de barras mostrando distribuição por hora do dia (0-23h).
"""

import plotly.graph_objects as go
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
import logging
from dash import html, dcc
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_atendimentos_hora_chart(
    notificacoes: List[Dict[str, Any]],
    height: int = 400
) -> go.Figure:
    """
    Cria gráfico de atendimentos por hora do dia.
    
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
    
    # Contar por hora (0-23)
    contagem_por_hora = defaultdict(int)
    
    for notif in notificacoes:
        # Tentar múltiplos caminhos para a data
        data_str = None
        
        if 'original' in notif and 'data_notificacao' in notif['original']:
            data_str = notif['original']['data_notificacao']
        elif 'data_notificacao' in notif:
            data_str = notif['data_notificacao']
        
        if data_str:
            try:
                # Extrair hora
                if 'T' in data_str:
                    hora_str = data_str.split('T')[1].split(':')[0]
                    hora = int(hora_str)
                    contagem_por_hora[hora] += 1
            except:
                continue
    
    if not contagem_por_hora:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhuma hora válida encontrada",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        fig.update_layout(height=height)
        return fig
    
    # Preparar dados (0-23h, preencher vazios com 0)
    horas = list(range(24))
    valores = [contagem_por_hora.get(h, 0) for h in horas]
    labels = [f"{h:02d}h" for h in horas]
    
    # Criar gráfico de barras
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=labels,
        y=valores,
        marker=dict(
            color='#3b82f6',
            line=dict(color='#1e40af', width=1)
        ),
        text=valores,
        textposition='outside',
        hovertemplate='<b>%{x}</b><br>Atendimentos: %{y}<extra></extra>',
    ))
    
    fig.update_layout(
        height=height,
        margin=dict(t=60, b=60, l=60, r=40),
        xaxis_title="Hora do Dia",
        yaxis_title="Número de Atendimentos",
        xaxis=dict(
            tickmode='linear',
            tick0=0,
            dtick=1,
        ),
        font=dict(size=11),
        showlegend=False,
    )
    
    return fig


def render_atendimentos_hora_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente de atendimentos por hora com card.
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Filtro ativo (não usado neste gráfico)
        
    Returns:
        dbc.Card com o gráfico
    """
    fig = create_atendimentos_hora_chart(dados, height=350)
    
    return dbc.Card(
        dbc.CardBody([
            html.H5("🕐 Distribuição por Hora do Dia", className="card-title mb-3"),
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
    'create_atendimentos_hora_chart',
    'render_atendimentos_hora_chart_component',
]
