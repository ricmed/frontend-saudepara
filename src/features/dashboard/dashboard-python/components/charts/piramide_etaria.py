# -*- coding: utf-8 -*-
"""
📊 Pirâmide Etária por Identidade de Gênero
Baseado EXATAMENTE em PiramideEtariaChart.tsx

Pirâmide completa com TODAS as identidades de gênero:
- Homem Cisgênero (azul forte)
- Homem Transgênero (azul claro)
- Mulher Cisgênero (rosa forte)
- Mulher Transgênero (rosa claro)
- Travesti (vermelho)
- Não Binário (roxo)
- Ignorado (cinza)
- Não se aplica (cinza claro)
"""

import plotly.graph_objects as go
import pandas as pd
from typing import List, Dict, Any, Optional
from collections import defaultdict
import logging
from dash import html, dcc
import dash_bootstrap_components as dbc

logger = logging.getLogger(__name__)

# Faixas etárias EXATAS do TypeScript
FAIXAS_ETARIAS = [
    'Menor de 1 ano', '1 a 4 anos', '5 a 9 anos', '10 a 14 anos', '15 a 19 anos',
    '20 a 24 anos', '25 a 29 anos', '30 a 34 anos', '35 a 39 anos', '40 a 44 anos',
    '45 a 49 anos', '50 a 54 anos', '55 a 59 anos', '60 a 64 anos', '65 a 69 anos',
    '70 a 74 anos', '75 a 79 anos', '80 ou mais anos'
]

# Cores EXATAS do TypeScript
CORES_GENERO = {
    'homemCisgenero': '#3B82F6',      # Azul forte
    'homemTransgenero': '#60A5FA',    # Azul claro
    'mulherCisgenero': '#EC4899',     # Rosa/Pink forte
    'mulherTransgenero': '#F472B6',   # Rosa claro
    'travesti': '#EF4444',            # Vermelho
    'naoBinario': '#8B5CF6',          # Roxo
    'ignorado': '#9CA3AF',            # Cinza
    'naoSeAplica': '#D1D5DB'          # Cinza claro
}


def calcular_faixa_etaria(idade_meses: Optional[int]) -> str:
    """
    Calcula a faixa etária EXATAMENTE como no TypeScript.
    
    Args:
        idade_meses: Idade em meses
        
    Returns:
        String da faixa etária
    """
    if idade_meses is None or idade_meses < 0:
        return None
    
    if idade_meses < 12:
        return 'Menor de 1 ano'
    
    anos = idade_meses // 12
    
    if 1 <= anos <= 4: return '1 a 4 anos'
    if 5 <= anos <= 9: return '5 a 9 anos'
    if 10 <= anos <= 14: return '10 a 14 anos'
    if 15 <= anos <= 19: return '15 a 19 anos'
    if 20 <= anos <= 24: return '20 a 24 anos'
    if 25 <= anos <= 29: return '25 a 29 anos'
    if 30 <= anos <= 34: return '30 a 34 anos'
    if 35 <= anos <= 39: return '35 a 39 anos'
    if 40 <= anos <= 44: return '40 a 44 anos'
    if 45 <= anos <= 49: return '45 a 49 anos'
    if 50 <= anos <= 54: return '50 a 54 anos'
    if 55 <= anos <= 59: return '55 a 59 anos'
    if 60 <= anos <= 64: return '60 a 64 anos'
    if 65 <= anos <= 69: return '65 a 69 anos'
    if 70 <= anos <= 74: return '70 a 74 anos'
    if 75 <= anos <= 79: return '75 a 79 anos'
    
    return '80 ou mais anos'


def classificar_genero(descricao_genero: Optional[str]) -> str:
    """
    Classifica gênero EXATAMENTE como no TypeScript.
    
    Args:
        descricao_genero: Descrição do tipo de gênero
        
    Returns:
        Chave da classificação
    """
    if not descricao_genero:
        return 'ignorado'
    
    genero = descricao_genero.lower().strip()
    
    # Classificações EXATAS do TypeScript
    if 'homem cisgênero' in genero or 'homem cisgenero' in genero:
        return 'homemCisgenero'
    
    if 'mulher cisgênero' in genero or 'mulher cisgenero' in genero:
        return 'mulherCisgenero'
    
    if 'homem transgênero' in genero or 'homem transgenero' in genero:
        return 'homemTransgenero'
    
    if 'mulher transgênero' in genero or 'mulher transgenero' in genero:
        return 'mulherTransgenero'
    
    if 'travesti' in genero:
        return 'travesti'
    
    if 'não binário' in genero or 'nao binario' in genero:
        return 'naoBinario'
    
    if 'não se aplica' in genero or 'nao se aplica' in genero:
        return 'naoSeAplica'
    
    return 'ignorado'

