"""
Componente: Tipos de Atendimento e Público
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
import pandas as pd

from config.colors import ATENDIMENTO_COLORS, get_color_palette


def criar_grafico_tipo_atendimento(df: pd.DataFrame) -> go.Figure:
    """
    Cria gráfico de distribuição por tipo de atendimento
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'tipo_atendimento' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df['tipo_atendimento'].value_counts()
    
    cores = [ATENDIMENTO_COLORS.get(tipo.lower(), '#999999') for tipo in contagens.index]
    
    fig = go.Figure(data=[go.Bar(
        x=contagens.index,
        y=contagens.values,
        marker=dict(color=cores),
        hovertemplate='<b>%{x}</b><br>' +
                      'Quantidade: %{y}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': 'Distribuição por Tipo de Atendimento',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis_title='Tipo de Atendimento',
        yaxis_title='Quantidade',
        height=400,
        plot_bgcolor='white',
    )
    
    return fig


def criar_grafico_publico_atendido(df: pd.DataFrame) -> go.Figure:
    """
    Cria gráfico de distribuição por público atendido
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'publico' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df['publico'].value_counts()
    
    cores = get_color_palette(len(contagens), 'pie')
    
    fig = go.Figure(data=[go.Pie(
        labels=contagens.index,
        values=contagens.values,
        marker=dict(colors=cores),
        hovertemplate='<b>%{label}</b><br>' +
                      'Quantidade: %{value}<br>' +
                      'Percentual: %{percent}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': 'Distribuição por Público Atendido',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        height=400,
    )
    
    return fig
