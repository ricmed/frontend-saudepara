import { Routes } from 'react-router-dom';
import { getPrivateAppRoutes } from '@/routes/PrivateAppRoutes';
import { getPublicAppRoutes } from '@/routes/PublicAppRoutes';

export const AppRoutes = () => {
  return (
    <Routes>
      {getPrivateAppRoutes()}
      {getPublicAppRoutes()}
    </Routes>
  );
};
