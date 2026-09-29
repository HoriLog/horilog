import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowDown,
  Truck,
  CheckCircle2,
  DollarSign,
  Layers,
  RefreshCw,
  Download,
  AlertTriangle,
  AlertCircle,
  Phone,
  Compass,
  Wrench,
  ChevronRight,
  Maximize2,
  Warehouse,
  ShieldCheck,
  Building2,
  MoreVertical,
  Radio,
  FileText,
} from 'lucide-react';
import { TangramMetricCard } from '../tangram/TangramMetricCard';
import { TangramButton } from '../tangram/TangramButton';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramModal } from '../tangram/TangramModal';
import {
  INITIAL_INCIDENTS,
  INITIAL_HUBS,
  INITIAL_DOCKS,
  HOURLY_EXPEDITION_DATA,
} from '../../data/erpData';
import { CriticalIncident, DockStatus } from '../../types';

export interface TorreDeControleProps {
  onNavigateToFleet?: () => void;
}

export const TorreDeControle: React.FC<TorreDeControleProps> = ({
  onNavigateToFleet,
}) => {
  const [activePeriod, setActivePeriod] = useState<'hoje' | '7dias' | 'mes'>('hoje');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('12s');

  // Selected Hub for interactive node callout
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  // Modals for actions
  const [contactModalIncident, setContactModalIncident] = useState<CriticalIncident | null>(null);
  const [rerouteModalIncident, setRerouteModalIncident] = useState<CriticalIncident | null>(null);
  const [supportModalIncident, setSupportModalIncident] = useState<CriticalIncident | null>(null);
  const [selectedDock, setSelectedDock] = useState<DockStatus | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAllIncidentsModalOpen, setIsAllIncidentsModalOpen] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('agora mesmo');
      showToast('Telemetria e status de malha atualizados com sucesso.');
    }, 650);
  };

  const showToast = (message: string) => {
    setActionSuccessToast(message);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1C30] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs sm:text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Operational Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#006C49] animate-pulse" />
            <span className="text-[11px] font-bold text-[#006C49] uppercase tracking-wider">
              Telemetria ao Vivo • Atualizado há {lastUpdated}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E2D72] tracking-tight">
            Torre de Controle Operacional
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Malha Horizonte Logística • Visão unificada em tempo real de frotas, transbordos, SLA e incidentes críticos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-[#EFF6FF] p-1 rounded-lg border border-[#BFDBFE]">
            <button
              type="button"
              onClick={() => setActivePeriod('hoje')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activePeriod === 'hoje'
                  ? 'bg-[#1E2D72] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E2D72]'
              }`}
            >
              Hoje - Tempo Real
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('7dias')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activePeriod === '7dias'
                  ? 'bg-[#1E2D72] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E2D72]'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('mes')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activePeriod === 'mes'
                  ? 'bg-[#1E2D72] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E2D72]'
              }`}
            >
              Mês Atual
            </button>
          </div>

          {/* Refresh button with spin animation */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Recarregar Telemetria"
            className="p-2 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E2D72] transition-all border border-[#BFDBFE] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#F39818]' : ''}`} />
          </button>

          {/* Export Report */}
          <TangramButton
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => showToast('Relatório da Torre de Controle exportado para PDF.')}
          >
            Exportar Relatório
          </TangramButton>
        </div>
      </div>

      {/* Key Metrics Row (4 Dense KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* OTIF Global */}
        <TangramMetricCard
          label="OTIF Global"
          value="96.8%"
          icon={<CheckCircle2 className="w-5 h-5 text-[#006C49]" />}
          iconBgColor="bg-[#D1FAE5]"
          iconColor="text-[#006C49]"
          trend={{
            text: '+1.4% vs meta (95.0%)',
            type: 'positive',
            icon: <TrendingUp className="w-3.5 h-3.5" />,
          }}
          secondaryText="4.120 / 4.256"
          progressBar={{
            percentage: 96.8,
            color: 'bg-[#006C49]',
          }}
        />

        {/* Remessas em Trânsito */}
        <TangramMetricCard
          label="Remessas em Trânsito"
          value="1.428"
          icon={<Truck className="w-5 h-5 text-[#004AC6]" />}
          iconBgColor="bg-[#EFF4FF]"
          iconColor="text-[#004AC6]"
          chip={{
            text: '48 em risco de atraso',
            variant: 'warning',
          }}
          secondaryText="96.6% no prazo"
          onClick={onNavigateToFleet}
        />

        {/* Custo / Tonelada */}
        <TangramMetricCard
          label="Custo / Tonelada"
          value="R$ 142,50"
          icon={<DollarSign className="w-5 h-5 text-[#0B1C30]" />}
          iconBgColor="bg-slate-100"
          iconColor="text-[#0B1C30]"
          trend={{
            text: '-3.2% economia vs mês anterior',
            type: 'positive',
            icon: <ArrowDown className="w-3.5 h-3.5" />,
          }}
          secondaryText="Meta: R$ 148,00"
        />

        {/* Ocupação de Frota */}
        <TangramMetricCard
          label="Ocupação de Frota"
          value="92.4%"
          icon={<Layers className="w-5 h-5 text-[#0B1C30]" />}
          iconBgColor="bg-slate-100"
          iconColor="text-[#0B1C30]"
          trend={{
            text: '+4.8% m/m',
            type: 'positive',
            icon: <TrendingUp className="w-3.5 h-3.5" />,
          }}
          secondaryText="Capacidade Volumétrica"
          progressBar={{
            percentage: 92.4,
            color: 'bg-[#004AC6]',
            secondaryPercentage: 7.6,
            secondaryColor: 'bg-[#CBDBF5]',
          }}
          onClick={onNavigateToFleet}
        />
      </div>

      {/* Main Grid: 8 cols Primary Operational vs 4 cols Analytics / Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PRIMARY COLUMN (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Interactive Telemetry Map Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
            {/* Map Card Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#1E2D72]">
                  <Compass className="w-5 h-5 text-[#F39818]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E2D72] tracking-tight">
                    Malha Rodoviária Horizonte • Telemetria em Tempo Real
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Corredores ativos: Horizonte Cajamar ⇄ Rio ⇄ Betim ⇄ Curitiba
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EFF6FF] rounded-lg font-mono text-xs text-[#1E2D72] font-semibold border border-[#BFDBFE]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" /> 684 Veículos Rastreados
                </span>
                <button
                  type="button"
                  onClick={() => showToast('Modo de mapa expandido')}
                  className="p-1.5 rounded-lg text-[#737686] hover:bg-slate-100 hover:text-[#0B1C30] transition-colors"
                  title="Tela Cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Geographic View with SVG Overlay Simulation */}
            <div className="relative w-full h-80 sm:h-96 bg-[#0B1C30] overflow-hidden select-none">
              {/* Topographic / Grid stylized background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(#2563eb 1px, transparent 1px), radial-gradient(#2563eb 1px, #0b1c30 1px)`,
                  backgroundSize: '32px 32px',
                  backgroundPosition: '0 0, 16px 16px',
                }}
              />

              {/* Tactical Map Overlay Layer */}
              <div className="absolute inset-0 bg-linear-to-t from-[#0B1C30] via-transparent to-[#0B1C30]/40 pointer-events-none" />

              {/* SVG Corridors and Fleet Vectors */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Route SP to RJ */}
                <path
                  d="M 240 180 Q 360 140 500 120"
                  fill="none"
                  stroke="#2563EB"
                  strokeDasharray="6,4"
                  strokeWidth="3"
                  className="opacity-90"
                />
                {/* Route SP to Betim/MG */}
                <path
                  d="M 240 180 Q 300 90 420 50"
                  fill="none"
                  stroke="#10B981"
                  strokeDasharray="4,4"
                  strokeWidth="2.5"
                  className="opacity-80"
                />
                {/* Route SP to Curitiba/PR */}
                <path
                  d="M 240 180 Q 180 230 110 260"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  className="opacity-85"
                />

                {/* Moving Telemetry Particles */}
                <circle cx="310" cy="155" r="4" fill="#6CF8BB" className="animate-ping" />
                <circle cx="310" cy="155" r="3" fill="#FFFFFF" />
                <circle cx="370" cy="72" r="3.5" fill="#FFB95F" className="animate-ping" />
                <circle cx="370" cy="72" r="2.5" fill="#FFFFFF" />
                <circle cx="165" cy="225" r="3.5" fill="#60A5FA" className="animate-ping" />
                <circle cx="165" cy="225" r="2.5" fill="#FFFFFF" />
              </svg>

              {/* Interactive Node Callouts on Map */}
              {/* Hub SP Central */}
              <div
                onClick={() => setSelectedHub('Cajamar / SP')}
                className="absolute left-[30%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                <div className="bg-[#004AC6] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 mb-1 ring-2 ring-white/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6CF8BB]" />
                  Hub SP - Cajamar
                </div>
                <div className="w-8 h-8 rounded-full bg-[#004AC6] text-white flex items-center justify-center shadow-xl ring-4 ring-blue-500/30 group-hover:scale-110 transition-transform">
                  <Warehouse className="w-4 h-4" />
                </div>
              </div>

              {/* Hub Betim (MG) */}
              <div
                onClick={() => setSelectedHub('Betim / MG')}
                className="absolute left-[54%] top-[14%] -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              >
                <div className="bg-white text-[#0B1C30] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006C49]" /> Betim / MG
                </div>
                <div className="w-6 h-6 rounded-full bg-[#006C49] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Hub Rio de Janeiro (Dutra) */}
              <div
                onClick={() => setSelectedHub('Dutra / RJ')}
                className="absolute right-[22%] top-[30%] flex flex-col items-center group cursor-pointer"
              >
                <div className="bg-white text-[#0B1C30] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004AC6]" /> Dutra - RJ
                </div>
                <div className="w-6 h-6 rounded-full bg-[#004AC6] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Hub Curitiba */}
              <div
                onClick={() => setSelectedHub('Curitiba / PR')}
                className="absolute left-[14%] bottom-[16%] flex flex-col items-center group cursor-pointer"
              >
                <div className="bg-white text-[#0B1C30] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Curitiba / PR
                </div>
                <div className="w-6 h-6 rounded-full bg-[#D97706] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Selected Hub Floating Callout Info */}
              {selectedHub && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-slate-200 z-20 text-xs">
                  <div className="flex items-center justify-between gap-4 font-bold text-slate-800">
                    <span>{selectedHub}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHub(null);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Veículos ativos nesta área: 142 • Tempo médio de trânsito: 4h 12m
                  </div>
                </div>
              )}

              {/* Live Corridors Status Bar Floating Footer */}
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#0B1C30]">
                      Corredor Ayrton Senna/Dutra:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] font-mono text-[11px] font-bold">
                      Fluido 88 km/h
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#0B1C30]">
                      Fernão Dias (MG):
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-mono text-[11px] font-bold">
                      Alerta Chuva 52 km/h
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-[#737686]">
                  42 comboios em tráfego pesado
                </span>
              </div>
            </div>

            {/* Telemetry Details Strip below Map */}
            <div className="grid grid-cols-2 sm:grid-cols-4 p-4 bg-[#EFF4FF] gap-4 border-t border-[#DBE8FE]">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
                  Consumo Médio Malha
                </span>
                <span className="font-mono text-base sm:text-lg text-[#0B1C30] font-bold">
                  2.41 km/L
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
                  Velocidade Média
                </span>
                <span className="font-mono text-base sm:text-lg text-[#0B1C30] font-bold">
                  67.4 km/h
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
                  Cargas Refrigeradas
                </span>
                <span className="font-mono text-base sm:text-lg text-[#006C49] font-bold">
                  -18.2 °C (Estável)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
                  Disponibilidade Frota
                </span>
                <span className="font-mono text-base sm:text-lg text-[#004AC6] font-bold">
                  98.1% Ativa
                </span>
              </div>
            </div>
          </div>

          {/* Critical Incident Table (Immediate Action Required) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FEF2F2] text-[#DC2626]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0B1C30] tracking-tight">
                      Alertas Críticos Imediatos
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold animate-pulse">
                      3 Ativos
                    </span>
                  </div>
                  <p className="text-xs text-[#737686]">
                    Exigem despacho de equipe operacional ou contato com motorista
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllIncidentsModalOpen(true)}
                className="text-xs font-semibold text-[#004AC6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver Todos os 14 Incidentes <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#EFF4FF] text-[#434655] text-[11px] uppercase font-semibold tracking-wider">
                    <th className="py-2.5 px-4">Veículo / Remessa</th>
                    <th className="py-2.5 px-4">Tipo de Incidente</th>
                    <th className="py-2.5 px-4">Localização</th>
                    <th className="py-2.5 px-4">Impacto SLA</th>
                    <th className="py-2.5 px-4 text-right">Ação Imediata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs sm:text-sm text-[#0B1C30]">
                  {INITIAL_INCIDENTS.map((inc) => {
                    const isError = inc.severity === 'error';
                    return (
                      <tr key={inc.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {isError ? (
                              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-[#0B1C30]">{inc.vehicle}</div>
                              <div className="font-mono text-[11px] text-[#737686]">
                                Motorista: {inc.driver}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <TangramBadge variant={isError ? 'danger' : 'warning'}>
                            {inc.incidentType}
                          </TangramBadge>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0B1C30]">{inc.location}</div>
                          <div className="font-mono text-[11px] text-[#737686]">{inc.landmark}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div
                            className={`font-semibold font-mono text-xs ${
                              isError ? 'text-[#DC2626]' : 'text-[#D97706]'
                            }`}
                          >
                            {inc.slaImpact}
                          </div>
                          <div className="text-[11px] text-[#737686]">{inc.cargoType}</div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inc.recommendedAction === 'contatar' && (
                              <>
                                <TangramButton
                                  variant="primary"
                                  size="sm"
                                  icon={<Phone className="w-3.5 h-3.5" />}
                                  onClick={() => setContactModalIncident(inc)}
                                >
                                  Contatar
                                </TangramButton>
                                <TangramButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRerouteModalIncident(inc)}
                                >
                                  Desvio
                                </TangramButton>
                              </>
                            )}

                            {inc.recommendedAction === 'desvio' && (
                              <TangramButton
                                variant="success"
                                size="sm"
                                icon={<Compass className="w-3.5 h-3.5" />}
                                onClick={() => setRerouteModalIncident(inc)}
                              >
                                Roteirizar Desvio
                              </TangramButton>
                            )}

                            {inc.recommendedAction === 'suporte' && (
                              <TangramButton
                                variant="primary"
                                size="sm"
                                icon={<Wrench className="w-3.5 h-3.5" />}
                                onClick={() => setSupportModalIncident(inc)}
                              >
                                Acionar Suporte
                              </TangramButton>
                            )}

                            <button
                              type="button"
                              onClick={() => showToast(`Detalhes expandidos do incidente ${inc.id}`)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECONDARY / SIDEBAR COLUMN (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Volume Expedido vs Entregue por Hora (Vector Bar & Line Chart) */}
          <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-[#0B1C30]">Expedição vs Entrega</h3>
                <span className="text-xs text-[#737686]">Volume por hora (Cargas finalizadas)</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#006C49] bg-[#D1FAE5] px-2 py-0.5 rounded">
                Pico: 11h-14h
              </span>
            </div>

            {/* Inline SVG Visualization */}
            <div className="w-full h-44 flex flex-col justify-end pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                {/* Gridlines */}
                <line x1="0" y1="100" x2="320" y2="100" stroke="#E5EEFF" strokeWidth="1" />
                <line x1="0" y1="60" x2="320" y2="60" stroke="#E5EEFF" strokeDasharray="2,2" strokeWidth="1" />
                <line x1="0" y1="20" x2="320" y2="20" stroke="#E5EEFF" strokeDasharray="2,2" strokeWidth="1" />

                {/* Bars: Expedido */}
                <rect x="15" y="65" width="10" height="35" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="55" y="45" width="10" height="55" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="95" y="30" width="10" height="70" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="135" y="15" width="10" height="85" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="175" y="25" width="10" height="75" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="215" y="38" width="10" height="62" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="255" y="18" width="10" height="82" rx="2" fill="#2563EB" className="opacity-80 hover:opacity-100 cursor-pointer" />
                <rect x="295" y="50" width="10" height="50" rx="2" fill="#2563EB" className="opacity-40 hover:opacity-80 cursor-pointer" />

                {/* Line: Entregue */}
                <path
                  d="M 20 85 L 60 75 L 100 55 L 140 32 L 180 35 L 220 48 L 260 28 L 300 62"
                  fill="none"
                  stroke="#006C49"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="260" cy="28" r="4" fill="#006C49" className="ring-2 ring-white" />
              </svg>

              <div className="flex justify-between text-[#737686] font-mono text-[10px] mt-2">
                {HOURLY_EXPEDITION_DATA.map((d) => (
                  <span key={d.hour}>{d.hour}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 bg-[#EFF4FF] p-2.5 rounded-lg border border-[#DBE8FE]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                <span className="text-[#0B1C30] font-medium">Expedido (Total: 4.820 t)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[#006C49] rounded-full" />
                <span className="text-[#0B1C30] font-medium">Entregue (4.120 t)</span>
              </div>
            </div>
          </div>

          {/* Hub SLA Performance Rankings */}
          <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1C30]">Performance dos Hubs</h3>
              <span className="text-xs text-[#737686]">Hoje</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {INITIAL_HUBS.map((hub) => (
                <div
                  key={hub.rank}
                  className="flex flex-col gap-1 p-2 hover:bg-[#EFF4FF] rounded-lg transition-colors cursor-pointer"
                  onClick={() => setSelectedHub(hub.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#004AC6]">#{hub.rank}</span>
                      <span className="text-xs font-bold text-[#0B1C30]">{hub.name}</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        hub.status === 'good' ? 'text-[#006C49]' : 'text-[#D97706]'
                      }`}
                    >
                      {hub.otif}% OTIF
                    </span>
                  </div>

                  <div className="w-full bg-[#EFF4FF] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        hub.status === 'good' ? 'bg-[#006C49]' : 'bg-[#F59E0B]'
                      }`}
                      style={{ width: `${hub.otif}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-[#737686] font-mono">
                    <span>Capacidade: {hub.capacityPercentage}%</span>
                    <span>{hub.dispatchesToday.toLocaleString('pt-BR')} despachos hoje</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dock Management Panel (Centro de Distribuição Principal) */}
          <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#0B1C30]">Status de Docas</h3>
                  <span className="px-1.5 py-0.2 bg-[#EFF4FF] text-[#004AC6] font-mono text-[10px] font-bold rounded">
                    CD-SP
                  </span>
                </div>
                <span className="text-xs text-[#737686]">12 docas em operação ativa</span>
              </div>
              <span className="font-mono text-xs text-[#004AC6] font-bold">11/12 Ocupadas</span>
            </div>

            {/* 12 Docks Status Matrix */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {INITIAL_DOCKS.map((dock) => {
                const isDesc = dock.status === 'descarregando';
                const isCarr = dock.status === 'carregando';
                const isLivre = dock.status === 'livre';

                return (
                  <button
                    key={dock.id}
                    type="button"
                    onClick={() => setSelectedDock(dock)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all group cursor-pointer text-center border ${
                      isDesc
                        ? 'bg-[#EFF4FF] hover:bg-[#DBE8FE] border-[#DBE8FE]'
                        : isCarr
                        ? 'bg-[#D1FAE5]/40 hover:bg-[#D1FAE5]/70 border-[#A7F3D0]'
                        : 'bg-white hover:bg-slate-50 border-[#CBD5E1]'
                    }`}
                    title={`${dock.dockNumber}: ${dock.status} ${dock.truckModel ? `(${dock.truckModel})` : ''}`}
                  >
                    <span className="font-mono text-[11px] font-bold text-[#0B1C30]">
                      {dock.dockNumber}
                    </span>
                    <span className="text-xs mt-1 font-bold">
                      {isDesc ? '↓' : isCarr ? '↑' : '✓'}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isDesc ? 'text-[#004AC6]' : isCarr ? 'text-[#006C49]' : 'text-[#737686]'
                      }`}
                    >
                      {isDesc ? 'Desc' : isCarr ? 'Carr' : 'Livre'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-[#737686] pt-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#004AC6]" /> 8 Desc.
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#006C49]" /> 3 Carr.
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> 1 Livre
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDock(INITIAL_DOCKS[0])}
                className="font-semibold text-xs text-[#004AC6] hover:underline cursor-pointer"
              >
                Gerenciar Pátio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Quick Dispatch & Audit Footer Widget */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#D1FAE5] text-[#006C49]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#0B1C30]">
              Auditoria de Cargas & Telemetria em Conformidade ANTT
            </span>
            <p className="text-xs text-[#737686]">
              Todos os manifestos MDF-e e NFe validados pelo gateway Sefaz sem divergências pendentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <span className="font-mono text-xs text-[#737686]">
            Sincronizado: Servidor Principal BRA-SP-01
          </span>
          <TangramButton
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
          >
            Log de Auditoria
          </TangramButton>
        </div>
      </div>

      {/* MODAL: Contatar Motorista */}
      <TangramModal
        isOpen={!!contactModalIncident}
        onClose={() => setContactModalIncident(null)}
        title="Despacho de Contato com Motorista"
        subtitle={`Veículo: ${contactModalIncident?.vehicle}`}
      >
        {contactModalIncident && (
          <div className="flex flex-col gap-4 text-xs sm:text-sm">
            <div className="p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE]">
              <div className="font-bold text-[#0B1C30]">{contactModalIncident.driver}</div>
              <div className="text-xs text-[#737686]">{contactModalIncident.driverPhone}</div>
              <div className="mt-1 text-xs text-[#004AC6] font-semibold">
                Status Atual: {contactModalIncident.incidentType} em {contactModalIncident.location}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Mensagem de Instrução</label>
              <textarea
                className="w-full h-20 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#004AC6]"
                defaultValue={`Olá ${contactModalIncident.driver}, identificamos parada atípica na ${contactModalIncident.landmark}. Por favor, confirme prontidão e segurança da carga (${contactModalIncident.cargoType}).`}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <TangramButton
                variant="primary"
                fullWidth
                icon={<Phone className="w-4 h-4" />}
                onClick={() => {
                  setContactModalIncident(null);
                  showToast(`Ligação disparada via PABX para ${contactModalIncident.driver}.`);
                }}
              >
                Ligar Agora (VoIP)
              </TangramButton>
              <TangramButton
                variant="outline"
                fullWidth
                onClick={() => {
                  setContactModalIncident(null);
                  showToast(`Mensagem enviada no app de bordo do motorista.`);
                }}
              >
                Enviar ao Painel
              </TangramButton>
            </div>
          </div>
        )}
      </TangramModal>

      {/* MODAL: Roteirizar Desvio */}
      <TangramModal
        isOpen={!!rerouteModalIncident}
        onClose={() => setRerouteModalIncident(null)}
        title="Roteirização e Desvio de Emergência"
        subtitle={`Evitar atraso na janela de entrega (${rerouteModalIncident?.cargoType})`}
      >
        {rerouteModalIncident && (
          <div className="flex flex-col gap-4 text-xs sm:text-sm">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
              <div className="font-bold">Trecho afetado: {rerouteModalIncident.location}</div>
              <div className="text-xs mt-1">Impacto previsto: {rerouteModalIncident.slaImpact}</div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="font-semibold text-slate-800 text-xs">Rotas Alternativas Sugeridas pelo TMS:</div>
              <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input type="radio" name="route" defaultChecked className="mt-0.5 text-[#004AC6]" />
                <div>
                  <div className="font-bold text-[#0B1C30]">Rota Secundária: Rodovia Dom Pedro I</div>
                  <div className="text-xs text-slate-500">Economia estimada: 28 min • Pedágio: +R$ 14,20</div>
                </div>
              </label>
              <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input type="radio" name="route" className="mt-0.5 text-[#004AC6]" />
                <div>
                  <div className="font-bold text-[#0B1C30]">Rota Expressa: Anel Viário Magalhães Teixeira</div>
                  <div className="text-xs text-slate-500">Economia estimada: 18 min • Tráfego moderado</div>
                </div>
              </label>
            </div>

            <TangramButton
              variant="success"
              fullWidth
              icon={<Compass className="w-4 h-4" />}
              onClick={() => {
                setRerouteModalIncident(null);
                showToast(`Nova rota calculada e transmitida ao computador de bordo.`);
              }}
            >
              Confirmar e Transmitir Rota
            </TangramButton>
          </div>
        )}
      </TangramModal>

      {/* MODAL: Suporte Mecânico / Temperatura */}
      <TangramModal
        isOpen={!!supportModalIncident}
        onClose={() => setSupportModalIncident(null)}
        title="Acionamento de Suporte Técnico"
        subtitle={`Sensor de Telemetria: ${supportModalIncident?.cargoType}`}
      >
        {supportModalIncident && (
          <div className="flex flex-col gap-4 text-xs sm:text-sm">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-900">
              <div className="font-bold">Temperatura Baú: -8.4 °C (Fora da meta de -18.0 °C)</div>
              <div className="text-xs mt-1">Localização: {supportModalIncident.location} ({supportModalIncident.landmark})</div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-semibold text-xs text-slate-700">Equipe Mais Próxima:</span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-800">Oficina Móvel ThermoKing - Base Dutra km 301</div>
                <div className="text-xs text-slate-500">Distância: 3.2 km • Tempo estimado de resposta: 12 min</div>
              </div>
            </div>

            <TangramButton
              variant="primary"
              fullWidth
              icon={<Wrench className="w-4 h-4" />}
              onClick={() => {
                setSupportModalIncident(null);
                showToast(`Equipe móvel despachada para o veículo ${supportModalIncident.plate}.`);
              }}
            >
              Confirmar Despacho de Socorro
            </TangramButton>
          </div>
        )}
      </TangramModal>

      {/* MODAL: Detalhes de Doca */}
      <TangramModal
        isOpen={!!selectedDock}
        onClose={() => setSelectedDock(null)}
        title={`Gerenciamento da Doca ${selectedDock?.dockNumber}`}
        subtitle={`Centro de Distribuição Cajamar (CD-SP)`}
      >
        {selectedDock && (
          <div className="flex flex-col gap-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE]">
              <div>
                <div className="text-xs text-[#737686]">Status da Doca</div>
                <div className="font-bold text-base text-[#0B1C30] uppercase">
                  {selectedDock.status}
                </div>
              </div>
              <TangramBadge
                variant={
                  selectedDock.status === 'descarregando'
                    ? 'info'
                    : selectedDock.status === 'carregando'
                    ? 'success'
                    : 'neutral'
                }
              >
                {selectedDock.status}
              </TangramBadge>
            </div>

            {selectedDock.status !== 'livre' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500">Veículo / Carreta</span>
                    <div className="font-bold text-slate-800">{selectedDock.truckModel}</div>
                    <div className="font-mono text-xs text-[#004AC6]">{selectedDock.truckPlate}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500">Previsão Término</span>
                    <div className="font-bold text-slate-800">{selectedDock.etaCompletion}</div>
                    <div className="text-xs text-emerald-600 font-semibold">Dentro do SLA</div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Progresso da Movimentação</span>
                    <span className="font-bold font-mono">{selectedDock.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#004AC6] h-full rounded-full transition-all"
                      style={{ width: `${selectedDock.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <TangramButton
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setSelectedDock(null);
                      showToast(`Doca ${selectedDock.dockNumber} marcada para liberação prioritária.`);
                    }}
                  >
                    Acelerar Liberação
                  </TangramButton>
                  <TangramButton
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setSelectedDock(null);
                      showToast(`Conferência de carga da Doca ${selectedDock.dockNumber} finalizada.`);
                    }}
                  >
                    Concluir Conferência
                  </TangramButton>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 py-2 text-center">
                <div className="text-slate-600 text-xs">
                  Esta doca está livre para alocação imediata de carretas na fila de espera.
                </div>
                <TangramButton
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setSelectedDock(null);
                    showToast(`Próximo veículo da fila alocado para a doca ${selectedDock.dockNumber}.`);
                  }}
                >
                  Alocar Próximo Veículo da Fila
                </TangramButton>
              </div>
            )}
          </div>
        )}
      </TangramModal>

      {/* MODAL: Log de Auditoria ANTT */}
      <TangramModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Log de Auditoria & Conformidade Fiscal ANTT"
        subtitle="Gateway de validação SEFAZ e MDF-e em tempo real"
        maxWidth="lg"
      >
        <div className="flex flex-col gap-3 text-xs sm:text-sm">
          <div className="divide-y divide-slate-100 font-mono text-xs">
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">MDF-e 3524098492041239</span>
                <div className="text-[11px] text-slate-500">Chave Sefaz SP • Placa FXZ-8921 • 42.100 kg</div>
              </div>
              <TangramBadge variant="success">Autorizado</TangramBadge>
            </div>
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">MDF-e 4124097712391204</span>
                <div className="text-[11px] text-slate-500">Chave Sefaz PR • Placa BRA-4E29 • 38.500 kg</div>
              </div>
              <TangramBadge variant="success">Autorizado</TangramBadge>
            </div>
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">CIOT 99482-2026/SP</span>
                <div className="text-[11px] text-slate-500">Vale-Pedágio Obrigatório Sincronizado</div>
              </div>
              <TangramBadge variant="info">Conforme</TangramBadge>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-xs">
            Certificado Digital A1 ativo. Validade até Dezembro de 2026. Zero pendências fiscais em trânsito.
          </div>
        </div>
      </TangramModal>

      {/* MODAL: Todos os Incidentes */}
      <TangramModal
        isOpen={isAllIncidentsModalOpen}
        onClose={() => setIsAllIncidentsModalOpen(false)}
        title="Todos os Incidentes Operacionais (14 Ocorrências)"
        subtitle="Visão consolidada da malha viária"
        maxWidth="lg"
      >
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {INITIAL_INCIDENTS.map((inc) => (
            <div key={inc.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">{inc.vehicle}</div>
                <div className="text-[11px] text-slate-500">{inc.incidentType} em {inc.location}</div>
                <div className="text-[11px] text-red-600 font-semibold">{inc.slaImpact}</div>
              </div>
              <TangramButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAllIncidentsModalOpen(false);
                  setContactModalIncident(inc);
                }}
              >
                Tratar
              </TangramButton>
            </div>
          ))}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
            + 11 ocorrências leves em monitoramento automático pela telemetria de bordo.
          </div>
        </div>
      </TangramModal>
    </div>
  );
};
