"""
Componente de Mapa Interativo de Estabelecimentos
==================================================

Renderiza um mapa interativo (Folium/Leaflet) mostrando estabelecimentos de saúde
com markers coloridos por nível de urgência. Inclui heatmap, popups detalhados 
e integração com filtros geográficos.

Baseado em: EstabelecimentosMapaAvancado.tsx (linhas 3800-4100)

Features:
- Markers coloridos por urgência (alarmante/alerta/médio/normal)
- Heatmap de densidade de atendimentos
- Popups com detalhes do estabelecimento
- Filtros geográficos integrados (país/estado/município/bairro)
- Auto-zoom para bounds dos markers
- Cluster de markers para performance

Autor: Convertido de TypeScript para Python
Data: 2025
"""

from typing import List, Dict, Any, Optional, Tuple
import folium
from folium import plugins
from dash import html
import pandas as pd
from config.colors import COLORS, get_country_color, get_state_color


def _calcular_nivel_urgencia(atendimentos: int) -> str:
    """
    Calcula o nível de urgência baseado no número de atendimentos.
    
    Args:
        atendimentos: Número de atendimentos no estabelecimento
        
    Returns:
        String com nível: 'alarmante', 'alerta', 'medio', 'normal'
    """
    if atendimentos >= 100:
        return 'alarmante'
    elif atendimentos >= 50:
        return 'alerta'
    elif atendimentos >= 20:
        return 'medio'
    else:
        return 'normal'


def _get_cor_urgencia(nivel: str) -> str:
    """
    Retorna a cor do marker baseado no nível de urgência.
    
    Args:
        nivel: Nível de urgência ('alarmante', 'alerta', 'medio', 'normal')
        
    Returns:
        Cor hexadecimal
    """
    cores = {
        'alarmante': '#f44336',  # Vermelho
        'alerta': '#ff9800',     # Laranja
        'medio': '#facc15',      # Amarelo
        'normal': '#3b5bdb'      # Azul
    }
    return cores.get(nivel, '#6B7280')


