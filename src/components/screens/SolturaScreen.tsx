import React, { useState } from 'react';
import { SolturaChecklist } from '../../types';
import { MOCK_SOLTURAS } from '../../data/processesData';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  QrCode,
  Truck,
  Lock,
  Radio,
  Printer,
  X,
  Search,
} from 'lucide-react';

export const SolturaScreen: React.FC = () => {
  const [solturas, setSolturas] = useState<SolturaChecklist[]>(MOCK_SOLTURAS);
  const [selectedSolturaForGatePass, setSelectedSolturaForGatePass] = useState<SolturaChecklist | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const handleAuthorizeRelease = (solturaId: string) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setSolturas((prev) =>
      prev.map((s) =>
        s.id === solturaId
          ? {
              ...s,
              gateStatus: 'Liberado para Saída',
              releaseTimestamp: nowTime,
              mdfeStatus: 'Autorizado',
              seals: { ...s.seals, isVerified: true },
              checklist: {
                ...s.checklist,
                trackerSignalActive: true,
                doorSensorsActive: true,
                teamEpiEquipped: true,
                brakesAndLightsChecked: true,
              },
            }
          : s
      )
    );

    const solt = solturas.find((s) => s.id === solturaId);
    setActionSuccessMsg(`Soltura autorizada! Veículo ${solt?.vehiclePlate} liberado no Gate-Out.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const releasedCount = solturas.filter((s) => s.gateStatus === 'Liberado para Saída').length;
  const validatingCount = solturas.filter((s) => s.gateStatus === 'Em Validação').length;
  const retainedCount = solturas.filter((s) => s.gateStatus === 'Retido por Pendência').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006C49] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE]">
              Horizonte Gate-Out
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Soltura de Frota & Liberação de Gate
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Auditoria Horizonte Logística • Lacres do baú, averbação de MDF-e, telemetria GRIS e liberação de saída.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActionSuccessMsg('Todos os sinais de rastreadores da frota Horizonte estão ativos e comunicando.');
              setTimeout(() => setActionSuccessMsg(null), 3500);
            }}
            className="text-xs font-bold text-[#1E2D72] hover:bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Auditar Rastreadores (GRIS)
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Solturas do Dia</span>
            <Truck className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{solturas.length * 12}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Janelas matutina e vespertina</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Liberados no Gate</span>
            <CheckCircle2 className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">{releasedCount * 12}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Passe emitido com sucesso</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Em Conferência na Portaria</span>
            <Lock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2563EB]">{validatingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Checagem de lacres e MDF-e</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Retidos por Pendência</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#DC2626]">{retainedCount}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Bloqueio automático no gate</div>
        </div>
      </div>

      {/* Main Soltura List */}
      <TangramCard
        title="Checklist e Autorizações de Soltura"
        subtitle="Conferência dos itens obrigatórios para liberação da viagem"
      >
        <div className="divide-y divide-[#F1F5F9]">
          {solturas.map((solt) => (
            <div key={solt.id} className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Identity and Route */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#004AC6]">
                      {solt.solturaNumber}
                    </span>
                    <span className="font-mono font-black text-sm text-[#0B1C30] bg-slate-100 px-2 py-0.5 rounded">
                      {solt.vehiclePlate}
                    </span>
                    <span className="text-xs text-slate-600">({solt.vehicleModel})</span>
                  </div>

                  <div className="text-xs text-slate-700 font-semibold">
                    Rota: <span className="text-[#0B1C30]">{solt.destinationRoute}</span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Equipe: <strong>{solt.driverName}</strong> (Motorista) •{' '}
                    <strong>{solt.helperName}</strong> (Ajudante)
                  </div>
                </div>

                {/* Middle: Security Checklist Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Lacre */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                      <Lock className="w-3 h-3 text-slate-400" /> Lacres
                    </div>
                    <div className="font-mono font-bold text-[11px] text-slate-800 mt-0.5">
                      {solt.seals.seal1}
                    </div>
                    <span
                      className={`text-[9px] font-bold ${
                        solt.seals.isVerified ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {solt.seals.isVerified ? '✓ Conferido' : '⚠ Pendente'}
                    </span>
                  </div>

                  {/* MDF-e */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                      <FileCheck className="w-3 h-3 text-slate-400" /> MDF-e
                    </div>
                    <div className="font-bold text-[11px] text-slate-800 mt-0.5">
                      {solt.cteCount} CT-es ({((solt.cargoWeightKg) / 1000).toFixed(1)}t)
                    </div>
                    <span
                      className={`text-[9px] font-bold ${
                        solt.mdfeStatus === 'Autorizado'
                          ? 'text-emerald-700'
                          : solt.mdfeStatus === 'Em Averbação'
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      ● {solt.mdfeStatus}
                    </span>
                  </div>

                  {/* Telemetria / GRIS */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                      <Radio className="w-3 h-3 text-slate-400" /> GRIS / GPS
                    </div>
                    <div className="font-bold text-[11px] text-slate-800 mt-0.5">
                      {solt.checklist.trackerSignalActive ? 'Sinal 100%' : 'Sem GPS'}
                    </div>
                    <span
                      className={`text-[9px] font-bold ${
                        solt.checklist.doorSensorsActive ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {solt.checklist.doorSensorsActive ? '✓ Trava Ativa' : '⚠ Sensor Porta'}
                    </span>
                  </div>

                  {/* Status Gate */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Status Gate</div>
                    <div className="mt-0.5">
                      {solt.gateStatus === 'Liberado para Saída' && (
                        <TangramBadge variant="success">Liberado ({solt.releaseTimestamp})</TangramBadge>
                      )}
                      {solt.gateStatus === 'Em Validação' && (
                        <TangramBadge variant="info">Em Validação</TangramBadge>
                      )}
                      {solt.gateStatus === 'Retido por Pendência' && (
                        <TangramBadge variant="danger">Retido no Gate</TangramBadge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {solt.gateStatus === 'Liberado para Saída' ? (
                    <button
                      type="button"
                      onClick={() => setSelectedSolturaForGatePass(solt)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004AC6] hover:bg-[#EFF4FF] border border-[#BFDBFE] px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      Passe de Saída
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAuthorizeRelease(solt.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#006C49] hover:bg-[#005538] text-white px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Autorizar Soltura
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </TangramCard>

      {/* Modal: Passe Digital de Saída com QR Code para Portaria */}
      {selectedSolturaForGatePass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#0B1C30] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Passe Digital de Saída (Gate-Out)</h3>
              </div>
              <button
                onClick={() => setSelectedSolturaForGatePass(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4 text-xs text-[#0B1C30]">
              <div className="inline-block p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
                <div className="w-36 h-36 bg-slate-900 text-white flex flex-col items-center justify-center rounded-xl font-mono mx-auto">
                  <QrCode className="w-20 h-20 text-white" />
                  <span className="text-[9px] mt-1 font-bold tracking-wider">
                    {selectedSolturaForGatePass.qrCodePass}
                  </span>
                </div>
              </div>

              <div>
                <div className="font-mono text-xl font-black text-[#0B1C30]">
                  {selectedSolturaForGatePass.vehiclePlate}
                </div>
                <div className="font-bold text-slate-700">
                  {selectedSolturaForGatePass.driverName} • Ajudante: {selectedSolturaForGatePass.helperName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Destino: {selectedSolturaForGatePass.destinationRoute}
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">MDF-e Averbação:</span>
                  <span className="font-mono font-bold">Válido & Averbado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Lacres de Baú:</span>
                  <span className="font-mono font-bold">{selectedSolturaForGatePass.seals.seal1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Liberado pelo Operador:</span>
                  <span className="font-semibold">{selectedSolturaForGatePass.gateOperator}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <TangramButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSolturaForGatePass(null)}
                >
                  Fechar
                </TangramButton>
                <TangramButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedSolturaForGatePass(null);
                  }}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir Passe
                </TangramButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
