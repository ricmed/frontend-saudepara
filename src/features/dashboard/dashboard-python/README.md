# 🏥 Dashboard de Vigilância em Saúde - Python

Dashboard interativo desenvolvido em **Python** usando **Dash/Plotly**, baseado no dashboard original em React/TypeScript (`NotificationDashboardCirio.tsx`).

## 📋 Descrição

Este é um sistema completo de visualização e análise de dados de vigilância em saúde, desenvolvido para o **Governo do Pará**. O dashboard oferece análises demográficas, clínicas e geográficas em tempo real.

## ✨ Funcionalidades

### 📊 Visualizações Disponíveis

1. **Visão Geral**
   - Pirâmide Etária por Gênero (com 8 categorias inclusivas)
   - Distribuição de Desfechos (gráfico de rosca)
   - Série Temporal de Casos
   - Distribuição por Tipo de Atendimento
   - Distribuição por Público Atendido

2. **Perfil Demográfico**
   - Distribuição por Gênero (barras ou pizza)
   - Distribuição por Raça/Cor (barras ou pizza)
   - Análise de Faixas Etárias

3. **Análise Clínica**
   - Top 10 Hipóteses Diagnósticas (com destaque para casos alarmantes)
   - Top 10 Sintomas Mais Frequentes
   - Distribuição por Tipos de Trauma

4. **Estabelecimentos**
   - Top 10 Estabelecimentos com Mais Casos
   - Atendimentos por Hora do Dia
   - Mapa Geográfico Interativo

### 🎯 Recursos Principais

- ✅ **Filtros Interativos**: Data, tipo de atendimento, estabelecimento
- ✅ **Atualização Automática**: Refresh a cada 60 segundos
- ✅ **Cards Estatísticos**: Totalizadores em tempo real
- ✅ **Sistema de Abas**: Organização por categorias
- ✅ **Exportação**: CSV, Excel, PNG, PDF
- ✅ **Responsivo**: Interface adaptável
- ✅ **Performance**: Gráficos otimizados com Plotly

## 🚀 Instalação

### Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passo 1: Instalar Dependências

```powershell
cd c:\Users\Business\Documents\GitHub\frontend-saudepara\src\features\dashboard\dashboard-python
pip install -r requirements.txt
```

### Passo 2: Configurar Dados

Edite o arquivo `app.py` na função `carregar_dados()` para conectar à sua fonte de dados:

```python
def carregar_dados():
    # Opção 1: Carregar de CSV
    return pd.read_csv('caminho/para/seus/dados.csv')
    
    # Opção 2: Carregar de banco de dados
    # import sqlalchemy
    # engine = sqlalchemy.create_engine('sua_connection_string')
    # return pd.read_sql("SELECT * FROM notificacoes", engine)
    
    # Opção 3: Carregar de API
    # import requests
    # response = requests.get('https://api.exemplo.com/notificacoes')
    # return pd.DataFrame(response.json())
```

### Passo 3: Executar o Dashboard

```powershell
python app.py
```

O dashboard estará disponível em: **http://localhost:8050**

## 📁 Estrutura do Projeto

```
dashboard-python/
├── app.py                          # Aplicação principal Dash
├── requirements.txt                # Dependências Python
├── README.md                       # Este arquivo
│
├── components/                     # Componentes de visualização
│   ├── piramide_etaria.py         # Pirâmide etária
│   ├── distribuicao_genero.py     # Gráficos de gênero
│   ├── distribuicao_raca.py       # Gráficos de raça/cor
│   ├── tipo_atendimento.py        # Tipos de atendimento
│   ├── hipoteses_sintomas.py      # Hipóteses e sintomas
│   ├── desfecho_estabelecimentos.py  # Desfechos e estabelecimentos
│   └── mapa_geografico.py         # Mapas interativos
│
├── utils/                         # Utilitários
│   ├── data_processing.py         # Processamento de dados
│   └── export.py                  # Funções de exportação
│
├── config/                        # Configurações
│   ├── colors.py                  # Paletas de cores
│   └── constants.py               # Constantes do sistema
│
└── services/                      # Serviços (API, banco de dados)
    └── (adicione seus serviços aqui)
```

## 🎨 Paleta de Cores

O dashboard utiliza as mesmas cores do sistema original:

- **Primary**: `#3b5bdb` (Azul principal)
- **Secondary**: `#e05297` (Rosa)
- **Accent**: `#047481` (Turquesa)
- **Masculino**: `#3b5bdb` (Azul)
- **Feminino**: `#e05297` (Rosa)

Paletas disponíveis:
- **BLUE_PALETTE**: 9 tons de azul para gráficos gerais
- **PIE_PALETTE**: Cores diversificadas para gráficos de pizza
- **TRAUMA_PALETTE**: Tons de vermelho para traumas

## 📊 Formato de Dados Esperado

O DataFrame deve conter as seguintes colunas (nomes exatos):

### Colunas Obrigatórias
- `data_notificacao`: Data/hora da notificação (datetime)
- `tipo_atendimento`: clinico, trauma, multiplas, qbrn

