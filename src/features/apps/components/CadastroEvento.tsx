import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { TiposEventoService } from '@/services/EventoService';
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";

import {
  PageLayout,
  PageHeader,
  FormContainer,
  FormInput,
  Alert,
  SubmitButton,
  CancelButton,
  ButtonGroup,
  formatText,
  capitalizeFirstLetter
} from './shared';

const CadastroTipoEvento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // 🔄 MODIFICAR o estado inicial
  const [formData, setFormData] = useState({ descricao: '', ativo: 'S' });
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
        const tipoEvento = await TiposEventoService.getById(parseInt(id));
        if (tipoEvento) {
          setFormData({
            descricao: tipoEvento.descricao,
            ativo: tipoEvento.ativo || 'S' // 🆕 CAMPO ADICIONADO
          });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do tipo de evento');
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

    if (trimmedDesc.length > 60) {
      setError('A descrição deve ter no máximo 60 caracteres.');
      return;
    }

    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const isDuplicate = await TiposEventoService.checkExisting(
        capitalizedDesc,
        id ? parseInt(id) : undefined
      );

      if (isDuplicate) {
        setError('Já existe um tipo de evento com essa descrição.');
        return;
      }

      if (id) {
        // 🔄 MODIFICAR - incluir campo ativo
        await TiposEventoService.update(parseInt(id), capitalizedDesc, formData.ativo);
      } else {
        // 🔄 MODIFICAR - incluir campo ativo
        await TiposEventoService.create(capitalizedDesc, formData.ativo);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/evento', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar tipo de evento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/evento');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'}
        onMenuClick={() => setIsMenuOpen(true)}
        onBackClick={() => navigate(-1)}
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
            message={`Tipo de evento ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}


        <FormInput
          label="Descrição"
          name="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Digite a descrição do tipo de evento"
          required
          disabled={loading.saving}
          preventSpaceStart
          formatOnBlur
          maxLength={60}
        />

        {/* 🆕 ADICIONAR este campo após o campo descrição */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="ativo"
            value={formData.ativo}
            onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.value }))}
            disabled={loading.saving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="S">Ativo</option>
            <option value="N">Inativo</option>
          </select>
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Tipo de Evento" : "Criar Tipo de Evento"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroTipoEvento;