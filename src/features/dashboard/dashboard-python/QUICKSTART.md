# 🚀 Guia de Início Rápido

## ⚡ Iniciando em 5 Minutos

### 1. Instalar Python

Baixe e instale Python 3.8+ de https://www.python.org/downloads/

### 2. Instalar Dependências

Abra o PowerShell na pasta do projeto:

```powershell
cd c:\Users\Business\Documents\GitHub\frontend-saudepara\src\features\dashboard\dashboard-python
pip install -r requirements.txt
```

### 3. Preparar Dados de Teste

Crie um arquivo `dados_exemplo.py` para gerar dados de teste:

```python
import pandas as pd
from datetime import datetime, timedelta
import random

# Gerar 1000 registros de exemplo
n = 1000

dados = {
    'data_notificacao': [datetime.now() - timedelta(days=random.randint(0, 30)) for _ in range(n)],
    'tipo_atendimento': random.choices(['clinico', 'trauma', 'multiplas', 'qbrn'], k=n),
    'idade_meses': [random.randint(0, 1200) for _ in range(n)],
    'genero': random.choices([
        'Homem Cisgênero', 'Mulher Cisgênero', 
        'Homem Transgênero', 'Mulher Transgênero',
        'Travesti', 'Não Binário', 'Ignorado'
    ], k=n),
    'raca': random.choices(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'], k=n),
    'publico': random.choices(['Operacional', 'Participante', 'Visitante'], k=n),
    'estabelecimento': random.choices(['Hospital A', 'UPA B', 'UBS C', 'Hospital D'], k=n),
    'desfecho': random.choices(['Alta', 'Internação', 'Transferência', 'Óbito'], k=n),
}

df = pd.DataFrame(dados)
df.to_csv('dados_teste.csv', index=False)
print("✅ Dados de teste criados: dados_teste.csv")
```

Execute:

```powershell
python dados_exemplo.py
```

### 4. Configurar app.py

Edite `app.py`, na função `carregar_dados()`:

```python
def carregar_dados():
    return pd.read_csv('dados_teste.csv')
```

### 5. Executar Dashboard

```powershell
python app.py
```

Abra o navegador em: **http://localhost:8050**

## 🎉 Pronto!

Você verá:
- ✅ 4 cards com estatísticas
- ✅ Pirâmide etária interativa
- ✅ Gráfico de desfechos
- ✅ Série temporal
- ✅ Múltiplas abas com análises

## 📊 Próximos Passos

### Conectar ao Banco de Dados Real

```python
import sqlalchemy

def carregar_dados():
    engine = sqlalchemy.create_engine('postgresql://user:pass@localhost/dbname')
    query = """
        SELECT 
            data_notificacao,
            tipo_atendimento,
            idade_meses,
            genero,
            raca,
            publico,
            estabelecimento,
            desfecho
        FROM notificacoes
        WHERE data_notificacao >= CURRENT_DATE - INTERVAL '30 days'
    """
    return pd.read_sql(query, engine)
```

### Conectar a API REST

```python
import requests

def carregar_dados():
    url = 'https://api.seuservidor.com/notificacoes'
    headers = {'Authorization': 'Bearer SEU_TOKEN'}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    return pd.DataFrame(data)
```

### Adicionar Autenticação

```python
# Instalar: pip install dash-auth

import dash_auth

VALID_USERNAME_PASSWORD_PAIRS = {
    'admin': 'senha_segura_aqui'
}

auth = dash_auth.BasicAuth(
    app,
    VALID_USERNAME_PASSWORD_PAIRS
)
```

## 🐛 Problemas Comuns

### Erro: "No module named 'dash'"

```powershell
pip install dash
```

### Erro: "Port 8050 already in use"

Altere a porta no `app.py`:

```python
app.run_server(debug=True, port=8051)
```

### Dashboard está lento

1. Reduza o volume de dados (últimos 30 dias)
2. Use agregação no banco
3. Desative auto-refresh se não precisar

## 📱 Acessar de Outros Dispositivos

Para acessar de celular/tablet na mesma rede:

```python
app.run_server(debug=False, host='0.0.0.0', port=8050)
```

Depois acesse pelo IP: `http://192.168.x.x:8050`

## 🎨 Personalizar Aparência

### Alterar Cores

Edite `config/colors.py`:

```python
COLORS = {
    'primary': '#FF6B6B',  # Vermelho
    'secondary': '#4ECDC4',  # Turquesa
}
```

### Alterar Título

Edite `app.py`:

```python
html.H1(
    "Meu Dashboard Personalizado",
    className="text-center mb-2",
)
```

## 📈 Monitoramento em Produção

### Usar Gunicorn (Linux/Mac)

```bash
pip install gunicorn
gunicorn app:server -b 0.0.0.0:8050 -w 4
```

### Usar Waitress (Windows)

```powershell
pip install waitress
waitress-serve --port=8050 app:server
```

## 🔒 Segurança

1. **NUNCA** commite senhas no código
2. Use variáveis de ambiente (`.env`)
3. Ative HTTPS em produção
4. Configure firewall
5. Limite rate de requisições

## 💡 Dicas

- Use **Ctrl+C** para parar o servidor
- Limpe cache: `pip cache purge`
- Atualize dependências: `pip install --upgrade -r requirements.txt`
- Teste com dados reais em ambiente de dev primeiro
- Faça backup dos dados antes de deploy

## 🆘 Ajuda

Documentação oficial:
- **Dash**: https://dash.plotly.com/
- **Plotly**: https://plotly.com/python/
- **Pandas**: https://pandas.pydata.org/

---

**Boa sorte! 🚀**
