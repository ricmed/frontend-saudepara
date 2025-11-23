"""
Componente: Distribuição por Raça/Cor
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
import pandas as pd

from config.colors import RACE_COLORS


def criar_grafico_raca(df: pd.DataFrame, tipo: str = 'bar') -> go.Figure:
    """
    Cria gráfico de distribuição por raça/cor
    
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
    
    # Contar por raça/cor
    if 'raca' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Campo 'raca' não disponível",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df['raca'].value_counts()
    
    # Criar figura baseada no tipo
    if tipo == 'pie':
        fig = go.Figure(data=[go.Pie(
            labels=contagens.index,
            values=contagens.values,
            marker=dict(colors=[RACE_COLORS.get(r, '#999999') for r in contagens.index]),
            hovertemplate='<b>%{label}</b><br>' +
                          'Quantidade: %{value}<br>' +
                          'Percentual: %{percent}<br>' +
                          '<extra></extra>',
        )])
        
        fig.update_layout(
            title={
                'text': 'Distribuição por Raça/Cor',
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
            marker=dict(color=[RACE_COLORS.get(r, '#999999') for r in contagens.index]),
            hovertemplate='<b>%{x}</b><br>' +
                          'Quantidade: %{y}<br>' +
                          '<extra></extra>',
        )])
        
        fig.update_layout(
            title={
                'text': 'Distribuição por Raça/Cor',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 18, 'color': '#1a3cad'}
            },
            xaxis_title='Raça/Cor',
            yaxis_title='Quantidade',
            height=400,
            plot_bgcolor='white',
        )
    
    return fig
