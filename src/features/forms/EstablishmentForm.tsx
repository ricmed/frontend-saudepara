import React, { useState, useEffect } from "react";
import { ArrowLeft, Building2, Save, Trash2, Eraser, X, Menu } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { EstabelecimentoFormService } from "@/services/EstabelecimentoFormService";
import { usuarioGestaoService } from "@/services/UsuarioGestaoService";  // 🆕 Importar serviço
import {
  FIELD_LENGTHS,
  validateLength,
  validateNumber,
  validateCNES,
  validateCNPJ,
  validateCoordinates,
} from "@/features/forms/utils/validations";
import ExportButtons from "@/features/forms/components/ExportButtons";
import DadosPrincipais from "@/features/forms/components/PrimaryData";
import Endereco from "@/features/forms/components/Address";
import InformacoesComplementares from "@/features/forms/components/ComplementaryInformations";
import QualificacoesHabilitacoes from "@/features/forms/components/QualificationsHabilitations";
import { SideMenu } from "@/features/home/components/SideMenu";
import { Language } from "@/i18n/types";

export interface OptionItem {
  id?: number;
  idtipo_qualificacao?: number;
  idtipo_habilitacao?: number;
  idtipo_estabelecimento?: number;
  idtipo_natureza?: number; // Adicionar
  idtipo_turno?: number; // Adicionar
  tipo_estabelecimento_idtipo_estabelecimento?: number;
  tipo_natureza_idtipo_natureza?: number; // Adicionar
  tipo_turno_idtipo_turno?: number; // Adicionar
  tipo_habilitacao_idtipo_habilitacao?: number;
  descricao: string;
}

interface EstabelecimentoData {
  id?: number;
  codigo_unidade: string; // Mude para aceitar indefinido
  nome: string;
  cnes?: string;
  cnpj?: string;
  cidade?: string;
  municipioId?: number | null; // 🆕 Campo para associação com município
  logradouro?: string;
  bairro?: string;
  numero?: string;
  latitude?: string;
  longitude?: string;
  tipoEstabelecimentoId: number | null;
  tipoNaturezaId: number | null;
  tipoTurnoId: number | null;
  ativo: string;
  habilitacoes?: number[];
  habilitacoes_selecionadas?: Array<{ id: number; descricao: string }>;
  qualificacoes?: number[];
  tipo_estabelecimento_descricao?: string;
  tipo_natureza_descricao?: string;
  tipo_turno_descricao?: string;
}

const initialEstabelecimentoState: EstabelecimentoData = {
  codigo_unidade: "",
  nome: "",
  cnes: "",
  cnpj: "",
  cidade: "",
  municipioId: null, // 🆕 Inicializar como null
  logradouro: "",
  bairro: "",
  numero: "",
  latitude: "",
  longitude: "",
  tipoEstabelecimentoId: null,
  tipoNaturezaId: null,
  tipoTurnoId: null,
  ativo: "N",
};

interface FieldErrors {
  [key: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

const EstabelecimentoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  // Estado para controlar o SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Estados para o SideMenu
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("pt-BR");
  
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState<
    OptionItem[]
  >([]);
  const [tiposNatureza, setTiposNatureza] = useState<OptionItem[]>([]);
  const [tiposTurno, setTiposTurno] = useState<OptionItem[]>([]);
  const [municipios, setMunicipios] = useState<Array<{ id: number; descricao: string }>>([]);  // 🆕 Estado para municípios
  const [habilitacoes, setHabilitacoes] = useState<OptionItem[]>([]);
  const [qualificacoesDisponiveis, setQualificacoesDisponiveis] = useState<
    OptionItem[]
  >([]);
  const [habilitacoesSelecionadas, setHabilitacoesSelecionadas] = useState<
    OptionItem[]
  >([]);
  const [qualificacoesSelecionadas, setQualificacoesSelecionadas] = useState<
    OptionItem[]
  >([]);
  const [, setCurrentHabilitacoes] = useState<OptionItem[]>([]);
  const [estabelecimento, setEstabelecimento] = useState<EstabelecimentoData>(
    initialEstabelecimentoState
  );
  const [originalEstabelecimento, setOriginalEstabelecimento] =
    useState<EstabelecimentoData | null>(null);
  const [addressFieldsModified, setAddressFieldsModified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🔒 Proteção contra submits duplicados

  const validateField = (name: string, value: string) => {
    let errorMsg = "";
    const requiredFields = ["nome", "cidade", "logradouro", "bairro", "numero"];
    if (!value && !requiredFields.includes(name)) return true;
    switch (name) {
      case "codigo_unidade":
        if (value) {
          const numResult = validateNumber(value);
          if (!numResult.isValid) errorMsg = numResult.message || "";
          const lenResult = validateLength(value, FIELD_LENGTHS.CODIGO_UNIDADE);
          if (!errorMsg && !lenResult.isValid)
            errorMsg = lenResult.message || "";
        }
        break;
      case "nome":
        if (!value.trim()) errorMsg = "Nome é obrigatório";
        else {
          const lenResult = validateLength(value, FIELD_LENGTHS.NOME);
          if (!lenResult.isValid) errorMsg = lenResult.message || "";
        }
        break;
      case "cnes":
        if (value) {
          const cnesResult = validateCNES(value);
          if (!cnesResult.isValid) errorMsg = cnesResult.message || "";
        }
        break;
      case "cnpj":
        if (value) {
          const cnpjResult = validateCNPJ(value);
          if (!cnpjResult.isValid) errorMsg = cnpjResult.message || "";
        }
        break;
      case "latitude":
        if (value) {
          const latResult = validateCoordinates(value, "lat");
          if (!latResult.isValid) errorMsg = latResult.message || "";
        }
        break;
      case "longitude":
        if (value) {
          const lngResult = validateCoordinates(value, "lng");
          if (!lngResult.isValid) errorMsg = lngResult.message || "";
        }
        break;
      case "numero":
        if (value) {
          const numResult = validateNumber(value);
          if (!numResult.isValid) errorMsg = numResult.message || "";
        }
        break;
      default:
        if (value) {
          const maxLength =
            FIELD_LENGTHS[name.toUpperCase() as keyof typeof FIELD_LENGTHS];
          if (maxLength) {
            const lenResult = validateLength(value, maxLength);
            if (!lenResult.isValid) errorMsg = lenResult.message || "";
          }
        }
    }
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return !errorMsg;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // 🆕 Buscar contexto do usuário para filtrar municípios
        let userAccess: any = null;
        let municipiosData: any[] = [];
        
        try {
          userAccess = await usuarioGestaoService.getUserAccess();
          console.log('🔐 Acesso do usuário:', userAccess);
          
          // Carregar municípios baseado no nível de acesso
          if (userAccess) {
            if (userAccess.nivel === 'unidade' || userAccess.nivel === 'estabelecimento') {
              // Usuário de unidade: buscar município do estabelecimento
              if (userAccess.estabelecimentoId) {
                const estabelecimento = await usuarioGestaoService.getEstabelecimentoComHierarquia(userAccess.estabelecimentoId);
                if (estabelecimento?.tipo_municipio) {
                  municipiosData = [{
                    idtipo_municipio: estabelecimento.tipo_municipio.idtipo_municipio,
                    id: estabelecimento.tipo_municipio.idtipo_municipio,
                    descricao: estabelecimento.tipo_municipio.descricao
                  }];
                }
              }
            } else if (userAccess.nivel === 'municipio') {
              // Usuário de município: buscar apenas o município dele
              if (userAccess.municipioId) {
                try {
                  const municipio = await usuarioGestaoService.getMunicipioComEstado(userAccess.municipioId);
                  municipiosData = [{
                    idtipo_municipio: municipio.idtipo_municipio,
                    id: municipio.idtipo_municipio,
                    descricao: municipio.descricao
                  }];
                } catch (error) {
                  console.warn('⚠️ Erro ao buscar município específico, tentando pelo endpoint geral');
                  const response = await fetch(`/api/municipios/${userAccess.municipioId}`, { credentials: 'include' });
                  if (response.ok) {
                    const mun = await response.json();
                    municipiosData = [{
                      idtipo_municipio: mun.idtipo_municipio || mun.id,
                      id: mun.idtipo_municipio || mun.id,
                      descricao: mun.descricao
                    }];
                  }
                }
              }
            } else if (userAccess.nivel === 'estado') {
              // Usuário de estado: buscar todos os municípios do estado
              if (userAccess.estadoId) {
                try {
                  municipiosData = await usuarioGestaoService.getMunicipiosPorEstado(userAccess.estadoId);
                } catch (error) {
                  console.warn('⚠️ Erro ao buscar municípios do estado, tentando endpoint geral');
                  const response = await fetch(`/api/municipios/estado/${userAccess.estadoId}`, { credentials: 'include' });
                  if (response.ok) {
                    municipiosData = await response.json();
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Não foi possível determinar contexto do usuário, carregando todos os municípios');
        }
        
        // Se não conseguiu carregar municípios pelo nível de acesso, tenta carregar todos
        if (municipiosData.length === 0) {
          const response = await fetch('/api/municipios', { credentials: 'include' });
          if (response.ok) {
            municipiosData = await response.json();
          }
        }
        
        // Buscar dados brutos primeiro
        const [
          tiposEstData,
          tiposNatData,
          tiposTurData,
          habsData,
          qualsData,
          estabelecimentoData,
        ] = await Promise.all([
          EstabelecimentoFormService.getTiposEstabelecimento(),
          EstabelecimentoFormService.getTiposNatureza(),
          EstabelecimentoFormService.getTiposTurno(),
          EstabelecimentoFormService.getHabilitacoes(),
          EstabelecimentoFormService.getQualificacoes(),
          id ? EstabelecimentoFormService.getById(Number(id)) : null,
        ]);

        // Normalizar os dados para o formato esperado
        const tiposEst = tiposEstData
          .map((item) => ({
            id: Number(item.idtipo_estabelecimento || item.id),
            descricao: item.descricao,
          }))
          .sort((a, b) => a.descricao.localeCompare(b.descricao));

        const tiposNat = tiposNatData
          .map((item) => ({
            id: Number(
              "idtipo_natureza" in item ? item.idtipo_natureza : item.id
            ),
            descricao: item.descricao,
          }))
          .sort((a, b) => a.descricao.localeCompare(b.descricao));

        const tiposTur = tiposTurData
          .map((item) => ({
            id: Number((item as any).idtipo_turno || item.id),
            descricao: item.descricao,
          }))
          .sort((a, b) => a.descricao.localeCompare(b.descricao));

        const habs = habsData
          .map((item) => ({
            id: Number(item.idtipo_habilitacao || item.id),
            descricao: item.descricao,
          }))
          .sort((a, b) => a.descricao.localeCompare(b.descricao));

        const quals = qualsData
          .map((item) => ({
            id: Number(item.idtipo_qualificacao || item.id),
            descricao: item.descricao,
          }))
          .sort((a, b) => a.descricao.localeCompare(b.descricao));

        // 🆕 Processar municípios
        const muns = Array.isArray(municipiosData) 
          ? municipiosData
              .map((item: any) => ({
                id: Number(item.idtipo_municipio || item.id),
                descricao: item.descricao,
              }))
              .sort((a, b) => a.descricao.localeCompare(b.descricao))
          : [];

        setTiposEstabelecimento(tiposEst);
        setTiposNatureza(tiposNat);
        setTiposTurno(tiposTur);
        setMunicipios(muns); // 🆕 Salvar municípios no estado
        setHabilitacoes(habs);
        setQualificacoesDisponiveis(quals);
        setCurrentHabilitacoes(habs);
        
        // 🆕 Log para debug
        console.log('📊 Dados carregados:', {
          tiposEstabelecimento: tiposEst.length,
          tiposNatureza: tiposNat.length,
          tiposTurno: tiposTur.length,
          municipios: muns.length,
          municipiosCarregados: muns,
          habilitacoes: habs.length,
          qualificacoes: quals.length,
          acessoUsuario: userAccess
        });

        if (estabelecimentoData) {
          const formatEstabelecimento = {
            ...estabelecimentoData,
            tipoEstabelecimentoId: estabelecimentoData.tipoEstabelecimentoId
              ? Number(estabelecimentoData.tipoEstabelecimentoId)
              : null,
            tipoNaturezaId: estabelecimentoData.tipoNaturezaId
              ? Number(estabelecimentoData.tipoNaturezaId)
              : null,
            tipoTurnoId: estabelecimentoData.tipoTurnoId
              ? Number(estabelecimentoData.tipoTurnoId)
              : null,
            // 🆕 Mapear municipioId do backend
            municipioId: estabelecimentoData.tipo_municipio_idtipo_municipio 
              ? Number(estabelecimentoData.tipo_municipio_idtipo_municipio)
              : null,
          };
          setEstabelecimento(formatEstabelecimento);
          setOriginalEstabelecimento(formatEstabelecimento);
          const habSelecionadas = habs.filter((h) => {
            // Se não tiver habilitações, retorna false
            if (!estabelecimentoData.habilitacoes) return false;
            
            // Use any para evitar inferência incorreta de tipo
            return estabelecimentoData.habilitacoes.some((hab: any) => {
              // Se for número, compara diretamente
              if (typeof hab === 'number') {
                return Number(hab) === Number(h.id);
              }
              
              // Se for objeto, tenta extrair o ID de forma segura
              if (hab && typeof hab === 'object') {
                // Tenta acessar as propriedades de forma segura
                const habId = hab.id !== undefined ? hab.id : 
                             (hab.idtipo_habilitacao !== undefined ? hab.idtipo_habilitacao : null);
                
                return habId !== null && Number(habId) === Number(h.id);
              }
              
              return false;
            });
          });
          const qualSelecionadas = quals.filter((q) =>
            estabelecimentoData.qualificacoes?.includes(Number(q.id))
          );
          setHabilitacoesSelecionadas(habSelecionadas);
          setQualificacoesSelecionadas(qualSelecionadas);
          setQualificacoesDisponiveis(
            quals.filter(
              (q) =>
                !qualSelecionadas.some((sel) => Number(sel.id) === Number(q.id))
            )
          );
          setCurrentHabilitacoes(
            habs.filter(
              (h) =>
                !habSelecionadas.some((sel) => Number(sel.id) === Number(h.id))
            )
          );
        }
      } catch (error) {
        setError("Erro ao carregar dados iniciais");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const validateForm = async () => {
    if (!estabelecimento.nome?.trim())
      throw new Error("O campo Nome é obrigatório");
    if (!estabelecimento.municipioId)  // 🆕 Validar município
      throw new Error("O campo Município é obrigatório");
    if (!estabelecimento.cidade?.trim())
      throw new Error("O campo Cidade é obrigatório");
    if (!estabelecimento.logradouro?.trim())
      throw new Error("O campo Logradouro é obrigatório");
    if (!estabelecimento.bairro?.trim())
      throw new Error("O campo Bairro é obrigatório");
    if (!estabelecimento.numero?.trim())
      throw new Error("O campo Número é obrigatório");
    if (!estabelecimento.tipoEstabelecimentoId)
      throw new Error("O Tipo de Estabelecimento é obrigatório");
    if (!estabelecimento.tipoNaturezaId)
      throw new Error("A Natureza é obrigatória");
    if (!estabelecimento.tipoTurnoId)
      throw new Error("O Turno de Atendimento é obrigatório");
    if (estabelecimento.ativo === "S") {
      if (!estabelecimento.latitude || !estabelecimento.longitude) {
        throw new Error(
          "Latitude e Longitude são obrigatórias para ativação do estabelecimento"
        );
      }
      if (estabelecimento.latitude) {
        const lat = Number(estabelecimento.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90)
          throw new Error("Latitude inválida (deve estar entre -90 e 90)");
      }
      if (estabelecimento.longitude) {
        const lng = Number(estabelecimento.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180)
          throw new Error("Longitude inválida (deve estar entre -180 e 180)");
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    validateField(name, value);
    setError(null);
    const addressFields = ["cidade", "logradouro", "bairro", "numero"];
    if (addressFields.includes(name)) setAddressFieldsModified(true);
    
    // 🆕 Converter municipioId para número
    if (name === 'municipioId') {
      setEstabelecimento((prev) => ({ 
        ...prev, 
        [name]: value ? Number(value) : null 
      }));
    } else {
      setEstabelecimento((prev) => ({ ...prev, [name]: value }));
    }
  };

  const prepareDataForSubmission = () => {
    const cleanData = Object.entries(estabelecimento).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === "string" ? value.trim() : value,
      }),
      {} as Partial<EstabelecimentoData>
    );

    // Para habilitações, extrair o ID correto
    const habilitacoesIds = habilitacoesSelecionadas
      .map((h) => {
        // Tentar obter o ID no formato que o backend espera
        if (typeof h === "number") return h;
        return (
          h.idtipo_habilitacao || h.id || h.tipo_habilitacao_idtipo_habilitacao
        );
      })
      .filter((id) => id != null);

    console.log("IDs das habilitações que serão enviados:", habilitacoesIds);
    
    // 🆕 Log de debug para município
    console.log("📍 Debug município:", {
      municipioIdOriginal: estabelecimento.municipioId,
      municipioIdClean: cleanData.municipioId,
      tipoMunicipioQueSeraEnviado: cleanData.municipioId
    });

    const dataToSend = {
      ...cleanData,
      tipo_estabelecimento_idtipo_estabelecimento:
        cleanData.tipoEstabelecimentoId,
      tipo_natureza_idtipo_natureza: cleanData.tipoNaturezaId,
      tipo_turno_idtipo_turno: cleanData.tipoTurnoId,
      tipo_municipio_idtipo_municipio: cleanData.municipioId, // 🆕 Incluir município
      habilitacoes: habilitacoesIds,
      qualificacoes: qualificacoesSelecionadas
        .map((q) => q.id || q.idtipo_qualificacao)
        .filter((id) => id != null),
      ativo: cleanData.ativo || "N",
    };
    
    console.log("📦 Dados que serão enviados:", dataToSend);
    
    return dataToSend;
  };

  const isFormModified = (): boolean => {
    if (originalEstabelecimento) {
      return (
        JSON.stringify(estabelecimento) !==
        JSON.stringify(originalEstabelecimento)
      );
    }
    return (
      JSON.stringify(estabelecimento) !==
      JSON.stringify(initialEstabelecimentoState)
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 🔒 PROTEÇÃO: Prevenir múltiplos submits
    if (isSubmitting || loading) {
      console.warn('⚠️ Submit bloqueado - já existe uma operação em andamento');
      return;
    }
    
    setIsSubmitting(true); // Bloquear novos submits
    setError(null);
    
    try {
      await validateForm();
      
      // 🔍 VALIDAÇÃO DE DUPLICATAS - apenas para novos estabelecimentos
      if (!id) {
        console.log('🔍 Verificando duplicatas...');
        
        // ⚠️ IMPORTANTE: Desabilitar check duplicate por enquanto pois o endpoint não existe
        // TODO: Implementar endpoint /api/estabelecimentos/check-duplicate no backend
        /*
        const validationPromises = [];
        
        if (estabelecimento.codigo_unidade) {
          validationPromises.push(
            EstabelecimentoFormService.checkDuplicate(
              "codigo_unidade",
              estabelecimento.codigo_unidade
            )
          );
        }
        if (estabelecimento.cnes) {
          validationPromises.push(
            EstabelecimentoFormService.checkDuplicate(
              "cnes",
              estabelecimento.cnes
            )
          );
        }
        if (estabelecimento.cnpj) {
          // 🎭 Remover máscara do CNPJ antes de verificar duplicata
          const cnpjSemMascara = estabelecimento.cnpj.replace(/\D/g, '');
          validationPromises.push(
            EstabelecimentoFormService.checkDuplicate(
              "cnpj",
              cnpjSemMascara
            )
          );
        }
        
        if (validationPromises.length > 0) {
          const results = await Promise.all(validationPromises);
          const duplicates = results.filter((r) => r.isDuplicate);
          
          if (duplicates.length > 0) {
            const fieldNames: Record<string, string> = {
              codigo_unidade: 'Código da Unidade',
              cnes: 'CNES',
              cnpj: 'CNPJ'
            };
            const fieldName = fieldNames[duplicates[0].field] || duplicates[0].field;
            throw new Error(`❌ ${fieldName} já cadastrado no sistema. Por favor, verifique os dados.`);
          }
        }
        */
        console.log('✅ Verificação de duplicatas desabilitada temporariamente');
      }
      
      setLoading(true);
      const dataToSubmit = prepareDataForSubmission();
      
      if (id) {
        console.log('📝 Atualizando estabelecimento...');
        await EstabelecimentoFormService.update(Number(id), dataToSubmit as any);
        alert("Estabelecimento atualizado com sucesso!");
      } else {
        console.log('➕ Criando novo estabelecimento...');
        await EstabelecimentoFormService.create(dataToSubmit as any);
        alert("Estabelecimento criado com sucesso!");
      }
      navigate(-1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao salvar estabelecimento";
      setError(errorMessage);
      console.error("❌ Erro ao salvar:", err);
    } finally {
      setLoading(false);
      setIsSubmitting(false); // Liberar para novos submits
    }
  };

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm("Tem certeza que deseja excluir este estabelecimento?")
    )
      return;
    try {
      setLoading(true);
      await EstabelecimentoFormService.delete(Number(id));
      alert("Estabelecimento excluído com sucesso!");
      navigate(-1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao excluir estabelecimento";
      setError(errorMessage);
      console.error("Erro ao excluir:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (
      isFormModified() &&
      !window.confirm("Deseja descartar as alterações não salvas?")
    )
      return;
    navigate(-1);
  };

  const handleReset = () => {
    setEstabelecimento(initialEstabelecimentoState);
    setFieldErrors({});
    setError(null);
    setHabilitacoesSelecionadas([]);
    setQualificacoesSelecionadas([]);
  };

  const getFormattedAddress = () => {
    const parts = [
      estabelecimento.logradouro,
      estabelecimento.numero,
      estabelecimento.bairro,
      estabelecimento.cidade,
      "Pará",
      "Brasil",
    ].filter(Boolean);
    return parts.join(", ");
  };

  useEffect(() => {
    if (!addressFieldsModified) return;
    const updateCoordinates = async () => {
      if (
        !estabelecimento.cidade ||
        !estabelecimento.logradouro ||
        !estabelecimento.bairro ||
        !estabelecimento.numero
      )
        return;
      try {
        const geocoder = new google.maps.Geocoder();
        const address = getFormattedAddress();
        const result = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results)
                resolve(results);
              else reject(status);
            });
          }
        );
        if (result && result[0]?.geometry?.location) {
          const { lat, lng } = result[0].geometry.location;
          setEstabelecimento((prev) => ({
            ...prev,
            latitude: lat().toString(),
            longitude: lng().toString(),
          }));
        }
      } catch (error) {
        console.error("Erro ao geocodificar endereço:", error);
      }
    };
    const timeoutId = setTimeout(updateCoordinates, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    estabelecimento.cidade,
    estabelecimento.logradouro,
    estabelecimento.bairro,
    estabelecimento.numero,
    addressFieldsModified,
  ]);

  const updateAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat, lng };
      const result = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results)
              resolve(results);
            else reject(status);
          });
        }
      );
      if (result && result[0]) {
        const addressComponents = result[0].address_components;
        let newAddress = { cidade: "", bairro: "", logradouro: "", numero: "" };
        addressComponents.forEach((component) => {
          const types = component.types;
          if (types.includes("administrative_area_level_2"))
            newAddress.cidade = component.long_name;
          else if (
            types.includes("sublocality") ||
            types.includes("neighborhood")
          )
            newAddress.bairro = component.long_name;
          else if (types.includes("route"))
            newAddress.logradouro = component.long_name;
          else if (types.includes("street_number"))
            newAddress.numero = component.long_name;
        });
        setEstabelecimento((prev) => ({
          ...prev,
          cidade: newAddress.cidade || prev.cidade,
          bairro: newAddress.bairro || prev.bairro,
          logradouro: newAddress.logradouro || prev.logradouro,
          numero: newAddress.numero || prev.numero,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));
        setAddressFieldsModified(false);
      }
    } catch (error) {
      console.error("Erro ao obter endereço:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-white/90 p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={handleBack}
              className="text-white/90 p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-white/90" />
              <h1 className="text-xl font-semibold text-white">
                {id ? "Editar" : "Novo"} Estabelecimento
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ExportButtons
              data={estabelecimento}
              fileName={`estabelecimento-${estabelecimento.codigo_unidade || "novo"}`}
            />
            <div className="h-6 w-px bg-white/20" />
            <div className="flex gap-3">
              <button
                type="submit"
                form="estabelecimento-form"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || isSubmitting}
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
              {id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 🔄 FEEDBACK VISUAL DE SALVAMENTO */}
          {isSubmitting && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    Salvando estabelecimento... Por favor, aguarde.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form
            id="estabelecimento-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <DadosPrincipais
              estabelecimento={estabelecimento}
              handleInputChange={handleInputChange}
              fieldErrors={fieldErrors}
            />
            <Endereco
              estabelecimento={estabelecimento}
              handleInputChange={handleInputChange}
              fieldErrors={fieldErrors}
              updateAddressFromCoordinates={updateAddressFromCoordinates}
              municipios={municipios}
            />
            <InformacoesComplementares
              estabelecimento={estabelecimento}
              handleInputChange={handleInputChange}
              tiposEstabelecimento={tiposEstabelecimento}
              tiposNatureza={tiposNatureza}
              tiposTurno={tiposTurno}
            />
            <QualificacoesHabilitacoes
              qualificacoesDisponiveis={qualificacoesDisponiveis}
              setQualificacoesDisponiveis={setQualificacoesDisponiveis}
              qualificacoesSelecionadas={qualificacoesSelecionadas}
              setQualificacoesSelecionadas={setQualificacoesSelecionadas}
              habilitacoes={habilitacoes}
              setHabilitacoes={setHabilitacoes}
              habilitacoesSelecionadas={habilitacoesSelecionadas}
              setHabilitacoesSelecionadas={setHabilitacoesSelecionadas}
            />
            <div className="flex justify-center gap-4 mt-8 pb-8">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || isSubmitting}
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <Eraser className="h-4 w-4" />
                <span>Limpar</span>
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
              {id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir</span>
                </button>
              )}
            </div>          </form>
        </div>
      </main>
      
      {/* SideMenu */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
    </div>
  );
};

export default EstabelecimentoForm;
