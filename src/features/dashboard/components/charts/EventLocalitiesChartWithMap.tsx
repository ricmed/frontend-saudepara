import React, { useEffect, useMemo, useRef } from 'react';
import { MapPin, MapPinned } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import ChartExportMenu from '../../../../components/common/ChartExportMenu';
import EventLocalitiesMiniMap from './EventLocalitiesMiniMap';
import {
  EVENT_LOCALITY_CHART_TOP_COUNT,
  EventLocalityAggregate,
  getRankedEventLocalities,
  getTopEventLocalitiesForChart
} from '../../utils/eventLocalities';

const BAR_COLORS = [
  '#1a3cad',
  '#2a49c4',
  '#3b5bdb',
  '#4c6cf1',
  '#5d7df7',
  '#7f96f9',
  '#a1affb',
  '#c2c9fd',
  '#e4e8fe',
  '#c2c9fd'
];

const TABLE_COLORS = [
  '#1a3cad',
  '#3b5bdb',
  '#4c6cf1',
  '#5d7df7',
  '#7f96f9',
  '#2196F3',
  '#00BCD4',
  '#607D8B',
  '#795548',
  '#9E9E9E'
];

interface EventLocalityChartRow {
  id: number;
  name: string;
  value: number;
}

interface EventLocalitiesChartWithMapProps {
  eventDescription: string;
  data: EventLocalityAggregate[];
  selectedLocalityIds: number[];
  onLocalityClick: (localityId: number, multiSelect?: boolean) => void;
}

const toChartRow = (item: EventLocalityAggregate): EventLocalityChartRow => ({
  id: item.id,
  name: item.label,
  value: item.count
});

const EventLocalitiesChartWithMap: React.FC<EventLocalitiesChartWithMapProps> = ({
  eventDescription,
  data,
  selectedLocalityIds,
  onLocalityClick
}) => {
  const ctrlPressedRef = useRef(false);
  const rankedLocalities = useMemo(() => getRankedEventLocalities(data), [data]);
  const topLocalities = useMemo(
    () => getTopEventLocalitiesForChart(data).map(toChartRow),
    [data]
  );
  const tableRows = useMemo(
    () => rankedLocalities.map(toChartRow),
    [rankedLocalities]
  );
  const selectedIds = useMemo(
    () => new Set(selectedLocalityIds),
    [selectedLocalityIds]
  );
  const exportData = useMemo(
    () => tableRows.map(({ name, value }) => ({ name, value })),
    [tableRows]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control' || event.key === 'Meta') {
        ctrlPressedRef.current = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control' || event.key === 'Meta') {
        ctrlPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isItemFiltered = (localityId: number): boolean =>
    selectedIds.has(localityId);

  const getCellColor = (localityId: number, baseColor: string): string => {
    if (selectedIds.size === 0) {
      return baseColor;
    }

    return isItemFiltered(localityId) ? baseColor : `${baseColor}4D`;
  };

  const handleLocalityClick = (localityId: number) => {
    onLocalityClick(localityId, ctrlPressedRef.current);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
      data-dashboard="event-localities"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">
            Localidades no Evento
          </h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {data.length} {data.length === 1 ? 'localidade' : 'localidades'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            chartId="localidade-evento-chart"
            chartData={exportData}
            chartTitle={`Localidades — ${eventDescription}`}
            buttonVariant="icon"
          />
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <span>Localidade:</span>
              <span className="font-semibold">
                {rankedLocalities
                  .filter((item) => selectedIds.has(item.id))
                  .map((item) => item.label)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Top {EVENT_LOCALITY_CHART_TOP_COUNT} Localidades
            </h4>
            <p className="text-sm text-gray-500">
              Clique nas barras para filtrar por localidade
            </p>
          </div>

          {topLocalities.length > 0 ? (
            <div id="localidade-evento-chart">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topLocalities}
                  margin={{ top: 40, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }

                      const value = Number(payload[0]?.value ?? 0);

                      return (
                        <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                          <p className="font-semibold text-gray-800">{label}</p>
                          <p className="text-blue-600">
                            <span className="font-bold">
                              {value.toLocaleString('pt-BR')}
                            </span>{' '}
                            {value === 1 ? 'caso' : 'casos'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    cursor="pointer"
                    radius={[4, 4, 0, 0]}
                    onClick={(item) => {
                      const localityId = Number(item?.id);
                      if (Number.isInteger(localityId) && localityId > 0) {
                        handleLocalityClick(localityId);
                      }
                    }}
                  >
                    {topLocalities.map((entry, index) => {
                      const color = BAR_COLORS[index % BAR_COLORS.length];
                      return (
                        <Cell
                          key={`localidade-bar-${entry.id}`}
                          fill={getCellColor(entry.id, color)}
                          stroke={isItemFiltered(entry.id) ? '#000000' : 'none'}
                          strokeWidth={isItemFiltered(entry.id) ? 4 : 0}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => value.toLocaleString('pt-BR')}
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum dado de localidade disponível</p>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Todas as Localidades
            </h4>
            <p className="text-sm text-gray-500">
              Clique para filtrar por localidade
            </p>
          </div>

          <div
            className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto"
            role="list"
            aria-label="Todas as localidades"
          >
            <div className="space-y-2">
              {tableRows.map((item, index) => {
                const isActive = isItemFiltered(item.id);
                const itemColor = TABLE_COLORS[index % TABLE_COLORS.length];

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    className={`flex w-full items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-blue-100 border border-blue-300 shadow-sm'
                        : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                    }`}
                    onClick={() => handleLocalityClick(item.id)}
                    title={`Clique para filtrar por ${item.name}`}
                    aria-label={`${item.name}: ${item.value} notificações`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${itemColor}20` }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: itemColor }}
                        />
                      </div>
                      <span
                        className={`font-medium text-sm truncate ${
                          isActive ? 'text-blue-800' : 'text-gray-700'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? 'text-blue-700' : 'text-gray-600'
                        }`}
                      >
                        {item.value.toLocaleString('pt-BR')}
                      </span>
                      {isActive && <span className="text-blue-500 text-xs">●</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventLocalitiesMapSection: React.FC<{
  data: EventLocalityAggregate[];
  selectedLocalityIds: number[];
  onLocalityClick: (localityId: number) => void;
}> = ({ data, selectedLocalityIds, onLocalityClick }) => (
  <div data-dashboard="event-localities-map">
    <div className="mb-4 flex items-center gap-2">
      <MapPinned className="h-5 w-5 text-blue-700" />
      <div>
        <h3 className="font-semibold text-gray-800">Minimapa de localidades</h3>
        <p className="text-xs text-gray-500">
          Centroides de localidades relacionadas às notificações
        </p>
      </div>
    </div>
    <EventLocalitiesMiniMap
      data={data}
      selectedLocalityIds={selectedLocalityIds}
      granularityEnabled
      onLocalityClick={onLocalityClick}
    />
  </div>
);

export default React.memo(EventLocalitiesChartWithMap);
