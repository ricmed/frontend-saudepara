"""
Utilitários para Processamento de Dados
Sistema de Vigilância em Saúde - Governo do Pará
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pytz

from config.constants import (
    FAIXAS_ETARIAS,
    TIPOS_GENERO,
    DEFAULT_TIMEZONE,
    DATE_FORMAT,
    DATETIME_FORMAT
)


def calcular_faixa_etaria(idade_meses: int) -> str:
    """
    Calcula a faixa etária baseada na idade em meses
    
    Args:
        idade_meses: Idade em meses
        
    Returns:
        String com a faixa etária
    """
    if pd.isna(idade_meses) or idade_meses < 0:
        return 'Não informado'
    
    if idade_meses < 12:
        return 'Menor de 1 ano'
    
    anos = idade_meses // 12
    
    if 1 <= anos <= 4:
        return '1 a 4 anos'
    elif 5 <= anos <= 9:
        return '5 a 9 anos'
    elif 10 <= anos <= 14:
        return '10 a 14 anos'
    elif 15 <= anos <= 19:
        return '15 a 19 anos'
    elif 20 <= anos <= 24:
        return '20 a 24 anos'
    elif 25 <= anos <= 29:
        return '25 a 29 anos'
    elif 30 <= anos <= 34:
        return '30 a 34 anos'
    elif 35 <= anos <= 39:
        return '35 a 39 anos'
    elif 40 <= anos <= 44:
        return '40 a 44 anos'
    elif 45 <= anos <= 49:
        return '45 a 49 anos'
    elif 50 <= anos <= 54:
        return '50 a 54 anos'
    elif 55 <= anos <= 59:
        return '55 a 59 anos'
    elif 60 <= anos <= 64:
        return '60 a 64 anos'
    elif 65 <= anos <= 69:
        return '65 a 69 anos'
    elif 70 <= anos <= 74:
        return '70 a 74 anos'
    elif 75 <= anos <= 79:
        return '75 a 79 anos'
    else:
        return '80 ou mais anos'


def classificar_genero(descricao_genero: str) -> str:
    """
    Classifica o gênero de forma inclusiva
    
    Args:
        descricao_genero: Descrição do gênero
        
    Returns:
        Categoria de gênero padronizada
    """
    if pd.isna(descricao_genero) or not descricao_genero:
        return 'Ignorado'
    
    genero = str(descricao_genero).lower().strip()
    
    if 'homem cisgênero' in genero or genero == 'homem cisgênero':
        return 'Homem Cisgênero'
    elif 'mulher cisgênero' in genero or genero == 'mulher cisgênero':
        return 'Mulher Cisgênero'
    elif 'homem transgênero' in genero or 'homem trans' in genero:
        return 'Homem Transgênero'
    elif 'mulher transgênero' in genero or 'mulher trans' in genero:
        return 'Mulher Transgênero'
    elif 'travesti' in genero:
        return 'Travesti'
    elif 'não binário' in genero or 'nao binario' in genero:
        return 'Não Binário'
    elif 'não se aplica' in genero or 'nao se aplica' in genero:
        return 'Não se Aplica'
    else:
        return 'Ignorado'


def processar_data(data: Any, timezone: str = DEFAULT_TIMEZONE) -> Optional[datetime]:
    """
    Processa e padroniza datas
    
    Args:
        data: Data em qualquer formato
        timezone: Timezone para conversão
        
    Returns:
        Objeto datetime ou None
    """
    if pd.isna(data):
        return None
    
    try:
        if isinstance(data, str):
            # Tentar vários formatos
            for fmt in [DATETIME_FORMAT, DATE_FORMAT, '%Y-%m-%d', '%Y-%m-%d %H:%M:%S']:
                try:
                    dt = datetime.strptime(data, fmt)
                    tz = pytz.timezone(timezone)
                    return tz.localize(dt)
                except ValueError:
                    continue
        elif isinstance(data, datetime):
            if data.tzinfo is None:
                tz = pytz.timezone(timezone)
                return tz.localize(data)
            return data
        
        return None
    except Exception:
        return None


def filtrar_por_data(df: pd.DataFrame, 
                     coluna_data: str,
                     data_inicio: Optional[datetime] = None,
                     data_fim: Optional[datetime] = None) -> pd.DataFrame:
    """
    Filtra DataFrame por intervalo de datas
    
    Args:
        df: DataFrame a ser filtrado
        coluna_data: Nome da coluna de data
        data_inicio: Data inicial (opcional)
        data_fim: Data final (opcional)
        
    Returns:
        DataFrame filtrado
    """
    if df.empty:
        return df
    
    df_filtrado = df.copy()
    
    if data_inicio is not None:
        df_filtrado = df_filtrado[df_filtrado[coluna_data] >= data_inicio]
    
    if data_fim is not None:
        df_filtrado = df_filtrado[df_filtrado[coluna_data] <= data_fim]
    
    return df_filtrado


def agrupar_por_categoria(df: pd.DataFrame, 
                          coluna: str, 
                          top_n: Optional[int] = None) -> Dict[str, int]:
    """
    Agrupa dados por categoria e retorna contagens
    
    Args:
        df: DataFrame a ser agrupado
        coluna: Nome da coluna para agrupar
        top_n: Número máximo de categorias a retornar (opcional)
        
    Returns:
        Dicionário com categorias e contagens
    """
    if df.empty or coluna not in df.columns:
        return {}
    
    contagens = df[coluna].value_counts().to_dict()
    
    if top_n is not None:
        contagens = dict(sorted(contagens.items(), key=lambda x: x[1], reverse=True)[:top_n])
    
    return contagens


def calcular_estatisticas_basicas(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calcula estatísticas básicas do DataFrame
    
    Args:
        df: DataFrame com os dados
        
    Returns:
        Dicionário com estatísticas
    """
    if df.empty:
        return {
            'total': 0,
            'clinico': 0,
            'trauma': 0,
            'multiplas': 0,
            'qbrn': 0,
        }
    
    stats = {
        'total': len(df)
    }
    
    # Contar tipos de atendimento
    if 'tipo_atendimento' in df.columns:
        for tipo in ['clinico', 'trauma', 'multiplas', 'qbrn']:
            stats[tipo] = len(df[df['tipo_atendimento'].str.lower() == tipo])
    else:
        stats.update({'clinico': 0, 'trauma': 0, 'multiplas': 0, 'qbrn': 0})
    
    return stats


