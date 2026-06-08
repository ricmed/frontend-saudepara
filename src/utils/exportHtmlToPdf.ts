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

type PdfLayout = {
  marginMm: number;
  pageW: number;
  pageH: number;
  usableW: number;
  usableH: number;
  footerReserveMm: number;
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

function createPdfLayout(pdf: jsPDF, marginMm: number, footerLineCount: number): PdfLayout {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const footerReserveMm = footerLineCount > 0 ? 8 + footerLineCount * 4.5 : 6;
  return {
    marginMm,
    pageW,
    pageH,
    usableW: pageW - 2 * marginMm,
    usableH: pageH - 2 * marginMm - footerReserveMm,
    footerReserveMm,
  };
}

function writePdfFooter(
  pdf: jsPDF,
  layout: PdfLayout,
  footerLines: string[],
  pageIndex: number,
  totalPages: number,
): void {
  const { marginMm, pageW, pageH, footerReserveMm } = layout;
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  let y = pageH - marginMm - footerReserveMm + 4;
  footerLines.forEach((line) => {
    pdf.text(line, pageW / 2, y, { align: 'center', maxWidth: pageW - 2 * marginMm });
    y += 4.5;
  });
  pdf.text(`Página ${pageIndex} de ${totalPages}`, pageW / 2, pageH - marginMm, { align: 'center' });
}

function canvasHeightMm(canvas: HTMLCanvasElement, imgWmm: number): number {
  return (canvas.height / canvas.width) * imgWmm;
}

/** Procura faixa clara próxima ao corte ideal para não partir labels/campos. */
function findSnapSliceEndY(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  minY: number,
  maxY: number,
  preferredY: number,
): number {
  const searchStart = Math.max(minY + 24, preferredY - 120);
  const searchEnd = Math.min(maxY - 8, preferredY + 40);
  let bestY = Math.min(preferredY, maxY);
  let bestScore = -1;

  for (let y = searchStart; y <= searchEnd; y += 3) {
    let lightCount = 0;
    let samples = 0;
    for (let x = 0; x < canvasWidth; x += 10) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      samples += 1;
      if (d[0] > 242 && d[1] > 242 && d[2] > 242) lightCount += 1;
    }
    const score = lightCount / samples;
    if (score > bestScore) {
      bestScore = score;
      bestY = y;
    }
  }

  return Math.max(bestY, minY + 40);
}

function drawCanvasSlice(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  yPx: number,
  hPx: number,
  layout: PdfLayout,
  yMm: number,
): number {
  const slice = document.createElement('canvas');
  slice.width = canvas.width;
  slice.height = hPx;
  const ctx = slice.getContext('2d');
  if (!ctx) return yMm;
  ctx.drawImage(canvas, 0, yPx, canvas.width, hPx, 0, 0, canvas.width, hPx);
  const sliceHmm = (hPx / canvas.width) * layout.usableW;
  const dataUrl = slice.toDataURL('image/png', 1.0);
  pdf.addImage(dataUrl, 'PNG', layout.marginMm, yMm, layout.usableW, sliceHmm);
  return yMm + sliceHmm;
}

type PageCursor = {
  pageIndex: number;
};

function ensureSpace(pdf: jsPDF, cursor: PageCursor, layout: PdfLayout, neededMm: number, yMm: number): number {
  if (yMm + neededMm <= layout.marginMm + layout.usableH) return yMm;
  pdf.addPage();
  cursor.pageIndex += 1;
  return layout.marginMm;
}

/**
 * Desenha canvas em páginas A4; tenta encaixar blocos pequenos na mesma folha.
 * Retorna número de páginas adicionadas por este canvas.
 */
function appendCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  layout: PdfLayout,
  cursor: PageCursor,
  startYMm: number,
  options: { scaleToFitMaxRatio?: number },
): number {
  const pagesBefore = pdf.getNumberOfPages();
  let yMm = startYMm;
  let imgWmm = layout.usableW;
  let imgHmm = canvasHeightMm(canvas, imgWmm);
  const maxRatio = options.scaleToFitMaxRatio ?? 1.12;

  if (imgHmm > layout.usableH && imgHmm <= layout.usableH * maxRatio) {
    const scale = layout.usableH / imgHmm;
    imgWmm *= scale;
    imgHmm = layout.usableH;
  }

  if (imgHmm <= layout.usableH) {
    yMm = ensureSpace(pdf, cursor, layout, imgHmm + 2, yMm);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(dataUrl, 'PNG', layout.marginMm, yMm, imgWmm, imgHmm);
    return pdf.getNumberOfPages() - pagesBefore;
  }

  yMm = ensureSpace(pdf, cursor, layout, layout.usableH * 0.25, yMm);
  const sliceHeightPx = Math.max(1, Math.floor((layout.usableH / imgWmm) * canvas.width));
  const fullCtx = canvas.getContext('2d');
  let yPx = 0;

  while (yPx < canvas.height) {
    if (yPx > 0) {
      pdf.addPage();
      cursor.pageIndex += 1;
      yMm = layout.marginMm;
    }

    const remainingPx = canvas.height - yPx;
    let hPx = Math.min(sliceHeightPx, remainingPx);
    if (hPx < remainingPx && fullCtx) {
      const preferredEnd = yPx + hPx;
      const snappedEnd = findSnapSliceEndY(fullCtx, canvas.width, yPx, canvas.height, preferredEnd);
      hPx = Math.max(48, snappedEnd - yPx);
    }

    yMm = drawCanvasSlice(pdf, canvas, yPx, hPx, layout, yMm);
    yPx += hPx;
  }

  return pdf.getNumberOfPages() - pagesBefore;
}

