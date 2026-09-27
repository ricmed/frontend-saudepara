import React from 'react';
import { splitListaEventos } from '../utils/listaEventoSelecao';
import type { EventoOption } from '../types/index2';

interface ListaEventoSelectProps {
  eventos: EventoOption[];
  selectedEventId: number | null;
  onChange: (eventId: number | null) => void;
  pronto?: boolean;
}

const ListaEventoSelect: React.FC<ListaEventoSelectProps> = ({
  eventos,
  selectedEventId,
  onChange,
  pronto = true,
}) => {
  const { ativos, historico } = splitListaEventos(eventos);
  const selecionado = eventos.find((evento) => evento.idtipo_evento === selectedEventId);
  const vendoHistorico = Boolean(selecionado && historico.some(
    (evento) => evento.idtipo_evento === selectedEventId,
  ));

  return (
    <div className="w-full max-w-xs rounded-lg border-2 border-blue-500 bg-blue-50 px-3 py-2">
      <label htmlFor="lista-evento" className="block text-sm font-medium text-blue-800 mb-1">
        Evento
      </label>
      <select
        id="lista-evento"
        data-testid="lista-evento"
        value={selectedEventId ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          if (!raw) {
            onChange(null);
            return;
          }
          const id = Number(raw);
          onChange(Number.isInteger(id) && id > 0 ? id : null);
        }}
        className="w-full p-2 border border-blue-400 rounded text-sm text-blue-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none"
      >
        <option value="">Todos (eventos ativos)</option>
        {ativos.length > 0 && (
          <optgroup label="Eventos ativos">
            {ativos.map((evento) => (
              <option key={evento.idtipo_evento} value={evento.idtipo_evento}>
                {evento.descricao}
              </option>
            ))}
          </optgroup>
        )}
        {historico.length > 0 && (
          <optgroup label="Histórico">
            {historico.map((evento) => (
              <option key={evento.idtipo_evento} value={evento.idtipo_evento}>
                {evento.descricao}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {pronto && ativos.length === 0 && selectedEventId == null && (
        <p className="mt-2 text-xs text-blue-800">
          Nenhum evento está ativo. Escolha um evento em Histórico para ver as comunicações de caso.
        </p>
      )}
      {vendoHistorico && (
        <p className="mt-2 text-xs text-blue-800">
          Evento encerrado. A lista mostra as comunicações já registradas.
        </p>
      )}
    </div>
  );
};

export default ListaEventoSelect;
