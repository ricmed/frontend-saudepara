import { useAuth } from './AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRoles?: string[]; // Lista de roles necessárias
  requiredGroups?: string[]; // Lista de grupos necessários
}

const ProtectedRoute = ({ children, requiredRoles = [], requiredGroups = [] }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Carregando...</p>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se há restrições de roles ou grupos
  if (requiredRoles.length > 0 || requiredGroups.length > 0) {
    const hasRequiredRole = requiredRoles.length > 0 && user.roles && requiredRoles.some(role => user.roles.includes(role));
    const hasRequiredGroup = requiredGroups.length > 0 && user.groups && requiredGroups.some(group => user.groups.includes(group));

    // O usuário precisa ter pelo menos uma role OU um grupo (se especificados)
    if (!hasRequiredRole && !hasRequiredGroup) {
      return <Navigate to="/access-denied" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;