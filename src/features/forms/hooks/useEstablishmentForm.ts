import { useState, useEffect } from "react";
import { EstabelecimentoFormService } from "@/services/EstabelecimentoFormService";
import {
  FIELD_LENGTHS,
  validateLength,
  validateNumber,
  validateCNES,
  validateCNPJ,
  validateCoordinates,
} from "@/features/forms/utils/validations";

export interface EstablishmentData {
  id?: number;
  unitCode: string;
  name: string;
  cnes?: string;
  cnpj?: string;
  city?: string;
  street?: string;
  neighborhood?: string;
  number?: string;
  latitude?: string;
  longitude?: string;
  establishmentTypeId: number | null;
  natureId: number | null;
  shiftId: number | null;
  status: string;
  // Outros campos conforme necessário
}

const initialEstablishmentState: EstablishmentData = {
  unitCode: "",
  name: "",
  cnes: "",
  cnpj: "",
  city: "",
  street: "",
  neighborhood: "",
  number: "",
  latitude: "",
  longitude: "",
  establishmentTypeId: null,
  natureId: null,
  shiftId: null,
  status: "Inactive",
};

const useEstablishmentForm = (id?: string) => {
  const [data, setData] = useState<EstablishmentData>(initialEstablishmentState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Estados para opções dos selects
  const [establishmentTypes, setEstablishmentTypes] = useState<any[]>([]);
  const [natures, setNatures] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // Estados para qualifications e permissions
  const [qualificationsAvailable, setQualificationsAvailable] = useState<any[]>([]);
  const [qualificationsSelected, setQualificationsSelected] = useState<any[]>([]);
  const [permissionsAvailable, setPermissionsAvailable] = useState<any[]>([]);
  const [permissionsSelected, setPermissionsSelected] = useState<any[]>([]);

  const validateField = (name: string, value: string): boolean => {
    let errorMsg = "";
    if (name === "unitCode" && value) {
      const numResult = validateNumber(value);
      if (!numResult.isValid) errorMsg = numResult.message || "";
      const lenResult = validateLength(value, FIELD_LENGTHS.CODIGO_UNIDADE);
      if (!errorMsg && !lenResult.isValid)
        errorMsg = lenResult.message || "";
    }
    if (name === "name") {
      if (!value.trim()) {
        errorMsg = "Name is required";
      } else {
        const lenResult = validateLength(value, FIELD_LENGTHS.NOME);
        if (!lenResult.isValid) errorMsg = lenResult.message || "";
      }
    }
    if (name === "cnes" && value) {
      const cnesResult = validateCNES(value);
      if (!cnesResult.isValid) errorMsg = cnesResult.message || "";
    }
    if (name === "cnpj" && value) {
      const cnpjResult = validateCNPJ(value);
      if (!cnpjResult.isValid) errorMsg = cnpjResult.message || "";
    }
    if (name === "latitude" && value) {
      const latResult = validateCoordinates(value, "lat");
      if (!latResult.isValid) errorMsg = latResult.message || "";
    }
    if (name === "longitude" && value) {
      const lngResult = validateCoordinates(value, "lng");
      if (!lngResult.isValid) errorMsg = lngResult.message || "";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return !errorMsg;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    validateField(name, value);
    setError(null);
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        types,
        naturesData,
        shiftsData,
        quals,
        perms,
        establishmentData,
      ] = await Promise.all([
        EstabelecimentoFormService.getTiposEstabelecimento(),
        EstabelecimentoFormService.getTiposNatureza(),
        EstabelecimentoFormService.getTiposTurno(),
        EstabelecimentoFormService.getQualificacoes(),
        EstabelecimentoFormService.getHabilitacoes(),
        id ? EstabelecimentoFormService.getById(Number(id)) : null,
      ]);
      setEstablishmentTypes(types);
      setNatures(naturesData);
      setShifts(shiftsData);
      setQualificationsAvailable(quals);
      setPermissionsAvailable(perms);

      if (establishmentData) {
        const formatted = {
          ...establishmentData,
          unitCode: establishmentData.codigo_unidade,
          name: establishmentData.nome,
          cnes: establishmentData.cnes,
          cnpj: establishmentData.cnpj,
          city: establishmentData.cidade,
          street: establishmentData.logradouro,
          neighborhood: establishmentData.bairro,
          number: establishmentData.numero,
          latitude: establishmentData.latitude,
          longitude: establishmentData.longitude,
          establishmentTypeId: establishmentData.tipoEstabelecimentoId
            ? Number(establishmentData.tipoEstabelecimentoId)
            : null,
          natureId: establishmentData.tipoNaturezaId
            ? Number(establishmentData.tipoNaturezaId)
            : null,
          shiftId: establishmentData.tipoTurnoId
            ? Number(establishmentData.tipoTurnoId)
            : null,
          status: establishmentData.ativo,
        };
        setData(formatted);
        // Ajuste também os estados de qualificationsSelected e permissionsSelected se necessário.
      }
    } catch (err) {
      setError("Error loading initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const prepareDataForSubmission = () => {
    const cleanData = Object.entries(data).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === "string" ? value.trim() : value,
      }),
      {} as Partial<EstablishmentData>
    );

    return {
      ...cleanData,
      tipo_estabelecimento_idtipo_estabelecimento: cleanData.establishmentTypeId,
      tipo_natureza_idtipo_natureza: cleanData.natureId,
      tipo_turno_idtipo_turno: cleanData.shiftId,
      qualificacoes: qualificationsSelected.map((q: any) => q.id),
      habilitacoes: permissionsSelected.map((p: any) => p.id),
      ativo: cleanData.status || "Inactive",
    };
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const submissionData = prepareDataForSubmission();
      if (id) {
        await EstabelecimentoFormService.update(Number(id), submissionData);
      } else {
        await EstabelecimentoFormService.create(submissionData);
      }
    } catch (err) {
      setError("Error submitting the form");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await EstabelecimentoFormService.delete(Number(id));
    } catch (err) {
      setError("Error deleting the establishment");
    } finally {
      setLoading(false);
    }
  };

  // Funções dummy para formatação de endereço e geocodificação
  const getFormattedAddress = () => {
    const parts = [
      data.street,
      data.number,
      data.neighborhood,
      data.city,
      "State",
      "Country",
    ].filter(Boolean);
    return parts.join(", ");
  };

  const updateAddressFromCoordinates = (lat: number, lng: number) => {
    setData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  return {
    data,
    setData,
    loading,
    error,
    fieldErrors,
    establishmentTypes,
    natures,
    shifts,
    qualificationsAvailable,
    qualificationsSelected,
    permissionsAvailable,
    permissionsSelected,
    handleInputChange,
    handleSubmit,
    handleDelete,
    getFormattedAddress,
    updateAddressFromCoordinates,
    setQualificationsSelected,
    setPermissionsSelected,
    setQualificationsAvailable,
    setPermissionsAvailable,
  };
};

export default useEstablishmentForm;