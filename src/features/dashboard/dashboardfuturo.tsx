import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// Define the Leaflet map property on the Window interface
declare global {
  interface Window {
    mymap: any; // Using any type as we don't have the Leaflet typings imported
  }
}
import {
  User,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  BookOpen,
  Heart,
  Award,
  Briefcase,
  GraduationCap,
  Bell,
  Users,
  Building,
  FileImage,
  FileSearch2,
  ChevronDown,
  File,
  Globe,
  Table,
  MapPin,
  Calendar,
  Info,
} from "lucide-react";

// Cores padronizadas baseadas na imagem de referência
const COLORS = {
  primary: "#3b5bdb", // Azul médio da referência
  secondary: "#e05297", // Rosa para feminino
  accent: "#047481",
  neutral: "#374151",
  // Cores para gráficos - predominantemente tons de azul baseados na imagem
  masculino: "#3b5bdb", // Azul da referência
  feminino: "#e05297", // Rosa mantido para feminino
  ignorado: "#999999", // Cinza neutro
  // Tons de azul para os gráficos (variações do azul principal #3b5bdb)
  blue: [
    "#1a3cad",
    "#2a49c4",
    "#3b5bdb",
    "#4c6cf1",
    "#5d7df7",
    "#7f96f9",
    "#a1affb",
    "#c2c9fd",
    "#e4e8fe",
  ],
  chart: [
    "#1a3cad",
    "#2a49c4",
    "#3b5bdb",
    "#4c6cf1",
    "#5d7df7",
    "#7f96f9",
    "#a1affb",
    "#c2c9fd",
    "#e4e8fe",
  ],
};

// Mockup de dados adicionais para novos gráficos
const atendimentosPorHora = [
  { hora: "00:00", quantidade: 156, urgencia: 45 },
  { hora: "01:00", quantidade: 132, urgencia: 38 },
  { hora: "02:00", quantidade: 98, urgencia: 32 },
  { hora: "03:00", quantidade: 87, urgencia: 30 },
  { hora: "04:00", quantidade: 76, urgencia: 25 },
  { hora: "05:00", quantidade: 92, urgencia: 28 },
  { hora: "06:00", quantidade: 145, urgencia: 35 },
  { hora: "07:00", quantidade: 210, urgencia: 42 },
  { hora: "08:00", quantidade: 345, urgencia: 58 },
  { hora: "09:00", quantidade: 478, urgencia: 72 },
  { hora: "10:00", quantidade: 523, urgencia: 85 },
  { hora: "11:00", quantidade: 498, urgencia: 80 },
  { hora: "12:00", quantidade: 432, urgencia: 65 },
  { hora: "13:00", quantidade: 387, urgencia: 62 },
  { hora: "14:00", quantidade: 423, urgencia: 75 },
  { hora: "15:00", quantidade: 445, urgencia: 78 },
  { hora: "16:00", quantidade: 467, urgencia: 82 },
  { hora: "17:00", quantidade: 478, urgencia: 88 },
  { hora: "18:00", quantidade: 432, urgencia: 95 },
  { hora: "19:00", quantidade: 398, urgencia: 90 },
  { hora: "20:00", quantidade: 354, urgencia: 88 },
  { hora: "21:00", quantidade: 312, urgencia: 76 },
  { hora: "22:00", quantidade: 258, urgencia: 70 },
  { hora: "23:00", quantidade: 182, urgencia: 55 },
];

