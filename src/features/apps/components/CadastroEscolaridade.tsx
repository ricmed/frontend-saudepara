import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useEscolaridade, useCreateEscolaridade, useUpdateEscolaridade, useCheckEscolaridadeExisting } from '../hooks/useEscolaridade';
import SideBarMenuAppsAuxiliares from "./SideBarMenuAppsAuxiliares";
import {PageLayout,PageHeader,FormContainer,FormInput,Alert,SubmitButton,CancelButton,ButtonGroup,formatText,capitalizeFirstLetter} from './shared';

const CadastroEscolaridade = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const escolaridadeId = id ? parseInt(id) : undefined;
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const { data: escolaridadeData, isLoading: loadingEscolaridade } = useEscolaridade(escolaridadeId || 0);
  const createEscolaridade = useCreateEscolaridade();
  const updateEscolaridade = useUpdateEscolaridade();
  const checkExisting = useCheckEscolaridadeExisting();

  // Carregar dados quando disponível (apenas uma vez)
  useEffect(() => {
    if (escolaridadeData && !dataLoaded) {
      setFormData({ descricao: escolaridadeData.descricao });
      setDataLoaded(true);
    }
  }, [escolaridadeData, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (createEscolaridade.isPending || updateEscolaridade.isPending) return;

    try {
      setError(null);
      setSuccess(false);

      const isDuplicate = await checkExisting.mutateAsync({
        descricao: capitalizedDesc,
        excludeId: escolaridadeId
      });

      if (isDuplicate) {
        setError('Já existe um nível de escolaridade com essa descrição.');
        return;
      }

      if (escolaridadeId) {
        await updateEscolaridade.mutateAsync({ id: escolaridadeId, descricao: capitalizedDesc });
      } else {
        await createEscolaridade.mutateAsync(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/escolaridade', { replace: true }), 1500);
      
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar nível de escolaridade. Verifique os dados e tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/private/escolaridade');
  };

  const isLoading = loadingEscolaridade || createEscolaridade.isPending || updateEscolaridade.isPending;

  return (
    <PageLayout>
      <PageHeader
        title={escolaridadeId ? 'Editar Nível de Escolaridade' : 'Novo Nível de Escolaridade'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate('/private/apps-auxiliares')}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <FormContainer onSubmit={handleSubmit}>
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={`Nível de escolaridade ${escolaridadeId ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => {
            const value = e.target.value;
            if (value && /^\d/.test(value)) return; // Previne números no início
            setFormData({ descricao: value });
          }}
          placeholder="Digite a descrição do nível de escolaridade"
          required
          disabled={isLoading}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={isLoading}
          />
          <SubmitButton
            isLoading={isLoading}
            isDisabled={loadingEscolaridade}
            defaultText={escolaridadeId ? "Atualizar Escolaridade" : "Criar Escolaridade"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroEscolaridade;