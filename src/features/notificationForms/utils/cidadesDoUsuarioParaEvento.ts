import { MunicipioService } from '@/services/MunicipioService';

const cacheCrs = new Map<number, Promise<number[]>>();

function idValido(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

async function idsDaCrs(crsId: number): Promise<number[]> {
  const guardada = cacheCrs.get(crsId);
  if (guardada) {
    return guardada;
  }
  const pedido = MunicipioService.getIdsByCrs(crsId).catch(() => {
    cacheCrs.delete(crsId);
    return [] as number[];
  });
  cacheCrs.set(crsId, pedido);
  return pedido;
}

/** Cidade do acesso e, na CRS, os municípios da regional. */
export async function cidadesDoUsuarioParaEvento(permissions: {
  municipioId?: number | null;
  crsId?: number | null;
  isCrs?: boolean;
}): Promise<number[]> {
  const ids: number[] = [];
  const municipioId = Number(permissions.municipioId);
  if (idValido(municipioId)) {
    ids.push(municipioId);
  }
  const crsId = Number(permissions.crsId);
  if (permissions.isCrs && idValido(crsId)) {
    ids.push(...(await idsDaCrs(crsId)));
  }
  return [...new Set(ids)];
}