// Bairros da Região Metropolitana de Belém com coordenadas reais
const bairrosBelem = [
  {
    id: 1,
    nome: "Batista Campos",
    quantidade: 1245,
    lat: -1.4557,
    lon: -48.4902,
    raio: 9,
  },
  {
    id: 2,
    nome: "Nazaré",
    quantidade: 1138,
    lat: -1.4513,
    lon: -48.4853,
    raio: 8,
  },
  {
    id: 3,
    nome: "Marco",
    quantidade: 956,
    lat: -1.4357,
    lon: -48.4763,
    raio: 7,
  },
  {
    id: 4,
    nome: "Umarizal",
    quantidade: 892,
    lat: -1.4464,
    lon: -48.4889,
    raio: 7,
  },
  {
    id: 5,
    nome: "Pedreira",
    quantidade: 724,
    lat: -1.4316,
    lon: -48.4573,
    raio: 6,
  }, // Coordenada do usuário
  {
    id: 6,
    nome: "Guamá",
    quantidade: 683,
    lat: -1.4662,
    lon: -48.467,
    raio: 6,
  },
  {
    id: 7,
    nome: "Terra Firme",
    quantidade: 657,
    lat: -1.4517,
    lon: -48.4563,
    raio: 6,
  },
  {
    id: 8,
    nome: "Jurunas",
    quantidade: 612,
    lat: -1.4675,
    lon: -48.4954,
    raio: 6,
  },
  {
    id: 9,
    nome: "Cremação",
    quantidade: 578,
    lat: -1.4583,
    lon: -48.4784,
    raio: 5,
  },
  {
    id: 10,
    nome: "Canudos",
    quantidade: 498,
    lat: -1.4423,
    lon: -48.4702,
    raio: 5,
  },
  {
    id: 11,
    nome: "Condor",
    quantidade: 456,
    lat: -1.4735,
    lon: -48.4875,
    raio: 5,
  },
  {
    id: 12,
    nome: "Cidade Velha",
    quantidade: 432,
    lat: -1.4592,
    lon: -48.5075,
    raio: 5,
  },
  {
    id: 13,
    nome: "São Brás",
    quantidade: 398,
    lat: -1.4478,
    lon: -48.4693,
    raio: 5,
  },
  {
    id: 14,
    nome: "Telégrafo",
    quantidade: 374,
    lat: -1.4342,
    lon: -48.4942,
    raio: 4,
  },
  {
    id: 15,
    nome: "Sacramenta",
    quantidade: 345,
    lat: -1.4213,
    lon: -48.4857,
    raio: 4,
  },
  {
    id: 16,
    nome: "Marambaia",
    quantidade: 324,
    lat: -1.4034,
    lon: -48.4619,
    raio: 4,
  },
  {
    id: 17,
    nome: "Val-de-Cans",
    quantidade: 278,
    lat: -1.3935,
    lon: -48.4738,
    raio: 4,
  },
  {
    id: 18,
    nome: "Tapanã",
    quantidade: 245,
    lat: -1.3792,
    lon: -48.4522,
    raio: 4,
  },
  {
    id: 19,
    nome: "Icoaraci",
    quantidade: 523,
    lat: -1.3101,
    lon: -48.4891,
    raio: 5,
  },
  {
    id: 20,
    nome: "Outeiro",
    quantidade: 345,
    lat: -1.2456,
    lon: -48.4422,
    raio: 4,
  },
  {
    id: 21,
    nome: "Mosqueiro",
    quantidade: 389,
    lat: -1.1234,
    lon: -48.3926,
    raio: 4,
  },
  {
    id: 22,
    nome: "Ananindeua",
    quantidade: 872,
    lat: -1.3743,
    lon: -48.3726,
    raio: 7,
  },
  {
    id: 23,
    nome: "Marituba",
    quantidade: 432,
    lat: -1.3659,
    lon: -48.3415,
    raio: 5,
  },
  {
    id: 24,
    nome: "Benevides",
    quantidade: 298,
    lat: -1.3619,
    lon: -48.2441,
    raio: 4,
  },
  {
    id: 25,
    nome: "Santa Bárbara",
    quantidade: 215,
    lat: -1.2182,
    lon: -48.2961,
    raio: 3,
  },
];

// Função para determinar a cor baseada na quantidade
const getColor = (quantidade: number) => {
  if (quantidade > 1000) return "#f44336"; // Vermelho (alerta crítico)
  if (quantidade > 750) return "#ff7043"; // Laranja forte (alerta alto)
  if (quantidade > 500) return "#ffab40"; // Laranja (alerta moderado)
  if (quantidade > 250) return "#3b5bdb"; // Azul médio
  return "#5d7df7"; // Azul claro
};

