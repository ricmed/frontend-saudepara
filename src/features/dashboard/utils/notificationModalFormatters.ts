export const getOptionDescriptionById = (
  options: any[],
  id: any,
  idField: string,
  descField: string
): string => {
  if (!options || !Array.isArray(options)) return 'N/A';
  const item = options.find((opt: any) => String(opt[idField]) === String(id));
  return item ? item[descField] : 'N/A';
};

export const formatNotificationDatePtBr = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const formatAgeFromMonths = (
  idade: number | null | undefined
): string => {
  if (!idade || isNaN(Number(idade))) return 'N/A';

  const idadeMeses = Number(idade);
  if (idadeMeses < 12) {
    return `${idadeMeses} ${idadeMeses === 1 ? 'mês' : 'meses'}`;
  }

  const anos = Math.floor(idadeMeses / 12);
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
};
