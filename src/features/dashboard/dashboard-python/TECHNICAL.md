# 📚 Documentação Técnica - Dashboard Python

## Arquitetura do Sistema

### Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Web (Dash)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Cards   │  │ Filtros  │  │  Abas    │           │
│  │  Stats   │  │  Data    │  │Gráficos  │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  Camada de Componentes                  │
│  ┌────────────────────────────────────────────────┐   │
│  │  • Pirâmide Etária    • Hipóteses              │   │
│  │  • Distribuições      • Mapas                  │   │
│  │  • Série Temporal     • Desfechos              │   │
│  └────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Camada de Processamento                │
│  ┌────────────────────────────────────────────────┐   │
│  │  • data_processing.py - Transformações         │   │
│  │  • export.py - Exportações                     │   │
│  │  • Cálculos e Agregações                       │   │
│  └────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Camada de Dados                      │
│  ┌────────────────────────────────────────────────┐   │
│  │  CSV  │  PostgreSQL  │  MySQL  │  API REST    │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
dashboard-python/
│
├── app.py                          # Aplicação principal Dash
├── requirements.txt                # Dependências
├── .env.example                    # Exemplo de configuração
├── .gitignore                      # Arquivos ignorados
├── README.md                       # Documentação geral
├── QUICKSTART.md                   # Início rápido
├── TECHNICAL.md                    # Esta documentação
├── gerar_dados_teste.py           # Gerador de dados
│
├── components/                     # Componentes de visualização
│   ├── __init__.py
│   ├── piramide_etaria.py         # Gráfico pirâmide etária
│   ├── distribuicao_genero.py     # Gráficos de gênero
│   ├── distribuicao_raca.py       # Gráficos de raça/cor
│   ├── tipo_atendimento.py        # Tipos de atendimento
│   ├── hipoteses_sintomas.py      # Hipóteses e sintomas
│   ├── desfecho_estabelecimentos.py  # Desfechos
│   └── mapa_geografico.py         # Mapas interativos
│
├── utils/                         # Utilitários
│   ├── __init__.py
│   ├── data_processing.py         # Processamento de dados
│   └── export.py                  # Exportação
│
├── config/                        # Configurações
│   ├── __init__.py
│   ├── colors.py                  # Paletas de cores
│   └── constants.py               # Constantes
│
└── services/                      # Serviços (futuro)
    └── api_service.py             # Conexões API
```

## Fluxo de Dados

### 1. Carregamento de Dados

```python
def carregar_dados():
    # Fonte de dados (CSV, DB, API)
    df = pd.read_csv('dados.csv')
    
    # Validação básica
    if df.empty:
        raise ValueError("Dados vazios")
    
    # Processamento inicial
    df['data_notificacao'] = pd.to_datetime(df['data_notificacao'])
    
    return df
```

### 2. Filtragem

```python
@callback(
    Output('dados-filtrados', 'data'),
    [Input('date-range', 'value'),
     Input('tipo-atendimento', 'value')]
)
def filtrar_dados(date_range, tipo):
    df = carregar_dados()
    
    # Aplicar filtros
    df_filtrado = aplicar_filtros(df, {
        'data': date_range,
        'tipo_atendimento': tipo
    })
    
    return df_filtrado.to_json()
```

### 3. Visualização

```python
def criar_grafico(df):
    # Processar dados
    dados_processados = processar_dados(df)
    
    # Criar figura Plotly
    fig = go.Figure(data=[...])
    
    # Configurar layout
    fig.update_layout(...)
    
    return fig
```

## Callbacks do Dash

### Estrutura de um Callback

```python
@callback(
    # Outputs - O que será atualizado
    [Output('grafico-1', 'figure'),
     Output('grafico-2', 'figure')],
    
    # Inputs - O que dispara a atualização
    [Input('filtro-data', 'value'),
     Input('filtro-tipo', 'value')],
    
    # States - Valores adicionais (não dispara)
    [State('algum-valor', 'data')]
)
def atualizar_graficos(data, tipo, valor_adicional):
    # Lógica aqui
    return grafico1, grafico2
```

### Callbacks Principais

1. **atualizar_dados**: Carrega dados da fonte
2. **atualizar_cards**: Atualiza estatísticas
3. **atualizar_graficos**: Atualiza todos os gráficos
4. **exportar_relatorio**: Gera exportações

## Otimizações Implementadas

### 1. Memoização com @cache

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def calcular_estatisticas(df_hash):
    # Cálculos pesados aqui
    pass
```

### 2. Store para Cache de Dados

```python
dcc.Store(id='dados-cache', storage_type='session')
```

### 3. Prevent Initial Call

```python
@callback(..., prevent_initial_call=True)
def callback_funcao(...):
    pass
```

### 4. Clientside Callbacks (JavaScript)

Para operações simples e rápidas:

```python
app.clientside_callback(
    """
    function(n_clicks) {
        return new Date().toLocaleString();
    }
    """,
    Output('timestamp', 'children'),
    Input('btn-refresh', 'n_clicks')
)
```

## Processamento de Dados

### Cálculo de Faixa Etária

```python
def calcular_faixa_etaria(idade_meses: int) -> str:
    if idade_meses < 12:
        return 'Menor de 1 ano'
    
    anos = idade_meses // 12
    
    if 1 <= anos <= 4:
        return '1 a 4 anos'
    # ... continua
```

