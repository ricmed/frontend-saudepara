import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { MunicipioService } from '@/services/MunicipioService';
import { EstadoService } from '@/services/EstadoService';
import SideBarMenuAppsAuxiliares from "./SideBarMenuAppsAuxiliares";

import {
  PageLayout,
  PageHeader,
  FormContainer,
  FormInput,
  FormSelect,
  Alert,
  SubmitButton,
  CancelButton,
  ButtonGroup,
  formatText,
  capitalizeFirstLetter
} from './shared';

interface Estado {
  idtipo_estado: number;
  codigo: string;
  descricao: string;
}

const CadastroMunicipio = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({ 
    codigo: '',
    descricao: '',
    tipo_estado_idtipo_estado: 0
  });
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState({
    initial: !!id,
    saving: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const carregarEstados = async () => {
      try {
        const response = await EstadoService.getAll();
        setEstados(response);
      } catch (err) {
        console.error('Erro ao carregar estados:', err);
        setError('Erro ao carregar lista de estados');
      }
    };

    carregarEstados();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const municipio = await MunicipioService.getById(parseInt(id));
        if (municipio) {
          setFormData({ 
            codigo: municipio.codigo,
            descricao: municipio.descricao,
            tipo_estado_idtipo_estado: municipio.tipo_estado_idtipo_estado
          });
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar dados do município');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
  }, [id]);

  const validateForm = () => {
    const trimmedCodigo = formatText(formData.codigo);
    const trimmedDesc = formatText(formData.descricao);
    const estadoId = formData.tipo_estado_idtipo_estado;

    if (!trimmedCodigo || !trimmedDesc || !estadoId) {
      setError('Todos os campos são obrigatórios.');
      return false;
    }

    if (trimmedCodigo.length !== 6) {
      setError('O código deve ter exatamente 6 números.');
      return false;
    }

    if (trimmedDesc.length > 60) {
      setError('A descrição deve ter no máximo 60 caracteres.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (loading.saving) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);

      const trimmedCodigo = formatText(formData.codigo);
      const formattedDesc = capitalizeFirstLetter(formatText(formData.descricao));

      const isDuplicateCodigo = await MunicipioService.checkExisting(
        trimmedCodigo,
        formData.tipo_estado_idtipo_estado,
        id ? parseInt(id) : undefined
      );

      if (isDuplicateCodigo) {
        setError('Já existe um município com esse código neste estado.');
        return;
      }

      const isDuplicateDescricao = await MunicipioService.checkExistingDescricao(
        formattedDesc,
        formData.tipo_estado_idtipo_estado,
        id ? parseInt(id) : undefined
      );

      if (isDuplicateDescricao) {
        setError('Já existe um município com essa descrição neste estado.');
        return;
      }

      if (id) {
        await MunicipioService.update(parseInt(id), trimmedCodigo, formattedDesc, formData.tipo_estado_idtipo_estado);
      } else {
        await MunicipioService.create(trimmedCodigo, formattedDesc, formData.tipo_estado_idtipo_estado);
      }

      setSuccess(true);
      setTimeout(() => navigate('/private/municipio', { replace: true }), 1500);
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar município. Verifique os dados e tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate('/private/municipio');
  };

  return (
    <PageLayout>
      <PageHeader
        title={id ? 'Editar Município' : 'Novo Município'}
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
            message={`Município ${id ? "atualizado" : "criado"} com sucesso!`}
          />
        )}

        <div className="space-y-4">
          <FormSelect
            label="Estado"
            name="estado"
            value={formData.tipo_estado_idtipo_estado}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              tipo_estado_idtipo_estado: Number(e.target.value) 
            }))}
            options={estados.map(estado => ({
              value: estado.idtipo_estado,
              label: estado.descricao
            }))}
            placeholder="Selecione um estado"
            required
            disabled={loading.saving}
          />

          <FormInput
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
            placeholder="Digite o código do município (6 Dígitos)"
            maxLength={6}
            required
            disabled={loading.saving}
            preventSpaceStart
            formatOnBlur
            onlyNumbers={true}
          />

          <FormInput
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Digite a descrição do município"
            maxLength={60}
            required
            disabled={loading.saving}
            preventSpaceStart
            formatOnBlur
          />
        </div>

        <ButtonGroup>
          <CancelButton
            onClick={handleCancel}
            isDisabled={loading.saving}
          />
          <SubmitButton
            isLoading={loading.saving}
            isDisabled={loading.initial}
            defaultText={id ? "Atualizar Município" : "Criar Município"}
          />
        </ButtonGroup>
      </FormContainer>
    </PageLayout>
  );
};

export default CadastroMunicipio;