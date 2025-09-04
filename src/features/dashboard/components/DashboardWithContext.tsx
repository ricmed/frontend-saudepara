import React from 'react';
import { DashboardProvider } from '../context/DashboardContext';
import NotificationDashboard from '../NotificationDashboard';

interface DashboardWithContextProps {
  initialData?: any[];
}

const DashboardWithContext: React.FC<DashboardWithContextProps> = ({ 
  initialData = [] 
}) => {
  return (
    <DashboardProvider initialData={initialData}>
      <NotificationDashboard />
    </DashboardProvider>
  );
};

export default DashboardWithContext;