def create_piramide_etaria_chart(
    df: pd.DataFrame,
    active_filter: Optional[str] = None,
    height: int = 600
) -> go.Figure:
    """
    Cria pirâmide etária COMPLETA com TODOS os gêneros (EXATAMENTE como TypeScript).
    
    Args:
        df: DataFrame com os dados de notificações
        active_filter: Filtro de faixa etária ativo
        height: Altura do gráfico
        
    Returns:
        Figura Plotly com pirâmide completa
    """
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="Nenhum dado disponível",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="gray")
        )
        fig.update_layout(height=height)
        return fig
    
    # Contar por faixa etária e gênero (TODAS as categorias)
    grupos = {faixa: {
        'homemCisgenero': 0,
        'homemTransgenero': 0,
        'mulherCisgenero': 0,
        'mulherTransgenero': 0,
        'travesti': 0,
        'naoBinario': 0,
        'ignorado': 0,
        'naoSeAplica': 0
    } for faixa in FAIXAS_ETARIAS}
    
    # Processar cada notificação
    for row in df.to_dict('records'):
        # Paciente está em row['paciente']
        paciente = row.get('paciente')
        if not paciente or not isinstance(paciente, dict):
            continue
        
        # Idade em meses
        idade_meses = paciente.get('idade')
        if idade_meses is None:
            continue
        
        # Calcular faixa etária
        faixa = calcular_faixa_etaria(idade_meses)
        if not faixa:
            continue
        
        # Classificar gênero
        tipo_genero = paciente.get('tipo_genero')
        if tipo_genero and isinstance(tipo_genero, dict):
            genero_descricao = tipo_genero.get('descricao', '')
        else:
            genero_descricao = ''
        
        genero_classificado = classificar_genero(genero_descricao)
        
        # Incrementar contador
        if faixa in grupos:
            grupos[faixa][genero_classificado] += 1
    
    # Preparar dados para o gráfico (PIRÂMIDE PRINCIPAL: Masculino x Feminino)
    faixas_com_dados = []
    masculino_valores = []  # Soma de homem cis + trans
    feminino_valores = []   # Soma de mulher cis + trans + travesti
    
    for faixa in FAIXAS_ETARIAS:
        g = grupos[faixa]
        total_masc = g['homemCisgenero'] + g['homemTransgenero']
        total_fem = g['mulherCisgenero'] + g['mulherTransgenero'] + g['travesti']
        total = total_masc + total_fem + g['naoBinario'] + g['ignorado'] + g['naoSeAplica']
        
        if total > 0:
            faixas_com_dados.append(faixa)
            masculino_valores.append(-total_masc)  # Negativo para esquerda
            feminino_valores.append(total_fem)
    
    # Criar figura com subplots
    fig = go.Figure()
    
    # Barras masculino (esquerda - azul)
    fig.add_trace(go.Bar(
        y=faixas_com_dados,
        x=masculino_valores,
        name='Masculino',
        orientation='h',
        marker=dict(color='#3B82F6'),
        text=[abs(v) for v in masculino_valores],
        textposition='inside',
        hovertemplate='<b>Masculino</b><br>Faixa: %{y}<br>Casos: %{text}<extra></extra>',
    ))
    
    # Barras feminino (direita - rosa)
    fig.add_trace(go.Bar(
        y=faixas_com_dados,
        x=feminino_valores,
        name='Feminino',
        orientation='h',
        marker=dict(color='#EC4899'),
        text=feminino_valores,
        textposition='inside',
        hovertemplate='<b>Feminino</b><br>Faixa: %{y}<br>Casos: %{x}<extra></extra>',
    ))
    
    # Calcular valor máximo para eixo simétrico
    max_val = max([abs(v) for v in masculino_valores] + feminino_valores) if masculino_valores or feminino_valores else 10
    
    fig.update_layout(
        barmode='overlay',
        height=height,
        margin=dict(t=80, b=60, l=120, r=120),
        title=dict(
            text='Pirâmide Etária - Masculino × Feminino',
            font=dict(size=16, color='#1f2937')
        ),
        xaxis=dict(
            title='Número de Casos',
            range=[-max_val * 1.1, max_val * 1.1],
            tickvals=[-max_val, -max_val/2, 0, max_val/2, max_val],
            ticktext=[str(int(max_val)), str(int(max_val/2)), '0', str(int(max_val/2)), str(int(max_val))],
        ),
        yaxis=dict(
            title='Faixa Etária',
            autorange='reversed',  # Invertido
        ),
        font=dict(size=11),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="center",
            x=0.5
        ),
        plot_bgcolor='white',
        paper_bgcolor='white',
    )
    
    return fig


