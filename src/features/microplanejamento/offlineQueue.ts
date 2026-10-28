import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { microplanejamentoApi } from './api';

type FilaItem = {
  id?: number;
  clientUuid: string;
  tipo: 'execucao' | 'resposta';
  payload: Record<string, unknown>;
  status: 'pendente' | 'rejeitado';
  erro?: string;
};

interface MpDb extends DBSchema {
  fila: {
    key: number;
    value: FilaItem;
    indexes: { 'by-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<MpDb>> | null = null;

function banco() {
  if (!dbPromise) {
    dbPromise = openDB<MpDb>('saudepara-microplanejamento', 1, {
      upgrade(db) {
        const store = db.createObjectStore('fila', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-status', 'status');
      },
    });
  }
  return dbPromise;
}

export async function enfileirar(tipo: FilaItem['tipo'], payload: Record<string, unknown>) {
  const clientUuid = crypto.randomUUID();
  const db = await banco();
  await db.add('fila', { clientUuid, tipo, payload: { ...payload, client_uuid: clientUuid }, status: 'pendente' });
  return clientUuid;
}

export async function listarFila() {
  const db = await banco();
  return db.getAll('fila');
}

export async function sincronizarFila() {
  const db = await banco();
  const itens = await db.getAll('fila');
  const pendentes = itens.filter((item) => item.status === 'pendente' || item.status === 'rejeitado');
  if (pendentes.length === 0) return { aceitos: [], rejeitados: [] };
  const resultado = await microplanejamentoApi.sincronizar({
    execucoes: pendentes.filter((item) => item.tipo === 'execucao').map((item) => item.payload),
    respostas: pendentes.filter((item) => item.tipo === 'resposta').map((item) => item.payload),
  });
  const rejeitados = new Map(resultado.rejeitados.map((item) => [item.client_uuid, item.message]));
  for (const item of pendentes) {
    if (item.id == null) continue;
    if (rejeitados.has(item.clientUuid)) {
      await db.put('fila', { ...item, status: 'rejeitado', erro: rejeitados.get(item.clientUuid) });
    } else {
      await db.delete('fila', item.id);
    }
  }
  return resultado;
}
