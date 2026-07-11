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

export function useResizableTableColumns(
  containerRef: React.RefObject<HTMLElement | null>,
  /** Quando > 0, a tabela está visível no DOM — encaixa colunas no container. */
  layoutKey = 0,
) {
  const [columnWidths, setColumnWidths] = useState<Record<DaeTableColumnId, number>>(
    () => ({ ...DAE_TABLE_DEFAULT_WIDTHS }),
  );
  const widthsRef = useRef(columnWidths);
  widthsRef.current = columnWidths;

  const resizeRef = useRef<{
    columnId: DaeTableColumnId;
    startX: number;
    startWidth: number;
  } | null>(null);
  const fittedRef = useRef(false);

  const fitColumnsToContainer = useCallback(() => {
    const el = containerRef.current;
    if (!el) return false;
    const containerW = el.clientWidth;
    if (containerW <= 0) return false;

    const defaultSum = Object.values(DAE_TABLE_DEFAULT_WIDTHS).reduce((acc, w) => acc + w, 0);
    const scale = containerW / defaultSum;
    const scaled = Object.fromEntries(
      Object.entries(DAE_TABLE_DEFAULT_WIDTHS).map(([key, width]) => [
        key,
        Math.max(MIN_COLUMN_WIDTH, Math.floor(width * scale)),
      ]),
    ) as Record<DaeTableColumnId, number>;

    setColumnWidths(scaled);
    fittedRef.current = true;
    return true;
  }, [containerRef]);

  // Tabela só monta após o loading — ajustar larguras assim que o container existir.
  useLayoutEffect(() => {
    if (fittedRef.current || layoutKey <= 0) return;
    fitColumnsToContainer();
  }, [fitColumnsToContainer, layoutKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || fittedRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!fittedRef.current) {
        fitColumnsToContainer();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, fitColumnsToContainer, layoutKey]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const state = resizeRef.current;
      if (!state) return;

      const delta = event.clientX - state.startX;
      const nextWidth = Math.max(MIN_COLUMN_WIDTH, state.startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [state.columnId]: nextWidth }));
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

  const startResize = useCallback((columnId: DaeTableColumnId, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    resizeRef.current = {
      columnId,
      startX: event.clientX,
      startWidth: widthsRef.current[columnId],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const totalWidth = Object.values(columnWidths).reduce((acc, w) => acc + w, 0);

  return {
    columnWidths,
    totalWidth,
    startResize,
  };
}