def render_piramide_etaria_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente de pirâmide etária COMPLETO (pirâmide + painéis laterais + resumo).
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Filtro ativo
        
    Returns:
        dbc.Card com layout COMPLETO (3 colunas: pirâmide + painéis + resumo)
    """
    # Processar dados
    grupos = {faixa: {
        'homemCisgenero': 0,
        'homemTransgenero': 0,
        'mulherCisgenero': 0,
        'mulherTransgenero': 0,
        'travesti': 0,
        'naoBinario': 0,
        'ignorado': 0,
        'naoSeAplica': 0
    } for faixa in FAIXAS_ETARIAS}
    
    # Contar
    for notif in dados:
        paciente = notif.get('paciente')
        if not paciente or not isinstance(paciente, dict):
            continue
        
        idade_meses = paciente.get('idade')
        if idade_meses is None:
            continue
        
        faixa = calcular_faixa_etaria(idade_meses)
        if not faixa:
            continue
        
        tipo_genero = paciente.get('tipo_genero')
        genero_descricao = tipo_genero.get('descricao', '') if tipo_genero and isinstance(tipo_genero, dict) else ''
        genero_classificado = classificar_genero(genero_descricao)
        
        if faixa in grupos:
            grupos[faixa][genero_classificado] += 1
    
    # Calcular totais
    totais = {
        'homemCisgenero': sum(g['homemCisgenero'] for g in grupos.values()),
        'homemTransgenero': sum(g['homemTransgenero'] for g in grupos.values()),
        'mulherCisgenero': sum(g['mulherCisgenero'] for g in grupos.values()),
        'mulherTransgenero': sum(g['mulherTransgenero'] for g in grupos.values()),
        'travesti': sum(g['travesti'] for g in grupos.values()),
        'naoBinario': sum(g['naoBinario'] for g in grupos.values()),
        'ignorado': sum(g['ignorado'] for g in grupos.values()),
        'naoSeAplica': sum(g['naoSeAplica'] for g in grupos.values())
    }
    total_geral = sum(totais.values())
    
    # Calcular valor máximo para escala da pirâmide principal
    max_value = 0
    max_nb = 1
    max_qual = 1
    for faixa in FAIXAS_ETARIAS:
        g = grupos[faixa]
        total_masc = g['homemCisgenero'] + g['homemTransgenero']
        total_fem = g['mulherCisgenero'] + g['mulherTransgenero'] + g['travesti']
        max_value = max(max_value, total_masc, total_fem)
        max_nb = max(max_nb, g['naoBinario'])
        max_qual = max(max_qual, g['ignorado'] + g['naoSeAplica'])
    
    if max_value == 0:
        max_value = 1
    
    # =============================
    # PIRÂMIDE PRINCIPAL (col-span-9)
    # =============================
    barras_piramide = []
    for faixa in reversed(FAIXAS_ETARIAS):
        g = grupos[faixa]
        
        homem_cis = g['homemCisgenero']
        homem_trans = g['homemTransgenero']
        total_masc = homem_cis + homem_trans
        
        mulher_cis = g['mulherCisgenero']
        mulher_trans = g['mulherTransgenero']
        travesti = g['travesti']
        total_fem = mulher_cis + mulher_trans + travesti
        
        total_geral_faixa = total_masc + total_fem
        
        if total_geral_faixa == 0:
            continue
        
        largura_masc = (total_masc / max_value) * 100 if total_masc > 0 else 0
        largura_fem = (total_fem / max_value) * 100 if total_fem > 0 else 0
        
        # MASCULINO (esquerda)
        barra_masc_parts = []
        if total_masc > 0:
            if homem_trans > 0:
                barra_masc_parts.append(html.Div(
                    str(homem_trans),
                    style={'width': f'{(homem_trans / total_masc) * 100}%', 'backgroundColor': CORES_GENERO['homemTransgenero'],
                           'color': 'white', 'fontSize': '11px', 'fontWeight': '500', 'display': 'flex',
                           'alignItems': 'center', 'justifyContent': 'center', 'minWidth': '20px', 'height': '32px'},
                    title=f'Homem Transgênero: {homem_trans}'
                ))
            if homem_cis > 0:
                barra_masc_parts.append(html.Div(
                    str(homem_cis),
                    style={'width': f'{(homem_cis / total_masc) * 100}%', 'backgroundColor': CORES_GENERO['homemCisgenero'],
                           'color': 'white', 'fontSize': '13px', 'fontWeight': '600', 'display': 'flex',
                           'alignItems': 'center', 'justifyContent': 'center', 'minWidth': '20px', 'height': '32px'},
                    title=f'Homem Cisgênero: {homem_cis}'
                ))
        
        # FEMININO (direita)
        barra_fem_parts = []
        if total_fem > 0:
            if mulher_cis > 0:
                barra_fem_parts.append(html.Div(
                    str(mulher_cis),
                    style={'width': f'{(mulher_cis / total_fem) * 100}%', 'backgroundColor': CORES_GENERO['mulherCisgenero'],
                           'color': 'white', 'fontSize': '13px', 'fontWeight': '600', 'display': 'flex',
                           'alignItems': 'center', 'justifyContent': 'center', 'minWidth': '20px', 'height': '32px'},
                    title=f'Mulher Cisgênero: {mulher_cis}'
                ))
            if mulher_trans > 0:
                barra_fem_parts.append(html.Div(
                    str(mulher_trans),
                    style={'width': f'{(mulher_trans / total_fem) * 100}%', 'backgroundColor': CORES_GENERO['mulherTransgenero'],
                           'color': 'white', 'fontSize': '11px', 'fontWeight': '500', 'display': 'flex',
                           'alignItems': 'center', 'justifyContent': 'center', 'minWidth': '20px', 'height': '32px'},
                    title=f'Mulher Transgênero: {mulher_trans}'
                ))
            if travesti > 0:
                barra_fem_parts.append(html.Div(
                    str(travesti),
                    style={'width': f'{(travesti / total_fem) * 100}%', 'backgroundColor': CORES_GENERO['travesti'],
                           'color': 'white', 'fontSize': '11px', 'fontWeight': '500', 'display': 'flex',
                           'alignItems': 'center', 'justifyContent': 'center', 'minWidth': '20px', 'height': '32px'},
                    title=f'Travesti: {travesti}'
                ))
        
        barras_piramide.append(html.Div([
            html.Div(html.Div(barra_masc_parts, style={'display': 'flex', 'width': f'{largura_masc}%', 'height': '32px',
                                                        'borderRadius': '4px 0 0 4px', 'overflow': 'hidden',
                                                        'minWidth': '30px' if total_masc > 0 else '0'}),
                     style={'flex': '1', 'display': 'flex', 'justifyContent': 'flex-end', 'paddingRight': '2px'}),
            html.Div(faixa, style={'width': '140px', 'textAlign': 'center', 'fontSize': '11px', 'fontWeight': '700',
                                   'backgroundColor': '#f3f4f6', 'padding': '8px 4px', 'borderRadius': '4px',
                                   'border': '2px solid #e5e7eb', 'color': '#374151'}),
            html.Div(html.Div(barra_fem_parts, style={'display': 'flex', 'width': f'{largura_fem}%', 'height': '32px',
                                                       'borderRadius': '0 4px 4px 0', 'overflow': 'hidden',
                                                       'minWidth': '30px' if total_fem > 0 else '0'}),
                     style={'flex': '1', 'display': 'flex', 'justifyContent': 'flex-start', 'paddingLeft': '2px'}),
        ], style={'display': 'flex', 'alignItems': 'center', 'marginBottom': '4px'}))
    
    # =============================
    # PAINÉIS LATERAIS (col-span-3)
    # =============================
    # Painel Não Binário
    barras_nb = []
    for faixa in reversed(FAIXAS_ETARIAS):
        nb = grupos[faixa]['naoBinario']
        if nb > 0:
            barras_nb.append(html.Div([
                html.Div(faixa.split(' ')[0], style={'width': '64px', 'fontSize': '11px', 'color': '#374151',
                                                       'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap'},
                         title=faixa),
                html.Div(str(nb), style={'width': f'{(nb / max_nb) * 100}%', 'height': '20px', 'borderRadius': '4px',
                                          'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center',
                                          'backgroundColor': CORES_GENERO['naoBinario'], 'color': 'white',
                                          'fontSize': '11px', 'fontWeight': '500', 'minWidth': '20px'},
                         title=f'Não Binário: {nb} ({faixa})')
            ], style={'display': 'flex', 'alignItems': 'center', 'gap': '4px', 'marginBottom': '4px'}))
    
    painel_nb = html.Div([
        html.H6("Não Binário", style={'fontSize': '12px', 'fontWeight': '600', 'color': '#6b21a8', 'marginBottom': '8px'}),
        html.Div(barras_nb if barras_nb else html.Div("Sem registros", style={'fontSize': '11px', 'color': '#9ca3af',
                                                                               'fontStyle': 'italic', 'textAlign': 'center', 'padding': '8px'}),
                 style={'maxHeight': '240px', 'overflowY': 'auto', 'overflowX': 'hidden'}),
        html.Div([
            html.Div(str(totais['naoBinario']), style={'fontSize': '18px', 'fontWeight': '700', 'color': '#7c3aed'}),
            html.Div("Total", style={'fontSize': '11px', 'color': '#8b5cf6'})
        ], style={'marginTop': '8px', 'paddingTop': '8px', 'borderTop': '1px solid #c084fc', 'textAlign': 'center'})
    ], style={'backgroundColor': '#faf5ff', 'padding': '12px', 'borderRadius': '8px', 'border': '1px solid #c084fc'})
    
    # Painel Qualidade do Dado
    barras_qual = []
    for faixa in reversed(FAIXAS_ETARIAS):
        ignorado = grupos[faixa]['ignorado']
        nsa = grupos[faixa]['naoSeAplica']
        total_qual = ignorado + nsa
        if total_qual > 0:
            partes = []
            if ignorado > 0:
                partes.append(html.Div(str(ignorado), style={'width': f'{(ignorado / max_qual) * 100}%', 'height': '20px',
                                                              'borderRadius': '4px', 'display': 'flex', 'alignItems': 'center',
                                                              'justifyContent': 'center', 'backgroundColor': CORES_GENERO['ignorado'],
                                                              'color': 'white', 'fontSize': '11px', 'fontWeight': '500',
                                                              'minWidth': '20px', 'marginRight': '2px'},
                                       title=f'Ignorado: {ignorado} ({faixa})'))
            if nsa > 0:
                partes.append(html.Div(str(nsa), style={'width': f'{(nsa / max_qual) * 100}%', 'height': '20px',
                                                        'borderRadius': '4px', 'display': 'flex', 'alignItems': 'center',
                                                        'justifyContent': 'center', 'backgroundColor': CORES_GENERO['naoSeAplica'],
                                                        'color': '#374151', 'fontSize': '11px', 'fontWeight': '500',
                                                        'minWidth': '20px'},
                                       title=f'Não se Aplica: {nsa} ({faixa})'))
            barras_qual.append(html.Div([
                html.Div(faixa.split(' ')[0], style={'width': '64px', 'fontSize': '11px', 'color': '#374151',
                                                       'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap'},
                         title=faixa),
                html.Div(partes, style={'display': 'flex', 'flex': '1', 'gap': '2px'})
            ], style={'display': 'flex', 'alignItems': 'center', 'gap': '4px', 'marginBottom': '4px'}))
    
    painel_qual = html.Div([
        html.H6("Qualidade do Dado", style={'fontSize': '12px', 'fontWeight': '600', 'color': '#374151', 'marginBottom': '8px'}),
        html.Div(barras_qual if barras_qual else html.Div("Sem registros", style={'fontSize': '11px', 'color': '#9ca3af',
                                                                                   'fontStyle': 'italic', 'textAlign': 'center', 'padding': '8px'}),
                 style={'maxHeight': '240px', 'overflowY': 'auto', 'overflowX': 'hidden'}),
        html.Div([
            html.Div([
                html.Div(str(totais['ignorado']), style={'fontSize': '14px', 'fontWeight': '700', 'color': '#374151'}),
                html.Div("Ignorado", style={'fontSize': '10px', 'color': '#6b7280'})
            ], style={'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['naoSeAplica']), style={'fontSize': '14px', 'fontWeight': '700', 'color': '#374151'}),
                html.Div("NSA", style={'fontSize': '10px', 'color': '#6b7280'})
            ], style={'textAlign': 'center'})
        ], style={'marginTop': '8px', 'paddingTop': '8px', 'borderTop': '1px solid #d1d5db', 'display': 'flex',
                  'justifyContent': 'space-around', 'fontSize': '11px'})
    ], style={'backgroundColor': '#f9fafb', 'padding': '12px', 'borderRadius': '8px', 'border': '1px solid #d1d5db'})
    
    # =============================
    # RESUMO ESTATÍSTICO
    # =============================
    resumo = html.Div([
        html.H6("Resumo por Identidade de Gênero", style={'fontSize': '14px', 'fontWeight': '600', 'color': '#374151',
                                                           'textAlign': 'center', 'marginBottom': '16px'}),
        # Linha 1: Identidades Binárias
        html.Div([
            html.Div([
                html.Div(str(totais['homemCisgenero']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#1d4ed8'}),
                html.Div("Homem Cisgênero", style={'fontSize': '11px', 'color': '#2563eb', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #bfdbfe', 'backgroundColor': '#eff6ff', 'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['homemTransgenero']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#2563eb'}),
                html.Div("Homem Transgênero", style={'fontSize': '11px', 'color': '#3b82f6', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #bfdbfe', 'backgroundColor': '#eff6ff', 'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['mulherCisgenero']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#be185d'}),
                html.Div("Mulher Cisgênero", style={'fontSize': '11px', 'color': '#db2777', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #fbcfe8', 'backgroundColor': '#fdf2f8', 'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['mulherTransgenero']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#db2777'}),
                html.Div("Mulher Transgênero", style={'fontSize': '11px', 'color': '#ec4899', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #fbcfe8', 'backgroundColor': '#fdf2f8', 'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['travesti']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#dc2626'}),
                html.Div("Travesti", style={'fontSize': '11px', 'color': '#dc2626', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #fecaca', 'backgroundColor': '#fef2f2', 'textAlign': 'center'}),
        ], style={'display': 'grid', 'gridTemplateColumns': 'repeat(5, 1fr)', 'gap': '12px', 'marginBottom': '12px'}),
        
        # Linha 2: Não Binário e Qualidade
        html.Div([
            html.Div([
                html.Div(str(totais['naoBinario']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#7c3aed'}),
                html.Div("Não Binário", style={'fontSize': '11px', 'color': '#8b5cf6', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #ddd6fe', 'backgroundColor': '#faf5ff', 'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['ignorado']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#374151'}),
                html.Div("Ignorado", style={'fontSize': '11px', 'color': '#6b7280', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #d1d5db', 'backgroundColor': '#f9fafb', 'textAlign': 'center'}),
            html.Div([
                html.Div(str(totais['naoSeAplica']), style={'fontSize': '24px', 'fontWeight': '700', 'color': '#374151'}),
                html.Div("Não se Aplica", style={'fontSize': '11px', 'color': '#6b7280', 'fontWeight': '500', 'marginTop': '4px'})
            ], style={'padding': '12px', 'borderRadius': '8px', 'border': '2px solid #d1d5db', 'backgroundColor': '#f9fafb', 'textAlign': 'center'}),
        ], style={'display': 'grid', 'gridTemplateColumns': 'repeat(3, 1fr)', 'gap': '12px', 'marginBottom': '16px'}),
        
        # Total Geral
        html.Div([
            html.Div(str(total_geral), style={'fontSize': '32px', 'fontWeight': '700', 'color': 'white'}),
            html.Div("Total Geral de Casos", style={'fontSize': '13px', 'color': '#e0e7ff', 'fontWeight': '500', 'marginTop': '4px'})
        ], style={'background': 'linear-gradient(to right, #6366f1, #8b5cf6)', 'padding': '16px', 'borderRadius': '8px',
                  'textAlign': 'center', 'display': 'inline-block', 'boxShadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
                  'margin': '0 auto'}, className='mx-auto d-block')
    ], style={'marginTop': '24px'})
    
    # =============================
    # CARD COMPLETO
    # =============================
    return dbc.Card(
        dbc.CardBody([
            # Header
            html.Div([
                html.Div([
                    html.I(className="fas fa-users", style={'fontSize': '24px', 'color': '#3b82f6', 'marginRight': '12px'}),
                    html.Div([
                        html.H5("Pirâmide Etária por Identidade de Gênero", 
                               style={'fontSize': '18px', 'fontWeight': '600', 'color': '#111827', 'marginBottom': '4px'}),
                        html.P("Distribuição de casos por faixa etária e identidade de gênero", 
                              style={'fontSize': '13px', 'color': '#6B7280', 'marginBottom': '0'})
                    ], style={'flex': '1'})
                ], style={'display': 'flex', 'alignItems': 'center', 'marginBottom': '16px'}),
            ]),
            html.Hr(style={'margin': '0 0 16px 0', 'borderColor': '#e5e7eb'}),
            
            # Grid principal: Pirâmide (75%) + Painéis Laterais (25%)
            dbc.Row([
                # Pirâmide principal
                dbc.Col([
                    html.H6("Pirâmide Principal - Masculino × Feminino", 
                           style={'textAlign': 'center', 'fontSize': '14px', 'fontWeight': '600', 
                                  'color': '#374151', 'marginBottom': '12px'}),
                    html.Div(barras_piramide if barras_piramide else html.Div("Nenhum dado disponível",
                                                                               style={'textAlign': 'center', 'color': '#9ca3af', 'padding': '40px'}),
                             style={'maxHeight': '500px', 'overflowY': 'auto', 'overflowX': 'hidden'})
                ], width=9),
                
                # Painéis laterais
                dbc.Col([
                    painel_nb,
                    html.Div(style={'height': '24px'}),  # Espaçador
                    painel_qual
                ], width=3)
            ]),
            
            # Legenda
            html.Div([
                html.Div([
                    html.Div([html.Div(style={'width': '20px', 'height': '20px', 'backgroundColor': c, 'borderRadius': '4px', 'marginRight': '8px'}),
                              html.Span(n, style={'fontSize': '13px', 'fontWeight': '500'})] + [html.Div(style={'width': '16px'})] if i < 7 else [],
                             style={'display': 'flex', 'alignItems': 'center'})
                    for i, (c, n) in enumerate([
                        (CORES_GENERO['homemCisgenero'], 'Homem Cisgênero'),
                        (CORES_GENERO['homemTransgenero'], 'Homem Transgênero'),
                        (CORES_GENERO['mulherCisgenero'], 'Mulher Cisgênero'),
                        (CORES_GENERO['mulherTransgenero'], 'Mulher Transgênero'),
                        (CORES_GENERO['travesti'], 'Travesti'),
                        (CORES_GENERO['naoBinario'], 'Não Binário'),
                        (CORES_GENERO['ignorado'], 'Ignorado'),
                        (CORES_GENERO['naoSeAplica'], 'Não se Aplica')
                    ])
                ], style={'display': 'flex', 'flexWrap': 'wrap', 'justifyContent': 'center', 'gap': '16px', 'fontSize': '14px'})
            ], style={'marginTop': '24px', 'paddingTop': '16px', 'borderTop': '1px solid #e5e7eb'}),
            
            # Resumo estatístico
            resumo if total_geral > 0 else None
        ]),
        className='shadow-sm mb-4',
        style={'borderLeft': '4px solid #8B5CF6', 'borderRadius': '8px', 'backgroundColor': 'white'}
    )


__all__ = [
    'create_piramide_etaria_chart',
    'render_piramide_etaria_chart_component',
    'calcular_faixa_etaria',
    'classificar_genero',
    'FAIXAS_ETARIAS',
    'CORES_GENERO',
]
