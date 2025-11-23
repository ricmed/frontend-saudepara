"""
Componente: Mapa Geográfico de Estabelecimentos
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
import pandas as pd
from typing import Dict, Any

from config.constants import MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM
from config.colors import ATENDIMENTO_COLORS


def criar_mapa_estabelecimentos(df: pd.DataFrame) -> go.Figure:
    """
    Cria mapa geográfico com estabelecimentos de saúde
    
    Args:
        df: DataFrame com os dados incluindo latitude e longitude
        
    Returns:
        Figura Plotly com mapa
    """
    if df.empty or 'latitude' not in df.columns or 'longitude' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Dados de localização não disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Remover registros sem coordenadas
    df_com_coords = df.dropna(subset=['latitude', 'longitude'])
    
    if df_com_coords.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhum registro com coordenadas",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Agrupar por estabelecimento
    mapa_data = df_com_coords.groupby(['estabelecimento', 'latitude', 'longitude']).size().reset_index(name='casos')
    
    # Criar texto de hover
    mapa_data['hover_text'] = (
        '<b>' + mapa_data['estabelecimento'] + '</b><br>' +
        'Casos: ' + mapa_data['casos'].astype(str) + '<br>' +
        'Lat: ' + mapa_data['latitude'].round(4).astype(str) + '<br>' +
        'Lon: ' + mapa_data['longitude'].round(4).astype(str)
    )
    
    # Criar mapa
    fig = go.Figure()
    
    fig.add_trace(go.Scattermapbox(
        lat=mapa_data['latitude'],
        lon=mapa_data['longitude'],
        mode='markers',
        marker=dict(
            size=mapa_data['casos'] / mapa_data['casos'].max() * 30 + 10,
            color=mapa_data['casos'],
            colorscale='Blues',
            showscale=True,
            colorbar=dict(title="Casos"),
        ),
        text=mapa_data['hover_text'],
        hovertemplate='%{text}<extra></extra>',
    ))
    
    fig.update_layout(
        title={
            'text': 'Mapa de Estabelecimentos de Saúde',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        mapbox=dict(
            style='open-street-map',
            center=dict(
                lat=mapa_data['latitude'].mean() if not mapa_data.empty else MAP_DEFAULT_CENTER[0],
                lon=mapa_data['longitude'].mean() if not mapa_data.empty else MAP_DEFAULT_CENTER[1]
            ),
            zoom=MAP_DEFAULT_ZOOM,
        ),
        height=600,
        margin=dict(l=0, r=0, t=50, b=0),
    )
    
    return fig


def criar_mapa_calor_casos(df: pd.DataFrame) -> go.Figure:
    """
    Cria mapa de calor com densidade de casos
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Figura Plotly com mapa de calor
    """
    if df.empty or 'latitude' not in df.columns or 'longitude' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Dados de localização não disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    df_com_coords = df.dropna(subset=['latitude', 'longitude'])
    
    if df_com_coords.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhum registro com coordenadas",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    fig = go.Figure()
    
    fig.add_trace(go.Densitymapbox(
        lat=df_com_coords['latitude'],
        lon=df_com_coords['longitude'],
        radius=15,
        colorscale='Reds',
        showscale=True,
        colorbar=dict(title="Densidade"),
    ))
    
    fig.update_layout(
        title={
            'text': 'Mapa de Calor - Densidade de Casos',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        mapbox=dict(
            style='open-street-map',
            center=dict(
                lat=df_com_coords['latitude'].mean(),
                lon=df_com_coords['longitude'].mean()
            ),
            zoom=MAP_DEFAULT_ZOOM,
        ),
        height=600,
        margin=dict(l=0, r=0, t=50, b=0),
    )
    
    return fig


def criar_distribuicao_geografica(df: pd.DataFrame) -> Dict[str, go.Figure]:
    """
    Cria múltiplos gráficos de distribuição geográfica
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Dicionário com múltiplas figuras
    """
    figuras = {}
    
    # Gráfico por município
    if 'municipio' in df.columns:
        contagens = df['municipio'].value_counts().head(10)
        
        fig_municipio = go.Figure(data=[go.Bar(
            y=contagens.index[::-1],
            x=contagens.values[::-1],
            orientation='h',
            marker=dict(color='#3b5bdb'),
        )])
        
        fig_municipio.update_layout(
            title='Top 10 Municípios com Mais Casos',
            xaxis_title='Quantidade',
            yaxis_title='Município',
            height=400,
            plot_bgcolor='white',
        )
        
        figuras['municipio'] = fig_municipio
    
    # Gráfico por bairro
    if 'bairro' in df.columns:
        contagens = df['bairro'].value_counts().head(10)
        
        fig_bairro = go.Figure(data=[go.Bar(
            y=contagens.index[::-1],
            x=contagens.values[::-1],
            orientation='h',
            marker=dict(color='#4c6cf1'),
        )])
        
        fig_bairro.update_layout(
            title='Top 10 Bairros com Mais Casos',
            xaxis_title='Quantidade',
            yaxis_title='Bairro',
            height=400,
            plot_bgcolor='white',
        )
        
        figuras['bairro'] = fig_bairro
    
    return figuras
