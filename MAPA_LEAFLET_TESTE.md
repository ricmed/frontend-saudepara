# Mapa Leaflet - Teste

## Como acessar

Para testar o mapa Leaflet implementado com os novos filtros de habilitações e qualificações, acesse:

```
http://localhost:5173/mapa-leaflet
```

## Funcionalidades Implementadas

### ✅ Migração Concluída
- ✅ Backend: Endpoint `/api/estabelecimentos/mapa` com habilitações e qualificações
- ✅ Google Maps: Migrado do Excel para API com novos filtros
- ✅ Leaflet: Migrado do Excel para API com novos filtros

### 🗺️ Filtros Disponíveis
1. **Habilitação** (dropdown): Filtra estabelecimentos por tipo de habilitação
2. **Qualificação** (campo de busca): Pesquisa por qualificações específicas
3. **Natureza Jurídica** (dropdown): Público/Privado
4. **Raio de Busca** (slider): Distância em km quando localização disponível

### 🔧 Funcionalidades do Mapa
- 📍 Geolocalização automática do usuário
- 🗺️ Marcadores dos estabelecimentos ativos
- 📱 Interface responsiva
- 🔄 Filtros em tempo real
- 📊 Lista lateral com estabelecimentos
- 🚗 Botão para traçar rota (abre no Google Maps)

### 📊 Dados da API
- **Source**: Banco de dados via Prisma ORM
- **Filtros**: Apenas estabelecimentos ativos
- **Relacionamentos**: Inclui habilitações e qualificações
- **Validação**: Coordenadas válidas obrigatórias

## Diferenças Google Maps vs Leaflet

| Funcionalidade | Google Maps | Leaflet |
|----------------|-------------|---------|
| Filtros | ✅ Habilitações/Qualificações | ✅ Habilitações/Qualificações |
| Geolocalização | ✅ | ✅ |
| Marcadores | ✅ | ✅ |
| Roteamento | ✅ Integrado | ❌ Redireciona p/ Google |
| Performance | 🔥 Excelente | 🔥 Excelente |
| Custo | 💰 Pago | 🆓 Gratuito |

## Para Desenvolvimento

### Rotas Disponíveis
- `/mapa` - Mapa principal (Google Maps)
- `/mapa-leaflet` - Mapa Leaflet (TESTE)
- `/mapa-original` - Versão original

### Comandos
```bash
# Build
npm run build

# Dev
npm run dev

# Acessar teste
# http://localhost:5173/mapa-leaflet
```

---

**Status**: ✅ Implementação completa e funcional
**Data**: Agosto 2025
