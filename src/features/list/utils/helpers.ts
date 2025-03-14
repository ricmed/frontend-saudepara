import { Estabelecimento } from "../types/estabelecimento";

export const formatHabilitacoes = (estab: Estabelecimento) => {
  return estab.habilitacoes?.map((hab) => hab.descricao).join(", ") || "";
};

export const generatePageNumbers = (current: number, totalPages: number) => {
  const pageNumbers: (number | string)[] = [];

  pageNumbers.push(1);

  if (current > 4) {
    pageNumbers.push("...");
  }

  for (
    let i = Math.max(2, current - 2);
    i <= Math.min(current + 2, totalPages - 1);
    i++
  ) {
    pageNumbers.push(i);
  }

  if (current < totalPages - 3) {
    pageNumbers.push("...");
  }

  if (totalPages > 1) {
    pageNumbers.push(totalPages);
  }

  return Array.from(new Set(pageNumbers));
};

export const showingFrom = (currentPage: number, itemsPerPage: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((currentPage - 1) * itemsPerPage + 1, total);
};

export const showingTo = (currentPage: number, itemsPerPage: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(currentPage * itemsPerPage, total);
};
