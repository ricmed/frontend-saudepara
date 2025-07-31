// src/features/apps/components/CadastroCBO.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useCBO, useCreateCBO, useUpdateCBO, useCheckCBOCodigoExisting } from '../hooks/useCBO';
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
 const cboId = id ? parseInt(id) : undefined;
 
 const [formData, setFormData] = useState({
   codigo: '',
   descricao: ''
 });
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 
 const { data: cboData, isLoading: loadingCBO } = useCBO(cboId!);
 const createCBO = useCreateCBO();
 const updateCBO = useUpdateCBO();
 const checkExisting = useCheckCBOCodigoExisting();

 // Carregar dados quando disponível
 useEffect(() => {
   if (cboData && !formData.codigo) {
     setFormData({
       codigo: cboData.codigo,
       descricao: cboData.descricao
     });
   }
 }, [cboData]);

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
   if (createCBO.isPending || updateCBO.isPending) return;

   try {
     setError(null);
     setSuccess(false);

     const isDuplicate = await checkExisting.mutateAsync({
       codigo: formData.codigo,
       excludeId: cboId
     });

     if (isDuplicate) {
       setError('Já existe um CBO com esse código.');
       return;
     }

     const formattedDesc = capitalizeFirstLetter(formatText(formData.descricao));

     if (cboId) {
       await updateCBO.mutateAsync({
         id: cboId,
         data: {
           codigo: formData.codigo.trim(),
           descricao: formattedDesc
         }
       });
     } else {
       await createCBO.mutateAsync({
         codigo: formData.codigo.trim(),
         descricao: formattedDesc
       });
     }

     setSuccess(true);
     setTimeout(() => navigate('/private/cbo', { replace: true }), 1500);
     
   } catch (err: any) {
     console.error('Erro ao salvar:', err);
     if (err?.response?.data?.error) {
       setError(err.response.data.error);
     } else {
       setError(err.message || 'Erro ao salvar CBO. Verifique os dados e tente novamente.');
     }
   }
 };

 const handleCancel = () => {
   navigate('/private/cbo');
 };

 const isLoading = loadingCBO || createCBO.isPending || updateCBO.isPending;

 return (
   <PageLayout>
     <PageHeader
       title={cboId ? 'Editar CBO' : 'Novo CBO'}
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
           message={`CBO ${cboId ? "atualizado" : "criado"} com sucesso!`}
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
           disabled={isLoading}
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
           disabled={isLoading}
           preventSpaceStart
           formatOnBlur
         />
       </div>

       <ButtonGroup>
         <CancelButton
           onClick={handleCancel}
           isDisabled={isLoading}
         />
         <SubmitButton
           isLoading={isLoading}
           isDisabled={loadingCBO}
           defaultText={cboId ? "Atualizar CBO" : "Criar CBO"}
         />
       </ButtonGroup>
     </FormContainer>
   </PageLayout>
 );
};

export default CadastroCBO;