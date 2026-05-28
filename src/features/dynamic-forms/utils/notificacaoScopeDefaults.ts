import { usuarioGestaoService } from '@/services/UsuarioGestaoService';

export type NotificacaoEscopo = 'livre' | 'estado' | 'municipio' | 'unidade';

function unwrap<T = any>(raw: T | null | undefined): T | null {
  if (raw == null) return null;
  const a = (raw as any).data !== undefined ? (raw as any).data : raw;
  if (a && typeof a === 'object' && (a as any).data !== undefined && !(a as any).idestabelecimento && !(a as any).idtipo_municipio) {
    return (a as any).data ?? a;
  }
  return a as T;
}

export function schemaUsesNotificacao(schema: { sections?: Array<{ fields?: Array<{ key?: string }> }> } | null | undefined): boolean {
  const sections = schema?.sections;
  if (!Array.isArray(sections)) return false;
  for (const s of sections) {
    for (const f of s.fields || []) {
      if (String(f?.key || '').startsWith('notificacao.')) return true;
    }
  }
  return false;
}

export function escopoFromAccess(access: Record<string, any> | null, isAdmin: boolean): NotificacaoEscopo {
  if (!access) return isAdmin ? 'livre' : 'livre';
  const n = String(access.nivel ?? access.nivel_acesso ?? '').toLowerCase();
  // Quando existir vínculo explícito (estado/município/unidade), ele prevalece
  // mesmo para usuários com role admin.
  if (n === 'estado' && access.estadoId) return 'estado';
  if (n === 'municipio' && access.municipioId) return 'municipio';
  if ((n === 'unidade' || n === 'estabelecimento') && access.estabelecimentoId) return 'unidade';
  return isAdmin ? 'livre' : 'livre';
}

/**
 * Valores iniciais para `notificacao.*` conforme vínculo do usuário (espelha o fluxo e-SUS em linhas gerais).
 */
export async function buildNotificacaoPrefillFromAccess(
  access: Record<string, any> | null,
  escopo: NotificacaoEscopo
): Promise<Record<string, any>> {
  if (escopo === 'livre' || !access) return {};

  try {
    if (escopo === 'unidade' && access.estabelecimentoId) {
      const raw = await usuarioGestaoService.getEstabelecimentoComHierarquia(Number(access.estabelecimentoId));
      const est = unwrap<any>(raw);
      if (!est) return {};
      const mun = est.tipo_municipio ?? est.tipoMunicipio;
      const munId = mun?.idtipo_municipio ?? mun?.id;
      let ibge = mun?.codigo ?? mun?.codigo_ibge ?? '';
      if ((!ibge || String(ibge).trim() === '') && munId) {
        const munFull = unwrap(await usuarioGestaoService.getMunicipioComEstado(Number(munId)));
        ibge = munFull?.codigo ?? munFull?.codigo_ibge ?? '';
      }
      const te = est.tipo_estado ?? mun?.tipo_estado ?? est.tipoEstado;
      const estadoId = te?.idtipo_estado ?? est.tipo_estado_idtipo_estado ?? mun?.tipo_estado_idtipo_estado;
      const sigla = te?.sigla ?? te?.uf ?? '';

      return {
        unidade_id: est.idestabelecimento ?? Number(access.estabelecimentoId),
        estabelecimento: est.nome ?? '',
        estabelecimento_cnes: est.cnes ?? '',
        municipio_id: munId ? Number(munId) : undefined,
        estado_id: estadoId ? Number(estadoId) : undefined,
        municipio_notificacao_ibge: ibge != null && String(ibge).trim() !== '' ? String(ibge) : '',
        uf_notificacao: sigla ? String(sigla).toUpperCase().slice(0, 2) : '',
      };
    }

    if (escopo === 'municipio' && access.municipioId) {
      const mun = unwrap<any>(await usuarioGestaoService.getMunicipioComEstado(Number(access.municipioId)));
      if (!mun) return {};
      const estadoId = mun.tipo_estado_idtipo_estado ?? mun.tipo_estado?.idtipo_estado;
      const ibge = mun.codigo ?? mun.codigo_ibge ?? '';
      const sigla = mun.tipo_estado?.sigla ?? mun.sigla_uf ?? mun.uf ?? '';

      return {
        municipio_id: mun.idtipo_municipio ?? mun.id,
        estado_id: estadoId ? Number(estadoId) : undefined,
        municipio_notificacao_ibge: ibge != null ? String(ibge) : '',
        uf_notificacao: sigla ? String(sigla).toUpperCase().slice(0, 2) : '',
      };
    }

    if (escopo === 'estado' && access.estadoId) {
      let uf = '';
      try {
        const h = await usuarioGestaoService.getHierarquiaCompleta();
        const estado = (h?.estados || []).find((e: any) => Number(e.id) === Number(access.estadoId));
        uf = String(estado?.sigla ?? '').toUpperCase().slice(0, 2);
      } catch {
        uf = '';
      }
      return {
        estado_id: Number(access.estadoId),
        uf_notificacao: uf,
      };
    }
  } catch (e) {
    console.warn('notificacaoScopeDefaults: falha ao montar pré-preenchimento', e);
  }

  return {};
}