// Componente para o Mapa Leaflet
const MapaLeaflet = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [totalNotificacoes, setTotalNotificacoes] = useState(0);

  useEffect(() => {
    // Importar Leaflet dinamicamente via CDN
    const loadLeaflet = async () => {
      // Garantir que o CSS do Leaflet seja carregado
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const linkElement = document.createElement("link");
        linkElement.rel = "stylesheet";
        linkElement.href =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        document.head.appendChild(linkElement);
      }

      // Garantir que o script do Leaflet seja carregado
      const loadLeafletScript = new Promise((resolve, reject) => {
        if ("L" in window) {
          resolve((window as any).L);
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
        script.onload = () => resolve((window as any).L);
        script.onerror = reject;
        document.head.appendChild(script);
      });

      try {
        // Type assertion to tell TypeScript that L has the expected methods
        const L = (await loadLeafletScript) as any;

        // Calcular total de notificações
        const total = bairrosBelem.reduce(
          (sum, bairro) => sum + bairro.quantidade,
          0
        );
        setTotalNotificacoes(total);

        // Remover mapa anterior se existir
        if (window.mymap) {
          window.mymap.remove();
        }

        // Criar mapa centrado em Belém
        window.mymap = L.map("mapid").setView([-1.4316, -48.4573], 12);

        // Adicionar camada de mapa do OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(window.mymap);

        // Adicionar marcadores para cada bairro
        bairrosBelem.forEach((bairro) => {
          const raioCirculo = Math.sqrt(bairro.quantidade) * 20; // Raio proporcional à raiz quadrada da quantidade
          const cor = getColor(bairro.quantidade);

          // Determinar se é a localização do usuário
          const isUserLocation = bairro.id === 5; // Pedreira

          // Criar círculo para representar o bairro
          const circle = L.circle([bairro.lat, bairro.lon], {
            color: cor,
            fillColor: cor,
            fillOpacity: 0.7,
            radius: raioCirculo,
            weight: 1,
            // Adicionar efeito pulsante para áreas com alerta (mais de 750 casos)
            className: bairro.quantidade > 750 ? "pulse-circle" : "",
          }).addTo(window.mymap);

          // Adicionar popup com informações
          const percentual = ((bairro.quantidade / total) * 100).toFixed(2);
          circle.bindPopup(`
            <div style="text-align: center;">
              <h3 style="margin: 5px 0; font-weight: bold;">${bairro.nome}</h3>
              <p style="margin: 5px 0;"><b>Notificações:</b> ${bairro.quantidade.toLocaleString()}</p>
              <p style="margin: 5px 0;"><b>Percentual:</b> ${percentual}%</p>
              <p style="margin: 5px 0;"><b>Coordenadas:</b> ${bairro.lat.toFixed(4)}, ${bairro.lon.toFixed(4)}</p>
              $            ${isUserLocation ? '<p style="color: #1a3cad; font-weight: bold; margin: 5px 0;">Sua localização</p>' : ""}
            ${bairro.quantidade > 1000 ? '<p style="color: #f44336; font-weight: bold; margin: 5px 0; background-color: #ffebee; padding: 2px 5px; border-radius: 3px;">⚠️ ALERTA CRÍTICO: Alta concentração de casos</p>' : ""}
            ${bairro.quantidade > 750 && bairro.quantidade <= 1000 ? '<p style="color: #ff7043; font-weight: bold; margin: 5px 0; background-color: #fff3e0; padding: 2px 5px; border-radius: 3px;">⚠️ ALERTA ALTO: Grande número de casos</p>' : ""}
            </div>
          `);

          // Adicionar rótulo para bairros com mais notificações
          if (bairro.quantidade > 500) {
            // Determinar estilo do rótulo baseado no nível de alerta
            let bgColor = "#fff";
            let textColor = "#333";
            let borderColor = "#ddd";

            if (bairro.quantidade > 1000) {
              bgColor = "#f44336";
              textColor = "#fff";
              borderColor = "#d32f2f";
            } else if (bairro.quantidade > 750) {
              bgColor = "#ff7043";
              textColor = "#fff";
              borderColor = "#f4511e";
            } else if (bairro.quantidade > 500) {
              bgColor = "#ffab40";
              textColor = "#333";
              borderColor = "#ff9100";
            }

            L.marker([bairro.lat, bairro.lon], {
              icon: L.divIcon({
                className: "bairro-label",
                html: `<div style="background-color: ${bgColor}; 
                           color: ${textColor}; 
                           padding: 3px 5px; 
                           border-radius: 3px; 
                           font-weight: bold; 
                           font-size: 12px;
                           border: 1px solid ${borderColor};
                           box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                        ${bairro.nome} (${bairro.quantidade})
                      </div>`,
                iconSize: [100, 20],
                iconAnchor: [50, 10],
              }),
            }).addTo(window.mymap);
          }
        });

        // Adicionar estilos para efeitos de pulsação
        const styleElement = document.createElement("style");
        styleElement.textContent = `
          @keyframes pulse-blue {
            0% { transform: scale(0.8); opacity: 1; }
            70% { transform: scale(1.5); opacity: 0.7; }
            100% { transform: scale(0.8); opacity: 1; }
          }
          
          @keyframes pulse-alert {
            0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(244, 67, 54, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
          }
          
          .pulse-circle {
            animation: pulse-alert 1.5s infinite;
          }
        `;
        document.head.appendChild(styleElement);

        // Adicionar marcador especial para locais com muitos casos (vermelho piscando)
        bairrosBelem.forEach((bairro) => {
          // Verificar se é área de alerta crítico ou alto
          if (bairro.quantidade > 750) {
            const alertIcon = L.divIcon({
              className: "alert-location-marker",
              html: `<div style="
                       background-color: #f44336; 
                       border: 3px solid white; 
                       border-radius: 50%; 
                       box-shadow: 0 0 10px rgba(244,67,54,0.7);
                       width: 20px;
                       height: 20px;
                       animation: pulse-alert 1.5s infinite;
                     "></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            // Adicionar marcador de alerta acima do círculo principal
            L.marker([bairro.lat, bairro.lon], { icon: alertIcon }).addTo(
              window.mymap
            ).bindPopup(`<div style="text-align: center;">
                            <h3 style="margin: 5px 0; font-weight: bold; color: #f44336;">⚠️ ÁREA DE ALERTA</h3>
                            <p style="margin: 5px 0;"><b>Bairro:</b> ${bairro.nome}</p>
                            <p style="margin: 5px 0;"><b>Casos:</b> ${bairro.quantidade.toLocaleString()}</p>
                            <p style="color: #f44336; font-weight: bold; background-color: #ffebee; padding: 5px; border-radius: 3px;">
                              Requer atenção prioritária da equipe técnica
                            </p>
                          </div>`);
          }
        });

        // Adicionar marcador especial na localização exata do usuário (azul escuro piscando)
        const userIcon = L.divIcon({
          className: "user-location-marker",
          html: `<div style="
                   background-color: #1a3cad; 
                   border: 3px solid white; 
                   border-radius: 50%; 
                   box-shadow: 0 0 10px rgba(0,0,0,0.5);
                   width: 16px;
                   height: 16px;
                   animation: pulse-blue 1.5s infinite;
                 "></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([-1.431616572976942, -48.45737525217788], {
          icon: userIcon,
        }).addTo(window.mymap).bindPopup(`<div style="text-align: center;">
                        <h3 style="margin: 5px 0; font-weight: bold; color: #1a3cad;">Sua Localização Exata</h3>
                        <p style="margin: 5px 0;"><b>Coordenadas:</b> -1.4316, -48.4574</p>
                        <p style="margin: 5px 0;"><b>Bairro:</b> Pedreira</p>
                      </div>`);

        // Adicionar legenda
        const legend = L.control({ position: "bottomright" });
        legend.onAdd = function () {
          const div = L.DomUtil.create("div", "legend");
          div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 1px 5px rgba(0,0,0,0.4);">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Notificações</h4>
              <div style="margin-bottom: 5px; color: #d32f2f; font-weight: bold; font-size: 13px;">ÁREAS DE ALERTA:</div>
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <div style="width: 16px; height: 16px; background-color: #f44336; border-radius: 50%; margin-right: 5px; box-shadow: 0 0 5px #f44336;"></div>
                <span style="font-size: 12px; font-weight: bold;">Alerta Crítico: Mais de 1000 casos</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <div style="width: 16px; height: 16px; background-color: #ff7043; border-radius: 50%; margin-right: 5px; box-shadow: 0 0 3px #ff7043;"></div>
                <span style="font-size: 12px; font-weight: bold;">Alerta Alto: 750 - 999 casos</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <div style="width: 16px; height: 16px; background-color: #ffab40; border-radius: 50%; margin-right: 5px;"></div>
                <span style="font-size: 12px;">Alerta Moderado: 500 - 749 casos</span>
              </div>
              <div style="margin-top: 10px; margin-bottom: 5px; color: #0d47a1; font-weight: bold; font-size: 13px;">ÁREAS MONITORADAS:</div>
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <div style="width: 16px; height: 16px; background-color: #3b5bdb; border-radius: 50%; margin-right: 5px;"></div>
                <span style="font-size: 12px;">250 - 499 casos</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 16px; height: 16px; background-color: #5d7df7; border-radius: 50%; margin-right: 5px;"></div>
                <span style="font-size: 12px;">Menos de 250 casos</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 5px; border-top: 1px solid #eee; padding-top: 5px;">
                <div style="width: 16px; height: 16px; background-color: #1a3cad; border-radius: 50%; margin-right: 5px; animation: pulse-blue 1.5s infinite;"></div>
                <span style="font-size: 12px;">Sua localização</span>
              </div>
            </div>
          `;
          return div;
        };
        legend.addTo(window.mymap);

        setMapLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar o mapa:", error);
      }
    };

    loadLeaflet();

    // Cleanup function
    return () => {
      if (window.mymap) {
        window.mymap.remove();
      }
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-700" />
          <h3 className="text-lg font-medium text-gray-700">
            Distribuição Geográfica das Notificações - Região Metropolitana de
            Belém
          </h3>
        </div>

        <div className="bg-blue-50 p-2 rounded-lg flex items-center text-sm">
          <Info className="h-4 w-4 text-blue-700 mr-1" />
          <span>
            Total: <b>{totalNotificacoes.toLocaleString()}</b> notificações
          </span>
        </div>
      </div>

      {/* Container do mapa Leaflet */}
      <div
        id="mapid"
        className="h-[600px] w-full rounded-lg border border-gray-200 relative"
        style={{ zIndex: 0 }}
      ></div>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 rounded-lg">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-700">Carregando mapa...</p>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Análise da Distribuição por Bairros
        </h4>
        <p className="text-sm text-gray-600">
          Na região metropolitana de Belém, os bairros mais centrais como
          Batista Campos, Nazaré e Marco apresentam maior concentração de
          notificações. Sua localização atual no bairro Pedreira registra 724
          notificações, o que representa um número significativo na região. O
          tamanho de cada círculo no mapa é proporcional à quantidade de
          notificações registradas.
        </p>
      </div>
    </div>
  );
};

// Interface para as props do dashboard
interface DashboardProps {
  notificacoes?: any[]; // Lista de notificações da API (opcional)
  exportOptions?: any; // Opções de exportação com os tipos/categorias (opcional)
}

const EnhancedNotificationDashboard = ({
  notificacoes = [],
  exportOptions = {},
}: DashboardProps) => {
  // Estado para controle de visualização
  const [activeTab, setActiveTab] = useState("graficos");

  // Estado para filtragem interativa
  const [loading, setLoading] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState("Todos");
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Dados base do dashboard original
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [clinicalCases, setClinicicalCases] = useState(0);
  const [traumaCases, setTraumaCases] = useState(0);
  const [outbreakCases, setOutbreakCases] = useState(0);

  // Define interface for chart data
  interface ChartDataItem {
    name: string;
    value: number;
    fill: string;
  }
  
  // Estado para os dados filtrados de cada categoria
  const [filteredRaca, setFilteredRaca] = useState<ChartDataItem[]>([]);
  const [filteredEscolaridade, setFilteredEscolaridade] = useState<ChartDataItem[]>([]);
  const [filteredUnidades, setFilteredUnidades] = useState<ChartDataItem[]>([]);
  const [filteredSintomas, setFilteredSintomas] = useState<ChartDataItem[]>([]);
  const [filteredTipoAtendimento, setFilteredTipoAtendimento] = useState<ChartDataItem[]>([]);
  const [filteredPublico, setFilteredPublico] = useState<ChartDataItem[]>([]);
  const [filteredHipoteses, setFilteredHipoteses] = useState<ChartDataItem[]>([]);
  const [filteredTrauma, setFilteredTrauma] = useState<ChartDataItem[]>([]);
  const [filteredGenero, setFilteredGenero] = useState<ChartDataItem[]>([]);

  // Processamento de dados das notificações
  useEffect(() => {
    if (loading) return;

    const processarDados = async () => {
      setLoading(true);
      try {
        // Verificação de segurança
        if (
          !notificacoes ||
          !Array.isArray(notificacoes) ||
          notificacoes.length === 0
        ) {
          // Em vez de usar dados mockados, definir todos como vazios/zeros
          setTotalNotifications(0);
          setClinicicalCases(0);
          setTraumaCases(0);
          setOutbreakCases(0);

          // Limpar todos os gráficos com arrays vazios
          setFilteredRaca([]);
          setFilteredEscolaridade([]);
          setFilteredUnidades([]);
          setFilteredSintomas([]);
          setFilteredTipoAtendimento([]);
          setFilteredPublico([]);
          setFilteredHipoteses([]);
          setFilteredTrauma([]);
          setFilteredGenero([]);

          return;
        }

        // Se tiver dados reais, processar normalmente
        await calcularEstatisticas();
      } catch (error) {
        console.error("Erro ao processar dados:", error);
        // Mesmo comportamento - em caso de erro, mostrar zeros
        setTotalNotifications(0);
        setClinicicalCases(0);
        setTraumaCases(0);
        setOutbreakCases(0);
      } finally {
        setLoading(false);
        setLastUpdate(new Date().toLocaleString());
      }
    };

    processarDados();
  }, [notificacoes]);

  // Função para calcular estatísticas a partir das notificações
  const calcularEstatisticas = async () => {
    if (!Array.isArray(notificacoes)) {
      console.error("notificacoes não é um array:", notificacoes);
      return;
    }

    // Total de notificações
    const total = notificacoes.length;
    setTotalNotifications(total);

    // Contagens por tipo de atendimento
    const countByAtendimento = notificacoes.reduce(
      (acc: Record<string, number>, n: any) => {
        const tipo = n?.tipoAtendimento || "Não especificado";
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      },
      {}
    );

    const clinicos = countByAtendimento["Clínico"] || 0;
    const traumas = countByAtendimento["Trauma"] || 0;
    const surtos = countByAtendimento["Surto"] || 0;

    setClinicicalCases(clinicos);
    setTraumaCases(traumas);
    setOutbreakCases(surtos);

    // Processar dados para gráficos
    processarDadosGraficos();
  };

  // Processamento dos dados para gráficos
  const processarDadosGraficos = () => {
    if (!Array.isArray(notificacoes) || !notificacoes.length) {
      console.log("Sem notificações para processar, usando dados mockados");
      return;
    }

    if (!exportOptions || typeof exportOptions !== "object") {
      console.log("exportOptions inválido, usando dados mockados");
      return;
    }

    try {
      // Processar raça/cor
      const racaPorNotificacao = processarCategoria(
        notificacoes,
        "original.paciente.tipo_raca_idtipo_raca",
        exportOptions.racaOptions || [],
        "idtipo_raca",
        "descricao",
        COLORS.blue
      );
      if (racaPorNotificacao.length > 0) {
        setFilteredRaca(racaPorNotificacao);
      }

      // Processar escolaridade
      const escolaridadePorNotificacao = processarCategoria(
        notificacoes,
        "original.paciente.escolaridade_idescolaridade",
        exportOptions.escolaridadeOptions || [],
        "idtipo_escolaridade",
        "descricao",
        COLORS.blue
      );
      if (escolaridadePorNotificacao.length > 0) {
        setFilteredEscolaridade(escolaridadePorNotificacao);
      }

      // Processar unidades notificadoras
      const unidadesPorNotificacao = processarCategoria(
        notificacoes,
        "original.estabelecimento_idestabelecimento",
        exportOptions.estabelecimentoOptions || [],
        "idestabelecimento",
        "nome",
        COLORS.blue
      );
      if (unidadesPorNotificacao.length > 0) {
        setFilteredUnidades(unidadesPorNotificacao);
      }

      // Processar identidade de gênero
      const generoPorNotificacao = processarCategoria(
        notificacoes,
        "original.paciente.tipo_genero_idtipo_genero",
        exportOptions.generoOptions || [],
        "idtipo_genero",
        "descricao",
        COLORS.blue
      );
      if (generoPorNotificacao.length > 0) {
        setFilteredGenero(generoPorNotificacao);
      }

      // Processar sintomas (pode ser relacionamento muitos-para-muitos)
      const sintomasPorNotificacao = processarCategoriaMuitosParaMuitos(
        notificacoes,
        "original.notificacao_has_tipo_sintoma",
        "tipo_sintoma_idtipo_sintoma",
        exportOptions.sintomaOptions || [],
        "idtipo_sintoma",
        "descricao",
        COLORS.blue
      );
      if (sintomasPorNotificacao.length > 0) {
        setFilteredSintomas(sintomasPorNotificacao);
      }

      // Processar tipo de atendimento
      const atendimentoPorNotificacao = processarCategoria(
        notificacoes,
        "original.tipo_atendimento_idtipo_atendimento",
        exportOptions.atendimentoOptions || [],
        "idtipo_atendimento",
        "descricao",
        COLORS.blue
      );
      if (atendimentoPorNotificacao.length > 0) {
        setFilteredTipoAtendimento(atendimentoPorNotificacao);
      }

      // Processar público atendido
      const publicoPorNotificacao = processarCategoria(
        notificacoes,
        "original.tipo_publico_idtipo_publico",
        exportOptions.publicoOptions || [],
        "idtipo_publico",
        "descricao",
        COLORS.blue
      );
      if (publicoPorNotificacao.length > 0) {
        setFilteredPublico(publicoPorNotificacao);
      }

      // Processar hipótese diagnóstica
      const hipoteseePorNotificacao = processarCategoria(
        notificacoes,
        "original.tipo_hipotese_diag_idtipo_hipotese_diag",
        exportOptions.hipoteseDiagOptions || [],
        "idtipo_hipotese_diag",
        "descricao",
        COLORS.blue
      );
      if (hipoteseePorNotificacao.length > 0) {
        setFilteredHipoteses(hipoteseePorNotificacao);
      }

      // Processar trauma
      const traumaPorNotificacao = processarCategoria(
        notificacoes,
        "original.tipo_trauma_idtipo_trauma",
        exportOptions.traumaOptions || [],
        "idtipo_trauma",
        "descricao",
        COLORS.blue
      );
      if (traumaPorNotificacao.length > 0) {
        setFilteredTrauma(traumaPorNotificacao);
      }
    } catch (error) {
      console.error("Erro ao processar dados para gráficos:", error);
    }
  };

  // Função para processar categoria simples (relação 1:1)
  const processarCategoria = (
    dados: any[],
    campoId: string,
    opcoes: any[],
    idField: string,
    descField: string,
    cores: string[]
  ) => {
    // Primeiro contar ocorrências
    const contagem: Record<string, number> = {};

    dados.forEach((item) => {
      // Acessar valor do campo pelo caminho, ex: 'original.paciente.tipo_raca_idtipo_raca'
      let valor = item;
      const partes = campoId.split(".");

      for (const parte of partes) {
        if (valor && typeof valor === "object" && parte in valor) {
          valor = valor[parte];
        } else {
          valor = undefined;
          break;
        }
      }

      if (valor !== undefined) {
        const id = String(valor);
        contagem[id] = (contagem[id] || 0) + 1;
      } else {
        contagem["unknown"] = (contagem["unknown"] || 0) + 1;
      }
    });

    // Agora converter para o formato adequado para o gráfico
    const resultado = [];
    let index = 0;

    for (const [id, count] of Object.entries(contagem)) {
      if (id === "unknown") {
        resultado.push({
          name: "Ignorado",
          value: count,
          fill: COLORS.ignorado,
        });
        continue;
      }

      // Buscar a descrição nas opções
      const descricao =
        opcoes.find((opt) => String(opt[idField]) === id)?.[descField] ||
        `Tipo ${id}`;

      resultado.push({
        name: descricao,
        value: count,
        fill: cores[index % cores.length],
      });

      index++;
    }

    return resultado;
  };

  // Função para processar categorias muitos-para-muitos
  const processarCategoriaMuitosParaMuitos = (
    dados: any[],
    campoRelacionamento: string,
    campoIdRelacionado: string,
    opcoes: any[],
    idField: string,
    descField: string,
    cores: string[]
  ) => {
    // Contagem para os tipos relacionados
    const contagem: Record<string, number> = {};

    dados.forEach((item) => {
      // Acessar o relacionamento
      let relacionamentos = item;
      const partes = campoRelacionamento.split(".");

      for (const parte of partes) {
        if (
          relacionamentos &&
          typeof relacionamentos === "object" &&
          parte in relacionamentos
        ) {
          relacionamentos = relacionamentos[parte];
        } else {
          relacionamentos = undefined;
          break;
        }
      }

      // Verificar se é um array de relacionamentos
      if (Array.isArray(relacionamentos)) {
        relacionamentos.forEach((rel) => {
          const idRelacionado = rel[campoIdRelacionado];
          if (idRelacionado !== undefined) {
            const id = String(idRelacionado);
            contagem[id] = (contagem[id] || 0) + 1;
          }
        });
      }
    });

    // Converter para formato do gráfico
    const resultado = [];
    let index = 0;

    for (const [id, count] of Object.entries(contagem)) {
      // Buscar a descrição nas opções
      const descricao =
        opcoes.find((opt) => String(opt[idField]) === id)?.[descField] ||
        `Tipo ${id}`;

      resultado.push({
        name: descricao,
        value: count,
        fill: cores[index % cores.length],
      });

      index++;
    }

    return resultado.sort((a, b) => b.value - a.value); // Ordenar pelo valor
  };

  // Aplicar filtros quando uma categoria é selecionada
  useEffect(() => {
    if (!selectedCategory) {
      // Não é necessário fazer nada, os dados já são atualizados pelo processamento principal
      return;
    }

    // Função para simular filtragem
    const getFilteredValue = (value: number) => {
      // Simular filtragem reduzindo valores por uma quantidade aleatória
      const reductionFactor = 0.4 + Math.random() * 0.4; // entre 40% e 80% do original
      return Math.round(value * reductionFactor);
    };

    // Aplicar a mesma lógica de filtragem que estava no código original
    setFilteredRaca(
      filteredRaca.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredEscolaridade(
      filteredEscolaridade.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredUnidades(
      filteredUnidades.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredSintomas(
      filteredSintomas.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredTipoAtendimento(
      filteredTipoAtendimento.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredPublico(
      filteredPublico.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredHipoteses(
      filteredHipoteses.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredTrauma(
      filteredTrauma.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );

    setFilteredGenero(
      filteredGenero.map((item: any) => ({
        ...item,
        value: getFilteredValue(item.value),
      }))
    );
  }, [selectedCategory]);

  const eventoOptions = [
    "Todos",
    "COP30",
    "Carnaval",
    "Copa do Mundo Feminina",
    "Círio de Nazaré",
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastUpdate(new Date().toLocaleString());
    }, 1000);
  };

  const handleEventoChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvento(e.target.value);
    setSelectedCategory(e.target.value !== "Todos" ? e.target.value : null);
  };

  // Handler para charts que retornam dados diretos
  const handleDirectChartClick = (name: string) => {
    if (selectedCategory === name) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(name);
    }
  };

  // Handler para o botão de voltar
  const handleBackButton = () => {
    window.history.back();
  };

  const dashboardRef = useRef(null);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-6">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 text-white mb-4 md:mb-0">
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
              onClick={handleBackButton}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <ClipboardList className="h-7 w-7" />
            <h1 className="text-xl md:text-2xl font-semibold">
              Comunicação de Eventos
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-white text-sm">
              <Clock className="h-4 w-4" />
              <span>Última atualização: {lastUpdate}</span>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar Dados
            </button>

            {/* Botão de exportação com dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                onBlur={() =>
                  setTimeout(() => setShowExportDropdown(false), 200)
                }
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className="h-3 w-3" />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-20 min-w-[160px]">
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <FileSearch2 className="h-4 w-4 text-red-500" />
                    Exportar PDF
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <File className="h-4 w-4 text-blue-500" />
                    Exportar Word
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <FileImage className="h-4 w-4 text-green-500" />
                    Exportar PNG
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    <File className="h-4 w-4 text-gray-500" />
                    Exportar CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Seção de Filtros */}
      <div className="max-w-7xl mx-auto mt-4 px-4">
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-blue-800">
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filtro:</span>
          </div>

          <div className="flex-1">
            <div className="w-full md:w-64">
              <label className="block text-sm text-gray-600 mb-1">Evento</label>
              <select
                value={selectedEvento}
                onChange={handleEventoChange}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                {eventoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCategory && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>Filtro ativo: {selectedCategory}</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className="hover:bg-blue-200 rounded-full p-1"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Abas para alternar entre Gráficos, Tabelas e Mapas */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex border-b border-gray-300">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "graficos" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-500"}`}
            onClick={() => setActiveTab("graficos")}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Gráficos
            </div>
          </button>

          {/* Comentar outras abas para implementação futura */}
          {/* 
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'tabelas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('tabelas')}
          >
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Tabelas
            </div>
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'historico' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('historico')}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Série Histórica
            </div>
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'mapa' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('mapa')}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Mapa
            </div>
          </button>
          */}
        </div>
      </div>

      {/* Conteúdo principal baseado na aba selecionada */}
      {activeTab === "graficos" && (
        <main
          ref={dashboardRef}
          className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2"
        >
          {/* Cards de Resumo */}
          <div
            className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCategory(null)}
          >
            <div className="p-3 bg-blue-100 text-blue-800 rounded-full">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Total de Notificações</h3>
              <p className="text-2xl font-bold text-blue-800">
                {totalNotifications.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleDirectChartClick("Clínico")}
          >
            <div className="p-3 bg-green-100 text-green-800 rounded-full">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Casos Clínicos</h3>
              <p className="text-2xl font-bold text-green-800">
                {clinicalCases.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleDirectChartClick("Trauma")}
          >
            <div className="p-3 bg-red-100 text-red-800 rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Casos de Trauma</h3>
              <p className="text-2xl font-bold text-red-800">
                {traumaCases.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleDirectChartClick("Surto")}
          >
            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-full">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Surtos</h3>
              <p className="text-2xl font-bold text-yellow-800">
                {outbreakCases.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Gráfico de Público Atendido */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-yellow-700" />
              <h3 className="text-sm font-medium text-gray-700">
                Distribuição por Público Atendido
              </h3>
            </div>
            <div className="h-64">
              {filteredPublico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredPublico}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      onClick={(data) => {
                        if (data && data.name) {
                          handleDirectChartClick(data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredPublico.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Tipo de Atendimento */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-700" />
              <h3 className="text-sm font-medium text-gray-700">
                Distribuição por Tipo de Atendimento
              </h3>
            </div>
            <div className="h-64">
              {filteredPublico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredTipoAtendimento}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      onClick={(data) => {
                        if (data && data.name) {
                          handleDirectChartClick(data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredTipoAtendimento.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Identidade de Gênero */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-700" />
              <h3 className="text-sm font-medium text-gray-700">
                Distribuição por Sexo
              </h3>
            </div>
            <div className="h-64">
              {filteredPublico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredGenero}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      cursor="pointer"
                      onClick={(data) => {
                        if (data && data.name) {
                          handleDirectChartClick(data.name);
                        }
                      }}
                    >
                      {filteredGenero.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Raça */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-green-700" />
              <h3 className="text-sm font-medium text-gray-700">
                Distribuição por Raça e Cor
              </h3>
            </div>
            <div className="h-64">
              {filteredPublico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredRaca}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      onClick={(data) => {
                        if (data && data.name) {
                          handleDirectChartClick(data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredRaca.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Principais Sintomas */}
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-red-700" />
              <h3 className="text-sm font-medium text-gray-700">
                Principais Sinais e Sintomas
              </h3>
            </div>
            <div className="h-64">
              {filteredPublico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredSintomas.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                      }}
                      formatter={(value) => [
                        value.toLocaleString(),
                        "Notificações",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      onClick={(data) => {
                        if (data && data.name) {
                          handleDirectChartClick(data.name);
                        }
                      }}
                      cursor="pointer"
                    >
                      {filteredSintomas.slice(0, 10).map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Não há dados disponíveis para exibir
                </div>
              )}
            </div>
          </div>

          {/* Hipóteses Diagnósticas - COMENTADO PARA IMPLEMENTAÇÃO FUTURA */}
          {/* 
          <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-purple-700" />
              <h3 className="text-sm font-medium text-gray-700">Hipóteses Diagnósticas</h3>
            </div>
            <div className="h-64">
            {filteredPublico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredHipoteses}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#666" 
                    width={140}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                    formatter={(value) => [value.toLocaleString(), 'Notificações']}
                  />
                  <Bar 
                    dataKey="value" 
                    onClick={(data) => {
                      if (data && data.name) {
                        handleDirectChartClick(data.name);
                      }
                    }}
                    cursor="pointer"
                  >
                    {filteredHipoteses.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              ) : (
  <div className="h-64 flex items-center justify-center text-gray-500">
    Não há dados disponíveis para exibir
  </div>
)}
            </div>
          </div>
          */}
        </main>
      )}

      {/* Comentar outras seções para implementação futura */}
      {/* 
      {activeTab === 'tabelas' && (
        // ... tabelas content
      )}
      
      {activeTab === 'historico' && (
        // ... historical series content
      )}
      
      {activeTab === 'mapa' && (
        // ... map content
      )}
      */}

      {/* Rodapé */}
      <footer className="max-w-7xl mx-auto p-4 text-center text-xs text-gray-500 mt-4">
        <p>
          © 2025 Secretaria de Saúde Pública do Pará - SESPA. Todos os direitos
          reservados.
        </p>
        <p className="mt-1">Portal Saúde Pará</p>
      </footer>
    </div>
  );
};

export default EnhancedNotificationDashboard;
