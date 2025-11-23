# -*- coding: utf-8 -*-
"""
📊 Painel Geográfico - 4 Gráficos
Baseado em GeographicLocationPanel.tsx

Painel com 4 gráficos de barras para localização geográfica:
- País de residência (cores específicas)
- Estado de residência (cores brasileiras)
- Município de residência
- Bairro de residência
"""

import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import List, Dict, Any, Optional, Tuple
import logging
from dash import html, dcc
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

def create_geographic_panel(
    pais_data: List[Dict[str, Any]],
    estado_data: List[Dict[str, Any]],
    municipio_data: List[Dict[str, Any]],
    bairro_data: List[Dict[str, Any]],
    active_filters: Dict[str, Optional[str]],
    height: int = 800
) -> go.Figure:
    """
    Cria painel geográfico com 4 subgráficos.
    
    Args:
        pais_data: Dados de países
        estado_data: Dados de estados
        municipio_data: Dados de municípios
        bairro_data: Dados de bairros
        active_filters: Dicionário de filtros ativos
        height: Altura total do painel
        
    Returns:
        Figura Plotly com 4 subplots
    """
    # Criar subplots: 2 linhas x 2 colunas
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=("País de Residência", "Estado de Residência", 
                       "Município de Residência", "Bairro de Residência"),
        vertical_spacing=0.15,
        horizontal_spacing=0.12,
    )
    
    # Função auxiliar para adicionar barras com highlighting
    def add_bars_to_subplot(data, row, col, filter_key):
        if not data:
            return
        
        # Limitar a top 10
        data_limited = data[:10]
        
        labels = [item['name'] for item in data_limited]
        values = [item['value'] for item in data_limited]
        colors = [item['fill'] for item in data_limited]
        
        # Highlighting
        marker_line_widths = []
        marker_line_colors = []
        active_filter = active_filters.get(filter_key)
        
        for item in data_limited:
            if active_filter and item['name'] in str(active_filter).split(','):
                marker_line_widths.append(3)
                marker_line_colors.append('#000000')
            else:
                marker_line_widths.append(0)
                marker_line_colors.append('#ffffff')
        
        fig.add_trace(
            go.Bar(
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
                showlegend=False,
            ),
            row=row, col=col
        )
        
        # Inverter ordem (maior no topo)
        fig.update_yaxes(autorange="reversed", row=row, col=col)
    
    # Adicionar cada gráfico
    add_bars_to_subplot(pais_data, 1, 1, 'pais')
    add_bars_to_subplot(estado_data, 1, 2, 'estado')
    add_bars_to_subplot(municipio_data, 2, 1, 'municipio')
    add_bars_to_subplot(bairro_data, 2, 2, 'bairro')
    
    # Layout geral
    fig.update_layout(
        height=height,
        showlegend=False,
        font=dict(size=10),
        margin=dict(t=60, b=40, l=20, r=20),
    )
    
    # Ajustar eixos
    fig.update_xaxes(title_text="Casos", row=2, col=1)
    fig.update_xaxes(title_text="Casos", row=2, col=2)
    
    return fig


def render_geographic_panel_component(
    dados: List[Dict[str, Any]],
    active_filters: Optional[Dict[str, str]] = None
):
    """Renderiza o painel geográfico completo com 4 gráficos.
    
    Args:
        dados: Lista de notificações filtradas
        active_filters: Dicionário de filtros ativos por tipo
        
    Returns:
        dbc.Card com painel geográfico
    """
    from utils.data_processing import (
        process_pais_data,
        process_estado_data, 
        process_municipio_data,
        process_bairro_data
    )
    
    if active_filters is None:
        active_filters = {}
    
    # Processar dados geográficos
    pais_data = process_pais_data(dados)
    estado_data = process_estado_data(dados)
    municipio_data = process_municipio_data(dados)
    bairro_data = process_bairro_data(dados)
    
    # Criar figura
    fig = create_geographic_panel(
        pais_data, estado_data, municipio_data, bairro_data,
        active_filters, height=700
    )
    
    return dbc.Card(
        dbc.CardBody([
            html.H5("🌍 Distribuição Geográfica", className="card-title mb-3"),
            html.Hr(),
            dcc.Graph(
                figure=fig,
                config={'displayModeBar': True, 'displaylogo': False}
            )
        ]),
        className='shadow-sm mb-4',
        style={'borderLeft': '4px solid #047481'}
    )


__all__ = [
    'create_geographic_panel',
    'render_geographic_panel_component',
]