def _processar_estabelecimentos_geo(
    dados: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Processa dados de notificações para extrair estabelecimentos com coordenadas.
    
    Args:
        dados: Lista de notificações filtradas
        
    Returns:
        Lista de estabelecimentos com coordenadas, contagem e nível de urgência
        
    Exemplo de retorno:
        [
            {
                'id': 'EST123',
                'nome': 'Hospital X',
                'lat': -1.4558,
                'lng': -48.4902,
                'atendimentos': 45,
                'nivel_urgencia': 'medio',
                'municipio': 'Belém',
                'estado': 'PA',
                'endereco': 'Rua X, 123'
            }
        ]
    """
    estabelecimentos_map: Dict[str, Dict] = {}
    
    for notificacao in dados:
        est = notificacao.get('estabelecimento') or {}
        est_id = est.get('id')
        
        # Pula se não tem ID ou coordenadas
        if not est_id:
            continue
            
        lat = est.get('latitude')
        lng = est.get('longitude')
        
        if lat is None or lng is None:
            continue
        
        # Agrupa por estabelecimento
        if est_id not in estabelecimentos_map:
            estabelecimentos_map[est_id] = {
                'id': est_id,
                'nome': est.get('nome', 'Sem Nome'),
                'lat': float(lat),
                'lng': float(lng),
                'atendimentos': 0,
                'municipio': est.get('municipio', {}).get('nome', 'N/A'),
                'estado': est.get('municipio', {}).get('estado', {}).get('sigla', 'N/A'),
                'endereco': est.get('endereco', 'N/A')
            }
        
        estabelecimentos_map[est_id]['atendimentos'] += 1
    
    # Calcula nível de urgência
    estabelecimentos = list(estabelecimentos_map.values())
    for est in estabelecimentos:
        est['nivel_urgencia'] = _calcular_nivel_urgencia(est['atendimentos'])
    
    return estabelecimentos


def _calcular_bounds(
    estabelecimentos: List[Dict[str, Any]]
) -> Optional[Tuple[Tuple[float, float], Tuple[float, float]]]:
    """
    Calcula os bounds (limites) do mapa baseado nos estabelecimentos.
    
    Args:
        estabelecimentos: Lista de estabelecimentos com lat/lng
        
    Returns:
        Tupla ((lat_min, lng_min), (lat_max, lng_max)) ou None se vazio
    """
    if not estabelecimentos:
        return None
    
    lats = [est['lat'] for est in estabelecimentos]
    lngs = [est['lng'] for est in estabelecimentos]
    
    return (
        (min(lats), min(lngs)),
        (max(lats), max(lngs))
    )


def create_mapa_chart(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
) -> folium.Map:
    """
    Cria um mapa interativo Folium com markers de estabelecimentos.
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Categoria de filtro ativa (para highlighting)
        
    Returns:
        Objeto folium.Map com markers e heatmap
        
    Features:
    - Markers coloridos por urgência
    - Cluster de markers para performance
    - Heatmap de densidade
    - Popups com informações detalhadas
    - Auto-zoom para bounds
    """
    # Processa estabelecimentos
    estabelecimentos = _processar_estabelecimentos_geo(dados)
    
    # Centro padrão (Belém, PA - cidade do evento Círio)
    centro_padrao = (-1.4558, -48.4902)
    zoom_padrao = 12
    
    # Calcula bounds
    bounds = _calcular_bounds(estabelecimentos)
    
    # Cria mapa base
    mapa = folium.Map(
        location=centro_padrao,
        zoom_start=zoom_padrao,
        tiles='OpenStreetMap',
        control_scale=True
    )
    
    # Se não há dados, retorna mapa vazio
    if not estabelecimentos:
        folium.Marker(
            location=centro_padrao,
            popup='Nenhum estabelecimento encontrado',
            icon=folium.Icon(color='gray', icon='info-sign')
        ).add_to(mapa)
        return mapa
    
    # Ajusta zoom para bounds
    if bounds:
        mapa.fit_bounds(bounds, padding=(50, 50))
    
    # Cria cluster de markers
    marker_cluster = plugins.MarkerCluster(
        name='Estabelecimentos',
        overlay=True,
        control=True,
        show=True
    ).add_to(mapa)
    
    # Adiciona markers
    for est in estabelecimentos:
        cor = _get_cor_urgencia(est['nivel_urgencia'])
        
        # Define ícone baseado no nível
        icon_map = {
            'alarmante': 'exclamation-sign',
            'alerta': 'warning-sign',
            'medio': 'info-sign',
            'normal': 'ok-sign'
        }
        
        icon_name = icon_map.get(est['nivel_urgencia'], 'info-sign')
        
        # Determina cor do Folium (limitado a: red, blue, green, purple, orange, darkred, lightred, beige, darkblue, darkgreen, cadetblue, darkpurple, white, pink, lightblue, lightgreen, gray, black, lightgray)
        folium_color_map = {
            'alarmante': 'red',
            'alerta': 'orange',
            'medio': 'lightred',
            'normal': 'blue'
        }
        folium_color = folium_color_map.get(est['nivel_urgencia'], 'gray')
        
        # Cria popup HTML
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: {cor};">
                {est['nome']}
            </h4>
            <div style="margin-bottom: 5px;">
                <strong>Atendimentos:</strong> {est['atendimentos']}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Nível:</strong> 
                <span style="color: {cor}; font-weight: bold;">
                    {est['nivel_urgencia'].upper()}
                </span>
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Município:</strong> {est['municipio']}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Estado:</strong> {est['estado']}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Endereço:</strong> {est['endereco']}
            </div>
        </div>
        """
        
        # Adiciona marker ao cluster
        folium.Marker(
            location=(est['lat'], est['lng']),
            popup=folium.Popup(popup_html, max_width=300),
            tooltip=f"{est['nome']} ({est['atendimentos']} casos)",
            icon=folium.Icon(
                color=folium_color,
                icon=icon_name,
                prefix='glyphicon'
            )
        ).add_to(marker_cluster)
    
    # Adiciona heatmap de densidade
    heat_data = [[est['lat'], est['lng'], est['atendimentos']] for est in estabelecimentos]
    
    plugins.HeatMap(
        heat_data,
        name='Mapa de Calor',
        min_opacity=0.2,
        max_opacity=0.8,
        radius=25,
        blur=20,
        overlay=True,
        control=True,
        show=False  # Inicia desligado
    ).add_to(mapa)
    
    # Adiciona controle de camadas
    folium.LayerControl(position='topright').add_to(mapa)
    
    # Adiciona legenda
    legenda_html = f"""
    <div style="position: fixed; 
                bottom: 50px; 
                left: 50px; 
                width: 200px; 
                background-color: white; 
                border: 2px solid gray; 
                border-radius: 5px; 
                padding: 10px;
                z-index: 9999;
                font-size: 14px;
                box-shadow: 0 0 10px rgba(0,0,0,0.3);">
        <h5 style="margin: 0 0 10px 0;">Nível de Urgência</h5>
        <div style="margin-bottom: 5px;">
            <span style="color: #f44336; font-size: 20px;">●</span>
            <span style="margin-left: 5px;">≥100 casos (Alarmante)</span>
        </div>
        <div style="margin-bottom: 5px;">
            <span style="color: #ff9800; font-size: 20px;">●</span>
            <span style="margin-left: 5px;">50-99 casos (Alerta)</span>
        </div>
        <div style="margin-bottom: 5px;">
            <span style="color: #facc15; font-size: 20px;">●</span>
            <span style="margin-left: 5px;">20-49 casos (Médio)</span>
        </div>
        <div style="margin-bottom: 5px;">
            <span style="color: #3b5bdb; font-size: 20px;">●</span>
            <span style="margin-left: 5px;">&lt;20 casos (Normal)</span>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: gray;">
            Total: {len(estabelecimentos)} estabelecimentos
        </div>
    </div>
    """
    
    mapa.get_root().html.add_child(folium.Element(legenda_html))
    
    return mapa


def render_mapa_chart_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
) -> html.Div:
    """
    Renderiza o componente Dash do mapa interativo.
    
    Args:
        dados: Lista de notificações filtradas
        active_filter: Categoria de filtro ativa
        
    Returns:
        Componente html.Div com iframe do mapa Folium
        
    Uso no Dash:
        ```python
        from components.charts.mapa_estabelecimentos import render_mapa_chart_component
        
        layout = html.Div([
            render_mapa_chart_component(dados_filtrados, active_filter)
        ])
        ```
    """
    # Cria mapa
    mapa = create_mapa_chart(dados, active_filter)
    
    # Converte para HTML
    mapa_html = mapa._repr_html_()
    
    # Componente Dash
    return html.Div(
        children=[
            html.H3(
                "Mapa de Estabelecimentos",
                style={
                    'textAlign': 'center',
                    'marginBottom': '10px',
                    'color': '#1e3a8a'
                }
            ),
            html.Iframe(
                srcDoc=mapa_html,
                style={
                    'width': '100%',
                    'height': '600px',
                    'border': '3px solid black' if active_filter in ['pais', 'estado', 'municipio', 'bairro', 'unidade'] else '1px solid #ddd',
                    'borderRadius': '8px'
                }
            ),
            html.Div(
                [
                    html.P(
                        "💡 Dica: Clique nos markers para ver detalhes. Use o controle de camadas para ativar o mapa de calor.",
                        style={
                            'textAlign': 'center',
                            'fontSize': '12px',
                            'color': '#666',
                            'marginTop': '10px'
                        }
                    )
                ]
            )
        ],
        style={
            'padding': '20px',
            'backgroundColor': 'white',
            'borderRadius': '12px',
            'boxShadow': '0 2px 8px rgba(0,0,0,0.1)'
        }
    )


