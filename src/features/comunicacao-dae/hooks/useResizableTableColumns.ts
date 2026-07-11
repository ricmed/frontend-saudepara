import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_COLUMN_WIDTH = 48;

export type DaeTableColumnId =
  | 'id_comunicacao'
  | 'data_comunicacao'
  | 'semana_epidemiologica'
  | 'nome_paciente'
  | 'origem_tipo'
  | 'unidade_notificadora'
  | 'dae'
  | 'municipio'
  | 'anexos'
  | 'acoes';

export const DAE_TABLE_DEFAULT_WIDTHS: Record<DaeTableColumnId, number> = {
  id_comunicacao: 72,
  data_comunicacao: 88,
  semana_epidemiologica: 64,
  nome_paciente: 140,
  origem_tipo: 72,
  unidade_notificadora: 160,
  dae: 180,
  municipio: 130,
  anexos: 64,
  acoes: 200,
};

export const DAE_TABLE_COLUMN_ORDER: DaeTableColumnId[] = [
  'id_comunicacao',
  'data_comunicacao',
  'semana_epidemiologica',
  'nome_paciente',
  'origem_tipo',
  'unidade_notificadora',
  'dae',
  'municipio',
  'anexos',
  'acoes',
];

export function useResizableTableColumns(containerRef: React.RefObject<HTMLElement | null>) {
  const [columnWidths, setColumnWidths] = useState<Record<DaeTableColumnId, number> | null>(null);
  const resizeRef = useRef<{
    columnId: DaeTableColumnId;
    startX: number;
    startWidth: number;
  } | null>(null);
  const initializedRef = useRef(false);

  const fitColumnsToContainer = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const containerW = el.clientWidth;
    if (containerW <= 0) return;

    const defaultSum = Object.values(DAE_TABLE_DEFAULT_WIDTHS).reduce((acc, w) => acc + w, 0);
    const scale = containerW / defaultSum;
    const scaled = Object.fromEntries(
      Object.entries(DAE_TABLE_DEFAULT_WIDTHS).map(([key, width]) => [
        key,
        Math.max(MIN_COLUMN_WIDTH, Math.floor(width * scale)),
      ]),
    ) as Record<DaeTableColumnId, number>;

    setColumnWidths(scaled);
    initializedRef.current = true;
  }, [containerRef]);

  useLayoutEffect(() => {
    if (initializedRef.current) return;
    fitColumnsToContainer();
  }, [fitColumnsToContainer]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const state = resizeRef.current;
      if (!state) return;

      const delta = event.clientX - state.startX;
      const nextWidth = Math.max(MIN_COLUMN_WIDTH, state.startWidth + delta);
      setColumnWidths((prev) => {
        if (!prev) return prev;
        return { ...prev, [state.columnId]: nextWidth };
      });
      resizeRef.current = {
        ...state,
        startX: event.clientX,
        startWidth: nextWidth,
      };
    };

    const endResize = () => {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endResize);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endResize);
      endResize();
    };
  }, []);

  const startResize = useCallback(
    (columnId: DaeTableColumnId, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!columnWidths) return;

      resizeRef.current = {
        columnId,
        startX: event.clientX,
        startWidth: columnWidths[columnId],
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [columnWidths],
  );

  const totalWidth = columnWidths
    ? Object.values(columnWidths).reduce((acc, w) => acc + w, 0)
    : Object.values(DAE_TABLE_DEFAULT_WIDTHS).reduce((acc, w) => acc + w, 0);

  const widths = columnWidths ?? DAE_TABLE_DEFAULT_WIDTHS;

  return {
    columnWidths: widths,
    totalWidth,
    startResize,
    isReady: columnWidths !== null,
  };
}
