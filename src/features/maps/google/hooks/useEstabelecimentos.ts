import { useState, useCallback } from 'react';
import { Local, TipoEstabelecimento } from '../types';
import * as XLSX from 'xlsx';

export const useEstabelecimentos = () => {
  const [allPlaces, setAllPlaces] = useState<Local[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Local[]>([]);
  const [tiposEstabelecimentos, setTiposEstabelecimentos] = useState<TipoEstabelecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarDadosExcel = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch("./data/estabelecimentos.xlsx");
      const arrayBuffer = await response.arrayBuffer();

      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
        type: "array",
        cellStyles: true,
        cellDates: true,
      });

      const planilha = workbook.Sheets[workbook.SheetNames[0]];
      const dados = XLSX.utils.sheet_to_json(planilha);

      const estabelecimentos = dados
        .filter((d: any) => d.NU_LATITUDE && d.NU_LONGITUDE)
        .map((d: any) => ({
          id: d.CO_CNES,
          nome: d.NO_FANTASIA,
          lat: parseFloat(d.NU_LATITUDE),
          lng: parseFloat(d.NU_LONGITUDE),
          endereco: `${d.NO_LOGRADOURO}, ${d.NU_ENDERECO} - ${d.NO_BAIRRO}`,
          tipo: d.TP_UNIDADE_DESCRICAO,
          natureza: d.NATUREZA_JURIDICA,
          turno: d.DS_TURNO_ATENDIMENTO,
        }));

      setAllPlaces(estabelecimentos);

      const tiposUnicos = Array.from(new Set(estabelecimentos.map(d => d.tipo)));
      setTiposEstabelecimentos([
        { id: "todos", nome: "Todos os Estabelecimentos" },
        ...tiposUnicos.map(tipo => ({ id: tipo, nome: tipo }))
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados do Excel:", error);
      setIsLoading(false);
    }
  }, []);

  return {
    allPlaces,
    filteredPlaces,
    setFilteredPlaces,
    tiposEstabelecimentos,
    isLoading,
    carregarDadosExcel
  };
};