function collectExportBlocks(root: HTMLElement, selector: string): HTMLElement[] {
  const marked = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (marked.length === 0) return [root];

  const leaves = marked.filter((el) => {
    for (const other of marked) {
      if (other !== el && el.contains(other)) return false;
    }
    return root === el || root.contains(el);
  });

  return leaves.sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function prepareElementForCapture(element: HTMLElement): () => void {
  const rootOriginalOverflow = element.style.overflow;
  const rootOriginalMaxH = element.style.maxHeight;
  const rootOriginalH = element.style.height;
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.height = 'auto';
  const { restore } = expandOverflowForCapture(element);

  return () => {
    restore();
    element.style.overflow = rootOriginalOverflow;
    element.style.maxHeight = rootOriginalMaxH;
    element.style.height = rootOriginalH;
  };
}

async function captureElementCanvas(element: HTMLElement, pixelRatio: number): Promise<HTMLCanvasElement> {
  return toCanvas(element, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
}

export type ExportHtmlToPdfOptions = {
  element: HTMLElement | null;
  filename: string;
  footerExtraLines?: string[];
  pixelRatio?: number;
};

export type ExportHtmlBlocksToPdfOptions = ExportHtmlToPdfOptions & {
  blockSelector?: string;
  /** Espaço entre blocos na mesma página (mm). */
  blockGapMm?: number;
};

async function buildFooterLines(footerExtraLines: string[]): Promise<string[]> {
  const generated = new Date().toLocaleString('pt-BR');
  return [...footerExtraLines, `Gerado em ${generated}`];
}

function savePdf(pdf: jsPDF, filename: string): void {
  const safeName = filename.replace(/[^\w\-.\u00C0-\u024F]+/g, '_');
  pdf.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
}

/**
 * Exporta blocos marcados no DOM (campo a campo / painéis), evitando quebra entre label e input.
 */
export async function exportHtmlBlocksToPdfA4(options: ExportHtmlBlocksToPdfOptions): Promise<void> {
  const {
    element,
    filename,
    footerExtraLines = [],
    pixelRatio = 2,
    blockSelector = '[data-visual-export-block]',
    blockGapMm = 3,
  } = options;

  if (!element) {
    window.alert('Não foi possível localizar o conteúdo para exportar.');
    return;
  }

  const blocks = collectExportBlocks(element, blockSelector);
  const restores: Array<() => void> = [];

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => undefined);
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    for (const block of blocks) {
      restores.push(prepareElementForCapture(block));
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const marginMm = 10;
    const footerLines = await buildFooterLines(footerExtraLines);
    const layout = createPdfLayout(pdf, marginMm, footerLines.length);
    const cursor: PageCursor = { pageIndex: 1 };
    let yMm = layout.marginMm;

    for (const block of blocks) {
      const canvas = await captureElementCanvas(block, pixelRatio);
      const naturalHmm = canvasHeightMm(canvas, layout.usableW);
      let drawHmm = naturalHmm;
      let drawWmm = layout.usableW;

      if (naturalHmm > layout.usableH && naturalHmm <= layout.usableH * 1.12) {
        const scale = layout.usableH / naturalHmm;
        drawWmm *= scale;
        drawHmm = layout.usableH;
      }

      if (drawHmm <= layout.usableH) {
        if (yMm + drawHmm > layout.marginMm + layout.usableH) {
          pdf.addPage();
          cursor.pageIndex += 1;
          yMm = layout.marginMm;
        }
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(dataUrl, 'PNG', layout.marginMm, yMm, drawWmm, drawHmm);
        yMm += drawHmm + blockGapMm;
        continue;
      }

      if (yMm > layout.marginMm + 4) {
        pdf.addPage();
        cursor.pageIndex += 1;
      }
      yMm = layout.marginMm;
      appendCanvasToPdf(pdf, canvas, layout, cursor, yMm, { scaleToFitMaxRatio: 1.12 });
      yMm = layout.marginMm;
    }

    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p += 1) {
      pdf.setPage(p);
      writePdfFooter(pdf, layout, footerLines, p, totalPages);
    }

    savePdf(pdf, filename);
  } catch (e) {
    console.error('exportHtmlBlocksToPdfA4', e);
    window.alert(
      'Não foi possível gerar o PDF. Se a ficha tiver mapa externo, pode ser bloqueio de segurança (CORS). Tente de novo.',
    );
    throw e;
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
}

/**
 * Exporta um trecho único do DOM (modo legado — fatia em faixas fixas).
 */
export async function exportHtmlElementToPdfA4(options: ExportHtmlToPdfOptions): Promise<void> {
  const { element, filename, footerExtraLines = [], pixelRatio = 2 } = options;
  if (!element) {
    window.alert('Não foi possível localizar o conteúdo para exportar.');
    return;
  }

  const restore = prepareElementForCapture(element);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => undefined);
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const canvas = await captureElementCanvas(element, pixelRatio);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const marginMm = 10;
    const footerLines = await buildFooterLines(footerExtraLines);
    const layout = createPdfLayout(pdf, marginMm, footerLines.length);
    const cursor: PageCursor = { pageIndex: 1 };

    appendCanvasToPdf(pdf, canvas, layout, cursor, layout.marginMm, { scaleToFitMaxRatio: 1.08 });

    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p += 1) {
      pdf.setPage(p);
      writePdfFooter(pdf, layout, footerLines, p, totalPages);
    }

    savePdf(pdf, filename);
  } catch (e) {
    console.error('exportHtmlElementToPdfA4', e);
    window.alert(
      'Não foi possível gerar o PDF. Se o relatório tiver imagens de outro site, pode ser bloqueio de segurança (CORS). Tente de novo ou use Exportar CSV.',
    );
    throw e;
  } finally {
    restore();
  }
}
