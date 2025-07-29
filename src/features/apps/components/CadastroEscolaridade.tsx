import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { EscolaridadeService } from '@/services/EscolaridadeService';
import SideBarMenuAppsAuxiliares from "./SideBarMenuAppsAuxiliares";
import {PageLayout,PageHeader,FormContainer,FormInput,Alert,SubmitButton,CancelButton,ButtonGroup,formatText,capitalizeFirstLetter} from './shared';

const CadastroEscolaridade = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ descricao: '' });
  const [loading, setLoading] = useState({
    initial: !!id,
    saving: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const educationLevel = await EscolaridadeService.getById(parseInt(id));
        if (educationLevel) {
          setFormData({ descricao: educationLevel.descricao });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do nível de escolaridade');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = formatText(formData.descricao);
    const capitalizedDesc = capitalizeFirstLetter(trimmedDesc);

    if (!trimmedDesc) {
      setError('A descrição não pode estar vazia.');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const isDuplicate = await EscolaridadeService.checkExisting(
        capitalizedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um nível de escolaridade com essa descrição.');
        return;
      }

      if (id) {
        await EscolaridadeService.update(parseInt(id), capitalizedDesc);
      } else {
        await EscolaridadeService.create(capitalizedDesc);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/escolaridade', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar nível de escolaridade. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/escolaridade');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Nível de Escolaridade' : 'Novo Nível de Escolaridade'}
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
            message={`Nível de escolaridade ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ descricao: e.target.value })}
          placeholder="Digite a descrição do nível de escolaridade"
          required
          disabled={loading.saving}
          preventSpaceStart
          formatOnBlur
        />

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Nível de Escolaridade" : "Criar Nível de Escolaridade"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroEscolaridade;