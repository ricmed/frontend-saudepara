"""
Arquivo __init__.py para o pacote components
"""

from .piramide_etaria import criar_piramide_etaria, preparar_dados_piramide
from .distribuicao_genero import criar_grafico_genero
from .distribuicao_raca import criar_grafico_raca
from .tipo_atendimento import criar_grafico_tipo_atendimento, criar_grafico_publico_atendido
from .hipoteses_sintomas import criar_grafico_hipoteses, criar_grafico_sintomas, criar_grafico_tipos_trauma
from .desfecho_estabelecimentos import (
    criar_grafico_desfecho,
    criar_grafico_estabelecimentos,
    criar_grafico_serie_temporal,
    criar_grafico_atendimentos_hora
)
from .mapa_geografico import criar_mapa_estabelecimentos, criar_mapa_calor_casos, criar_distribuicao_geografica

__all__ = [
    'criar_piramide_etaria',
    'preparar_dados_piramide',
    'criar_grafico_genero',
    'criar_grafico_raca',
    'criar_grafico_tipo_atendimento',
    'criar_grafico_publico_atendido',
    'criar_grafico_hipoteses',
    'criar_grafico_sintomas',
    'criar_grafico_tipos_trauma',
    'criar_grafico_desfecho',
    'criar_grafico_estabelecimentos',
    'criar_grafico_serie_temporal',
    'criar_grafico_atendimentos_hora',
    'criar_mapa_estabelecimentos',
    'criar_mapa_calor_casos',
    'criar_distribuicao_geografica',
]
