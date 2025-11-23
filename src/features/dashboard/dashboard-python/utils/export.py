"""
Utilitários de Exportação de Dados e Gráficos
Sistema de Vigilância em Saúde - Governo do Pará
"""

import pandas as pd
import plotly.graph_objects as go
from datetime import datetime
from typing import Optional
import os


def exportar_para_csv(df: pd.DataFrame, nome_arquivo: Optional[str] = None) -> str:
    """
    Exporta DataFrame para CSV
    
    Args:
        df: DataFrame a ser exportado
        nome_arquivo: Nome do arquivo (opcional, gera automaticamente se não fornecido)
        
    Returns:
        Caminho do arquivo gerado
    """
    if nome_arquivo is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f'relatorio_{timestamp}.csv'
    
    # Criar diretório exports se não existir
    os.makedirs('exports', exist_ok=True)
    
    caminho = os.path.join('exports', nome_arquivo)
    df.to_csv(caminho, index=False, encoding='utf-8-sig')
    
    return caminho


def exportar_para_excel(df: pd.DataFrame, nome_arquivo: Optional[str] = None, 
                       multiplas_abas: Optional[dict] = None) -> str:
    """
    Exporta DataFrame para Excel
    
    Args:
        df: DataFrame principal a ser exportado
        nome_arquivo: Nome do arquivo (opcional)
        multiplas_abas: Dicionário com {nome_aba: dataframe} para múltiplas abas
        
    Returns:
        Caminho do arquivo gerado
    """
    if nome_arquivo is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f'relatorio_{timestamp}.xlsx'
    
    os.makedirs('exports', exist_ok=True)
    caminho = os.path.join('exports', nome_arquivo)
    
    with pd.ExcelWriter(caminho, engine='xlsxwriter') as writer:
        if multiplas_abas:
            for nome_aba, dados in multiplas_abas.items():
                dados.to_excel(writer, sheet_name=nome_aba, index=False)
        else:
            df.to_excel(writer, sheet_name='Dados', index=False)
        
        # Formatar planilha
        workbook = writer.book
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#3b5bdb',
            'font_color': 'white',
            'border': 1
        })
    
    return caminho


def exportar_grafico_png(fig: go.Figure, nome_arquivo: Optional[str] = None, 
                        largura: int = 1200, altura: int = 800) -> str:
    """
    Exporta gráfico Plotly como PNG
    
    Args:
        fig: Figura Plotly
        nome_arquivo: Nome do arquivo (opcional)
        largura: Largura da imagem em pixels
        altura: Altura da imagem em pixels
        
    Returns:
        Caminho do arquivo gerado
    """
    if nome_arquivo is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f'grafico_{timestamp}.png'
    
    os.makedirs('exports', exist_ok=True)
    caminho = os.path.join('exports', nome_arquivo)
    
    fig.write_image(caminho, width=largura, height=altura)
    
    return caminho


def exportar_grafico_pdf(fig: go.Figure, nome_arquivo: Optional[str] = None) -> str:
    """
    Exporta gráfico Plotly como PDF
    
    Args:
        fig: Figura Plotly
        nome_arquivo: Nome do arquivo (opcional)
        
    Returns:
        Caminho do arquivo gerado
    """
    if nome_arquivo is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f'grafico_{timestamp}.pdf'
    
    os.makedirs('exports', exist_ok=True)
    caminho = os.path.join('exports', nome_arquivo)
    
    fig.write_image(caminho, format='pdf')
    
    return caminho


def exportar_relatorio_completo(df: pd.DataFrame, figuras: dict, 
                               nome_base: Optional[str] = None) -> dict:
    """
    Exporta relatório completo com dados e gráficos
    
    Args:
        df: DataFrame com os dados
        figuras: Dicionário com {nome: figura_plotly}
        nome_base: Nome base para os arquivos
        
    Returns:
        Dicionário com caminhos dos arquivos gerados
    """
    if nome_base is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_base = f'relatorio_completo_{timestamp}'
    
    arquivos = {}
    
    # Exportar dados
    arquivos['csv'] = exportar_para_csv(df, f'{nome_base}.csv')
    arquivos['excel'] = exportar_para_excel(df, f'{nome_base}.xlsx')
    
    # Exportar gráficos
    for nome, fig in figuras.items():
        arquivo_png = exportar_grafico_png(fig, f'{nome_base}_{nome}.png')
        arquivos[f'grafico_{nome}'] = arquivo_png
    
    return arquivos


def gerar_resumo_estatistico(df: pd.DataFrame) -> pd.DataFrame:
    """
    Gera resumo estatístico dos dados
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        DataFrame com estatísticas resumidas
    """
    resumo = {
        'Métrica': [],
        'Valor': []
    }
    
    resumo['Métrica'].append('Total de Registros')
    resumo['Valor'].append(len(df))
    
    if 'tipo_atendimento' in df.columns:
        for tipo in df['tipo_atendimento'].unique():
            resumo['Métrica'].append(f'Atendimentos - {tipo}')
            resumo['Valor'].append(len(df[df['tipo_atendimento'] == tipo]))
    
    if 'genero' in df.columns:
        for genero in df['genero'].value_counts().head(5).index:
            resumo['Métrica'].append(f'Gênero - {genero}')
            resumo['Valor'].append(len(df[df['genero'] == genero]))
    
    if 'desfecho' in df.columns:
        for desfecho in df['desfecho'].unique():
            resumo['Métrica'].append(f'Desfecho - {desfecho}')
            resumo['Valor'].append(len(df[df['desfecho'] == desfecho]))
    
    return pd.DataFrame(resumo)


def exportar_dashboard_completo(df: pd.DataFrame, todas_figuras: dict) -> str:
    """
    Exporta dashboard completo em formato Excel com múltiplas abas
    
    Args:
        df: DataFrame principal
        todas_figuras: Todas as figuras geradas
        
    Returns:
        Caminho do arquivo Excel gerado
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    nome_arquivo = f'dashboard_completo_{timestamp}.xlsx'
    
    os.makedirs('exports', exist_ok=True)
    caminho = os.path.join('exports', nome_arquivo)
    
    # Preparar dados para múltiplas abas
    abas = {
        'Dados Completos': df,
        'Resumo Estatístico': gerar_resumo_estatistico(df),
    }
    
    # Adicionar contagens por categoria
    if 'tipo_atendimento' in df.columns:
        abas['Por Tipo Atendimento'] = df['tipo_atendimento'].value_counts().reset_index()
        abas['Por Tipo Atendimento'].columns = ['Tipo', 'Quantidade']
    
    if 'estabelecimento' in df.columns:
        abas['Por Estabelecimento'] = df['estabelecimento'].value_counts().reset_index()
        abas['Por Estabelecimento'].columns = ['Estabelecimento', 'Quantidade']
    
    # Exportar
    exportar_para_excel(df, nome_arquivo, abas)
    
    return caminho