def preparar_dados_grafico(contagens: Dict[str, int], 
                           ordem: Optional[List[str]] = None) -> pd.DataFrame:
    """
    Prepara dados para visualização em gráfico
    
    Args:
        contagens: Dicionário com contagens
        ordem: Lista opcional com ordem desejada das categorias
        
    Returns:
        DataFrame formatado para gráficos
    """
    df = pd.DataFrame(list(contagens.items()), columns=['categoria', 'valor'])
    
    if ordem is not None:
        # Criar um dicionário de ordenação
        ordem_dict = {cat: i for i, cat in enumerate(ordem)}
        df['ordem'] = df['categoria'].map(ordem_dict)
        df = df.sort_values('ordem').drop('ordem', axis=1)
    else:
        df = df.sort_values('valor', ascending=False)
    
    return df


def normalizar_texto(texto: str) -> str:
    """
    Normaliza texto removendo acentos e caracteres especiais
    
    Args:
        texto: Texto a ser normalizado
        
    Returns:
        Texto normalizado
    """
    if pd.isna(texto):
        return ''
    
    import unicodedata
    texto = str(texto)
    texto = unicodedata.normalize('NFKD', texto)
    texto = texto.encode('ASCII', 'ignore').decode('ASCII')
    return texto.lower().strip()


def aplicar_filtros(df: pd.DataFrame, filtros: Dict[str, Any]) -> pd.DataFrame:
    """
    Aplica múltiplos filtros ao DataFrame
    
    Args:
        df: DataFrame a ser filtrado
        filtros: Dicionário com filtros a aplicar
        
    Returns:
        DataFrame filtrado
    """
    if df.empty:
        return df
    
    df_filtrado = df.copy()
    
    for coluna, valor in filtros.items():
        if valor is None or valor == 'Todos':
            continue
        
        if coluna in df_filtrado.columns:
            if isinstance(valor, list):
                df_filtrado = df_filtrado[df_filtrado[coluna].isin(valor)]
            else:
                df_filtrado = df_filtrado[df_filtrado[coluna] == valor]
    
    return df_filtrado


