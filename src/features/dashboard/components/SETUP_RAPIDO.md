# 🚀 Setup Rápido - Chat com IA

## ⚡ Instalação Express (Windows)

### Opção 1: Localhost (Recomendado para Dados Sensíveis)

**1. Download e Instalação (5 minutos)**
```powershell
# 1. Baixar Ollama
# Acesse: https://ollama.ai e baixe o instalador Windows

# 2. Após instalação, abra PowerShell e execute:
ollama pull llama3.1

# 3. Iniciar o serviço:
ollama serve
```

**2. Configurar no Sistema**
- Abra o dashboard SaudePara
- Clique em "Config" no chat
- Selecione "Localhost (Ollama)"
- ✅ Pronto! Comece a usar

### Opção 2: API Externa (Mais Rápido)

**1. Criar Conta OpenRouter (2 minutos)**
- Acesse: https://openrouter.ai
- Crie conta gratuita
- Vá em "Keys" → "Create Key"
- Copie a chave de API

**2. Configurar no Sistema**
- Abra o dashboard SaudePara
- Clique em "Config" no chat
- Selecione "API Externa"
- Cole sua chave de API
- ✅ Pronto! Comece a usar

## 🎯 Primeiros Passos

Teste com estas perguntas:

```
Faça um resumo epidemiológico dos dados atuais

Identifique os 3 principais riscos nos dados

Que ações de vigilância você recomenda?
```

## 📋 Checklist de Instalação

### Localhost
- [ ] Ollama instalado
- [ ] Modelo llama3.1 baixado
- [ ] Serviço ollama rodando
- [ ] Chat configurado para "Localhost"
- [ ] Teste realizado com sucesso

### API Externa  
- [ ] Conta criada no provedor (OpenRouter/Groq/Together)
- [ ] Chave de API obtida
- [ ] Chat configurado para "API Externa"
- [ ] Chave inserida no sistema
- [ ] Teste realizado com sucesso

## 🆘 Resolução Rápida de Problemas

| Problema | Solução |
|----------|---------|
| "Erro na API: 404" | Execute `ollama serve` em um terminal |
| "Connection refused" | Verifique se Ollama está rodando |
| "401 Unauthorized" | Verifique sua chave de API |
| "Resposta vazia" | Teste com pergunta mais simples |
| Chat não responde | Clique em "Config" e verifique configuração |

## 💡 Dicas de Uso

**Para Melhores Resultados:**
- Seja específico nas perguntas
- Use dados contextuais ("nos últimos 30 dias...")
- Peça análises práticas e acionáveis

**Exemplos Eficazes:**
```
❌ "Como estão os dados?"
✅ "Há padrões preocupantes na distribuição de sintomas respiratórios?"

❌ "O que fazer?"
✅ "Baseado nos dados de hipóteses críticas, que medidas de vigilância são prioritárias?"
```

---
*Sistema SaudePara - Configuração em menos de 5 minutos*
