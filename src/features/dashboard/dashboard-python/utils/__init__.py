"""
Arquivo __init__.py para o pacote utils
"""

from .data_processing import (
    calcular_faixa_etaria,
    classificar_genero,
    processar_data,
    filtrar_por_data,
    agrupar_por_categoria,
    calcular_estatisticas_basicas,
    preparar_dados_grafico,
    normalizar_texto,
    aplicar_filtros,
)

from .export import (
    exportar_para_csv,
    exportar_para_excel,
    exportar_grafico_png,
    exportar_grafico_pdf,
    exportar_relatorio_completo,
    gerar_resumo_estatistico,
    exportar_dashboard_completo,
)

__all__ = [
    'calcular_faixa_etaria',
    'classificar_genero',
    'processar_data',
    'filtrar_por_data',
    'agrupar_por_categoria',
    'calcular_estatisticas_basicas',
    'preparar_dados_grafico',
    'normalizar_texto',
    'aplicar_filtros',
    'exportar_para_csv',
    'exportar_para_excel',
    'exportar_grafico_png',
    'exportar_grafico_pdf',
    'exportar_relatorio_completo',
    'gerar_resumo_estatistico',
    'exportar_dashboard_completo',
]
