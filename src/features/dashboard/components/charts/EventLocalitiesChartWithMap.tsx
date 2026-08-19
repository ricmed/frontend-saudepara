import React, { useMemo } from 'react';
import { BarChart3, MapPinned } from 'lucide-react';
import EventLocalitiesMiniMap from './EventLocalitiesMiniMap';
import {
  AggregateCountPolicy,
  EventLocalityAggregate
} from '../../utils/eventLocalities';

interface EventLocalitiesChartWithMapProps {
  eventDescription: string;
  data: EventLocalityAggregate[];
  selectedLocalityIds: number[];
  aggregatePolicy: AggregateCountPolicy;
  onLocalityClick: (localityId: number, multiSelect?: boolean) => void;
}

const EventLocalitiesChartWithMap: React.FC<EventLocalitiesChartWithMapProps> = ({
  eventDescription,
  data,
  selectedLocalityIds,
  aggregatePolicy,
  onLocalityClick
}) => {
  const selectedIds = useMemo(
    () => new Set(selectedLocalityIds),
    [selectedLocalityIds]
  );
  const maximumVisualCount = useMemo(() => {
    const minimumCount = aggregatePolicy.minimumCount ?? 1;
    return Math.max(
      ...data.map((item) => item.suppressed ? minimumCount : item.count),
      minimumCount
    );
  }, [aggregatePolicy.minimumCount, data]);

  return (
    <section
      className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
      data-dashboard="event-localities"
    >
      <header>
        <h2 className="text-lg font-bold text-gray-800">
          Localidades — {eventDescription}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Bairros, comunidades e ramais relacionados às notificações
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-700" />
            <div>
              <h3 className="font-semibold text-gray-800">
                Notificações por localidade
              </h3>
              <p className="text-xs text-gray-500">
                Concentração de notificações após os filtros ativos
              </p>
            </div>
          </div>

          {!aggregatePolicy.enabled ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
              Granularidade indisponível: configure um limiar agregado aprovado
              para este ambiente.
            </div>
          ) : data.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-600">
              Nenhuma localidade encontrada para os filtros atuais.
            </div>
          ) : (
            <div
              className="max-h-[32rem] space-y-2 overflow-y-auto pr-1"
              role="list"
              aria-label="Gráfico de notificações por localidade"
            >
              {data.map((item) => {
                const selected = selectedIds.has(item.id);
                const visualCount = item.suppressed
                  ? aggregatePolicy.minimumCount ?? 1
                  : item.count;
                const width = Math.max(
                  8,
                  Math.round((visualCount / maximumVisualCount) * 100)
                );
                const countLabel = item.suppressed
                  ? `<${aggregatePolicy.minimumCount}`
                  : item.count.toLocaleString('pt-BR');

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    disabled={item.suppressed}
                    onClick={(event) => {
                      if (!item.suppressed) {
                        onLocalityClick(
                          item.id,
                          event.ctrlKey || event.metaKey
                        );
                      }
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      item.suppressed
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                        : selected
                          ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                    aria-label={`${item.label}: ${countLabel} notificações`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-gray-800">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-gray-700">
                        {countLabel}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          item.suppressed
                            ? 'bg-gray-400'
                            : selected
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    {item.suppressed && (
                      <span className="mt-1 block text-[11px] text-gray-500">
                        Contagem suprimida; filtro indisponível.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-4 flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-blue-700" />
            <div>
              <h3 className="font-semibold text-gray-800">
                Minimapa de localidades
              </h3>
              <p className="text-xs text-gray-500">
                Centroides de localidades com contagem não suprimida
              </p>
            </div>
          </div>
          <EventLocalitiesMiniMap
            data={data}
            selectedLocalityIds={selectedLocalityIds}
            granularityEnabled={aggregatePolicy.enabled}
            onLocalityClick={(localityId) => onLocalityClick(localityId, false)}
          />
        </div>
      </div>
    </section>
  );
};

export default React.memo(EventLocalitiesChartWithMap);
