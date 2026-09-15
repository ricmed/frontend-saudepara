import indexedDBService from '@/services/indexedDB';
import { CBOService } from '@/services/CBOService';
import type { FormData } from '@/features/notificationForms/components/types';
import type { ExportOptions } from '@/features/notificationForms/components/exportUtilities';
import { findCboOption, looksLikeNumericId } from '@/features/notificationForms/utils/exportCatalogLabels';

function hasEstabelecimento(
  id: string,
  options: ExportOptions['estabelecimentoOptions'] | undefined,
): boolean {
  if (!id || !Array.isArray(options)) return false;
  return options.some(
    (opt) =>
      opt &&
      (String(opt.idestabelecimento) === id || String(opt.id) === id),
  );
}

async function loadCachedOpcoes(tipo: string): Promise<unknown[]> {
  try {
    const cached = await indexedDBService.getOpcoes(tipo);
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

/**
 * Completa catálogos que a ficha não guarda no hook (CBO vem só como ID).
 * Sem isso o PDF/impressão imprime o número em vez da descrição.
 */
export async function enrichExportOptions(
  options: ExportOptions,
  formData?: FormData,
): Promise<ExportOptions> {
  const next: ExportOptions = {
    ...options,
    cboOptions: [...(options.cboOptions ?? [])],
    estabelecimentoOptions: [...(options.estabelecimentoOptions ?? [])],
  };

  if (next.cboOptions.length === 0) {
    next.cboOptions = await loadCachedOpcoes('cbos');
  }

  const profissaoId = formData?.profissao;
  if (looksLikeNumericId(profissaoId) && !findCboOption(profissaoId, next.cboOptions)) {
    try {
      const fetched = await CBOService.getById(Number(profissaoId));
      if (fetched) {
        next.cboOptions = [...next.cboOptions, fetched];
      }
    } catch {
      /* cache/API indisponível: o resolver omite o ID em vez de imprimir o número */
    }
  }

  if (next.estabelecimentoOptions.length === 0) {
    next.estabelecimentoOptions = (await loadCachedOpcoes(
      'estabelecimentos',
    )) as ExportOptions['estabelecimentoOptions'];
  }

  const unidadeIds = [formData?.unidadeNotificadora, formData?.localEncaminhamento]
    .map((value) => String(value ?? '').trim())
    .filter((value) => looksLikeNumericId(value));

  const missingUnidade = unidadeIds.some(
    (id) => !hasEstabelecimento(id, next.estabelecimentoOptions),
  );
  if (missingUnidade) {
    const cached = (await loadCachedOpcoes(
      'estabelecimentos',
    )) as ExportOptions['estabelecimentoOptions'];
    if (cached.length > 0) {
      const seen = new Set(
        next.estabelecimentoOptions.map((opt) =>
          String(opt?.idestabelecimento ?? opt?.id ?? ''),
        ),
      );
      for (const opt of cached) {
        const key = String(opt?.idestabelecimento ?? opt?.id ?? '');
        if (key && !seen.has(key)) {
          next.estabelecimentoOptions.push(opt);
          seen.add(key);
        }
      }
    }
  }

  return next;
}
