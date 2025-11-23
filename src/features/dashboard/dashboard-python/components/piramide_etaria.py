"""
Componente: Pirâmide Etária
Sistema de Vigilância em Saúde - Governo do Pará
"""

import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from typing import List, Dict, Any

from config.constants import FAIXAS_ETARIAS, TIPOS_GENERO
from config.colors import GENDER_COLORS
from utils.data_processing import calcular_faixa_etaria, classificar_genero


def criar_piramide_etaria(df: pd.DataFrame) -> go.Figure:
    """
    Cria uma pirâmide etária interativa com todos os gêneros
    
    Args:
        df: DataFrame com os dados de notificações
        
    Returns:
        Figura Plotly com a pirâmide etária
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
    
    # Calcular faixa etária se não existir
    if 'faixa_etaria' not in df_processado.columns:
        if 'idade_meses' in df_processado.columns:
            df_processado['faixa_etaria'] = df_processado['idade_meses'].apply(calcular_faixa_etaria)
        else:
            df_processado['faixa_etaria'] = 'Não informado'
    
    # Classificar gênero se não existir
    if 'genero_classificado' not in df_processado.columns:
        if 'genero' in df_processado.columns:
            df_processado['genero_classificado'] = df_processado['genero'].apply(classificar_genero)
        else:
            df_processado['genero_classificado'] = 'Ignorado'
    
    # Criar contagens por faixa etária e gênero
    pivot_data = df_processado.groupby(['faixa_etaria', 'genero_classificado']).size().reset_index(name='count')
    
    # Garantir que todas as faixas etárias existam
    all_faixas = []
    for faixa in FAIXAS_ETARIAS:
        for genero in TIPOS_GENERO:
            all_faixas.append({'faixa_etaria': faixa, 'genero_classificado': genero, 'count': 0})
    
    df_base = pd.DataFrame(all_faixas)
    pivot_data = pd.merge(df_base, pivot_data, on=['faixa_etaria', 'genero_classificado'], how='left', suffixes=('', '_y'))
    pivot_data['count'] = pivot_data['count_y'].fillna(pivot_data['count'])
    pivot_data = pivot_data[['faixa_etaria', 'genero_classificado', 'count']]
    
    # Criar figura
    fig = go.Figure()
    
    # Adicionar barras para cada gênero
    for genero in TIPOS_GENERO:
        dados_genero = pivot_data[pivot_data['genero_classificado'] == genero]
        dados_genero = dados_genero.sort_values('faixa_etaria', 
                                                 key=lambda x: x.map({f: i for i, f in enumerate(FAIXAS_ETARIAS)}))
        
        # Para pirâmide, valores do lado esquerdo devem ser negativos
        valores = dados_genero['count'].values
        if genero in ['Homem Cisgênero', 'Homem Transgênero']:
            valores = -valores
        
        fig.add_trace(go.Bar(
            name=genero,
            y=dados_genero['faixa_etaria'],
            x=valores,
            orientation='h',
            marker=dict(color=GENDER_COLORS.get(genero, '#999999')),
            hovertemplate='<b>%{y}</b><br>' +
                          f'{genero}: %{{customdata}}<br>' +
                          '<extra></extra>',
            customdata=dados_genero['count'].values,
        ))
    
    # Configurar layout
    fig.update_layout(
        title={
            'text': 'Pirâmide Etária por Gênero',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#1a3cad', 'family': 'Arial, sans-serif'}
        },
        barmode='overlay',
        bargap=0.1,
        xaxis=dict(
            title='Quantidade',
            tickmode='linear',
            showgrid=True,
            gridcolor='#e5e5e5',
        ),
        yaxis=dict(
            title='Faixa Etária',
            categoryorder='array',
            categoryarray=FAIXAS_ETARIAS,
        ),
        height=600,
        hovermode='closest',
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='center',
            x=0.5,
        ),
        plot_bgcolor='white',
        paper_bgcolor='white',
    )
    
    return fig


def preparar_dados_piramide(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Prepara dados resumidos da pirâmide etária
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Dicionário com dados agregados
    """
    if df.empty:
        return {
            'total': 0,
            'por_genero': {},
            'por_faixa': {},
        }
    
    df_processado = df.copy()
    
    # Processar classificações
    if 'faixa_etaria' not in df_processado.columns:
        if 'idade_meses' in df_processado.columns:
            df_processado['faixa_etaria'] = df_processado['idade_meses'].apply(calcular_faixa_etaria)
    
    if 'genero_classificado' not in df_processado.columns:
        if 'genero' in df_processado.columns:
            df_processado['genero_classificado'] = df_processado['genero'].apply(classificar_genero)
    
    return {
        'total': len(df_processado),
        'por_genero': df_processado['genero_classificado'].value_counts().to_dict(),
        'por_faixa': df_processado['faixa_etaria'].value_counts().to_dict(),
    }
