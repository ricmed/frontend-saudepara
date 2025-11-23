# 📖 Índice de Arquivos - Dashboard Python

## 🎯 Começar por Aqui

1. **PROJETO.md** ← Leia primeiro! Visão geral completa
2. **README.md** ← Documentação principal
3. **QUICKSTART.md** ← Começar em 5 minutos

## 📁 Estrutura de Arquivos

### Arquivos Principais

| Arquivo | Descrição | Linhas | Prioridade |
|---------|-----------|--------|------------|
| `app.py` | Aplicação principal Dash | 500+ | 🔴 Alta |
| `gerar_dados_teste.py` | Gerador de dados | 300+ | 🟡 Média |
| `requirements.txt` | Dependências | 25 | 🔴 Alta |

### Documentação

| Arquivo | O que contém | Quando usar |
|---------|--------------|-------------|
| `PROJETO.md` | Resumo completo do projeto | Primeiro contato |
| `README.md` | Guia de uso geral | Instalação e uso |
| `QUICKSTART.md` | Início rápido | Quer começar logo |
| `TECHNICAL.md` | Documentação técnica | Desenvolver/modificar |
| `INDEX.md` | Este arquivo | Navegação |

### Configuração

| Arquivo | Função |
|---------|--------|
| `.env.example` | Template de configuração |
| `.gitignore` | Arquivos ignorados no git |

## 📁 Pastas

### 🎨 components/ - Visualizações

| Arquivo | Gráfico | Complexidade |
|---------|---------|--------------|
| `piramide_etaria.py` | Pirâmide etária 18x8 | ⭐⭐⭐⭐ |
| `distribuicao_genero.py` | Gênero (bar/pie) | ⭐⭐ |
| `distribuicao_raca.py` | Raça/Cor (bar/pie) | ⭐⭐ |
| `tipo_atendimento.py` | Atendimento + Público | ⭐⭐ |
| `hipoteses_sintomas.py` | Hipóteses + Sintomas + Trauma | ⭐⭐⭐ |
| `desfecho_estabelecimentos.py` | 4 gráficos | ⭐⭐⭐ |
| `mapa_geografico.py` | Mapas interativos | ⭐⭐⭐⭐ |

**Total**: 7 arquivos, 12 visualizações diferentes

### 🛠️ utils/ - Utilitários

| Arquivo | Funções | Uso |
|---------|---------|-----|
| `data_processing.py` | 10+ funções | Processar dados |
| `export.py` | 7 funções | Exportar relatórios |

### ⚙️ config/ - Configurações

| Arquivo | Contém |
|---------|--------|
| `colors.py` | 5 paletas de cores |
| `constants.py` | Constantes do sistema |

## 🗺️ Mapa de Navegação

```
Primeira vez aqui?
│
├─ Quer visão geral? → PROJETO.md
│
├─ Quer instalar? → README.md
│
├─ Quer começar rápido? → QUICKSTART.md
│
├─ É desenvolvedor? → TECHNICAL.md
│
└─ Quer gerar dados teste? → python gerar_dados_teste.py
```

## 📚 Guia de Leitura por Perfil

### 👨‍💼 Gestor / Tomador de Decisão

1. `PROJETO.md` - Entender o que foi feito
2. `README.md` (Seção "Funcionalidades") - Ver recursos
3. Executar demo com dados de teste

### 👨‍💻 Desenvolvedor

1. `PROJETO.md` - Contexto geral
2. `TECHNICAL.md` - Arquitetura e código
3. `app.py` - Código principal
4. `components/` - Cada componente

### 📊 Analista de Dados

1. `QUICKSTART.md` - Começar rápido
2. `README.md` (Seção "Formato de Dados") - Entender dados
3. `utils/data_processing.py` - Ver processamentos
4. Usar dashboard com dados reais

### 🎓 Estudante / Aprendendo

1. `PROJETO.md` - Visão geral
2. `QUICKSTART.md` - Executar demo
3. `components/piramide_etaria.py` - Exemplo simples
4. `TECHNICAL.md` - Conceitos avançados

## 🔍 Encontrar Algo Específico

### Como fazer...

| Tarefa | Onde ver |
|--------|----------|
| Instalar | `QUICKSTART.md` ou `README.md` |
| Conectar banco de dados | `app.py` função `carregar_dados()` |
| Adicionar novo gráfico | `TECHNICAL.md` seção "Personalização" |
| Mudar cores | `config/colors.py` |
| Exportar dados | `utils/export.py` |
| Gerar dados teste | `python gerar_dados_teste.py` |
| Deploy produção | `TECHNICAL.md` seção "Deploy" |
| Troubleshoot | `README.md` seção "Troubleshooting" |

### Conceitos Específicos

| Conceito | Arquivo | Seção |
|----------|---------|-------|
| Callbacks Dash | `TECHNICAL.md` | "Callbacks do Dash" |
| Paleta de cores | `config/colors.py` | Todo o arquivo |
| Filtros | `app.py` | Callbacks |
| Faixa etária | `utils/data_processing.py` | `calcular_faixa_etaria()` |
| Exportação | `utils/export.py` | Todas as funções |
| Mapas | `components/mapa_geografico.py` | Todo o arquivo |

## 📊 Estatísticas do Projeto

```
Total de arquivos:     25+
Linhas de código:      3.000+
Linhas de docs:        1.000+
Componentes:           12
Funções:               50+
Paletas de cores:      5
Formatos de export:    4
```

## 🎯 Checklist de Uso

### Para usar o dashboard:

- [ ] Ler `PROJETO.md`
- [ ] Instalar dependências (`pip install -r requirements.txt`)
- [ ] Gerar dados teste (`python gerar_dados_teste.py`)
- [ ] Executar dashboard (`python app.py`)
- [ ] Acessar `http://localhost:8050`

### Para modificar:

- [ ] Ler `TECHNICAL.md`
- [ ] Entender estrutura de pastas
- [ ] Ver exemplo em `components/`
- [ ] Modificar e testar

### Para deploy:

- [ ] Configurar `.env`
- [ ] Conectar fonte de dados real
- [ ] Testar em ambiente dev
- [ ] Seguir guia de deploy em `TECHNICAL.md`
- [ ] Configurar monitoramento

## 💡 Dicas Rápidas

1. **Primeira execução**: Use `gerar_dados_teste.py`
2. **Problemas**: Veja "Troubleshooting" no README
3. **Personalizar**: Edite `config/colors.py` e `config/constants.py`
4. **Novo gráfico**: Copie estrutura de `components/` existente
5. **Performance**: Veja otimizações em `TECHNICAL.md`

## 🆘 Ajuda

- **Dúvidas gerais**: `README.md`
- **Dúvidas técnicas**: `TECHNICAL.md`
- **Início rápido**: `QUICKSTART.md`
- **Visão geral**: `PROJETO.md`

## 🔗 Links Úteis

- Dash: https://dash.plotly.com/
- Plotly: https://plotly.com/python/
- Pandas: https://pandas.pydata.org/
- Python: https://python.org/

---

**Navegação**: Este arquivo é seu guia! 📖

**Atualizado**: 23/11/2025