### Classificação de Gênero

```python
def classificar_genero(descricao: str) -> str:
    genero = str(descricao).lower().strip()
    
    if 'homem cisgênero' in genero:
        return 'Homem Cisgênero'
    # ... continua
```

### Aplicação de Filtros

```python
def aplicar_filtros(df, filtros):
    df_filtrado = df.copy()
    
    for coluna, valor in filtros.items():
        if valor and valor != 'todos':
            df_filtrado = df_filtrado[
                df_filtrado[coluna] == valor
            ]
    
    return df_filtrado
```

## Gráficos Plotly

### Estrutura Básica

```python
fig = go.Figure()

# Adicionar trace
fig.add_trace(go.Bar(
    x=dados['categoria'],
    y=dados['valor'],
    marker=dict(color='#3b5bdb')
))

# Configurar layout
fig.update_layout(
    title='Título',
    xaxis_title='X',
    yaxis_title='Y',
    height=400
)

return fig
```

### Tipos de Gráficos Implementados

1. **Bar**: Gráficos de barras
2. **Pie**: Gráficos de pizza/rosca
3. **Scatter**: Séries temporais
4. **Scattermapbox**: Mapas interativos
5. **Densitymapbox**: Mapas de calor

## Sistema de Cores

### Paletas Disponíveis

```python
# Azul (principal)
BLUE_PALETTE = [
    '#1a3cad', '#2a49c4', '#3b5bdb', '#4c6cf1',
    '#5d7df7', '#7f96f9', '#a1affb', '#c2c9fd', '#e4e8fe'
]

# Pizza (diversificada)
PIE_PALETTE = [...]

# Trauma (vermelhos)
TRAUMA_PALETTE = [...]
```

### Uso

```python
from config.colors import get_color_palette

cores = get_color_palette(5, 'blue')
# Retorna: ['#1a3cad', '#2a49c4', '#3b5bdb', '#4c6cf1', '#5d7df7']
```

## Exportação

### Formatos Suportados

1. **CSV**: Dados tabulares
2. **Excel**: Múltiplas abas
3. **PNG**: Gráficos estáticos
4. **PDF**: Relatórios

### Exemplo de Uso

```python
from utils.export import exportar_dashboard_completo

# Exportar tudo
caminho = exportar_dashboard_completo(df, todas_figuras)
```

## Segurança

### Variáveis de Ambiente

```python
import os
from dotenv import load_dotenv

load_dotenv()

DB_PASSWORD = os.getenv('DB_PASSWORD')
```

### Validação de Entrada

```python
def validar_data(data_str):
    try:
        return datetime.strptime(data_str, '%Y-%m-%d')
    except ValueError:
        raise ValueError("Data inválida")
```

### Rate Limiting (Futuro)

```python
from flask_limiter import Limiter

limiter = Limiter(app.server, key_func=get_remote_address)

@limiter.limit("10 per minute")
def endpoint():
    pass
```

## Performance

### Benchmarks (1000 registros)

- Carregamento de dados: ~50ms
- Cálculo de estatísticas: ~100ms
- Renderização de gráfico: ~200ms
- Total (primeira carga): ~2s
- Atualização (com cache): ~500ms

### Otimizações Futuras

1. **Dask**: Para datasets muito grandes (>1M registros)
2. **Redis**: Cache distribuído
3. **CDN**: Para assets estáticos
4. **WebWorkers**: Processamento em background

## Testes

### Estrutura de Testes (Futuro)

```python
import pytest
from app import carregar_dados

def test_carregar_dados():
    df = carregar_dados()
    assert not df.empty
    assert 'data_notificacao' in df.columns

def test_calcular_faixa_etaria():
    assert calcular_faixa_etaria(6) == 'Menor de 1 ano'
    assert calcular_faixa_etaria(24) == '1 a 4 anos'
```

## Deploy

### Produção (Linux)

```bash
# Instalar dependências
pip install -r requirements.txt

# Usar Gunicorn
gunicorn app:server -b 0.0.0.0:8050 -w 4 --timeout 120

# Usar Nginx como proxy reverso
```

### Docker (Futuro)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8050

CMD ["gunicorn", "app:server", "-b", "0.0.0.0:8050"]
```

## Monitoramento

### Logs

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dashboard.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.info("Dashboard iniciado")
```

### Métricas (Futuro)

- Tempo de resposta por endpoint
- Número de usuários ativos
- Taxa de erro
- Uso de memória/CPU

## Troubleshooting

### Problema: Dashboard lento

**Solução**:
1. Reduzir volume de dados
2. Adicionar índices no banco
3. Usar agregação
4. Ativar cache

### Problema: Gráficos não aparecem

**Solução**:
1. Verificar console do navegador
2. Verificar se dados existem
3. Limpar cache
4. Verificar callbacks

### Problema: Erro de memória

**Solução**:
1. Usar chunking para grandes datasets
2. Limitar período de dados
3. Aumentar memória do servidor
4. Usar Dask

## Referências

- **Dash**: https://dash.plotly.com/
- **Plotly**: https://plotly.com/python/
- **Pandas**: https://pandas.pydata.org/
- **Gunicorn**: https://gunicorn.org/

---

**Última atualização**: 23/11/2025
