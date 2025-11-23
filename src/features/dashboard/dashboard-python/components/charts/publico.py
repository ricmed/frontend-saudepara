# -*- coding: utf-8 -*-
"""
📊 Gráfico de Distribuição por Público Atendido - REPLICAÇÃO EXATA TypeScript
Baseado em DistribuicaoPublicoAtendidoChart.tsx

Gráfico DONUT Plotly com animações e cores AZUIS variando (igual TypeScript).
"""

from typing import List, Dict, Any, Optional
import logging
from dash import html, dcc
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

logger = logging.getLogger(__name__)

# Cores EXATAS do TypeScript - PALETA AZUL VARIANDO
CORES_BLUE = [
    "#1a3cad",  # Azul escuro
    "#2a49c4",
    "#3b5bdb",
    "#4c6cf1",
    "#5d7df7",
    "#7f96f9",
    "#a1affb",
    "#c2c9fd",
    "#e4e8fe",  # Azul claro
]


def create_publico_chart(
    data: List[Dict[str, Any]],
    active_filter: Optional[str] = None,
    height: int = 400
):
    """Compatibilidade - não usado mais."""
    pass


def render_publico_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza donut Plotly COM ANIMAÇÃO - EXATO TypeScript."""
    # Contar por público
    contagens: Dict[str, int] = {}
    for notif in dados:
        tipo_publico = notif.get('tipo_publico')
        if tipo_publico and isinstance(tipo_publico, dict):
            descricao = tipo_publico.get('descricao', 'Não especificado')
            contagens[descricao] = contagens.get(descricao, 0) + 1
    
    if not contagens:
        return dbc.Card(
            dbc.CardBody(
                html.Div("Nenhum dado disponível", 
                        style={'textAlign': 'center', 'color': '#9ca3af', 'padding': '40px'})
            ),
            className='shadow-sm'
        )
    
    # Ordenar por valor decrescente
    items = sorted(contagens.items(), key=lambda x: x[1], reverse=True)
    labels = [item[0] for item in items]
    values = [item[1] for item in items]
    
    # Usar paleta AZUL variando (igual TypeScript)
    colors = [CORES_BLUE[i % len(CORES_BLUE)] for i in range(len(labels))]
    total = sum(values)
    
    # Aplicar opacidade se houver filtro
    if active_filter:
        colors = [c if label == active_filter else c + '4D' for label, c in zip(labels, colors)]
    
    # Criar gráfico Plotly DONUT COM ANIMAÇÃO
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=0.5,  # Donut hole
        marker=dict(
            colors=colors,
            line=dict(color='white', width=3)
        ),
        textinfo='label+percent',
        textposition='outside',
        textfont=dict(size=13, color='#374151', family='Arial, sans-serif'),
        hovertemplate='<b>%{label}</b><br>%{value} casos<br>%{percent}<extra></extra>',
        showlegend=False,
        pull=[0.05 if i == 0 else 0 for i in range(len(labels))]  # Destacar maior fatia
    )])
    
    # Adicionar texto no centro
    fig.add_annotation(
        text=f"<b>{total}</b>",
        x=0.5, y=0.52,
        font=dict(size=32, color='#374151', family='Arial Black'),
        showarrow=False,
        xref="paper", yref="paper"
    )
    fig.add_annotation(
        text="Total",
        x=0.5, y=0.45,
        font=dict(size=14, color='#6b7280'),
        showarrow=False,
        xref="paper", yref="paper"
    )
    
    # Layout BONITO COM ANIMAÇÃO
    fig.update_layout(
        height=350,
        margin=dict(l=20, r=20, t=20, b=20),
        paper_bgcolor='white',
        plot_bgcolor='white',
        font=dict(family='Arial, sans-serif'),
        transition={'duration': 500, 'easing': 'cubic-in-out'}
    )
    
    # Card completo
    return dbc.Card(
        dbc.CardBody([
            # Header
            html.Div([
                html.I(className="fas fa-users", style={'fontSize': '20px', 'color': '#3b5bdb', 'marginRight': '10px'}),
                html.H5("Público Atendido", style={'fontSize': '16px', 'fontWeight': '600', 
                                                    'color': '#111827', 'marginBottom': '0'})
            ], style={'display': 'flex', 'alignItems': 'center', 'marginBottom': '16px'}),
            
            html.Hr(style={'margin': '0 0 16px 0', 'borderColor': '#e5e7eb'}),
            
            # Gráfico COM ANIMAÇÃO
            dcc.Graph(
                figure=fig,
                config={'displayModeBar': False},
                style={'height': '350px'},
                animate=True  # ANIMAÇÃO ATIVADA
            )
        ]),
        className='shadow-sm',
        style={'borderLeft': '4px solid #3B5BDB', 'borderRadius': '8px', 'backgroundColor': 'white',
               'height': '100%'}
    )


__all__ = [
    'create_publico_chart',
    'render_publico_chart_component',
]

