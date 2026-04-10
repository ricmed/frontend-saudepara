import React from 'react';
import GenericEntityManager from './components/GenericEntityManager';
import CrsService from '@/services/CrsService';

const CrsPage: React.FC = () => {
  return (
    <GenericEntityManager
      entityName="CRS"
      entityTitle="Centro Regional de Saúde"
      service={CrsService}
      idField="id_crs"
      basePath="/private/apps/comunicacao-dae/crs"
    />
  );
};

export default CrsPage;