# ============================================================================
# FUNÇÕES DE PROCESSAMENTO PARA GRÁFICOS
# ============================================================================

def process_publico_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de público atendido."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # Contar por tipo de público (API usa 'tipo_publico')
    publicos = [d.get('tipo_publico', {}).get('descricao', 'Não informado') 
                for d in dados if d.get('tipo_publico')]
    
    counter = Counter(publicos)
    result = []
    for i, (name, value) in enumerate(counter.most_common()):
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_tipo_atendimento_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de tipo de atendimento."""
    from collections import Counter
    from config.colors import ATENDIMENTO_COLORS
    
    if not dados:
        return []
    
    tipos = [d.get('tipo_atendimento', {}).get('descricao', 'Não informado')
             for d in dados if d.get('tipo_atendimento')]
    
    counter = Counter(tipos)
    result = []
    for name, value in counter.most_common():
        color = ATENDIMENTO_COLORS.get(name.lower(), '#999999')
        result.append({
            'name': name,
            'value': value,
            'fill': color
        })
    
    return result


def process_sexo_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de sexo/gênero."""
    from collections import Counter
    from config.colors import GENDER_COLORS
    
    if not dados:
        return []
    
    # API usa paciente.tipo_genero.descricao
    generos = [d.get('paciente', {}).get('tipo_genero', {}).get('descricao', 'Não informado')
               for d in dados if d.get('paciente')]
    
    counter = Counter(generos)
    result = []
    for name, value in counter.most_common():
        color = GENDER_COLORS.get(name, '#999999')
        result.append({
            'name': name,
            'value': value,
            'fill': color
        })
    
    return result


def process_raca_cor_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de raça/cor."""
    from collections import Counter
    from config.colors import RACE_COLORS
    
    if not dados:
        return []
    
    # API usa paciente.tipo_raca.descricao
    racas = [d.get('paciente', {}).get('tipo_raca', {}).get('descricao', 'Não informado')
             for d in dados if d.get('paciente')]
    
    counter = Counter(racas)
    result = []
    for name, value in counter.most_common():
        color = RACE_COLORS.get(name, '#999999')
        result.append({
            'name': name,
            'value': value,
            'fill': color
        })
    
    return result


def process_sintomas_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de sintomas."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # API usa notificacao_has_tipo_sintoma
    sintomas_list = []
    for d in dados:
        sintomas = d.get('notificacao_has_tipo_sintoma', [])
        if isinstance(sintomas, list):
            for s in sintomas:
                if isinstance(s, dict) and s.get('tipo_sintoma'):
                    sintomas_list.append(s['tipo_sintoma'].get('descricao', 'Não informado'))
    
    counter = Counter(sintomas_list)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):  # Top 10
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_trauma_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de traumas."""
    from collections import Counter
    from config.colors import TRAUMA_PALETTE
    
    if not dados:
        return []
    
    # API usa notificacao_has_tipo_trauma
    traumas_list = []
    for d in dados:
        traumas = d.get('notificacao_has_tipo_trauma', [])
        if isinstance(traumas, list):
            for t in traumas:
                if isinstance(t, dict) and t.get('tipo_trauma'):
                    traumas_list.append(t['tipo_trauma'].get('descricao', 'Não informado'))
    
    counter = Counter(traumas_list)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):
        result.append({
            'name': name,
            'value': value,
            'fill': TRAUMA_PALETTE[i % len(TRAUMA_PALETTE)]
        })
    
    return result


