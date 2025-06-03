// translations/admin.translations.ts

export const adminTranslations = {
  pt: {
    admin: {
      // Dashboard
      dashboard: {
        title: 'Painel Administrativo',
        welcome: 'Bem-vindo, {{name}}',
        quickActions: 'Ações Rápidas',
        recentActivity: 'Atividade Recente',
        stats: {
          totalUsers: 'Total de Usuários',
          totalRoles: 'Total de Roles',
          recentEvents: 'Eventos Recentes',
          lastUpdate: 'Última Atualização',
          never: 'Nunca'
        },
        actions: {
          createUser: 'Criar Usuário',
          createUserDesc: 'Adicionar um novo usuário ao sistema',
          manageUsers: 'Gerenciar Usuários',
          manageUsersDesc: 'Visualizar e editar usuários existentes',
          manageRoles: 'Gerenciar Roles',
          manageRolesDesc: 'Configurar permissões e roles',
          viewReports: 'Ver Relatórios',
          viewReportsDesc: 'Analisar dados e estatísticas'
        },
        activity: {
          userCreated: 'Usuário criado com sucesso',
          roleAssigned: 'Role atribuída a usuário',
          userDisabled: 'Usuário desabilitado',
          timeAgo: 'há {{time}}'
        }
      },

      // Lista de usuários
      users: {
        title: 'Gerenciamento de Usuários',
        subtitle: 'Visualize e gerencie todos os usuários do sistema',
        filters: 'Filtros',
        createUser: 'Criar Usuário',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por nome, email ou username...',
        allStatuses: 'Todos os Status',
        enabled: 'Habilitado',
        disabled: 'Desabilitado',
        emailVerified: 'Email Verificado',
        emailNotVerified: 'Email Não Verificado',
        applyFilters: 'Aplicar Filtros',
        loading: 'Carregando usuários...',
        noUsers: 'Nenhum usuário encontrado',
        confirmDelete: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
        actionError: 'Erro ao executar ação. Tente novamente.',
        table: {
          user: 'Usuário',
          email: 'Email',
          status: 'Status',
          created: 'Criado em',
          actions: 'Ações'
        },
        actions: {
          edit: 'Editar',
          enable: 'Habilitar',
          disable: 'Desabilitar',
          sendVerifyEmail: 'Enviar Email de Verificação',
          resetPassword: 'Redefinir Senha',
          logout: 'Desconectar',
          delete: 'Excluir'
        },
        pagination: {
          showing: 'Mostrando',
          of: 'de'
        }
      },

      // Formulário de usuário
      userForm: {
        createTitle: 'Criar Novo Usuário',
        createSubtitle: 'Adicione um novo usuário ao sistema',
        editTitle: 'Editar Usuário',
        editSubtitle: 'Modifique as informações do usuário',
        loading: 'Carregando dados do usuário...',
        basicInfo: 'Informações Básicas',
        username: 'Nome de Usuário',
        usernamePlaceholder: 'Digite o nome de usuário',
        email: 'Email',
        emailPlaceholder: 'Digite o email',
        firstName: 'Primeiro Nome',
        firstNamePlaceholder: 'Digite o primeiro nome',
        lastName: 'Último Nome',
        lastNamePlaceholder: 'Digite o último nome',
        userEnabled: 'Usuário habilitado',
        emailVerified: 'Email verificado',
        changePassword: 'Alterar Senha',
        password: 'Senha',
        passwordPlaceholder: 'Digite a senha',
        newPasswordPlaceholder: 'Digite a nova senha (deixe em branco para não alterar)',
        confirmPassword: 'Confirmar Senha',
        confirmPasswordPlaceholder: 'Confirme a senha',
        temporaryPassword: 'Senha temporária',
        temporaryPasswordHelp: 'Se marcado, o usuário será obrigado a alterar a senha no próximo login',
        roles: 'Roles e Permissões',
        cancel: 'Cancelar',
        create: 'Criar Usuário',
        update: 'Atualizar Usuário',
        saving: 'Salvando...',
        loadError: 'Erro ao carregar dados do usuário',
        createSuccess: 'Usuário criado com sucesso!',
        updateSuccess: 'Usuário atualizado com sucesso!',
        saveError: 'Erro ao salvar usuário. Tente novamente.',
        roleAdded: 'Role {{role}} adicionada com sucesso',
        roleRemoved: 'Role {{role}} removida com sucesso',
        roleError: 'Erro ao alterar role. Tente novamente.',
        validation: {
          usernameRequired: 'Nome de usuário é obrigatório',
          emailRequired: 'Email é obrigatório',
          emailInvalid: 'Email deve ter um formato válido',
          passwordRequired: 'Senha é obrigatória',
          passwordMinLength: 'Senha deve ter pelo menos 6 caracteres',
          passwordMismatch: 'Senhas não coincidem'
        }
      },

      // Redefinição de senha
      passwordReset: {
        title: 'Redefinir Senha',
        subtitle: 'Altere a senha do usuário selecionado',
        loading: 'Carregando dados do usuário...',
        userNotFound: 'Usuário não encontrado',
        userInfo: 'Informações do Usuário',
        username: 'Nome de Usuário',
        email: 'Email',
        fullName: 'Nome Completo',
        status: 'Status',
        enabled: 'Habilitado',
        disabled: 'Desabilitado',
        newPassword: 'Nova Senha',
        password: 'Senha',
        passwordPlaceholder: 'Digite a nova senha',
        confirmPassword: 'Confirmar Senha',
        confirmPasswordPlaceholder: 'Confirme a nova senha',
        generatePassword: 'Gerar senha automática',
        temporaryPassword: 'Senha temporária',
        temporaryPasswordHelp: 'Se marcado, o usuário será obrigado a alterar a senha no próximo login',
        securityWarning: 'Aviso de Segurança',
        securityWarningText: 'Esta ação redefinirá a senha do usuário. Certifique-se de comunicar a nova senha de forma segura.',
        cancel: 'Cancelar',
        resetPassword: 'Redefinir Senha',
        resetting: 'Redefinindo...',
        success: 'Senha redefinida com sucesso!',
        error: 'Erro ao redefinir senha. Tente novamente.',
        validation: {
          passwordRequired: 'Senha é obrigatória',
          passwordMinLength: 'Senha deve ter pelo menos 6 caracteres',
          passwordMismatch: 'Senhas não coincidem'
        }
      },

      // Gestão de roles
      roles: {
        title: 'Gestão de Roles',
        subtitle: 'Configure permissões e roles do sistema',
        createRole: 'Criar Role',
        editRole: 'Editar Role',
        searchPlaceholder: 'Buscar roles...',
        noRoles: 'Nenhuma role encontrada',
        noRolesFound: 'Nenhuma role encontrada com os critérios de busca',
        noDescription: 'Sem descrição',
        usersWithRole: 'usuários com esta role',
        systemRole: 'Role do Sistema',
        compositeRole: 'Role Composta',
        roleName: 'Nome da Role',
        roleNamePlaceholder: 'Digite o nome da role',
        roleDescription: 'Descrição',
        roleDescriptionPlaceholder: 'Digite uma descrição para a role',
        cancel: 'Cancelar',
        create: 'Criar',
        update: 'Atualizar',
        confirmDelete: 'Tem certeza que deseja excluir a role "{{name}}"?',
        createSuccess: 'Role criada com sucesso!',
        updateSuccess: 'Role atualizada com sucesso!',
        deleteSuccess: 'Role excluída com sucesso!',
        saveError: 'Erro ao salvar role. Tente novamente.',
        deleteError: 'Erro ao excluir role. Tente novamente.',
        actions: {
          edit: 'Editar',
          delete: 'Excluir'
        },
        validation: {
          nameRequired: 'Nome da role é obrigatório'
        }
      },

      // Relatórios
      reports: {
        title: 'Relatórios e Estatísticas',
        subtitle: 'Análise detalhada dos dados do sistema',
        loading: 'Carregando relatórios...',
        refresh: 'Atualizar',
        export: 'Exportar',
        last7Days: 'Últimos 7 dias',
        last30Days: 'Últimos 30 dias',
        last90Days: 'Últimos 90 dias',
        lastYear: 'Último ano',
        totalUsers: 'Total de Usuários',
        activeUsers: 'Usuários Ativos',
        totalRoles: 'Total de Roles',
        recentActivity: 'Atividade Recente',
        enabledUsers: 'Usuários Habilitados',
        disabledUsers: 'Usuários Desabilitados',
        verifiedUsers: 'Usuários Verificados',
        unverifiedUsers: 'Usuários Não Verificados',
        unchanged: 'Inalterado',
        userDistribution: 'Distribuição de Usuários',
        activityTrend: 'Tendência de Atividade',
        chartPlaceholder: 'Gráfico será implementado aqui',
        implementChart: 'Integre com uma biblioteca de gráficos como Chart.js ou Recharts',
        recentActivities: 'Atividades Recentes',
        user: 'Usuário',
        justNow: 'Agora mesmo',
        hoursAgo: 'há {{hours}} horas',
        daysAgo: 'há {{days}} dias'
      }
    }
  },

  en: {
    admin: {
      // Dashboard
      dashboard: {
        title: 'Admin Panel',
        welcome: 'Welcome, {{name}}',
        quickActions: 'Quick Actions',
        recentActivity: 'Recent Activity',
        stats: {
          totalUsers: 'Total Users',
          totalRoles: 'Total Roles',
          recentEvents: 'Recent Events',
          lastUpdate: 'Last Update',
          never: 'Never'
        },
        actions: {
          createUser: 'Create User',
          createUserDesc: 'Add a new user to the system',
          manageUsers: 'Manage Users',
          manageUsersDesc: 'View and edit existing users',
          manageRoles: 'Manage Roles',
          manageRolesDesc: 'Configure permissions and roles',
          viewReports: 'View Reports',
          viewReportsDesc: 'Analyze data and statistics'
        },
        activity: {
          userCreated: 'User created successfully',
          roleAssigned: 'Role assigned to user',
          userDisabled: 'User disabled',
          timeAgo: '{{time}} ago'
        }
      },

      // User list
      users: {
        title: 'User Management',
        subtitle: 'View and manage all system users',
        filters: 'Filters',
        createUser: 'Create User',
        search: 'Search',
        searchPlaceholder: 'Search by name, email or username...',
        allStatuses: 'All Statuses',
        enabled: 'Enabled',
        disabled: 'Disabled',
        emailVerified: 'Email Verified',
        emailNotVerified: 'Email Not Verified',
        applyFilters: 'Apply Filters',
        loading: 'Loading users...',
        noUsers: 'No users found',
        confirmDelete: 'Are you sure you want to delete this user? This action cannot be undone.',
        actionError: 'Error executing action. Please try again.',
        table: {
          user: 'User',
          email: 'Email',
          status: 'Status',
          created: 'Created',
          actions: 'Actions'
        },
        actions: {
          edit: 'Edit',
          enable: 'Enable',
          disable: 'Disable',
          sendVerifyEmail: 'Send Verification Email',
          resetPassword: 'Reset Password',
          logout: 'Logout',
          delete: 'Delete'
        },
        pagination: {
          showing: 'Showing',
          of: 'of'
        }
      },

      // User form
      userForm: {
        createTitle: 'Create New User',
        createSubtitle: 'Add a new user to the system',
        editTitle: 'Edit User',
        editSubtitle: 'Modify user information',
        loading: 'Loading user data...',
        basicInfo: 'Basic Information',
        username: 'Username',
        usernamePlaceholder: 'Enter username',
        email: 'Email',
        emailPlaceholder: 'Enter email',
        firstName: 'First Name',
        firstNamePlaceholder: 'Enter first name',
        lastName: 'Last Name',
        lastNamePlaceholder: 'Enter last name',
        userEnabled: 'User enabled',
        emailVerified: 'Email verified',
        changePassword: 'Change Password',
        password: 'Password',
        passwordPlaceholder: 'Enter password',
        newPasswordPlaceholder: 'Enter new password (leave blank to keep current)',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Confirm password',
        temporaryPassword: 'Temporary password',
        temporaryPasswordHelp: 'If checked, user will be required to change password on next login',
        roles: 'Roles and Permissions',
        cancel: 'Cancel',
        create: 'Create User',
        update: 'Update User',
        saving: 'Saving...',
        loadError: 'Error loading user data',
        createSuccess: 'User created successfully!',
        updateSuccess: 'User updated successfully!',
        saveError: 'Error saving user. Please try again.',
        roleAdded: 'Role {{role}} added successfully',
        roleRemoved: 'Role {{role}} removed successfully',
        roleError: 'Error changing role. Please try again.',
        validation: {
          usernameRequired: 'Username is required',
          emailRequired: 'Email is required',
          emailInvalid: 'Email must be in valid format',
          passwordRequired: 'Password is required',
          passwordMinLength: 'Password must be at least 6 characters',
          passwordMismatch: 'Passwords do not match'
        }
      },

      // Password reset
      passwordReset: {
        title: 'Reset Password',
        subtitle: 'Change password for selected user',
        loading: 'Loading user data...',
        userNotFound: 'User not found',
        userInfo: 'User Information',
        username: 'Username',
        email: 'Email',
        fullName: 'Full Name',
        status: 'Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        newPassword: 'New Password',
        password: 'Password',
        passwordPlaceholder: 'Enter new password',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Confirm new password',
        generatePassword: 'Generate automatic password',
        temporaryPassword: 'Temporary password',
        temporaryPasswordHelp: 'If checked, user will be required to change password on next login',
        securityWarning: 'Security Warning',
        securityWarningText: 'This action will reset the user\'s password. Make sure to communicate the new password securely.',
        cancel: 'Cancel',
        resetPassword: 'Reset Password',
        resetting: 'Resetting...',
        success: 'Password reset successfully!',
        error: 'Error resetting password. Please try again.',
        validation: {
          passwordRequired: 'Password is required',
          passwordMinLength: 'Password must be at least 6 characters',
          passwordMismatch: 'Passwords do not match'
        }
      },

      // Role management
      roles: {
        title: 'Role Management',
        subtitle: 'Configure system permissions and roles',
        createRole: 'Create Role',
        editRole: 'Edit Role',
        searchPlaceholder: 'Search roles...',
        noRoles: 'No roles found',
        noRolesFound: 'No roles found matching search criteria',
        noDescription: 'No description',
        usersWithRole: 'users with this role',
        systemRole: 'System Role',
        compositeRole: 'Composite Role',
        roleName: 'Role Name',
        roleNamePlaceholder: 'Enter role name',
        roleDescription: 'Description',
        roleDescriptionPlaceholder: 'Enter role description',
        cancel: 'Cancel',
        create: 'Create',
        update: 'Update',
        confirmDelete: 'Are you sure you want to delete role "{{name}}"?',
        createSuccess: 'Role created successfully!',
        updateSuccess: 'Role updated successfully!',
        deleteSuccess: 'Role deleted successfully!',
        saveError: 'Error saving role. Please try again.',
        deleteError: 'Error deleting role. Please try again.',
        actions: {
          edit: 'Edit',
          delete: 'Delete'
        },
        validation: {
          nameRequired: 'Role name is required'
        }
      },

      // Reports
      reports: {
        title: 'Reports and Statistics',
        subtitle: 'Detailed analysis of system data',
        loading: 'Loading reports...',
        refresh: 'Refresh',
        export: 'Export',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        last90Days: 'Last 90 days',
        lastYear: 'Last year',
        totalUsers: 'Total Users',
        activeUsers: 'Active Users',
        totalRoles: 'Total Roles',
        recentActivity: 'Recent Activity',
        enabledUsers: 'Enabled Users',
        disabledUsers: 'Disabled Users',
        verifiedUsers: 'Verified Users',
        unverifiedUsers: 'Unverified Users',
        unchanged: 'Unchanged',
        userDistribution: 'User Distribution',
        activityTrend: 'Activity Trend',
        chartPlaceholder: 'Chart will be implemented here',
        implementChart: 'Integrate with a chart library like Chart.js or Recharts',
        recentActivities: 'Recent Activities',
        user: 'User',
        justNow: 'Just now',
        hoursAgo: '{{hours}} hours ago',
        daysAgo: '{{days}} days ago'
      }
    }
  },

  es: {
    admin: {
      // Dashboard
      dashboard: {
        title: 'Panel de Administración',
        welcome: 'Bienvenido, {{name}}',
        quickActions: 'Acciones Rápidas',
        recentActivity: 'Actividad Reciente',
        stats: {
          totalUsers: 'Total de Usuarios',
          totalRoles: 'Total de Roles',
          recentEvents: 'Eventos Recientes',
          lastUpdate: 'Última Actualización',
          never: 'Nunca'
        },
        actions: {
          createUser: 'Crear Usuario',
          createUserDesc: 'Agregar un nuevo usuario al sistema',
          manageUsers: 'Gestionar Usuarios',
          manageUsersDesc: 'Ver y editar usuarios existentes',
          manageRoles: 'Gestionar Roles',
          manageRolesDesc: 'Configurar permisos y roles',
          viewReports: 'Ver Reportes',
          viewReportsDesc: 'Analizar datos y estadísticas'
        },
        activity: {
          userCreated: 'Usuario creado exitosamente',
          roleAssigned: 'Rol asignado a usuario',
          userDisabled: 'Usuario deshabilitado',
          timeAgo: 'hace {{time}}'
        }
      },

      // Lista de usuarios
      users: {
        title: 'Gestión de Usuarios',
        subtitle: 'Ver y gestionar todos los usuarios del sistema',
        filters: 'Filtros',
        createUser: 'Crear Usuario',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por nombre, email o usuario...',
        allStatuses: 'Todos los Estados',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
        emailVerified: 'Email Verificado',
        emailNotVerified: 'Email No Verificado',
        applyFilters: 'Aplicar Filtros',
        loading: 'Cargando usuarios...',
        noUsers: 'No se encontraron usuarios',
        confirmDelete: '¿Está seguro que desea eliminar este usuario? Esta acción no se puede deshacer.',
        actionError: 'Error al ejecutar acción. Inténtelo de nuevo.',
        table: {
          user: 'Usuario',
          email: 'Email',
          status: 'Estado',
          created: 'Creado',
          actions: 'Acciones'
        },
        actions: {
          edit: 'Editar',
          enable: 'Habilitar',
          disable: 'Deshabilitar',
          sendVerifyEmail: 'Enviar Email de Verificación',
          resetPassword: 'Restablecer Contraseña',
          logout: 'Cerrar Sesión',
          delete: 'Eliminar'
        },
        pagination: {
          showing: 'Mostrando',
          of: 'de'
        }
      },

      // Formulario de usuario
      userForm: {
        createTitle: 'Crear Nuevo Usuario',
        createSubtitle: 'Agregar un nuevo usuario al sistema',
        editTitle: 'Editar Usuario',
        editSubtitle: 'Modificar información del usuario',
        loading: 'Cargando datos del usuario...',
        basicInfo: 'Información Básica',
        username: 'Nombre de Usuario',
        usernamePlaceholder: 'Ingrese el nombre de usuario',
        email: 'Email',
        emailPlaceholder: 'Ingrese el email',
        firstName: 'Primer Nombre',
        firstNamePlaceholder: 'Ingrese el primer nombre',
        lastName: 'Apellido',
        lastNamePlaceholder: 'Ingrese el apellido',
        userEnabled: 'Usuario habilitado',
        emailVerified: 'Email verificado',
        changePassword: 'Cambiar Contraseña',
        password: 'Contraseña',
        passwordPlaceholder: 'Ingrese la contraseña',
        newPasswordPlaceholder: 'Ingrese nueva contraseña (dejar en blanco para no cambiar)',
        confirmPassword: 'Confirmar Contraseña',
        confirmPasswordPlaceholder: 'Confirme la contraseña',
        temporaryPassword: 'Contraseña temporal',
        temporaryPasswordHelp: 'Si está marcado, el usuario deberá cambiar la contraseña en el próximo inicio de sesión',
        roles: 'Roles y Permisos',
        cancel: 'Cancelar',
        create: 'Crear Usuario',
        update: 'Actualizar Usuario',
        saving: 'Guardando...',
        loadError: 'Error al cargar datos del usuario',
        createSuccess: '¡Usuario creado exitosamente!',
        updateSuccess: '¡Usuario actualizado exitosamente!',
        saveError: 'Error al guardar usuario. Inténtelo de nuevo.',
        roleAdded: 'Rol {{role}} agregado exitosamente',
        roleRemoved: 'Rol {{role}} removido exitosamente',
        roleError: 'Error al cambiar rol. Inténtelo de nuevo.',
        validation: {
          usernameRequired: 'Nombre de usuario es requerido',
          emailRequired: 'Email es requerido',
          emailInvalid: 'Email debe tener un formato válido',
          passwordRequired: 'Contraseña es requerida',
          passwordMinLength: 'Contraseña debe tener al menos 6 caracteres',
          passwordMismatch: 'Las contraseñas no coinciden'
        }
      },

      // Restablecimiento de contraseña
      passwordReset: {
        title: 'Restablecer Contraseña',
        subtitle: 'Cambiar contraseña del usuario seleccionado',
        loading: 'Cargando datos del usuario...',
        userNotFound: 'Usuario no encontrado',
        userInfo: 'Información del Usuario',
        username: 'Nombre de Usuario',
        email: 'Email',
        fullName: 'Nombre Completo',
        status: 'Estado',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
        newPassword: 'Nueva Contraseña',
        password: 'Contraseña',
        passwordPlaceholder: 'Ingrese la nueva contraseña',
        confirmPassword: 'Confirmar Contraseña',
        confirmPasswordPlaceholder: 'Confirme la nueva contraseña',
        generatePassword: 'Generar contraseña automática',
        temporaryPassword: 'Contraseña temporal',
        temporaryPasswordHelp: 'Si está marcado, el usuario deberá cambiar la contraseña en el próximo inicio de sesión',
        securityWarning: 'Advertencia de Seguridad',
        securityWarningText: 'Esta acción restablecerá la contraseña del usuario. Asegúrese de comunicar la nueva contraseña de forma segura.',
        cancel: 'Cancelar',
        resetPassword: 'Restablecer Contraseña',
        resetting: 'Restableciendo...',
        success: '¡Contraseña restablecida exitosamente!',
        error: 'Error al restablecer contraseña. Inténtelo de nuevo.',
        validation: {
          passwordRequired: 'Contraseña es requerida',
          passwordMinLength: 'Contraseña debe tener al menos 6 caracteres',
          passwordMismatch: 'Las contraseñas no coinciden'
        }
      },

      // Reportes
      reports: {
        title: 'Reportes y Estadísticas',
        subtitle: 'Análisis detallado de los datos del sistema',
        loading: 'Cargando reportes...',
        refresh: 'Actualizar',
        export: 'Exportar',
        last7Days: 'Últimos 7 días',
        last30Days: 'Últimos 30 días',
        last90Days: 'Últimos 90 días',
        lastYear: 'Último año',
        totalUsers: 'Total de Usuarios',
        activeUsers: 'Usuarios Activos',
        totalRoles: 'Total de Roles',
        recentActivity: 'Actividad Reciente',
        enabledUsers: 'Usuarios Habilitados',
        disabledUsers: 'Usuarios Deshabilitados',
        verifiedUsers: 'Usuarios Verificados',
        unverifiedUsers: 'Usuarios No Verificados',
        unchanged: 'Sin cambios',
        userDistribution: 'Distribución de Usuarios',
        activityTrend: 'Tendencia de Actividad',
        chartPlaceholder: 'El gráfico se implementará aquí',
        implementChart: 'Integre con una librería de gráficos como Chart.js o Recharts',
        recentActivities: 'Actividades Recientes',
        user: 'Usuario',
        justNow: 'Ahora mismo',
        hoursAgo: 'hace {{hours}} horas',
        daysAgo: 'hace {{days}} días'
      }
    }
  }
};
