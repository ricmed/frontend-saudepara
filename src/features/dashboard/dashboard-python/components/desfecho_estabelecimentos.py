"""
Componente: Desfecho de Casos e Estabelecimentos
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
import pandas as pd

from config.colors import get_color_palette, BLUE_PALETTE


def criar_grafico_desfecho(df: pd.DataFrame) -> go.Figure:
    """
    Cria gráfico de desfecho dos casos
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'desfecho' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df['desfecho'].value_counts()
    
    cores = get_color_palette(len(contagens), 'pie')
    
    fig = go.Figure(data=[go.Pie(
        labels=contagens.index,
        values=contagens.values,
        marker=dict(colors=cores),
        hole=0.4,  # Gráfico de rosca
        hovertemplate='<b>%{label}</b><br>' +
                      'Quantidade: %{value}<br>' +
                      'Percentual: %{percent}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': 'Desfecho dos Casos',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        height=450,
        annotations=[dict(
            text=f'Total<br>{contagens.sum()}',
            x=0.5, y=0.5,
            font_size=16,
            showarrow=False
        )]
    )
    
    return fig


def criar_grafico_estabelecimentos(df: pd.DataFrame, top_n: int = 10) -> go.Figure:
    """
    Cria gráfico dos estabelecimentos com mais casos
    
    Args:
        df: DataFrame com os dados
        top_n: Número de estabelecimentos a mostrar
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'estabelecimento' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    contagens = df['estabelecimento'].value_counts().head(top_n)
    
    cores = BLUE_PALETTE * (len(contagens) // len(BLUE_PALETTE) + 1)
    cores = cores[:len(contagens)]
    
    fig = go.Figure(data=[go.Bar(
        y=contagens.index[::-1],
        x=contagens.values[::-1],
        orientation='h',
        marker=dict(color=cores[::-1]),
        hovertemplate='<b>%{y}</b><br>' +
                      'Quantidade: %{x}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': f'Top {top_n} Estabelecimentos com Mais Casos',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis_title='Quantidade de Casos',
        yaxis_title='Estabelecimento',
        height=500,
        plot_bgcolor='white',
        margin=dict(l=250),
    )
    
    return fig


def criar_grafico_serie_temporal(df: pd.DataFrame, freq: str = 'D') -> go.Figure:
    """
    Cria gráfico de série temporal de casos
    
    Args:
        df: DataFrame com os dados
        freq: Frequência de agregação ('D' = diário, 'W' = semanal, 'M' = mensal)
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'data_notificacao' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Garantir que data_notificacao é datetime
    df_temp = df.copy()
    df_temp['data_notificacao'] = pd.to_datetime(df_temp['data_notificacao'])
    
    # Agrupar por data
    serie = df_temp.groupby(pd.Grouper(key='data_notificacao', freq=freq)).size().reset_index(name='casos')
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=serie['data_notificacao'],
        y=serie['casos'],
        mode='lines+markers',
        name='Casos',
        line=dict(color='#3b5bdb', width=2),
        marker=dict(size=6),
        fill='tozeroy',
        fillcolor='rgba(59, 91, 219, 0.1)',
        hovertemplate='<b>%{x}</b><br>' +
                      'Casos: %{y}<br>' +
                      '<extra></extra>',
    ))
    
    freq_labels = {'D': 'Diário', 'W': 'Semanal', 'M': 'Mensal'}
    
    fig.update_layout(
        title={
            'text': f'Série Temporal de Casos ({freq_labels.get(freq, "Diário")})',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis_title='Data',
        yaxis_title='Número de Casos',
        height=400,
        plot_bgcolor='white',
        hovermode='x unified',
    )
    
    return fig


def criar_grafico_atendimentos_hora(df: pd.DataFrame) -> go.Figure:
    """
    Cria gráfico de atendimentos por hora do dia
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Figura Plotly
    """
    if df.empty or 'data_notificacao' not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="Sem dados disponíveis",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        return fig
    
    # Extrair hora
    df_temp = df.copy()
    df_temp['data_notificacao'] = pd.to_datetime(df_temp['data_notificacao'])
    df_temp['hora'] = df_temp['data_notificacao'].dt.hour
    
    # Contar por hora
    contagens = df_temp['hora'].value_counts().sort_index()
    
    # Garantir todas as horas (0-23)
    todas_horas = pd.Series(0, index=range(24))
    contagens = todas_horas.add(contagens, fill_value=0)
    
    fig = go.Figure(data=[go.Bar(
        x=contagens.index,
        y=contagens.values,
        marker=dict(color='#4c6cf1'),
        hovertemplate='<b>Hora: %{x}:00</b><br>' +
                      'Atendimentos: %{y}<br>' +
                      '<extra></extra>',
    )])
    
    fig.update_layout(
        title={
            'text': 'Atendimentos por Hora do Dia',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad'}
        },
        xaxis=dict(
            title='Hora',
            tickmode='linear',
            tick0=0,
            dtick=2,
        ),
        yaxis_title='Quantidade de Atendimentos',
        height=400,
        plot_bgcolor='white',
    )
    
    return fig
