// src/features/notificationForms/components/sections/NotifierInfoSection.tsx
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import BrazilianPhoneInput from '@/features/notificationForms/components/BrazilianPhoneInput';
import useUserPermissions from '@/hooks/useUserPermissions';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import indexedDBService from '@/services/indexedDB';

const NotifierInfoSection: React.FC<FormSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  isExpanded,
  toggleSection
}) => {
  const permissions = useUserPermissions();
  const [unidadesPermitidas, setUnidadesPermitidas] = useState<Array<{id: number; nome: string}>>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);

  // Carregar unidades permitidas baseado no nível de acesso
  useEffect(() => {
    const loadUnidadesPermitidas = async () => {
      if (permissions.loading) return;
      
      try {
        setLoadingUnidades(true);
        console.log('🔍 Carregando unidades baseado no nível:', permissions.nivel);
        console.log('📱 Status online:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
        
        let unidades: Array<{id: number; nome: string}> = [];
        
        if (permissions.nivel === 'unidade' && permissions.estabelecimentoId) {
          // Para usuário de unidade: apenas sua unidade
          
          if (!navigator.onLine) {
            // 📱 MODO OFFLINE: Buscar do cache
            console.log('📱 Modo offline: buscando unidade do cache...');
            const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos') || 
                                          await indexedDBService.getOpcoes('estabelecimentos');
            
            if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
              const unidade = cachedEstabelecimentos.find((est: any) => 
                est.idestabelecimento === permissions.estabelecimentoId
              );
              
              if (unidade) {
                unidades = [{
                  id: unidade.idestabelecimento,
                  nome: unidade.nome
                }];
                console.log('✅ Unidade encontrada no cache:', unidade.nome);
              }
            }
          } else {
            // 🌐 MODO ONLINE: Buscar da API
            const response = await usuarioGestaoService.getEstabelecimentoComHierarquia(permissions.estabelecimentoId);
            unidades = [{
              id: response.idestabelecimento,
              nome: response.nome
            }];
          }
          
          // Pré-selecionar automaticamente a unidade do usuário
          if (formData.unidadeNotificadora === '' && unidades.length > 0) {
            console.log('🏥 Pré-selecionando unidade do usuário:', unidades[0].nome);
            setFormData(prev => ({
              ...prev,
              unidadeNotificadora: unidades[0].id.toString()
            }));
          }
        } else if (permissions.nivel === 'municipio' && permissions.municipioId) {
          // Para usuário de município: todas as unidades do município
          
          if (!navigator.onLine) {
            // 📱 MODO OFFLINE: Filtrar do cache
            console.log('📱 Modo offline: filtrando estabelecimentos do município no cache...');
            const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos') || 
                                          await indexedDBService.getOpcoes('estabelecimentos');
            
            if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
              unidades = cachedEstabelecimentos
                .filter((est: any) => est.tipo_municipio_idtipo_municipio === permissions.municipioId && est.ativo === 'S')
                .map((est: any) => ({
                  id: est.idestabelecimento,
                  nome: est.nome
                }));
              console.log(`✅ ${unidades.length} estabelecimentos do município encontrados no cache`);
            }
          } else {
            // 🌐 MODO ONLINE: Buscar da API
            unidades = await usuarioGestaoService.getEstabelecimentosPorMunicipio(permissions.municipioId);
          }
        } else if (permissions.nivel === 'estado' && permissions.estadoId) {
          // Para usuário de estado: todas as unidades do estado (Pará)
          
          if (!navigator.onLine) {
            // 📱 MODO OFFLINE: Usar TODOS do cache (já filtrados hierarquicamente)
            console.log('📱 Modo offline: usando cache de estabelecimentos permitidos...');
            const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos');
            
            if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
              unidades = cachedEstabelecimentos
                .filter((est: any) => est.ativo === 'S')
                .map((est: any) => ({
                  id: est.idestabelecimento,
                  nome: est.nome
                }));
              console.log(`✅ ${unidades.length} estabelecimentos do estado encontrados no cache offline`);
            } else {
              console.warn('⚠️ Cache offline vazio! Execute o download de dados primeiro.');
            }
          } else {
            // 🌐 MODO ONLINE: Buscar da API
            unidades = await usuarioGestaoService.getEstabelecimentosPorEstado(permissions.estadoId);
          }
        }
        
        setUnidadesPermitidas(unidades);
        console.log(`✅ ${unidades.length} unidades carregadas para nível ${permissions.nivel}`);
        
      } catch (error) {
        console.error('❌ Erro ao carregar unidades permitidas:', error);
        
        // ✅ FALLBACK: Se der erro (ex: offline), tentar carregar do cache
        if (!navigator.onLine) {
          console.log('🔄 Tentando fallback para cache offline...');
          try {
            const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos') || 
                                          await indexedDBService.getOpcoes('estabelecimentos');
            
            if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
              const unidades = cachedEstabelecimentos
                .filter((est: any) => est.ativo === 'S')
                .map((est: any) => ({
                  id: est.idestabelecimento,
                  nome: est.nome
                }));
              setUnidadesPermitidas(unidades);
              console.log(`✅ Fallback: ${unidades.length} unidades carregadas do cache`);
            }
          } catch (cacheError) {
            console.error('❌ Erro ao carregar do cache:', cacheError);
          }
        }
      } finally {
        setLoadingUnidades(false);
      }
    };

    loadUnidadesPermitidas();
  }, [permissions.loading, permissions.nivel, permissions.estabelecimentoId, permissions.municipioId, permissions.estadoId, formData.unidadeNotificadora]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<Bell className="h-5 w-5 text-orange-500" />}
        title="5. Informações da unidade notificadora"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data do Atendimento */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Data do Atendimento
              </label>
              <CustomDateInput
                name="dataAtendimento"
                className={`w-full p-3 border ${
                  errors.dataAtendimento
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                value={formData.dataAtendimento}
                onChange={handleChange}
                data-error={errors.dataAtendimento ? "true" : "false"}
              />
              {errors.dataAtendimento && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dataAtendimento}
                </p>
              )}
            </div>

            {/* Unidade Notificadora */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Unidade Notificadora <span className="text-red-500">*</span>
                {permissions.nivel === 'unidade' && permissions.estabelecimentoId && (
                  <span className="text-sm text-blue-600 ml-1">(Pré-selecionada)</span>
                )}
              </label>
              <UnidadeNotificadoraField
                value={formData.unidadeNotificadora}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    unidadeNotificadora: value,
                  }))
                }
                label=""
                placeholder={
                  loadingUnidades 
                    ? "Carregando unidades..." 
                    : permissions.nivel === 'unidade' 
                      ? "Sua unidade será selecionada automaticamente"
                      : permissions.nivel === 'municipio'
                        ? "Buscar unidades do seu município..."
                        : "Buscar unidades do Pará..."
                }
                /** 
                 * 🔒 MODO ONLINE: Restringir por allowedOptions 
                 * 📱 MODO OFFLINE: Cache já está filtrado hierarquicamente, não restringir
                 * ⚠️ IMPORTANTE: Se lista vazia, passar undefined para buscar do cache
                 */
                restrictToAllowed={navigator.onLine && unidadesPermitidas.length > 0}
                allowedOptions={navigator.onLine && unidadesPermitidas.length > 0 ? unidadesPermitidas.map(u => ({
                  idestabelecimento: u.id,
                  nome: u.nome,
                  // Se você tiver mais campos disponíveis, inclua aqui:
                  // cnes: u.cnes,
                  // cidade: u.cidade,
                  // bairro: u.bairro,
                })) : undefined}
                denyOutsideMessage={
                  permissions.nivel === 'unidade' 
                    ? "Você só pode selecionar sua própria unidade"
                    : permissions.nivel === 'municipio'
                      ? "Você só pode selecionar unidades do seu município"
                      : "Você só pode selecionar unidades do Estado do Pará"
                }
                hasError={!!errors.unidadeNotificadora}
                className={`${errors.unidadeNotificadora ? "border-red-500 bg-red-50" : ""}`}
              />
              {errors.unidadeNotificadora && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.unidadeNotificadora}
                </p>
              )}
              {permissions.nivel === 'unidade' && unidadesPermitidas.length > 0 && (
                <p className="mt-1 text-xs text-blue-600">
                  ℹ️ Como usuário de unidade, você só pode notificar por: {unidadesPermitidas[0].nome}
                </p>
              )}
              {permissions.nivel === 'municipio' && (
                <p className="mt-1 text-xs text-green-600">
                  ℹ️ Você pode escolher qualquer unidade do seu município ({unidadesPermitidas.length} unidades disponíveis)
                </p>
              )}
              {permissions.nivel === 'estado' && (
                <p className="mt-1 text-xs text-purple-600">
                  ℹ️ Você pode escolher qualquer unidade do Estado do Pará ({unidadesPermitidas.length} unidades disponíveis)
                </p>
              )}
            </div>

            {/* Nome do Notificador */}
            <FormField
              label="Nome do Notificador"
              name="nomeNotificador"
              value={formData.nomeNotificador}
              onChange={handleChange}
              placeholder="Nome do notificador"
            />

            {/* Contato do Notificador */}
            <div>
              <BrazilianPhoneInput
                name="contatoNotificador"
                value={formData.contatoNotificador}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    contatoNotificador: value,
                  }))
                }
                label="Contato do Notificador"
                placeholder="Digite o número de telefone"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotifierInfoSection;