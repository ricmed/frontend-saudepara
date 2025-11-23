"""
Componente: Hipóteses Diagnósticas e Sintomas
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
import pandas as pd

from config.colors import get_color_palette, ALERT_COLORS
from config.constants import HIPOTESES_ALARMANTES


def criar_grafico_hipoteses(df: pd.DataFrame, top_n: int = 10) -> go.Figure:
    """
    Cria gráfico de hipóteses diagnósticas mais frequentes
    
    Args:
        df: DataFrame com os dados
        top_n: Número de hipóteses a mostrar
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'hipotese_diagnostica' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Remover valores nulos e vazios
    df_limpo = df[df['hipotese_diagnostica'].notna() & (df['hipotese_diagnostica'] != '')]
    
    if df_limpo.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados de hipóteses",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df_limpo['hipotese_diagnostica'].value_counts().head(top_n)
    
    # Colorir baseado em se é alarmante
    cores = [ALERT_COLORS['alarmante'] if hip in HIPOTESES_ALARMANTES 
             else ALERT_COLORS['normal'] for hip in contagens.index]
    
    fig = go.Figure(data=[go.Bar(
        y=contagens.index[::-1],  # Inverter para mostrar maior no topo
        x=contagens.values[::-1],
        orientation='h',
        marker=dict(color=cores[::-1]),
        hovertemplate='<b>%{y}</b><br>' +
                      'Quantidade: %{x}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': f'Top {top_n} Hipóteses Diagnósticas',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis_title='Quantidade',
        yaxis_title='Hipótese Diagnóstica',
        height=500,
        plot_bgcolor='white',
        margin=dict(l=250),  # Margem esquerda maior para textos longos
    )
    
    return fig


def criar_grafico_sintomas(df: pd.DataFrame, top_n: int = 10) -> go.Figure:
    """
    Cria gráfico dos sintomas mais frequentes
    
    Args:
        df: DataFrame com os dados
        top_n: Número de sintomas a mostrar
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'sintomas' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Processar sintomas (podem estar em lista ou separados por vírgula)
    sintomas_list = []
    for sintomas in df['sintomas'].dropna():
        if isinstance(sintomas, str):
            sintomas_list.extend([s.strip() for s in sintomas.split(',')])
        elif isinstance(sintomas, list):
            sintomas_list.extend(sintomas)
    
    if not sintomas_list:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados de sintomas",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = pd.Series(sintomas_list).value_counts().head(top_n)
    
    cores = get_color_palette(len(contagens), 'blue')
    
    fig = go.Figure(data=[go.Bar(
        y=contagens.index[::-1],
        x=contagens.values[::-1],
        orientation='h',
        marker=dict(color=cores),
        hovertemplate='<b>%{y}</b><br>' +
                      'Quantidade: %{x}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': f'Top {top_n} Sintomas Mais Frequentes',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis_title='Quantidade',
        yaxis_title='Sintoma',
        height=500,
        plot_bgcolor='white',
        margin=dict(l=200),
    )
    
    return fig


def criar_grafico_tipos_trauma(df: pd.DataFrame) -> go.Figure:
    """
    Cria gráfico dos tipos de trauma
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'tipo_trauma' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Filtrar apenas registros com trauma
    df_trauma = df[df['tipo_trauma'].notna() & (df['tipo_trauma'] != '')]
    
    if df_trauma.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados de trauma",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df_trauma['tipo_trauma'].value_counts()
    
    from config.colors import TRAUMA_PALETTE
    cores = get_color_palette(len(contagens), 'trauma')
    
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
            'text': 'Distribuição por Tipo de Trauma',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis_title='Tipo de Trauma',
        yaxis_title='Quantidade',
        height=400,
        plot_bgcolor='white',
    )
    
    return fig
