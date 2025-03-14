// src/features/apps/components/CadastroCBO.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { CBOService } from '@/services/CBOService';
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

const CadastroCBO = () => {
 const navigate = useNavigate();
 const { id } = useParams();
 
 const [formData, setFormData] = useState({
   codigo: '',
   descricao: ''
 });
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
       const cbo = await CBOService.getById(parseInt(id));
       if (cbo) {
         setFormData({
           codigo: cbo.codigo,
           descricao: cbo.descricao
         });
       }
     } catch (err) {
       console.error('Erro ao carregar:', err);
       setError('Erro ao carregar dados do CBO');
     } finally {
       setLoading(prev => ({ ...prev, initial: false }));
     }
   };

   loadData();
 }, [id]);

 const validateForm = () => {
   const trimmedCodigo = formData.codigo.trim();
   const trimmedDesc = formData.descricao.trim();

   if (!trimmedCodigo) {
     setError('O código não pode estar vazio.');
     return false;
   }

   if (!trimmedDesc) {
     setError('A descrição não pode estar vazia.');
     return false;
   }

   if (!/^\d{6}$/.test(trimmedCodigo)) {
     setError('O código CBO deve conter exatamente 6 dígitos.');
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

     const isDuplicate = await CBOService.checkExisting(
       formData.codigo,
       id ? parseInt(id) : undefined
     );

     const isDescDuplicate = await CBOService.checkExistingDescricao(
       formData.descricao,
       id ? parseInt(id) : undefined
     );

     if (isDuplicate) {
       setError('Já existe um CBO com esse código.');
       return;
     }

     if (isDescDuplicate) {
       setError('Já existe um CBO com essa descrição.');
       return;
     }

     const formattedDesc = capitalizeFirstLetter(formatText(formData.descricao));

     if (id) {
       await CBOService.update(parseInt(id), {
         codigo: formData.codigo.trim(),
         descricao: formattedDesc
       });
     } else {
       await CBOService.create({
         codigo: formData.codigo.trim(),
         descricao: formattedDesc
       });
     }

     setSuccess(true);
     setTimeout(() => navigate('/cbo/lista', { replace: true }), 1500);
     
   } catch (err: any) {
     console.error('Erro ao salvar:', err);
     if (err?.response?.data?.error) {
       setError(err.response.data.error);
     } else {
       setError('Erro ao salvar CBO. Verifique os dados e tente novamente.');
     }
   } finally {
     setLoading(prev => ({ ...prev, saving: false }));
   }
 };

 const handleCancel = () => {
   navigate('/cbo/lista');
 };

 return (
   <PageLayout>
     <PageHeader
       title={id ? 'Editar CBO' : 'Novo CBO'}
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
           message={`CBO ${id ? "atualizado" : "criado"} com sucesso!`}
         />
       )}

       <div className="space-y-4">
         <FormInput
           label="Código CBO"
           name="codigo"
           value={formData.codigo}
           onChange={(e) => {
             const numericValue = e.target.value.replace(/\D/g, '').slice(0, 6);
             setFormData(prev => ({ ...prev, codigo: numericValue }));
           }}
           placeholder="Digite o código do CBO (6 dígitos)"
           required
           disabled={loading.saving}
           maxLength={6}
           onlyNumbers={true}
         />

         <FormInput
           label="Descrição"
           name="descricao"
           value={formData.descricao}
           onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
           placeholder="Digite a descrição do CBO"
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
           defaultText={id ? "Atualizar CBO" : "Criar CBO"}
         />
       </ButtonGroup>
     </FormContainer>
   </PageLayout>
 );
};

export default CadastroCBO;