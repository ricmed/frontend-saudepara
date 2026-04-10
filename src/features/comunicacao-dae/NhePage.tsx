import React from 'react';
import GenericEntityManager from './components/GenericEntityManager';
import NheService from '@/services/NheService';

const NhePage: React.FC = () => {
  return (
    <GenericEntityManager
      entityName="NHE"
      entityTitle="Núcleo Hospitalar de Epidemiologia"
      service={NheService}
      idField="id_nhe"
      basePath="/private/apps/comunicacao-dae/nhe"
    />
  );
};

export default NhePage;
