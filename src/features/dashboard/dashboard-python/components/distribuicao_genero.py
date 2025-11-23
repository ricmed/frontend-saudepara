"""
Componente: Distribuição por Gênero
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
import pandas as pd
from typing import Dict, Any

from config.colors import GENDER_COLORS
from utils.data_processing import classificar_genero


def criar_grafico_genero(df: pd.DataFrame, tipo: str = 'bar') -> go.Figure:
    """
    Cria gráfico de distribuição por gênero (barra ou pizza)
    
    Args:
        df: DataFrame com os dados
        tipo: 'bar' ou 'pie'
        
    Returns:
        Figura Plotly
    """
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Processar dados
    df_processado = df.copy()
    
    if 'genero_classificado' not in df_processado.columns:
        if 'genero' in df_processado.columns:
            df_processado['genero_classificado'] = df_processado['genero'].apply(classificar_genero)
        else:
            df_processado['genero_classificado'] = 'Ignorado'
    
    # Contar por gênero
    contagens = df_processado['genero_classificado'].value_counts()
    
    # Criar figura baseada no tipo
    if tipo == 'pie':
        fig = go.Figure(data=[go.Pie(
            labels=contagens.index,
            values=contagens.values,
            marker=dict(colors=[GENDER_COLORS.get(g, '#999999') for g in contagens.index]),
            hovertemplate='<b>%{label}</b><br>' +
                          'Quantidade: %{value}<br>' +
                          'Percentual: %{percent}<br>' +
                          '<extra></extra>',
        )])
        
        fig.update_layout(
            title={
                'text': 'Distribuição por Gênero',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 18, 'color': '#1a3cad'}
            },
            height=400,
        )
    else:
        fig = go.Figure(data=[go.Bar(
            x=contagens.index,
            y=contagens.values,
            marker=dict(color=[GENDER_COLORS.get(g, '#999999') for g in contagens.index]),
            hovertemplate='<b>%{x}</b><br>' +
                          'Quantidade: %{y}<br>' +
                          '<extra></extra>',
        )])
        
        fig.update_layout(
            title={
                'text': 'Distribuição por Gênero',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 18, 'color': '#1a3cad'}
            },
            xaxis_title='Gênero',
            yaxis_title='Quantidade',
            height=400,
            plot_bgcolor='white',
        )
    
    return fig
