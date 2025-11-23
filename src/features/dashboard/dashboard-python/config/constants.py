"""
Constantes e Configurações do Dashboard
Sistema de Vigilância em Saúde - Governo do Pará
"""

# Faixas etárias padronizadas
FAIXAS_ETARIAS = [
    'Menor de 1 ano',
    '1 a 4 anos',
    '5 a 9 anos',
    '10 a 14 anos',
    '15 a 19 anos',
    '20 a 24 anos',
    '25 a 29 anos',
    '30 a 34 anos',
    '35 a 39 anos',
    '40 a 44 anos',
    '45 a 49 anos',
    '50 a 54 anos',
    '55 a 59 anos',
    '60 a 64 anos',
    '65 a 69 anos',
    '70 a 74 anos',
    '75 a 79 anos',
    '80 ou mais anos',
]

# Tipos de atendimento
TIPOS_ATENDIMENTO = {
    'clinico': 'Clínico',
    'trauma': 'Trauma',
    'multiplas': 'Múltiplas Causas',
    'qbrn': 'QBRN',
}

# Tipos de público
TIPOS_PUBLICO = [
    'Operacional',
    'Participante',
    'Visitante',
    'Não se Aplica',
]

# Tipos de gênero
TIPOS_GENERO = [
    'Homem Cisgênero',
    'Mulher Cisgênero',
    'Homem Transgênero',
    'Mulher Transgênero',
    'Travesti',
    'Não Binário',
    'Ignorado',
    'Não se Aplica',
]

# Tipos de raça/cor
TIPOS_RACA = [
    'Branca',
    'Preta',
    'Parda',
    'Amarela',
    'Indígena',
    'Ignorado',
]

# Níveis de escolaridade
NIVEIS_ESCOLARIDADE = [
    'Analfabeto',
    'Fundamental Incompleto',
    'Fundamental Completo',
    'Médio Incompleto',
    'Médio Completo',
    'Superior Incompleto',
    'Superior Completo',
    'Pós-Graduação',
    'Ignorado',
]

# Tipos de desfecho
TIPOS_DESFECHO = [
    'Alta',
    'Internação',
    'Transferência',
    'Óbito',
    'Evasão',
    'Em Atendimento',
]

# Configurações de atualização
AUTO_REFRESH_INTERVAL = 60  # segundos
DEFAULT_DATE_RANGE = 30  # dias

# Configurações de paginação
ITEMS_PER_PAGE = 50
MAX_ITEMS_PER_PAGE = 500

# Configurações de exportação
EXPORT_FORMATS = ['PNG', 'PDF', 'CSV', 'Excel']

# Mapeamento de prioridades por hipótese diagnóstica
HIPOTESES_ALARMANTES = [
    'Infarto Agudo do Miocárdio',
    'Acidente Vascular Cerebral',
    'Embolia Pulmonar',
    'Choque Séptico',
    'Trauma Cranioencefálico Grave',
    'Politraumatismo',
    'Hemorragia Digestiva Alta',
    'Abdome Agudo',
]

# Configurações de mapa
MAP_DEFAULT_CENTER = [-1.4558, -48.4902]  # Belém, PA
MAP_DEFAULT_ZOOM = 12

# Timezone padrão
DEFAULT_TIMEZONE = 'America/Belem'

# Formatos de data
DATE_FORMAT = '%d/%m/%Y'
DATETIME_FORMAT = '%d/%m/%Y %H:%M:%S'
