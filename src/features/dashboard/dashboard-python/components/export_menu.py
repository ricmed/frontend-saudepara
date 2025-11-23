"""
Sistema de Exportação do Dashboard
===================================

Permite exportar dados e gráficos em múltiplos formatos:
- PNG (imagens de gráficos)
- PDF (relatório completo)
- Word (documento editável)
- CSV (dados tabulares)
- Excel (planilha com múltiplas abas)

Baseado em: GraphExportMenu.tsx e DashboardExportMenu.tsx (linhas 3500-3700)

Features:
- Export de gráficos individuais
- Export do dashboard completo
- Seleção de formato
- Inclusão de filtros aplicados
- Metadata (data, hora, usuário)

Autor: Convertido de TypeScript para Python
Data: 2025
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import base64
from io import BytesIO
import pandas as pd
from dash import dcc, html
import dash_bootstrap_components as dbc


def export_to_csv(
    dados: List[Dict[str, Any]],
    filename: Optional[str] = None
) -> str:
    """
    Exporta dados para CSV.
    
    Args:
        dados: Lista de notificações
        filename: Nome do arquivo (opcional)
        
    Returns:
        String CSV
    """
    if not dados:
        return "Sem dados para exportar"
    
    # Converte para DataFrame
    df = pd.json_normalize(dados)
    
    # Remove colunas muito aninhadas
    colunas_remover = [col for col in df.columns if '.' in col and col.count('.') > 2]
    df = df.drop(columns=colunas_remover, errors='ignore')
    
    # Exporta para CSV
    csv_string = df.to_csv(index=False, encoding='utf-8-sig')
    
    return csv_string


def export_to_excel(
    dados: List[Dict[str, Any]],
    dados_processados: Optional[Dict[str, List[Dict]]] = None,
    filename: Optional[str] = None
) -> bytes:
    """
    Exporta dados para Excel com múltiplas abas.
    
    Args:
        dados: Lista de notificações (aba "Dados Brutos")
        dados_processados: Dict com dados processados por categoria
        filename: Nome do arquivo (opcional)
        
    Returns:
        Bytes do arquivo Excel
        
    Abas criadas:
        - Dados Brutos: Todas as notificações
        - Público: Contagem por público
        - Tipo Atendimento: Contagem por tipo
        - Sintomas: Top sintomas
        - Trauma: Tipos de trauma
        - etc.
    """
    if not filename:
        filename = f"dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    output = BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Aba 1: Dados Brutos
        if dados:
            df_dados = pd.json_normalize(dados)
            colunas_remover = [col for col in df_dados.columns if '.' in col and col.count('.') > 2]
            df_dados = df_dados.drop(columns=colunas_remover, errors='ignore')
            df_dados.to_excel(writer, sheet_name='Dados Brutos', index=False)
        
        # Abas 2+: Dados Processados
        if dados_processados:
            for categoria, items in dados_processados.items():
                if items:
                    df = pd.DataFrame(items)
                    # Limita nome da aba a 31 caracteres (limite Excel)
                    sheet_name = categoria[:31]
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    output.seek(0)
    return output.read()


def export_to_json(
    dados: List[Dict[str, Any]],
    metadata: Optional[Dict[str, Any]] = None,
    filename: Optional[str] = None
) -> str:
    """
    Exporta dados para JSON com metadata.
    
    Args:
        dados: Lista de notificações
        metadata: Informações adicionais (filtros, data export, etc)
        filename: Nome do arquivo (opcional)
        
    Returns:
        String JSON formatada
    """
    export_data = {
        'metadata': metadata or {
            'exported_at': datetime.now().isoformat(),
            'total_records': len(dados)
        },
        'data': dados
    }
    
    return json.dumps(export_data, indent=2, ensure_ascii=False)


def create_export_button(
    button_id: str,
    label: str,
    icon: str,
    color: str = 'primary',
    disabled: bool = False
) -> dbc.Button:
    """
    Cria um botão de exportação estilizado.
    
    Args:
        button_id: ID do botão para callbacks
        label: Texto do botão
        icon: Emoji ou ícone
        color: Cor do botão
        disabled: Se o botão está desabilitado
        
    Returns:
        Componente dbc.Button
    """
    return dbc.Button(
        [
            html.Span(icon, style={'marginRight': '8px'}),
            html.Span(label)
        ],
        id=button_id,
        color=color,
        size='sm',
        outline=True,
        disabled=disabled,
        style={'marginRight': '8px', 'marginBottom': '8px'}
    )


def render_graph_export_menu(
    graph_id: str,
    graph_title: str
) -> html.Div:
    """
    Renderiza menu de exportação para um gráfico individual.
    
    Args:
        graph_id: ID do gráfico
        graph_title: Título do gráfico
        
    Returns:
        Componente html.Div com menu dropdown
        
    Uso no Dash:
        ```python
        @app.callback(
            Output('download-graph', 'data'),
            Input(f'export-{graph_id}-png', 'n_clicks')
        )
        def export_graph(n_clicks):
            if n_clicks:
                # Exporta gráfico
                return dcc.send_bytes(png_bytes, f"{graph_title}.png")
        ```
    """
    return html.Div(
        children=[
            dbc.DropdownMenu(
                children=[
                    dbc.DropdownMenuItem(
                        "📊 PNG",
                        id=f'export-{graph_id}-png'
                    ),
                    dbc.DropdownMenuItem(
                        "📄 SVG",
                        id=f'export-{graph_id}-svg'
                    ),
                    dbc.DropdownMenuItem(divider=True),
                    dbc.DropdownMenuItem(
                        "📋 CSV",
                        id=f'export-{graph_id}-csv'
                    )
                ],
                label="⬇️ Exportar",
                size='sm',
                color='secondary',
                style={'float': 'right'}
            )
        ],
        style={'position': 'absolute', 'top': '10px', 'right': '10px', 'zIndex': '1000'}
    )


def render_dashboard_export_menu(
    dados: List[Dict[str, Any]],
    has_filters: bool = False
) -> html.Div:
    """
    Renderiza menu completo de exportação do dashboard.
    
    Args:
        dados: Lista de notificações
        has_filters: Se há filtros ativos
        
    Returns:
        Componente html.Div com todos os botões de export
        
    Uso no Dash:
        ```python
        @app.callback(
            Output('download-dashboard', 'data'),
            Input('export-dashboard-excel', 'n_clicks')
        )
        def export_dashboard(n_clicks):
            if n_clicks:
                excel_bytes = export_to_excel(dados, dados_processados)
                return dcc.send_bytes(excel_bytes, "dashboard.xlsx")
        ```
    """
    total_registros = len(dados)
    
    return html.Div(
        children=[
            # Cabeçalho
            html.Div(
                children=[
                    html.H5(
                        "⬇️ Exportar Dashboard",
                        style={'margin': '0', 'color': '#1e3a8a'}
                    ),
                    html.P(
                        f"{total_registros} registros • {'Com filtros' if has_filters else 'Sem filtros'}",
                        style={'fontSize': '12px', 'color': '#666', 'marginBottom': '0'}
                    )
                ],
                style={'marginBottom': '15px'}
            ),
            
            # Botões de exportação
            html.Div(
                children=[
                    # Formatos de dados
                    html.Div(
                        children=[
                            html.Label(
                                "Dados Tabulares:",
                                style={'fontSize': '12px', 'fontWeight': 'bold', 'display': 'block', 'marginBottom': '8px'}
                            ),
                            create_export_button('export-dashboard-csv', 'CSV', '📋', 'success'),
                            create_export_button('export-dashboard-excel', 'Excel', '📊', 'success'),
                            create_export_button('export-dashboard-json', 'JSON', '📄', 'success')
                        ],
                        style={'marginBottom': '15px'}
                    ),
                    
                    # Formatos de relatório
                    html.Div(
                        children=[
                            html.Label(
                                "Relatórios:",
                                style={'fontSize': '12px', 'fontWeight': 'bold', 'display': 'block', 'marginBottom': '8px'}
                            ),
                            create_export_button('export-dashboard-pdf', 'PDF', '📕', 'danger'),
                            create_export_button('export-dashboard-word', 'Word', '📘', 'primary'),
                            create_export_button('export-dashboard-html', 'HTML', '🌐', 'info')
                        ],
                        style={'marginBottom': '15px'}
                    ),
                    
                    # Formatos de gráficos
                    html.Div(
                        children=[
                            html.Label(
                                "Gráficos:",
                                style={'fontSize': '12px', 'fontWeight': 'bold', 'display': 'block', 'marginBottom': '8px'}
                            ),
                            create_export_button('export-all-graphs-png', 'Todos PNG', '🖼️', 'secondary'),
                            create_export_button('export-all-graphs-svg', 'Todos SVG', '📐', 'secondary')
                        ]
                    )
                ],
                style={'display': 'flex', 'flexDirection': 'column'}
            ),
            
            # Opções de exportação
            html.Div(
                children=[
                    html.Hr(style={'margin': '15px 0'}),
                    html.Label(
                        "Opções:",
                        style={'fontSize': '12px', 'fontWeight': 'bold', 'display': 'block', 'marginBottom': '8px'}
                    ),
                    dbc.Checklist(
                        id='export-options',
                        options=[
                            {'label': ' Incluir filtros aplicados', 'value': 'include_filters'},
                            {'label': ' Incluir metadata', 'value': 'include_metadata'},
                            {'label': ' Incluir timestamp', 'value': 'include_timestamp'}
                        ],
                        value=['include_filters', 'include_metadata', 'include_timestamp'],
                        style={'fontSize': '12px'}
                    )
                ]
            ),
            
            # Download component (invisível)
            dcc.Download(id='download-dashboard')
        ],
        style={
            'padding': '20px',
            'backgroundColor': 'white',
            'borderRadius': '12px',
            'boxShadow': '0 2px 8px rgba(0,0,0,0.1)',
            'marginBottom': '20px'
        }
    )


def create_export_metadata(
    dados: List[Dict[str, Any]],
    active_filters: Optional[Dict[str, Any]] = None,
    date_range: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Cria metadata para incluir na exportação.
    
    Args:
        dados: Lista de notificações
        active_filters: Filtros ativos
        date_range: Período de datas
        
    Returns:
        Dict com metadata completa
    """
    return {
        'exported_at': datetime.now().isoformat(),
        'exported_at_formatted': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'total_records': len(dados),
        'active_filters': active_filters or {},
        'date_range': date_range or {},
        'dashboard_version': '1.0.0',
        'source': 'Dashboard Círio de Nazaré 2025'
    }