def get_estatisticas_mapa(dados: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula estatísticas do mapa para exibição.
    
    Args:
        dados: Lista de notificações filtradas
        
    Returns:
        Dict com estatísticas:
            - total_estabelecimentos: int
            - total_atendimentos: int
            - estabelecimentos_alarmantes: int
            - estabelecimentos_alerta: int
            - media_atendimentos: float
    """
    estabelecimentos = _processar_estabelecimentos_geo(dados)
    
    if not estabelecimentos:
        return {
            'total_estabelecimentos': 0,
            'total_atendimentos': 0,
            'estabelecimentos_alarmantes': 0,
            'estabelecimentos_alerta': 0,
            'media_atendimentos': 0.0
        }
    
    total_atendimentos = sum(est['atendimentos'] for est in estabelecimentos)
    alarmantes = len([est for est in estabelecimentos if est['nivel_urgencia'] == 'alarmante'])
    alerta = len([est for est in estabelecimentos if est['nivel_urgencia'] == 'alerta'])
    
    return {
        'total_estabelecimentos': len(estabelecimentos),
        'total_atendimentos': total_atendimentos,
        'estabelecimentos_alarmantes': alarmantes,
        'estabelecimentos_alerta': alerta,
        'media_atendimentos': round(total_atendimentos / len(estabelecimentos), 2)
    }


__all__ = [
    'create_mapa_chart',
    'render_mapa_chart_component',
    'render_mapa_estabelecimentos_component',
    'get_estatisticas_mapa'
]


def render_mapa_estabelecimentos_component(
    dados: List[Dict[str, Any]],
    active_filter: Optional[str] = None
):
    """Renderiza o componente (temporariamente vazio).
    
    Returns:
        html.Div vazio
    """
    from dash import html
    return html.Div()
