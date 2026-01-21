import React from 'react';
import GenericEntityManager from './components/GenericEntityManager';
import DaeService from '@/services/DaeService';

const DaePage: React.FC = () => {
  return (
    <GenericEntityManager
      entityName="DAE"
      entityTitle="Doenças de Agravo e Evento"
      service={DaeService}
      idField="id_dae"
      basePath="/private/apps/comunicacao-dae/dae"
    />
  );
};

export default DaePage;
