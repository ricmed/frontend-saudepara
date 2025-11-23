"""
Configuração de Design do Dashboard
Replicação exata do NotificationDashboardCirio.tsx
"""

# ============================================================================
# PALETA DE CORES PRINCIPAL
# ============================================================================

COLORS = {
    'primary': '#3b5bdb',      # Azul principal
    'secondary': '#e05297',    # Rosa
    'accent': '#047481',       # Turquesa
    'neutral': '#374151',      # Cinza escuro
    'masculino': '#3b5bdb',    # Azul
    'feminino': '#e05297',     # Rosa
    'ignorado': '#999999',     # Cinza
}

# ============================================================================
# PALETA AZUL (Gradiente de 9 tons)
# ============================================================================

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

# ============================================================================
# PALETA AZUL MESCLADA (Para variedade em gráficos)
# ============================================================================

BLUE_MIXED = [
    '#1a3cad',  # Azul escuro
    '#4c6cf1',  # Azul médio
    '#7f96f9',  # Azul claro
    '#5d7df7',  # Azul brilhante
    '#2a49c4',  # Azul royal
    '#3b5bdb',  # Azul principal
    '#a1affb',  # Azul lavanda
    '#c2c9fd',  # Azul pastel
    '#e4e8fe',  # Azul muito claro
]

# ============================================================================
# PALETA TRAUMA (Vermelhos)
# ============================================================================

TRAUMA_PALETTE = [
    '#8B0000',  # Vermelho escuro (DarkRed)
    '#DC143C',  # Crimson
    '#B22222',  # FireBrick
    '#CD5C5C',  # IndianRed
    '#F08080',  # LightCoral
    '#FA8072',  # Salmon
    '#E9967A',  # DarkSalmon
    '#FFA07A',  # LightSalmon
]

# ============================================================================
# CORES DE GÊNERO
# ============================================================================

GENDER_COLORS = {
    'Masculino': '#3b5bdb',
    'Feminino': '#e05297',
    'Ignorado': '#999999',
    'Não Informado': '#999999',
}

# ============================================================================
# CORES DE RAÇA/COR
# ============================================================================

RACE_COLORS = {
    'Branca': '#e4e8fe',
    'Preta': '#1a3cad',
    'Parda': '#c2c9fd',
    'Amarela': '#ffd43b',
    'Indígena': '#7f96f9',
    'Não Informado': '#999999',
}

# ============================================================================
# CORES DE TIPO DE ATENDIMENTO
# ============================================================================

ATENDIMENTO_COLORS = {
    'clinico': '#047481',      # Turquesa
    'clínico': '#047481',
    'trauma': '#DC143C',       # Vermelho
    'obstétrico': '#e05297',   # Rosa
    'obstetrico': '#e05297',
    'pediátrico': '#4c6cf1',   # Azul
    'pediatrico': '#4c6cf1',
}

# ============================================================================
# CORES DE ALERTA (Níveis de Vigilância)
# ============================================================================

ALERT_COLORS = {
    'normal': '#10b981',       # Verde (sucesso)
    'alerta': '#f59e0b',       # Amarelo/Laranja (atenção)
    'alarmante': '#ef4444',    # Vermelho (perigo)
    'medio': '#3b82f6',        # Azul (médio)
}

# ============================================================================
# CORES DE CARDS (Estatísticas)
# ============================================================================

CARD_COLORS = {
    'primary': '#3b5bdb',
    'success': '#10b981',
    'danger': '#ef4444',
    'warning': '#f59e0b',
    'info': '#3b82f6',
}

# ============================================================================
# CONFIGURAÇÕES DE GRÁFICOS
# ============================================================================

CHART_CONFIG = {
    # Configurações globais
    'font_family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font_size': 12,
    'title_font_size': 16,
    'title_font_weight': 600,
    
    # Cores de fundo
    'background': '#ffffff',
    'grid_color': '#f3f4f6',
    
    # Configurações de tooltips
    'tooltip_bg': '#1f2937',
    'tooltip_color': '#ffffff',
    'tooltip_border': 'none',
    'tooltip_radius': 8,
    'tooltip_padding': 12,
    
    # Configurações de eixos
    'axis_color': '#9ca3af',
    'axis_line_color': '#e5e7eb',
    
    # Configurações de legenda
    'legend_font_size': 12,
    'legend_color': '#6b7280',
    
    # Animações
    'animation_duration': 750,
    'animation_easing': 'ease-out',
}

# ============================================================================
# CONFIGURAÇÕES DE CARDS
# ============================================================================

CARD_CONFIG = {
    'border_radius': 12,
    'shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    'padding': 16,
    'header_padding': 12,
    'bg_color': '#ffffff',
    'border_color': '#e5e7eb',
}

# ============================================================================
# ESTILOS CSS INLINE (Para Dash)
# ============================================================================

