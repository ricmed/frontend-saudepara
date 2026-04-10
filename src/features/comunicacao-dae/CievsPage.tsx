import React from 'react';
import GenericEntityManager from './components/GenericEntityManager';
import CievsService from '@/services/CievsService';

const CievsPage: React.FC = () => {
  return (
    <GenericEntityManager
      entityName="CIEVS"
      entityTitle="Centro de Informações Estratégicas em Vigilância em Saúde"
      service={CievsService}
      idField="id_cievs"
      basePath="/private/apps/comunicacao-dae/cievs"
    />
  );
};

export default CievsPage;
