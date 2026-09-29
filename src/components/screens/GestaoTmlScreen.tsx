import React, { useState } from 'react';
import { TmlVehicleRecord } from '../../types';
import { OperationalStorage } from '../../services/storageService';
import { usePersistedList } from '../../hooks/usePersistedList';
import { useToast } from '../../hooks/useToast';
import { formatMinutes } from '../../utils/format';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import {
  Timer,
  Clock,
  ArrowRight,
  TrendingDown,
  AlertOctagon,
  FastForward,
  CheckCircle2,
  Building2,
  Truck,
  ShieldCheck,
} from 'lucide-react';

const STAGES = [
  'Portaria / Check-in',
  'Fila de Doca',
  'Carregamento / Picking',
  'Conferência Cega & Lacre',
  'Emissão Fiscal (MDF-e)',
  'Liberação / Gate-Out',
] as const;

// Internal SLA targets per stage (minutes). Operational parameters, not measured data: adjust to the operation.
const STAGE_TARGETS = [10, 20, 50, 20, 15, 10];
const STAGE_KEYS = ['checkin', 'dockQueue', 'loading', 'auditSeal', 'fiscalBilling', 'gateOut'] as const;

export const GestaoTmlScreen: React.FC = () => {
  const [vehicles, setVehicles] = usePersistedList<TmlVehicleRecord>(
    OperationalStorage.getTmlVehicles,
    OperationalStorage.setTmlVehicles
  );
  const [actionSuccessMsg, showToast] = useToast();

  const averageTmlMinutes =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((acc, v) => acc + v.totalMinutesInYard, 0) / vehicles.length)
      : null;

  const targetTmlMinutes = 135; // 2h 15min (SLA parameter)

  const formatHoursMinutes = formatMinutes;

  const handleAdvanceStage = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const nextIndex = Math.min(v.stageIndex + 1, STAGES.length - 1);
        return { ...v, stageIndex: nextIndex, currentStage: STAGES[nextIndex] };
      })
    );

    const veh = vehicles.find((v) => v.id === vehicleId);
    showToast(`Veículo ${veh?.vehiclePlate} avançou para a próxima etapa do TML!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006C49] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Screen Title & High Level Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE]">
              Horizonte Pátio & Docas
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Gestão de TML • Tempo Médio de Liberação de Frota
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            CDs Horizonte Logística • Ciclo de permanência no pátio: do check-in na portaria até o gate-out da carga liberada.
          </p>
        </div>

      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>TML Médio Atual</span>
            <Timer className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">
            {averageTmlMinutes === null ? '—' : formatHoursMinutes(averageTmlMinutes)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <TrendingDown className="w-3.5 h-3.5" /> Média dos veículos no pátio
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Meta de TML (SLA)</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#004AC6]">
            {formatHoursMinutes(targetTmlMinutes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Janela máxima tolerada</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Veículos no Pátio CD</span>
            <Truck className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">{vehicles.length} ativos</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{vehicles.filter((v) => v.currentStage === 'Fila de Doca').length} em fila de doca</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>SLA Estourado</span>
            <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#DC2626]">
            {vehicles.filter((v) => v.status === 'sla-estourado').length}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Requer intervenção de doca</div>
        </div>
      </div>

      {/* Visual TML Funnel by Stages */}
      <TangramCard
        title="Tempo Médio por Etapa de Liberação"
        subtitle="Identificação de gargalos operacionais no fluxo de armazém e faturamento"
      >
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {['1. Check-in', '2. Fila Doca', '3. Picking/Carreg.', '4. Conferência', '5. MDF-e / Fiscal', '6. Gate-Out'].map((stage, i) => {
              const avg = vehicles.length
                ? Math.round(vehicles.reduce((acc, v) => acc + (v.stageTimes?.[STAGE_KEYS[i]] ?? 0), 0) / vehicles.length)
                : null;
              const target = STAGE_TARGETS[i];
              return {
                stage,
                time: avg === null ? '—' : `${avg} min`,
                target: `${target} min`,
                status: avg === null ? 'normal' : avg > target * 1.25 ? 'alerta' : avg > target ? 'atencao' : 'normal',
              };
            }).map((step, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  step.status === 'alerta'
                    ? 'bg-rose-50/70 border-rose-200'
                    : step.status === 'atencao'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-[#F8FAFC] border-slate-200'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Etapa {idx + 1}
                  </span>
                  <div className="text-xs font-bold text-[#0B1C30] mt-0.5">{step.stage}</div>
                </div>

                <div className="mt-3">
                  <div className="text-lg font-black text-[#0B1C30]">{step.time}</div>
                  <div className="text-[10px] text-slate-500">Meta: {step.target}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TangramCard>

      {/* Active Vehicles in Yard Table */}
      <TangramCard
        title="Fluxo Operacional dos Veículos no Pátio"
        subtitle="Acompanhamento em tempo real do tempo decorrido por caminhão"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0B1C30]">
            <thead className="bg-[#F8FAFC] text-[#737686] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Veículo & Motorista</th>
                <th className="py-3 px-4">Doca / Carga</th>
                <th className="py-3 px-4">Etapa Atual no Pátio</th>
                <th className="py-3 px-4">Tempo Decorrido</th>
                <th className="py-3 px-4">Status SLA</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {vehicles.map((veh) => {
                const progressPct = Math.round(((veh.stageIndex + 1) / STAGES.length) * 100);
                return (
                  <tr key={veh.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-xs text-[#004AC6]">
                        {veh.vehiclePlate}
                      </div>
                      <div className="text-slate-800 font-semibold">{veh.driverName}</div>
                      <div className="text-[10px] text-slate-400">{veh.vehicleModel}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {veh.dockAssigned}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{veh.cargoType}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800">{veh.currentStage}</div>
                      {/* Step Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full transition-all duration-300 ${
                            veh.status === 'sla-estourado'
                              ? 'bg-rose-500'
                              : veh.status === 'atencao'
                              ? 'bg-amber-500'
                              : 'bg-[#004AC6]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Progresso do TML</span>
                        <span>{progressPct}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-black text-sm text-[#0B1C30]">
                        {formatHoursMinutes(veh.totalMinutesInYard)}
                      </div>
                      <div className="text-[10px] text-slate-400">Chegou às {veh.arrivalTime}</div>
                      {veh.delayReason && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded mt-1 font-medium max-w-xs">
                          {veh.delayReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {veh.status === 'no-prazo' && (
                        <TangramBadge variant="success">No Prazo (SLA OK)</TangramBadge>
                      )}
                      {veh.status === 'atencao' && (
                        <TangramBadge variant="warning">Atenção</TangramBadge>
                      )}
                      {veh.status === 'sla-estourado' && (
                        <TangramBadge variant="danger">SLA Estourado (+{Math.max(0, veh.totalMinutesInYard - veh.targetMinutes)} min)</TangramBadge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {veh.stageIndex < STAGES.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStage(veh.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold bg-[#004AC6] hover:bg-[#003899] text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          Avançar Etapa
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#006C49] bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Liberado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TangramCard>
    </div>
  );
};
