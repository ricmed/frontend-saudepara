export const COMUNICACAO_DAE_LEITURA_ATUALIZADA = 'comunicacao-dae-leitura-atualizada';

export function notifyComunicacaoDaeLeituraAtualizada(): void {
  window.dispatchEvent(new CustomEvent(COMUNICACAO_DAE_LEITURA_ATUALIZADA));
}