def create_export_callbacks_setup() -> str:
    """
    Retorna código Python para configurar callbacks de exportação no app.py.
    
    Returns:
        String com código Python
    """
    return '''
# Export Callbacks
@app.callback(
    Output('download-dashboard', 'data'),
    [Input('export-dashboard-csv', 'n_clicks'),
     Input('export-dashboard-excel', 'n_clicks'),
     Input('export-dashboard-json', 'n_clicks')],
    [State('filtered-data', 'data'),
     State('filter-store', 'data'),
     State('export-options', 'value')]
)
def export_dashboard(csv_clicks, excel_clicks, json_clicks, 
                     dados, filters, export_options):
    """
    Gerencia exportação do dashboard em diferentes formatos.
    """
    from dash import callback_context
    from components.export_menu import (
        export_to_csv, export_to_excel, export_to_json,
        create_export_metadata
    )
    import dash
    
    ctx = callback_context
    if not ctx.triggered:
        return dash.no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    # Cria metadata
    metadata = None
    if 'include_metadata' in export_options:
        metadata = create_export_metadata(dados, filters)
    
    # CSV
    if trigger_id == 'export-dashboard-csv' and csv_clicks:
        csv_string = export_to_csv(dados)
        return dict(
            content=csv_string,
            filename=f"dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        )
    
    # Excel
    if trigger_id == 'export-dashboard-excel' and excel_clicks:
        excel_bytes = export_to_excel(dados)
        return dcc.send_bytes(
            excel_bytes,
            f"dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        )
    
    # JSON
    if trigger_id == 'export-dashboard-json' and json_clicks:
        json_string = export_to_json(dados, metadata)
        return dict(
            content=json_string,
            filename=f"dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
    
    return dash.no_update
'''


def get_export_statistics(
    total_exports: int = 0,
    exports_by_format: Optional[Dict[str, int]] = None
) -> Dict[str, Any]:
    """
    Calcula estatísticas de exportações.
    
    Args:
        total_exports: Total de exportações realizadas
        exports_by_format: Dict com contagem por formato
        
    Returns:
        Dict com estatísticas
    """
    return {
        'total_exports': total_exports,
        'exports_by_format': exports_by_format or {},
        'most_used_format': max(exports_by_format.items(), key=lambda x: x[1])[0] if exports_by_format else None
    }


__all__ = [
    'export_to_csv',
    'export_to_excel',
    'export_to_json',
    'create_export_button',
    'render_graph_export_menu',
    'render_dashboard_export_menu',
    'create_export_metadata',
    'create_export_callbacks_setup',
    'get_export_statistics'
]