def process_hipoteses_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de hipóteses diagnósticas."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # API usa tipo_hipotese_diag diretamente na notificação
    hipoteses_list = []
    for d in dados:
        hipotese = d.get('tipo_hipotese_diag')
        if hipotese and isinstance(hipotese, dict):
            hipoteses_list.append(hipotese.get('descricao', 'Não informado'))
    
    counter = Counter(hipoteses_list)
    result = []
    for i, (name, value) in enumerate(counter.most_common(15)):  # Top 15
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_desfecho_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de desfecho de casos."""
    from collections import Counter
    from config.colors import ALERT_COLORS
    
    if not dados:
        return []
    
    # API usa 'tipo_encerramento' (objeto com descricao)
    desfechos = []
    for d in dados:
        tipo_encerramento = d.get('tipo_encerramento')
        if tipo_encerramento and isinstance(tipo_encerramento, dict):
            descricao = tipo_encerramento.get('descricao')
            if descricao and descricao.strip():
                desfechos.append(descricao)
    
    counter = Counter(desfechos)
    result = []
    color_map = {
        'alta': ALERT_COLORS['normal'],
        'liberado': ALERT_COLORS['normal'],
        'atendido': ALERT_COLORS['normal'],
        'óbito': ALERT_COLORS['alarmante'],
        'obito': ALERT_COLORS['alarmante'],
        'transferência': ALERT_COLORS['alerta'],
        'transferencia': ALERT_COLORS['alerta'],
        'internação': ALERT_COLORS['medio'],
        'internacao': ALERT_COLORS['medio'],
        'observação': ALERT_COLORS['medio'],
        'observacao': ALERT_COLORS['medio']
    }
    
    for name, value in counter.most_common():
        # Buscar cor no mapa (case-insensitive)
        color = None
        for key, col in color_map.items():
            if key in name.lower():
                color = col
                break
        if not color:
            color = '#999999'
        
        result.append({
            'name': name,
            'value': value,
            'fill': color
        })
    
    return result


def process_estabelecimentos_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados para gráfico de estabelecimentos."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # API usa campo 'estabelecimento_idestabelecimento' (objeto com nome)
    # TypeScript: original.estabelecimento_idestabelecimento -> nome
    estabelecimentos = []
    for d in dados:
        # Tentar vários caminhos possíveis
        estab = d.get('estabelecimento_idestabelecimento')
        if not estab:
            estab = d.get('estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento')
        
        if estab and isinstance(estab, dict):
            # Preferir 'nome', senão 'nome_fantasia', senão 'razao_social'
            nome = estab.get('nome') or estab.get('nome_fantasia') or estab.get('razao_social')
            if nome and nome.strip():  # Só adicionar se tiver nome válido
                estabelecimentos.append(nome)
    
    counter = Counter(estabelecimentos)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):  # Top 10
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_pais_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados de países para gráfico geográfico."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # Extrair país - campo tipo_pais
    paises = []
    for d in dados:
        tipo_pais = d.get('tipo_pais')
        if tipo_pais and isinstance(tipo_pais, dict):
            descricao = tipo_pais.get('descricao')
            if descricao and descricao.strip():
                paises.append(descricao)
    
    counter = Counter(paises)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_estado_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados de estados para gráfico geográfico."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # Extrair estado - campo tipo_estado
    estados = []
    for d in dados:
        tipo_estado = d.get('tipo_estado')
        if tipo_estado and isinstance(tipo_estado, dict):
            descricao = tipo_estado.get('descricao')
            if descricao and descricao.strip():
                estados.append(descricao)
    
    counter = Counter(estados)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_municipio_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados de municípios para gráfico geográfico."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # Extrair município - campo tipo_municipio
    municipios = []
    for d in dados:
        tipo_municipio = d.get('tipo_municipio')
        if tipo_municipio and isinstance(tipo_municipio, dict):
            descricao = tipo_municipio.get('descricao')
            if descricao and descricao.strip():
                municipios.append(descricao)
    
    counter = Counter(municipios)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result


def process_bairro_data(dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processa dados de bairros para gráfico geográfico."""
    from collections import Counter
    from config.colors import BLUE_PALETTE
    
    if not dados:
        return []
    
    # Extrair bairro - campo tipo_bairro
    bairros = []
    for d in dados:
        tipo_bairro = d.get('tipo_bairro')
        if tipo_bairro and isinstance(tipo_bairro, dict):
            descricao = tipo_bairro.get('descricao')
            if descricao and descricao.strip():
                bairros.append(descricao)
    
    counter = Counter(bairros)
    result = []
    for i, (name, value) in enumerate(counter.most_common(10)):
        result.append({
            'name': name,
            'value': value,
            'fill': BLUE_PALETTE[i % len(BLUE_PALETTE)]
        })
    
    return result