### Colunas Opcionais (mas recomendadas)
- `idade_meses`: Idade em meses (int)
- `genero`: Descrição do gênero
- `raca`: Raça/cor do paciente
- `publico`: Tipo de público (Operacional, Participante, Visitante)
- `estabelecimento`: Nome do estabelecimento
- `hipotese_diagnostica`: Hipótese diagnóstica
- `sintomas`: Sintomas (string ou lista)
- `tipo_trauma`: Tipo de trauma
- `desfecho`: Alta, Internação, Transferência, Óbito, etc.
- `latitude`: Coordenada latitude
- `longitude`: Coordenada longitude
- `municipio`: Nome do município
- `bairro`: Nome do bairro

### Exemplo de Dados

```python
import pandas as pd
from datetime import datetime

dados = pd.DataFrame({
    'data_notificacao': [datetime.now(), datetime.now()],
    'tipo_atendimento': ['clinico', 'trauma'],
    'idade_meses': [240, 360],  # 20 anos e 30 anos
    'genero': ['Homem Cisgênero', 'Mulher Cisgênero'],
    'raca': ['Parda', 'Branca'],
    'publico': ['Participante', 'Operacional'],
    'estabelecimento': ['Hospital A', 'UPA B'],
    'desfecho': ['Alta', 'Internação'],
})
```

## 🔧 Personalização

### Alterar Cores

Edite `config/colors.py`:

```python
COLORS = {
    'primary': '#SUA_COR_AQUI',
    # ...
}
```

### Adicionar Novos Filtros

No `app.py`, adicione novos componentes no layout e callbacks:

```python
# No layout
dcc.Dropdown(
    id='seu-novo-filtro',
    options=[...],
)

# No callback
@callback(
    Output(...),
    Input('seu-novo-filtro', 'value')
)
def sua_funcao(valor_filtro):
    # Sua lógica aqui
    pass
```

### Adicionar Novos Gráficos

1. Crie uma nova função em `components/`:

```python
def criar_seu_grafico(df: pd.DataFrame) -> go.Figure:
    # Sua lógica aqui
    return fig
```

2. Importe e use no `app.py`:

```python
from components.seu_componente import criar_seu_grafico

# No callback
Output('graph-seu-grafico', 'figure'),
# ...
criar_seu_grafico(df),
```

## 📤 Exportação de Dados

### Exportar CSV

```python
from utils.export import exportar_para_csv

caminho = exportar_para_csv(df, 'meu_relatorio.csv')
```

### Exportar Excel

```python
from utils.export import exportar_para_excel

caminho = exportar_para_excel(df, 'meu_relatorio.xlsx')
```

### Exportar Gráfico como PNG

```python
from utils.export import exportar_grafico_png

caminho = exportar_grafico_png(figura, 'meu_grafico.png')
```

### Exportar Relatório Completo

```python
from utils.export import exportar_relatorio_completo

arquivos = exportar_relatorio_completo(df, todas_figuras)
# Retorna: {'csv': 'caminho.csv', 'excel': 'caminho.xlsx', ...}
```

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError"

```powershell
pip install --upgrade -r requirements.txt
```

### Erro: "Kaleido not found"

Para exportação de gráficos como PNG/PDF:

```powershell
pip install kaleido
```

### Erro: "Cannot connect to database"

Verifique:
1. String de conexão está correta
2. Credenciais estão válidas
3. Firewall não está bloqueando

### Dashboard não atualiza

1. Verifique se `carregar_dados()` está retornando dados
2. Verifique se as colunas têm os nomes corretos
3. Limpe o cache do navegador (Ctrl+Shift+R)

## 🔐 Segurança

### Dados Sensíveis

**NUNCA** coloque senhas ou credenciais diretamente no código. Use variáveis de ambiente:

```python
import os
from dotenv import load_dotenv

load_dotenv()

DB_PASSWORD = os.getenv('DB_PASSWORD')
API_KEY = os.getenv('API_KEY')
```

Crie um arquivo `.env`:

```
DB_PASSWORD=sua_senha_aqui
API_KEY=sua_chave_aqui
```

**Adicione `.env` ao `.gitignore`!**

## 📈 Performance

### Otimizações Implementadas

1. **Cache de dados**: Store do Dash armazena dados temporariamente
2. **Lazy loading**: Gráficos carregam apenas quando necessário
3. **Filtros eficientes**: Pandas otimizado para grandes datasets
4. **Callbacks otimizados**: Prevent_initial_call e clientside_callback

### Para Grandes Volumes de Dados

Se você tem mais de 100.000 registros:

1. Use agregação no banco de dados
2. Implemente paginação
3. Use Dask para processamento paralelo
4. Considere cache Redis

## 🤝 Contribuindo

Este projeto foi desenvolvido baseado no dashboard React/TypeScript original. Mantenha a paridade de funcionalidades ao adicionar novos recursos.

## 📝 Licença

© 2024 Governo do Pará - Sistema de Vigilância em Saúde

## 📞 Suporte

Para questões técnicas, consulte:
- Documentação Dash: https://dash.plotly.com/
- Documentação Plotly: https://plotly.com/python/
- Documentação Pandas: https://pandas.pydata.org/

---

**Desenvolvido com ❤️ usando Python, Dash e Plotly**

🎯 **Objetivo**: Fornecer insights em tempo real para melhorar a vigilância em saúde pública
