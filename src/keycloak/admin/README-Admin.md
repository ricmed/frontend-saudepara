# Painel Administrativo Keycloak

Este é um painel administrativo completo para gerenciamento de usuários através da API Keycloak. O painel oferece funcionalidades modernas de CRUD para usuários, gestão de roles, relatórios e estatísticas.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Dashboard**: Visão geral com estatísticas e ações rápidas
- **Gestão de Usuários**: CRUD completo de usuários
- **Formulário de Usuário**: Criação e edição com validação
- **Redefinição de Senha**: Reset de senhas com opção temporária
- **Gestão de Roles**: Visualização e criação de roles
- **Relatórios**: Estatísticas e métricas do sistema
- **Sistema de Notificações**: Feedback visual para ações
- **Paginação**: Navegação eficiente em listas grandes
- **Filtros**: Busca e filtros avançados
- **Internacionalização**: Suporte a múltiplos idiomas
- **Responsive**: Interface adaptável para mobile

### 🔄 Funcionalidades da API Integradas
- Listar usuários com filtros e paginação
- Criar novos usuários
- Atualizar informações de usuários
- Habilitar/desabilitar usuários
- Redefinir senhas (temporárias ou permanentes)
- Enviar emails de verificação
- Desconectar usuários (logout)
- Excluir usuários
- Gerenciar roles de usuários
- Estatísticas do sistema

## 📁 Estrutura de Arquivos

```
src/
├── pages/admin/
│   ├── AdminDashboard.tsx          # Dashboard principal
│   ├── UsersList.tsx               # Lista de usuários
│   ├── UserForm.tsx                # Formulário de usuário
│   ├── PasswordReset.tsx           # Redefinição de senha
│   ├── RolesManagement.tsx         # Gestão de roles
│   ├── AdminReports.tsx            # Relatórios
│   └── AdminRoutes.tsx             # Configuração de rotas
├── hooks/
│   └── useAdminApi.ts              # Hook para API
├── types/
│   └── admin.types.ts              # Tipos TypeScript
└── translations/
    └── admin.translations.ts       # Traduções
```

## 🛠️ Instalação e Configuração

### 1. Copiar Arquivos
Copie todos os arquivos TypeScript para o seu projeto React:

```bash
# Estrutura recomendada
src/
├── features/admin/          # Pasta para o módulo admin
│   ├── pages/              # Páginas do admin
│   ├── hooks/              # Hooks específicos
│   ├── types/              # Tipos TypeScript
│   └── translations/       # Traduções
```

### 2. Instalar Dependências
Certifique-se de ter as dependências necessárias:

```bash
npm install react-router-dom lucide-react
# ou
yarn add react-router-dom lucide-react
```

### 3. Configurar Rotas
Adicione as rotas administrativas no seu arquivo principal de rotas:

```tsx
// App.tsx ou routes/index.tsx
import AdminRoutes from '@/features/admin/AdminRoutes';

function App() {
  return (
    <Router>
      <Routes>
        {/* Suas outras rotas */}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </Router>
  );
}
```

### 4. Integrar Traduções
Adicione as traduções ao seu sistema de i18n:

```tsx
// i18n/translations.ts
import { mergeAdminTranslations } from '@/features/admin/translations/admin.translations';

const existingTranslations = {
  // suas traduções existentes
};

export const translations = mergeAdminTranslations(existingTranslations);
```

### 5. Verificar Autenticação
Certifique-se de que o usuário tem a role `admin` para acessar o painel:

```tsx
// Exemplo de verificação no AuthProvider
const { user } = useAuth();
const isAdmin = user?.realm_access?.roles?.includes('admin');
```

## 🔧 Configuração da API

### Variáveis de Ambiente
Configure as variáveis no seu backend:

```env
KEYCLOAK_URL=https://seu-keycloak.com
KEYCLOAK_REALM=seu-realm
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLIENT_SECRET=seu-secret
```

### Endpoints Utilizados
O painel utiliza os seguintes endpoints da sua API:

```
GET    /api-auth/admin/stats
GET    /api-auth/admin/users
GET    /api-auth/admin/users/count
GET    /api-auth/admin/users/:id
POST   /api-auth/admin/users
PUT    /api-auth/admin/users/:id
DELETE /api-auth/admin/users/:id
PUT    /api-auth/admin/users/:id/enabled
PUT    /api-auth/admin/users/:id/reset-password
PUT    /api-auth/admin/users/:id/send-verify-email
DELETE /api-auth/admin/users/:id/logout
GET    /api-auth/admin/roles
POST   /api-auth/admin/roles
GET    /api-auth/admin/users/:id/roles
POST   /api-auth/admin/users/:id/roles
DELETE /api-auth/admin/users/:id/roles
```

