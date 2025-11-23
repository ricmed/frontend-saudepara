"""
Configuração de Cores e Paletas do Dashboard
Sistema de Vigilância em Saúde - Governo do Pará
"""

# Cores primárias do sistema
COLORS = {
    'primary': '#3b5bdb',
    'secondary': '#e05297',
    'accent': '#047481',
    'neutral': '#374151',
    'masculino': '#3b5bdb',
    'feminino': '#e05297',
    'ignorado': '#999999',
}

# Paleta de azuis para gráficos gerais
BLUE_PALETTE = [
    '#1a3cad',  # Azul escuro
    '#2a49c4',
    '#3b5bdb',
    '#4c6cf1',
    '#5d7df7',
    '#7f96f9',
    '#a1affb',
    '#c2c9fd',
    '#e4e8fe',  # Azul claro
]

# Paleta de verdes
GREEN_PALETTE = [
    '#166534',  # Verde escuro
    '#15803d',
    '#16a34a',
    '#22c55e',
    '#4ade80',
    '#86efac',
    '#bbf7d0',
    '#dcfce7',
    '#f0fdf4',  # Verde claro
]

# Paleta de roxos
PURPLE_PALETTE = [
    '#581c87',  # Roxo escuro
    '#6b21a8',
    '#7c3aed',
    '#8b5cf6',
    '#a78bfa',
    '#c4b5fd',
    '#ddd6fe',
    '#ede9fe',
    '#f5f3ff',  # Roxo claro
]

# Paleta de laranjas
ORANGE_PALETTE = [
    '#9a3412',  # Laranja escuro
    '#c2410c',
    '#ea580c',
    '#f97316',
    '#fb923c',
    '#fdba74',
    '#fed7aa',
    '#ffedd5',
    '#fff7ed',  # Laranja claro
]

# Paleta para gráficos de pizza/rosca
PIE_PALETTE = [
    '#1a3cad',
    '#4c6cf1',
    '#7f96f9',
    '#5d7df7',
    '#2a49c4',
    '#3b5bdb',
    '#a1affb',
    '#c2c9fd',
    '#e4e8fe',
]

# Paleta específica para traumas
TRAUMA_PALETTE = [
    '#8B0000',  # DarkRed
    '#DC143C',  # Crimson
    '#B22222',  # FireBrick
    '#CD5C5C',  # IndianRed
    '#F08080',  # LightCoral
    '#FA8072',  # Salmon
    '#E9967A',  # DarkSalmon
    '#FFA07A',  # LightSalmon
    '#FFB6C1',  # LightPink
]

# Cores para tipos de atendimento
ATENDIMENTO_COLORS = {
    'clinico': '#047481',      # Turquesa
    'clínico': '#047481',
    'CLINICO': '#047481',
    'CLÍNICO': '#047481',
    'trauma': '#DC143C',       # Vermelho
    'TRAUMA': '#DC143C',
    'obstétrico': '#e05297',   # Rosa
    'obstetrico': '#e05297',
    'OBSTÉTRICO': '#e05297',
    'OBSTETRICO': '#e05297',
    'pediátrico': '#4c6cf1',   # Azul
    'pediatrico': '#4c6cf1',
    'PEDIÁTRICO': '#4c6cf1',
    'PEDIATRICO': '#4c6cf1',
}

# Cores para níveis de alerta
ALERT_COLORS = {
    'alarmante': '#ef4444',    # Vermelho
    'alerta': '#f59e0b',       # Laranja/Amarelo
    'medio': '#3b82f6',        # Azul
    'normal': '#10b981',       # Verde
}

# Cores para gêneros
GENDER_COLORS = {
    'Masculino': '#3b5bdb',
    'Feminino': '#e05297',
    'MASCULINO': '#3b5bdb',
    'FEMININO': '#e05297',
    'Homem Cisgênero': '#3b5bdb',
    'Mulher Cisgênero': '#e05297',
    'Homem Transgênero': '#4c6cf1',
    'Mulher Transgênero': '#e05297',
    'Travesti': '#7f96f9',
    'Não Binário': '#a1affb',
    'Ignorado': '#999999',
    'Não se Aplica': '#cccccc',
}

# Cores para raça/cor
RACE_COLORS = {
    'Branca': '#3b5bdb',
    'Preta': '#2a49c4',
    'Parda': '#4c6cf1',
    'Amarela': '#5d7df7',
    'Indígena': '#7f96f9',
    'Ignorado': '#999999',
}

# Função para obter cor de uma paleta por índice
def get_color_from_palette(index, palette=BLUE_PALETTE):
    """Retorna uma cor da paleta usando módulo para índices maiores que o tamanho"""
    return palette[index % len(palette)]

# Função para obter paleta de cores baseada no número de itens
def get_color_palette(n_colors, palette_type='blue'):
    """
    Retorna uma lista de cores com o tamanho especificado
    
    Args:
        n_colors: Número de cores necessárias
        palette_type: Tipo de paleta ('blue', 'pie', 'trauma')
    
    Returns:
        Lista de cores em formato hexadecimal
    """
    palettes = {
        'blue': BLUE_PALETTE,
        'pie': PIE_PALETTE,
        'trauma': TRAUMA_PALETTE,
    }
    
    base_palette = palettes.get(palette_type, BLUE_PALETTE)
    
    # Se precisar de mais cores que a paleta tem, repetir
    if n_colors <= len(base_palette):
        return base_palette[:n_colors]
    else:
        multiplier = (n_colors // len(base_palette)) + 1
        extended_palette = base_palette * multiplier
        return extended_palette[:n_colors]
