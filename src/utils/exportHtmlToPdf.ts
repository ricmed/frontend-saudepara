import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

type OverflowRestore = {
  element: HTMLElement;
  originalOverflow: string;
  originalOverflowX: string;
  originalOverflowY: string;
  originalMaxHeight: string;
  originalHeight: string;
};

/**
 * Expande overflow/max-height no nó e descendentes para a captura não cortar listas, gráficos ou bandeiras.
 */
function expandOverflowForCapture(root: HTMLElement): { restores: OverflowRestore[]; restore: () => void } {
  const restores: OverflowRestore[] = [];

  const push = (htmlEl: HTMLElement) => {
    restores.push({
      element: htmlEl,
      originalOverflow: htmlEl.style.overflow,
      originalOverflowX: htmlEl.style.overflowX,
      originalOverflowY: htmlEl.style.overflowY,
      originalMaxHeight: htmlEl.style.maxHeight,
      originalHeight: htmlEl.style.height,
    });
    htmlEl.style.overflow = 'visible';
    htmlEl.style.overflowX = 'visible';
    htmlEl.style.overflowY = 'visible';
    htmlEl.style.maxHeight = 'none';
    htmlEl.style.height = 'auto';
  };

  const computedRoot = window.getComputedStyle(root);
  if (
    computedRoot.overflow !== 'visible' ||
    computedRoot.overflowY !== 'visible' ||
    computedRoot.overflowX !== 'visible' ||
    computedRoot.maxHeight !== 'none'
  ) {
    push(root);
  }

  root.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const cs = window.getComputedStyle(htmlEl);
    if (
      cs.overflow !== 'visible' ||
      cs.overflowY !== 'visible' ||
      cs.overflowX !== 'visible' ||
      cs.maxHeight !== 'none'
    ) {
      push(htmlEl);
    }
  });

  const restore = () => {
    restores.forEach(
      ({
        element,
        originalOverflow,
        originalOverflowX,
        originalOverflowY,
        originalMaxHeight,
        originalHeight,
      }) => {
        element.style.overflow = originalOverflow;
        element.style.overflowX = originalOverflowX;
        element.style.overflowY = originalOverflowY;
        element.style.maxHeight = originalMaxHeight;
        element.style.height = originalHeight;
      },
    );
  };

  return { restore };
}

/**
 * Desenha o canvas em páginas A4 (retrato), fatiando em faixas na origem para não cortar no meio com “janela” única.
 */
function addCanvasPaginatedToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  options: { marginMm: number; footerLines?: string[] },
): void {
  const { marginMm, footerLines = [] } = options;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const footerReserveMm = footerLines.length > 0 ? 8 + footerLines.length * 4.5 : 6;
  const usableW = pageW - 2 * marginMm;
  const usableH = pageH - 2 * marginMm - footerReserveMm;

  const imgWmm = usableW;
  const imgHmmTotal = (canvas.height / canvas.width) * imgWmm;

  const writeFooter = (pageIndex: number, totalPages: number) => {
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    let y = pageH - marginMm - footerReserveMm + 4;
    footerLines.forEach((line) => {
      pdf.text(line, pageW / 2, y, { align: 'center', maxWidth: pageW - 2 * marginMm });
      y += 4.5;
    });
    pdf.text(`Página ${pageIndex} de ${totalPages}`, pageW / 2, pageH - marginMm, { align: 'center' });
  };

  if (imgHmmTotal <= usableH) {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(dataUrl, 'PNG', marginMm, marginMm, imgWmm, imgHmmTotal);
    writeFooter(1, 1);
    return;
  }

  const sliceHeightPx = Math.max(1, Math.floor((usableH / imgWmm) * canvas.width));
  const totalPages = Math.ceil(canvas.height / sliceHeightPx);

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) pdf.addPage();
    const yPx = p * sliceHeightPx;
    const hPx = Math.min(sliceHeightPx, canvas.height - yPx);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = hPx;
    const ctx = slice.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(canvas, 0, yPx, canvas.width, hPx, 0, 0, canvas.width, hPx);
    const sliceHmm = (hPx / canvas.width) * imgWmm;
    const dataUrl = slice.toDataURL('image/png', 1.0);
    pdf.addImage(dataUrl, 'PNG', marginMm, marginMm, imgWmm, sliceHmm);
    writeFooter(p + 1, totalPages);
  }
}

export type ExportHtmlToPdfOptions = {
  element: HTMLElement | null;
  filename: string;
  /** Linhas extras no rodapé (ex.: título do relatório). */
  footerExtraLines?: string[];
  /** Densidade da captura; 2 costuma equilibrar nitidez e memória. */
  pixelRatio?: number;
};

/**
 * Exporta um trecho do DOM para PDF A4 (retrato), com captura via `html-to-image` (melhor fidelidade SVG/CSS
 * que html2canvas em vários cenários) e paginação por fatias para não “cortar” imagens no meio da folha.
 */
export async function exportHtmlElementToPdfA4(options: ExportHtmlToPdfOptions): Promise<void> {
  const { element, filename, footerExtraLines = [], pixelRatio = 2 } = options;
  if (!element) {
    window.alert('Não foi possível localizar o conteúdo para exportar.');
    return;
  }

  const rootOriginalOverflow = element.style.overflow;
  const rootOriginalMaxH = element.style.maxHeight;
  const rootOriginalH = element.style.height;
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.height = 'auto';

  const { restore } = expandOverflowForCapture(element);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => undefined);
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const canvas = await toCanvas(element, {
      pixelRatio,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const marginMm = 10;
    const generated = new Date().toLocaleString('pt-BR');
    const footerLines = [...footerExtraLines, `Gerado em ${generated}`];

    addCanvasPaginatedToPdf(pdf, canvas, { marginMm, footerLines });

    const safeName = filename.replace(/[^\w\-.\u00C0-\u024F]+/g, '_');
    pdf.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
  } catch (e) {
    console.error('exportHtmlElementToPdfA4', e);
    window.alert(
      'Não foi possível gerar o PDF. Se o relatório tiver imagens de outro site, pode ser bloqueio de segurança (CORS). Tente de novo ou use Exportar CSV.',
    );
    throw e;
  } finally {
    restore();
    element.style.overflow = rootOriginalOverflow;
    element.style.maxHeight = rootOriginalMaxH;
    element.style.height = rootOriginalH;
  }
}
