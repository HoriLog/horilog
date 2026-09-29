import React, { useState } from 'react';
import {
  Truck,
  Compass,
  Building2,
  Wrench,
  ShieldAlert,
  UserPlus,
  PlusCircle,
  LayoutGrid,
  List,
  CheckCircle2,
  Timer,
  SlidersHorizontal,
  MapPin,
  Flame,
  Gauge,
  Thermometer,
  Wifi,
  Search,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { TangramButton } from '../tangram/TangramButton';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramModal } from '../tangram/TangramModal';
import { TangramInput } from '../tangram/TangramInput';
import { VehicleTelemetry, MaintenanceRecord, TeamMemberSchedule } from '../../types';
import { OperationalStorage } from '../../services/storageService';
import { useStorageVersion } from '../../hooks/useStorageVersion';
import { useVehicles } from '../../hooks/useVehicles';
import { createTeamMember } from '../../services/api/teamMembers';
import { NO_DATA, initials } from '../../utils/format';

export interface GestaoFrotaProps {
  onOpenNewVehicleModal?: () => void;
}

export const GestaoFrota: React.FC<GestaoFrotaProps> = ({
  onOpenNewVehicleModal,
}) => {
  useStorageVersion();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSegment, setSelectedSegment] = useState<string>('Todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [maintenanceSearch, setMaintenanceSearch] = useState('');

  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const maintenance = OperationalStorage.getMaintenance();

  // Interactive Modals
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<VehicleTelemetry | null>(null);
  const [registerDriverModalOpen, setRegisterDriverModalOpen] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', cpf: '', cnh: '', phone: '', toxExpiry: '' });
  const [selectedMaintenanceRecord, setSelectedMaintenanceRecord] = useState<MaintenanceRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const segments = [
    'Todos',
    'Carreta 9 Eixos',
    'Bitrem',
    'Cavalo Mecânico',
    'Toco',
    'VUC',
    'Fiorino',
  ];

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSegment = selectedSegment === 'Todos' || v.type === selectedSegment;
    const matchesSearch =
      v.model.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.driver.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesSegment && matchesSearch;
  });

  const filteredMaintenance = maintenance.filter((m) => {
    return (
      m.vehicle.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
      m.plate.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(maintenanceSearch.toLowerCase())
    );
  });

  const totalFrota = vehicles.length;
  const emOperacao = vehicles.filter((v) => v.status === 'Em Rota').length;
  const disponiveis = vehicles.filter((v) => v.status === 'Pátio' || v.status === 'Parado (Posto)').length;
  const emManutencao = vehicles.filter((v) => v.status === 'Oficina').length;

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1C30] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs sm:text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dynamic Status & Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs uppercase tracking-wider font-semibold">
            <span>HORIZONTE LOGÍSTICA</span>
            <span>/</span>
            <span className="text-[#1E2D72] font-bold">TELEMETRIA CAN-BUS & IOT</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E2D72] tracking-tight">
              Gestão de Frota Horizonte & Telemetria Ativa
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              Transmissão Contínua
            </span>
          </div>
        </div>

        {/* Quick Actions Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bloqueio / Emergência */}
          <TangramButton
            variant="danger"
            size="sm"
            icon={<ShieldAlert className="w-4 h-4" />}
            onClick={() => setEmergencyModalOpen(true)}
          >
            Bloqueio / Emergência
          </TangramButton>

          {/* Cadastrar Motorista */}
          <TangramButton
            variant="outline"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setRegisterDriverModalOpen(true)}
          >
            Cadastrar Motorista
          </TangramButton>

          {/* Novo Veículo */}
          <TangramButton
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={onOpenNewVehicleModal}
          >
            Novo Veículo
          </TangramButton>
        </div>
      </div>

      {/* Metric Capsules (Stats Strip) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Frota */}
        <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#004AC6]">
            <Truck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
              Total Frota
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#0B1C30] font-mono">{totalFrota}</span>
              <span className="text-xs text-[#737686]">unidades</span>
            </div>
          </div>
        </div>

        {/* Em Operação */}
        <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-[#006C49]">
            <Compass className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
              Em Operação
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#006C49] font-mono">{emOperacao}</span>
              <span className="text-xs text-[#006C49] font-semibold">
                {totalFrota > 0 ? `${Math.round((emOperacao / totalFrota) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Disponíveis (Pátio) */}
        <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
              Disponíveis (Pátio)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#0B1C30] font-mono">{disponiveis}</span>
              <span className="text-xs text-[#737686]">prontos</span>
            </div>
          </div>
        </div>

        {/* Manutenção Preventiva */}
        <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
              Manutenção Preventiva
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#D97706] font-mono">{emManutencao}</span>
              <span className="text-xs text-[#D97706] font-semibold">Doca Mecânica</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Filter & View Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle Mode */}
          <div className="inline-flex p-1 bg-[#EFF6FF] rounded-lg border border-[#BFDBFE] gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#1E2D72] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E2D72]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid Telemetria
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#1E2D72] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E2D72]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista de Veículos
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Vehicle Segment Filters */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {segments.map((seg) => {
              const isSelected = selectedSegment === seg;
              return (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setSelectedSegment(seg)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE] font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {seg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Diagnostic & Compliance Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EFF4FF] rounded-lg text-xs text-[#0B1C30] border border-[#DBE8FE]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#006C49]" />
            <span>Checklist Diário:</span>
            <span className="font-bold text-[#006C49]">98% OK</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EFF4FF] rounded-lg text-xs text-[#0B1C30] border border-[#DBE8FE]">
            <Timer className="w-3.5 h-3.5 text-[#004AC6]" />
            <span>Tacógrafo:</span>
            <span className="font-bold text-[#004AC6]">Sincronizado</span>
          </div>

          <button
            type="button"
            onClick={() => showToast('Filtros avançados de telemetria')}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Filtros avançados"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Telemetry Active Cards Grid or Empty State */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1E2D72] mb-4">
            <Truck className="w-8 h-8 text-[#F39818]" />
          </div>
          <h3 className="text-lg font-bold text-[#1E2D72]">Nenhum veículo registrado na frota</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Sua operação está pronta para telemetria em tempo real. Cadastre seus caminhões e carretas ou importe sua planilha de frota no formato CSV.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TangramButton
              variant="primary"
              size="md"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={onOpenNewVehicleModal}
            >
              Cadastrar Primeiro Veículo
            </TangramButton>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredVehicles.map((vehicle) => {
            return (
              <div
                key={vehicle.id}
                className="flex flex-col bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header Strip */}
                <div className="p-4 bg-[#EFF4FF] flex items-start justify-between border-b border-[#DBE8FE]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#DBE8FE] flex items-center justify-center text-[#004AC6]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0B1C30]">{vehicle.model}</span>
                        <span className="px-2 py-0.5 rounded bg-[#EFF4FF] text-[#004AC6] font-mono text-[11px] font-bold border border-[#BFDBFE]">
                          {vehicle.plate}
                        </span>
                      </div>
                      <span className="text-xs text-[#737686]">{vehicle.category}</span>
                    </div>
                  </div>

                  <TangramBadge
                    variant={
                      vehicle.status === 'Em Rota'
                        ? 'success'
                        : vehicle.status === 'Parado (Posto)'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {vehicle.status}
                  </TangramBadge>
                </div>

                {/* Driver & Geographic Anchor */}
                <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#DBE8FE] text-[#004AC6] text-[10px] font-bold flex items-center justify-center ring-1 ring-slate-200">
                      {vehicle.driver.name ? initials(vehicle.driver.name) : '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#737686] leading-none">Motorista Titular</span>
                      <span className="text-xs font-bold text-[#0B1C30]">{vehicle.driver.name || NO_DATA}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#737686] font-mono text-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#004AC6]" />
                    <span>{vehicle.location || NO_DATA}</span>
                  </div>
                </div>

                {/* Real-time Cockpit Body */}
                <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                  {vehicle.incidentAlert && (
                    <div className="flex items-start gap-2.5 p-2.5 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#DC2626]">
                            {vehicle.incidentAlert.title}
                          </span>
                          <span className="font-mono text-[10px] text-[#DC2626]">
                            {vehicle.incidentAlert.timeAgo}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-700 leading-snug">
                          {vehicle.incidentAlert.description}
                        </span>
                      </div>
                    </div>
                  )}

                  {vehicle.routeProgress && (
                    <div className="p-2.5 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE] flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#434655]">
                          Progresso do Trecho ({vehicle.routeProgress.currentKm} / {vehicle.routeProgress.totalKm} km)
                        </span>
                        <span className="font-mono font-bold text-[#004AC6]">
                          {vehicle.routeProgress.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-[#DBE8FE] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#004AC6] h-full rounded-full transition-all"
                          style={{ width: `${vehicle.routeProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#737686] font-mono">
                        <span>Partida: {vehicle.routeProgress.departureTime}</span>
                        <span>ETA Previsto: {vehicle.routeProgress.eta}</span>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Numbers Quad */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE]">
                    {/* Quad 1: Speed */}
                    <div className="flex flex-col bg-white p-2 rounded-md shadow-xs border border-slate-100">
                      <span className="text-[10px] text-[#737686]">Velocidade Atual</span>
                      {vehicle.currentSpeed !== undefined ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-lg font-bold font-mono ${
                                vehicle.currentSpeed > 0 ? 'text-[#004AC6]' : 'text-[#0B1C30]'
                              }`}
                            >
                              {vehicle.currentSpeed}
                            </span>
                            <span className="text-[10px] text-[#737686]">km/h</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-[#004AC6] h-full rounded-full"
                              style={{ width: `${Math.min(100, vehicle.currentSpeed)}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">{NO_DATA}</span>
                      )}
                    </div>

                    {/* Quad 2: Engine RPM */}
                    <div className="flex flex-col bg-white p-2 rounded-md shadow-xs border border-slate-100">
                      <span className="text-[10px] text-[#737686]">Rotação Motor</span>
                      {vehicle.engineRpm !== undefined ? (
                        <span className="text-base font-bold text-[#0B1C30] font-mono">
                          {vehicle.engineRpm} <span className="text-[10px] text-slate-500 font-normal">RPM</span>
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">{NO_DATA}</span>
                      )}
                    </div>

                    {/* Quad 3: Fuel Level */}
                    <div className="flex flex-col bg-white p-2 rounded-md shadow-xs border border-slate-100">
                      <span className="text-[10px] text-[#737686]">Nível de Diesel</span>
                      {vehicle.fuelLevel !== undefined ? (
                        <>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-bold text-[#0B1C30] font-mono">{vehicle.fuelLevel}%</span>
                            {vehicle.fuelKmEstimate !== undefined && (
                              <span className="font-mono text-[10px] text-[#737686]">~{vehicle.fuelKmEstimate} km</span>
                            )}
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${vehicle.fuelLevel < 35 ? 'bg-[#D97706]' : 'bg-[#006C49]'}`}
                              style={{ width: `${vehicle.fuelLevel}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">{NO_DATA}</span>
                      )}
                    </div>

                    {/* Quad 4: TPMS */}
                    <div className="flex flex-col bg-white p-2 rounded-md shadow-xs border border-slate-100">
                      <span className="text-[10px] text-[#737686]">Pressão Pneus (TPMS)</span>
                      {vehicle.tirePressureStatus ? (
                        <>
                          <div className="flex items-center gap-1 text-[#006C49] text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{vehicle.tirePressureStatus}</span>
                          </div>
                          {vehicle.tirePressurePsi !== undefined && (
                            <span className="text-[10px] text-[#737686]">{vehicle.tirePressurePsi} psi calibrado</span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">{NO_DATA}</span>
                      )}
                    </div>
                  </div>

                  {/* Refrigerated Telemetry Sensor */}
                  {vehicle.temperature && (
                    <div className="flex items-center justify-between p-2.5 bg-[#D1FAE5]/60 rounded-lg border border-[#A7F3D0]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#D1FAE5] flex items-center justify-center text-[#006C49]">
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-[#065F46]">
                            Baú Frigorífico (Sensor S1)
                          </span>
                          <span className="text-[10px] text-slate-600">
                            Carga Congelados (Meta: -20°C a -16°C)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-sm font-bold text-[#006C49]">
                        <span>{vehicle.temperature.current}°C</span>
                        <span className="w-2 h-2 rounded-full bg-[#006C49]" />
                      </div>
                    </div>
                  )}

                  {/* Telemetry Signal Footer */}
                  <div className="flex items-center justify-between text-[#737686] text-xs pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Wifi className="w-3.5 h-3.5 text-[#006C49]" />
                      Latência GSM: {vehicle.gsmLatency ?? NO_DATA}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleDetails(vehicle)}
                      className="text-[#004AC6] hover:underline font-semibold text-xs cursor-pointer"
                    >
                      Ver Telemetria Completa →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW MODE */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-x-auto">
          <table className="w-full text-left min-w-175">
            <thead className="bg-[#EFF4FF] text-[#434655] text-[11px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Veículo</th>
                <th className="py-2.5 px-4">Motorista</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Velocidade</th>
                <th className="py-2.5 px-4">Diesel</th>
                <th className="py-2.5 px-4">Localização</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0B1C30]">
                    {v.model} <span className="text-slate-400 font-mono text-xs">({v.plate})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{v.driver.name}</td>
                  <td className="py-3 px-4">
                    <TangramBadge variant={v.status === 'Em Rota' ? 'success' : 'warning'}>
                      {v.status}
                    </TangramBadge>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">{v.currentSpeed} km/h</td>
                  <td className="py-3 px-4 font-mono">{v.fuelLevel}%</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{v.location}</td>
                  <td className="py-3 px-4 text-right">
                    <TangramButton
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVehicleDetails(v)}
                    >
                      Detalhes
                    </TangramButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lower Section: Maintenance Schedule & Regulatory Certifications Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
        {/* Table Section Header */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F5F9]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#004AC6]" />
              <h2 className="text-base font-bold text-[#0B1C30]">
                Agendamento de Manutenções & Certificações Regulatórias
              </h2>
            </div>
            <span className="text-xs text-[#737686]">
              Controle integrado de revisões periódicas, conformidade ANTT, seguro e telemetria preventiva.
            </span>
          </div>

          {/* Action & Filter Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={maintenanceSearch}
                onChange={(e) => setMaintenanceSearch(e.target.value)}
                placeholder="Filtrar placa ou chassi..."
                className="h-8 pl-8 pr-3 bg-[#EFF4FF] rounded-lg text-xs text-[#0B1C30] placeholder-slate-400 border border-transparent focus:border-[#004AC6] focus:bg-white outline-none w-44 sm:w-56"
              />
            </div>
            <TangramButton
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => showToast('Relatório de revisões e ANTT exportado.')}
            >
              Exportar Relatório
            </TangramButton>
          </div>
        </div>

        {/* Dense Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EFF4FF] text-[#434655] text-[11px] uppercase font-semibold tracking-wider">
                <th className="py-2.5 px-4">Veículo & Placa</th>
                <th className="py-2.5 px-4">Categoria</th>
                <th className="py-2.5 px-4">Hodômetro Atual</th>
                <th className="py-2.5 px-4">Próxima Revisão</th>
                <th className="py-2.5 px-4">Troca de Óleo</th>
                <th className="py-2.5 px-4">Inspeção ANTT</th>
                <th className="py-2.5 px-4">Venc. Seguro</th>
                <th className="py-2.5 px-4">Status de Prontidão</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-[#0B1C30]">
              {filteredMaintenance.map((m) => {
                const isError = m.readinessType === 'error';
                const isWarning = m.readinessType === 'warning';

                return (
                  <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Veículo & Placa */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#EFF4FF] flex items-center justify-center text-[#004AC6]">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0B1C30] leading-tight">{m.vehicle}</span>
                          <span className="font-mono text-[11px] text-[#737686]">{m.plate}</span>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-2.5 px-4 text-xs text-[#737686]">{m.category}</td>

                    {/* Hodômetro Atual */}
                    <td className="py-2.5 px-4 font-mono text-xs">{m.currentOdometer}</td>

                    {/* Próxima Revisão */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold">{m.nextRevision}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            m.revisionStatusType === 'error'
                              ? 'text-[#DC2626]'
                              : m.revisionStatusType === 'warning'
                              ? 'text-[#D97706]'
                              : 'text-[#006C49]'
                          }`}
                        >
                          {m.revisionStatus}
                        </span>
                      </div>
                    </td>

                    {/* Troca de Óleo */}
                    <td
                      className={`py-2.5 px-4 font-mono text-xs font-semibold ${
                        m.oilChange === 'Troca Vencida'
                          ? 'text-[#DC2626]'
                          : m.oilChange.includes('Agendada')
                          ? 'text-[#D97706]'
                          : 'text-[#006C49]'
                      }`}
                    >
                      {m.oilChange}
                    </td>

                    {/* Inspeção ANTT */}
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold text-[#006C49]">
                      {m.anttInspection}
                    </td>

                    {/* Venc. Seguro */}
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-700">{m.insuranceExpiry}</td>

                    {/* Status de Prontidão */}
                    <td className="py-2.5 px-4">
                      <TangramBadge
                        variant={isError ? 'danger' : isWarning ? 'warning' : 'success'}
                      >
                        {m.readinessStatus}
                      </TangramBadge>
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMaintenanceRecord(m)}
                        className="p-1 text-slate-400 hover:text-[#004AC6] rounded transition-colors cursor-pointer"
                        title="Ver Histórico"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer of Table Section */}
        <div className="px-4 py-3 bg-[#EFF4FF] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#737686] border-t border-[#DBE8FE]">
          <span>Exibindo 5 de 240 ativos cadastrados</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="p-1 rounded text-slate-300 cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 rounded bg-white text-[#004AC6] font-bold font-mono shadow-2xs border border-slate-200">
              1
            </span>
            <button
              type="button"
              onClick={() => showToast('Navegando para página 2')}
              className="px-2 py-0.5 rounded hover:bg-white text-slate-600 font-mono transition-colors"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => showToast('Navegando para página 3')}
              className="px-2 py-0.5 rounded hover:bg-white text-slate-600 font-mono transition-colors"
            >
              3
            </button>
            <span>...</span>
            <button
              type="button"
              onClick={() => showToast('Navegando para página 48')}
              className="px-2 py-0.5 rounded hover:bg-white text-slate-600 font-mono transition-colors"
            >
              48
            </button>
            <button
              type="button"
              onClick={() => showToast('Próxima página')}
              className="p-1 rounded hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Bloqueio de Emergência */}
      <TangramModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        title="Protocolo de Bloqueio & Emergência"
        subtitle="Desativação remota de ignição ou emissão de alerta de risco"
      >
        <div className="flex flex-col gap-4 text-xs sm:text-sm">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Atenção: Ação Crítica de Segurança
            </div>
            <p className="text-xs mt-1 text-red-700 leading-relaxed">
              O bloqueio de bomba injetora ou ignição via telemetria satelital só deve ser acionado
              em caso de confirmação de sinistro ou desvio não autorizado de rota.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700">Selecione o Veículo</label>
            <select className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#004AC6]">
              {vehicles.map((v) => (
                <option key={v.id} value={v.plate}>
                  {v.model} - {v.plate} ({v.driver.name || NO_DATA})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700">Motivo da Emergência</label>
            <select className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#004AC6]">
              <option>Perda de Sinal Satelital / Risco de Roubo</option>
              <option>Desvio Não Autorizado de Rota Crítica</option>
              <option>Acidente Grave / Capotamento</option>
              <option>Falha Mecânica com Risco Estrutural</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <TangramButton
              variant="outline"
              fullWidth
              onClick={() => setEmergencyModalOpen(false)}
            >
              Cancelar
            </TangramButton>
            <TangramButton
              variant="danger"
              fullWidth
              onClick={() => {
                setEmergencyModalOpen(false);
                showToast('Comando de bloqueio enviado ao modem satelital.');
              }}
            >
              Confirmar Bloqueio
            </TangramButton>
          </div>
        </div>
      </TangramModal>

      {/* MODAL: Cadastrar Motorista */}
      <TangramModal
        isOpen={registerDriverModalOpen}
        onClose={() => setRegisterDriverModalOpen(false)}
        title="Cadastrar Novo Motorista de Frota"
        subtitle="Registro de CNH profissional, toxicológico e perfil"
      >
        <div className="flex flex-col gap-3 text-xs sm:text-sm">
          <TangramInput
            label="Nome Completo"
            placeholder="Ex: Roberto Silva Albuquerque"
            value={driverForm.name}
            onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <TangramInput
              label="CPF"
              placeholder="000.000.000-00"
              value={driverForm.cpf}
              onChange={(e) => setDriverForm({ ...driverForm, cpf: e.target.value })}
            />
            <TangramInput
              label="CNH (Categoria E)"
              placeholder="01234567890"
              value={driverForm.cnh}
              onChange={(e) => setDriverForm({ ...driverForm, cnh: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TangramInput
              label="Telefone / WhatsApp"
              placeholder="+55 11 99999-8888"
              value={driverForm.phone}
              onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
            />
            <TangramInput
              label="Validade Toxicológico"
              placeholder="12/2026"
              value={driverForm.toxExpiry}
              onChange={(e) => setDriverForm({ ...driverForm, toxExpiry: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-3">
            <TangramButton
              variant="outline"
              fullWidth
              onClick={() => setRegisterDriverModalOpen(false)}
            >
              Cancelar
            </TangramButton>
            <TangramButton
              variant="primary"
              fullWidth
              disabled={!driverForm.name.trim()}
              onClick={async () => {
                try {
                  await createTeamMember({
                    name: driverForm.name.trim(),
                    role: 'Motorista Titular',
                    phone: driverForm.phone.trim() || undefined,
                    cnhNumber: driverForm.cnh.trim() || undefined,
                  });
                  setRegisterDriverModalOpen(false);
                  setDriverForm({ name: '', cpf: '', cnh: '', phone: '', toxExpiry: '' });
                  showToast(
                    `Motorista ${driverForm.name.trim()} cadastrado. CPF e validade toxicológico ainda não são armazenados.`
                  );
                } catch (e) {
                  showToast(e instanceof Error ? e.message : 'Erro ao cadastrar motorista.');
                }
              }}
            >
              Salvar Cadastro
            </TangramButton>
          </div>
        </div>
      </TangramModal>

      {/* MODAL: Detalhes de Telemetria do Veículo */}
      <TangramModal
        isOpen={!!selectedVehicleDetails}
        onClose={() => setSelectedVehicleDetails(null)}
        title={`Telemetria Avançada: ${selectedVehicleDetails?.model}`}
        subtitle={`Placa: ${selectedVehicleDetails?.plate} • Motorista: ${selectedVehicleDetails?.driver.name}`}
        maxWidth="lg"
      >
        {selectedVehicleDetails && (
          <div className="flex flex-col gap-4 text-xs sm:text-sm">
            <div className="grid grid-cols-3 gap-2.5 p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Velocidade CAN</span>
                <div className="font-mono text-lg font-bold text-[#004AC6]">
                  {selectedVehicleDetails.currentSpeed} km/h
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">RPM Motor</span>
                <div className="font-mono text-lg font-bold text-slate-800">
                  {selectedVehicleDetails.engineRpm} RPM
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Tanque Diesel</span>
                <div className="font-mono text-lg font-bold text-[#006C49]">
                  {selectedVehicleDetails.fuelLevel}% (~{selectedVehicleDetails.fuelKmEstimate} km)
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 text-xs mb-1">Diagnóstico OBD-II / CAN-Bus</div>
              <div className="text-xs text-slate-600 flex flex-col gap-1">
                <div>• Módulo de Freios EBS: Sem falhas ativas (Pressão de linha 8.5 bar)</div>
                <div>• Sistema de Injeção Common Rail: Pressão nominal 1.800 bar</div>
                <div>• Temperatura do Líquido de Arrefecimento: 86 °C (Normal)</div>
                <div>• Sensor TPMS de Pneus: 115 psi calibrado em todos os rodados</div>
              </div>
            </div>

            <TangramButton
              variant="primary"
              fullWidth
              onClick={() => {
                setSelectedVehicleDetails(null);
                showToast(`Checklist e telemetria validados para ${selectedVehicleDetails.plate}.`);
              }}
            >
              Emitir Relatório de Bordo
            </TangramButton>
          </div>
        )}
      </TangramModal>

      {/* MODAL: Histórico de Manutenção */}
      <TangramModal
        isOpen={!!selectedMaintenanceRecord}
        onClose={() => setSelectedMaintenanceRecord(null)}
        title={`Histórico de Oficina: ${selectedMaintenanceRecord?.vehicle}`}
        subtitle={`Placa: ${selectedMaintenanceRecord?.plate}`}
      >
        {selectedMaintenanceRecord && (
          <div className="flex flex-col gap-3 text-xs sm:text-sm">
            <div className="p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE]">
              <div className="font-bold text-slate-800">Status: {selectedMaintenanceRecord.readinessStatus}</div>
              <div className="text-xs text-slate-500 mt-0.5">Hodômetro Atual: {selectedMaintenanceRecord.currentOdometer}</div>
            </div>

            <div className="space-y-2">
              <div className="p-2 border border-slate-200 rounded text-xs">
                <div className="font-bold text-slate-700">Revisão Periódica dos 180.000 km</div>
                <div className="text-[11px] text-slate-500">Substituição de filtros, pastilhas de freio e óleo lubrificante sintético.</div>
              </div>
              <div className="p-2 border border-slate-200 rounded text-xs">
                <div className="font-bold text-slate-700">Alinhamento Laser & Balanceamento</div>
                <div className="text-[11px] text-slate-500">Concluído na concessionária autorizada sem divergência de convergência.</div>
              </div>
            </div>

            <TangramButton
              variant="primary"
              fullWidth
              onClick={() => {
                setSelectedMaintenanceRecord(null);
                showToast('Ordem de serviço de manutenção agendada.');
              }}
            >
              Abrir Ordem de Serviço (OS)
            </TangramButton>
          </div>
        )}
      </TangramModal>
    </div>
  );
};