DASHBOARD_STYLES = {
    'container': {
        'backgroundColor': '#f9fafb',
        'minHeight': '100vh',
        'padding': '20px',
    },
    
    'header': {
        'backgroundColor': '#ffffff',
        'padding': '20px',
        'borderRadius': '12px',
        'boxShadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'marginBottom': '20px',
    },
    
    'card': {
        'backgroundColor': '#ffffff',
        'padding': '16px',
        'borderRadius': '12px',
        'boxShadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'height': '100%',
    },
    
    'card_header': {
        'fontSize': '16px',
        'fontWeight': '600',
        'color': '#1f2937',
        'marginBottom': '12px',
        'display': 'flex',
        'alignItems': 'center',
        'gap': '8px',
    },
    
    'stat_card': {
        'backgroundColor': '#ffffff',
        'padding': '20px',
        'borderRadius': '12px',
        'boxShadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'textAlign': 'center',
    },
    
    'stat_value': {
        'fontSize': '32px',
        'fontWeight': '700',
        'marginBottom': '4px',
    },
    
    'stat_label': {
        'fontSize': '14px',
        'color': '#6b7280',
        'fontWeight': '500',
    },
    
    'button': {
        'backgroundColor': '#3b5bdb',
        'color': '#ffffff',
        'padding': '8px 16px',
        'borderRadius': '8px',
        'border': 'none',
        'cursor': 'pointer',
        'fontSize': '14px',
        'fontWeight': '500',
        'transition': 'all 0.2s',
    },
    
    'button_outline': {
        'backgroundColor': 'transparent',
        'color': '#3b5bdb',
        'padding': '8px 16px',
        'borderRadius': '8px',
        'border': '1px solid #3b5bdb',
        'cursor': 'pointer',
        'fontSize': '14px',
        'fontWeight': '500',
        'transition': 'all 0.2s',
    },
}

# ============================================================================
# CONFIGURAÇÕES PLOTLY (Layout padrão para todos os gráficos)
# ============================================================================

PLOTLY_LAYOUT = {
    'font': {
        'family': CHART_CONFIG['font_family'],
        'size': CHART_CONFIG['font_size'],
        'color': '#374151',
    },
    'paper_bgcolor': CHART_CONFIG['background'],
    'plot_bgcolor': CHART_CONFIG['background'],
    'margin': {'l': 40, 'r': 20, 't': 40, 'b': 40},
    'hoverlabel': {
        'bgcolor': CHART_CONFIG['tooltip_bg'],
        'font': {
            'size': 13,
            'family': CHART_CONFIG['font_family'],
            'color': CHART_CONFIG['tooltip_color'],
        },
        'bordercolor': 'transparent',
    },
    'xaxis': {
        'gridcolor': CHART_CONFIG['grid_color'],
        'linecolor': CHART_CONFIG['axis_line_color'],
        'tickfont': {'color': CHART_CONFIG['axis_color'], 'size': 11},
    },
    'yaxis': {
        'gridcolor': CHART_CONFIG['grid_color'],
        'linecolor': CHART_CONFIG['axis_line_color'],
        'tickfont': {'color': CHART_CONFIG['axis_color'], 'size': 11},
    },
    'showlegend': True,
    'legend': {
        'orientation': 'h',
        'yanchor': 'bottom',
        'y': -0.2,
        'xanchor': 'center',
        'x': 0.5,
        'font': {'size': CHART_CONFIG['legend_font_size'], 'color': CHART_CONFIG['legend_color']},
    },
}

# ============================================================================
# CONFIGURAÇÕES DE GRÁFICO DE PIZZA
# ============================================================================

PIE_CHART_CONFIG = {
    'hole': 0.4,  # Donut chart
    'textposition': 'inside',
    'textinfo': 'percent+label',
    'hovertemplate': '<b>%{label}</b><br>%{value} casos<br>%{percent}<extra></extra>',
    'marker': {
        'line': {
            'color': '#ffffff',
            'width': 2
        }
    },
}

# ============================================================================
# CONFIGURAÇÕES DE GRÁFICO DE BARRAS
# ============================================================================

BAR_CHART_CONFIG = {
    'orientation': 'v',  # Vertical por padrão
    'textposition': 'outside',
    'hovertemplate': '<b>%{x}</b><br>%{y} casos<extra></extra>',
    'marker': {
        'line': {
            'color': '#ffffff',
            'width': 1
        }
    },
}

# ============================================================================
# CONFIGURAÇÕES DE GRÁFICO DE LINHA
# ============================================================================

LINE_CHART_CONFIG = {
    'mode': 'lines+markers',
    'line': {
        'width': 3,
        'shape': 'spline',  # Curva suave
    },
    'marker': {
        'size': 8,
        'line': {
            'color': '#ffffff',
            'width': 2
        }
    },
    'hovertemplate': '<b>%{x}</b><br>%{y} casos<extra></extra>',
}
