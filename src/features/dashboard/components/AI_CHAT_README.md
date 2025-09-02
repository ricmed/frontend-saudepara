# 🤖 Chat com IA - Sistema SaudePara

## 📋 Visão Geral

O componente AIChat permite que usuários interajam com uma IA especializada em epidemiologia e vigilância em saúde pública. A IA pode analisar dados do dashboard e fornecer insights sobre padrões epidemiológicos, tendências e recomendações.

## 🔧 Modos de Operação

O sistema suporta dois modos de operação:

### 1. 🏠 **Localhost (Ollama)** - Gratuito e Privado
- Roda completamente offline no seu computador
- Dados nunca saem da sua máquina
- Gratuito após instalação inicial
- Requer instalação do Ollama e modelo Llama 3.1

### 2. ☁️ **API Externa** - Rápido e Sem Instalação
- Usa serviços de IA na nuvem
- Não requer instalação local
- Requer chave de API (alguns serviços oferecem créditos gratuitos)
- Funciona imediatamente após configuração

## 📦 Instalação Local (Ollama + Llama 3.1)

### Windows

#### Passo 1: Instalar o Ollama
1. Acesse: https://ollama.ai
2. Baixe o instalador para Windows
3. Execute o arquivo baixado e siga as instruções
4. Reinicie o terminal após a instalação

#### Passo 2: Baixar o Modelo Llama 3.1
Abra o PowerShell ou CMD como administrador e execute:
```bash
ollama pull llama3.1
```
> ⚠️ **Aviso**: Este download tem aproximadamente 4.7GB. Certifique-se de ter espaço suficiente e uma boa conexão de internet.

#### Passo 3: Iniciar o Ollama
Para usar o chat local, o Ollama deve estar sempre rodando:
```bash
ollama serve
```
> 💡 **Dica**: Mantenha este terminal aberto enquanto usar o chat. O Ollama ficará disponível em `http://localhost:11434`

#### Passo 4: Testar a Instalação
Em outro terminal, teste se tudo está funcionando:
```bash
ollama run llama3.1 "Olá, como você está?"
```

### macOS

#### Passo 1: Instalar o Ollama
```bash
# Usando Homebrew
brew install ollama

# Ou baixe diretamente de https://ollama.ai
```

#### Passo 2: Baixar o Modelo
```bash
ollama pull llama3.1
```

#### Passo 3: Iniciar o Serviço
```bash
ollama serve
```

### Linux (Ubuntu/Debian)

#### Passo 1: Instalar o Ollama
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Passo 2: Baixar o Modelo
```bash
ollama pull llama3.1
```

#### Passo 3: Iniciar o Serviço
```bash
ollama serve
```

## 🌐 Configuração de API Externa

Se preferir não instalar localmente, você pode usar serviços de IA na nuvem:

### OpenRouter (Recomendado)
1. Crie uma conta em: https://openrouter.ai
2. Vá para "Keys" e crie uma nova API key
3. No chat, clique em "Config" → "API Externa"
4. Cole sua chave de API
5. Endpoint padrão: `https://openrouter.ai/api/v1/chat/completions`

### Together AI
1. Crie uma conta em: https://api.together.xyz
2. Obtenha sua API key
3. Configure no chat com endpoint: `https://api.together.xyz/v1/chat/completions`

### Groq (Rápido e com tier gratuito)
1. Crie uma conta em: https://console.groq.com
2. Obtenha sua API key
3. Configure no chat com endpoint: `https://api.groq.com/openai/v1/chat/completions`

## ⚙️ Como Usar

### 1. Configurar o Modo
1. Abra o chat no dashboard
2. Clique no botão "Config" no canto superior direito
3. Escolha entre "Localhost (Ollama)" ou "API Externa"
4. Se escolher API Externa, insira sua chave de API

### 2. Fazer Perguntas
Exemplos de perguntas que você pode fazer:

**Análises Epidemiológicas:**
- "Quais são os padrões mais preocupantes nos dados?"
- "Há indícios de surto ou aglomeração de casos?"
- "Como está a distribuição demográfica dos casos?"

**Recomendações:**
- "Que recomendações você daria para vigilância?"
- "Que medidas preventivas devem ser priorizadas?"
- "Como melhorar a coleta de dados?"

**Correlações:**
- "Existem correlações entre sintomas e hipóteses?"
- "Há padrões temporais ou geográficos nos dados?"
- "Quais grupos demográficos estão mais afetados?"

### 3. Funcionalidades Extras
- **Copiar Respostas**: Clique no botão "Copiar" nas respostas da IA
- **Limpar Chat**: Use o botão "Limpar" para recomeçar
- **Instruções**: Clique em "Instruções" para ver este guia

## 🔒 Privacidade e Segurança

### Modo Localhost
- ✅ Dados permanecem no seu computador
- ✅ Nenhuma informação é enviada para internet
- ✅ Totalmente privado e seguro
- ✅ Funciona offline

### Modo API Externa
- ⚠️ Dados são enviados para o serviço de IA
- ⚠️ Siga as políticas de privacidade do provedor
- ✅ Dados são criptografados em trânsito
- ✅ Chaves de API são armazenadas localmente

## 🛠️ Solução de Problemas

### Ollama Local

**Erro: "Erro na API: 404"**
- Verifique se o Ollama está rodando: `ollama serve`
- Confirme se o modelo está instalado: `ollama list`

**Erro: "Connection refused"**
- Certifique-se que o Ollama está ativo
- Verifique se a porta 11434 não está bloqueada

**Modelo não encontrado**
```bash
ollama pull llama3.1
```

### API Externa

**Erro: "401 Unauthorized"**
- Verifique se a chave de API está correta
- Confirme se a chave tem permissões adequadas

**Erro: "429 Rate Limit"**
- Você excedeu o limite de requisições
- Aguarde alguns minutos ou upgrade seu plano

**Erro: "403 Forbidden"**
- Verifique se você tem créditos disponíveis
- Confirme se a API key é válida

## 💰 Custos

### Localhost (Ollama)
- **Custo**: Gratuito
- **Requisitos**: ~8GB RAM, ~5GB armazenamento
- **Internet**: Apenas para download inicial

### API Externa (Estimativas)
- **OpenRouter**: ~$0.001-0.01 por mensagem
- **Together AI**: ~$0.0008 por mensagem
- **Groq**: Tier gratuito disponível

## 🔄 Atualizações

### Atualizar Ollama
```bash
# Windows/macOS: Baixe nova versão do site
# Linux:
curl -fsSL https://ollama.ai/install.sh | sh
```

### Atualizar Modelo
```bash
ollama pull llama3.1
```

## 📞 Suporte

Para problemas técnicos:
1. Verifique este README primeiro
2. Consulte a documentação do Ollama: https://ollama.ai/docs
3. Entre em contato com a equipe técnica

---

**Desenvolvido para o Sistema SaudePara**  
*Vigilância Epidemiológica Inteligente*