## 🎨 Customização

### Estilos
O painel usa Tailwind CSS. Para customizar:

```tsx
// Exemplo de customização de cores
className="bg-blue-600 hover:bg-blue-700" // Mude para sua cor primária
```

### Componentes
Todos os componentes são modulares e podem ser customizados:

```tsx
// Exemplo: customizar o header
<Header 
  onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
  isMobile={false}
  selectedLanguage={selectedLanguage}
  // Adicione suas props customizadas
/>
```

### Traduções
Adicione ou modifique traduções:

```tsx
// admin.translations.ts
export const adminTranslations = {
  pt: {
    admin: {
      // Adicione suas traduções customizadas
      customMessage: 'Minha mensagem customizada'
    }
  }
};
```

## 🔒 Segurança

### Proteção de Rotas
Todas as rotas administrativas são protegidas:

```tsx
// AdminRoutes.tsx verifica automaticamente a role 'admin'
const isAdmin = user?.realm_access?.roles?.includes('admin');
```

### Validação de Dados
Todos os formulários incluem validação:

```tsx
// Exemplo de validação
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.username.trim()) {
    newErrors.username = t('admin.userForm.validation.usernameRequired');
  }
  
  // Mais validações...
  return Object.keys(newErrors).length === 0;
};
```

## 📱 Responsividade

O painel é totalmente responsivo:

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com navegação otimizada
- **Mobile**: Interface compacta com menu collapse

## 🚀 Performance

### Otimizações Implementadas
- **Lazy Loading**: Componentes carregados sob demanda
- **Paginação**: Carregamento eficiente de listas grandes
- **Debounce**: Busca otimizada com delay
- **Cache**: Estados mantidos durante navegação
- **Memoização**: Componentes otimizados

### Exemplo de Paginação
```tsx
const [pagination, setPagination] = useState({ 
  first: 0, 
  max: 20, 
  total: 0 
});
```

## 🐛 Tratamento de Erros

### Sistema de Notificações
```tsx
const showNotification = (message: string, type: 'success' | 'error') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 5000);
};
```

### Try-Catch Global
```tsx
try {
  await apiCall();
  showNotification('Sucesso!', 'success');
} catch (error) {
  console.error('Erro:', error);
  showNotification('Erro na operação', 'error');
}
```

## 🔄 Próximos Passos

### Melhorias Sugeridas
1. **Gráficos**: Integrar Chart.js ou Recharts para relatórios
2. **Exportação**: Implementar exportação de dados (CSV, Excel)
3. **Filtros Avançados**: Mais opções de filtro e busca
4. **Bulk Operations**: Operações em lote para múltiplos usuários
5. **Logs**: Sistema de auditoria e logs
6. **Configurações**: Painel de configurações do sistema

### Integrações Futuras
- **Notificações Push**: Para ações em tempo real
- **WebSocket**: Para atualizações live
- **API de Eventos**: Integração com sistema de eventos Keycloak
- **Métricas**: Dashboard de performance e uso

## 📞 Suporte

### Problemas Comuns

1. **Erro 403 (Forbidden)**
   - Verifique se o usuário tem a role `admin`
   - Confirme a configuração do Keycloak

2. **Erro de CORS**
   - Configure o CORS no backend para aceitar o frontend
   - Verifique as origens permitidas

3. **Traduções não aparecem**
   - Confirme a integração com o sistema de i18n
   - Verifique se as traduções foram importadas corretamente

### Debug
Ative logs para debug:

```tsx
// useAdminApi.ts
console.log('API Request:', url, options);
console.log('API Response:', result);
```

---

## 📄 Licença

Este código é fornecido como exemplo e pode ser usado e modificado conforme necessário para seu projeto.

## 🤝 Contribuição

Sugestões de melhorias são bem-vindas! Considere:
- Melhorar a UX/UI
- Adicionar mais funcionalidades
- Otimizar performance
- Corrigir bugs
- Melhorar documentação

---

**Desenvolvido com ❤️ para facilitar a gestão de usuários Keycloak**