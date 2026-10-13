import React, { useState } from 'react';
import { useTours } from '../../hooks/useTours';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { orDash } from '../../utils/format';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import type { TourWithTML, TourTMLUpdate } from '../../types';
import {
  Timer,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Truck,
  CalendarDays,
  RefreshCw,
  X,
} from 'lucide-react';

const TML_LIMIT_MINUTES = 30;

function tmlStatusBadge(tour: TourWithTML) {
  if (tour.tml_minutes === null) return <TangramBadge variant="neutral">Não registrado</TangramBadge>;
  if (tour.tml_exceeded) return <TangramBadge variant="danger">Estourado</TangramBadge>;
  if (tour.tml_minutes >= TML_LIMIT_MINUTES * 0.8)
    return <TangramBadge variant="warning">Atenção</TangramBadge>;
  return <TangramBadge variant="success">No prazo</TangramBadge>;
}

export const GestaoTmlScreen: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [toast, showToast] = useToast();
  const [modalTour, setModalTour] = useState<TourWithTML | null>(null);
  const [arrivedAtCdd, setArrivedAtCdd] = useState('');
  const [exceededReason, setExceededReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { tours, kpis, loading, error, registerTML, reload } = useTours(selectedDate);

  const toursWithTML = tours.filter((t) => t.tml_minutes !== null);
  const exceeded = tours.filter((t) => t.tml_exceeded);

  const openModal = (tour: TourWithTML) => {
    setModalTour(tour);
    // Pré-preenche com valor existente se já foi registrado
    if (tour.arrived_at_cdd) {
      const time = new Date(tour.arrived_at_cdd).toTimeString().slice(0, 5);
      setArrivedAtCdd(time);
    } else {
      setArrivedAtCdd('');
    }
    setExceededReason(tour.tml_exceeded_reason ?? '');
  };

  const closeModal = () => {
    setModalTour(null);
    setArrivedAtCdd('');
    setExceededReason('');
  };

  const handleSaveTML = async () => {
    if (!modalTour || !arrivedAtCdd) return;
    setSaving(true);
    try {
      // Monta ISO timestamp combinando a data do tour com o horário informado
      const isoTimestamp = `${modalTour.tour_date}T${arrivedAtCdd}:00`;
      const update: TourTMLUpdate = {
        arrived_at_cdd: isoTimestamp,
        ...(exceededReason ? { tml_exceeded_reason: exceededReason } : {}),
      };
      await registerTML(modalTour.id, update);
      showToast(`TML do mapa #${modalTour.external_tour_id} registrado.`);
      closeModal();
    } catch {
      showToast('Erro ao salvar TML. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006C49] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE]">
              Horizonte Last-Mile
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Gestão de TML
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Tempo de Liberação do CDD • Limite: {TML_LIMIT_MINUTES} minutos por mapa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs text-[#0B1C30] bg-transparent focus:outline-none"
            />
          </div>
          <button
            onClick={() => { void reload(); }}
            className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-500 hover:text-[#004AC6] hover:border-[#004AC6] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Mapas do Dia</span>
            <Truck className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{kpis.total_tours}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{toursWithTML.length} com TML registrado</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>TML Médio</span>
            <Timer className="w-4 h-4 text-[#F39818]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">
            {kpis.avg_tml_minutes !== null ? `${kpis.avg_tml_minutes} min` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Meta: {TML_LIMIT_MINUTES} min</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>SLA Estourado</span>
            <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#DC2626]">{kpis.tml_exceeded_count}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Acima de {TML_LIMIT_MINUTES} min</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Pendentes Registro</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">
            {kpis.total_tours - toursWithTML.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sem horário de chegada</div>
        </div>
      </div>

      {/* Tabela de mapas */}
      <TangramCard>
        <div className="p-4 border-b border-[#F1F5F9]">
          <h2 className="text-sm font-bold text-[#0B1C30]">Registro de TML por Mapa</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Clique em "Registrar" para informar o horário de chegada do motorista no CDD.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando mapas...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-rose-500">{error}</div>
        ) : tours.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Nenhum mapa para {selectedDate}. Importe o CSV do dia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0B1C30]">
              <thead className="bg-[#F8FAFC] text-[#737686] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Mapa</th>
                  <th className="py-3 px-4">Motorista / Placa</th>
                  <th className="py-3 px-4">Chegada CDD</th>
                  <th className="py-3 px-4">Saída CDD</th>
                  <th className="py-3 px-4">TML</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Motivo (se estourado)</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {tours.map((tour) => {
                  const chegada = tour.arrived_at_cdd
                    ? new Date(tour.arrived_at_cdd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : null;
                  const saida = tour.trip_start
                    ? new Date(tour.trip_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : null;

                  return (
                    <tr key={tour.id} className={`hover:bg-[#F8FAFC] transition-colors ${tour.tml_exceeded ? 'bg-rose-50/40' : ''}`}>
                      <td className="py-3 px-4 font-black text-[#0B1C30]">#{tour.external_tour_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{orDash(tour.driver_name)}</div>
                        <div className="font-mono text-[11px] text-[#004AC6]">{orDash(tour.vehicle_plate)}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {chegada ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {saida ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {tour.tml_minutes !== null ? (
                          <span className={`font-black text-sm ${tour.tml_exceeded ? 'text-rose-600' : 'text-[#006C49]'}`}>
                            {tour.tml_minutes} min
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4">{tmlStatusBadge(tour)}</td>
                      <td className="py-3 px-4 max-w-xs">
                        {tour.tml_exceeded_reason
                          ? <span className="text-rose-700 text-[11px]">{tour.tml_exceeded_reason}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openModal(tour)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#004AC6] hover:bg-[#EFF4FF] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {tour.arrived_at_cdd ? 'Editar' : 'Registrar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TangramCard>

      {/* Modal de registro de TML */}
      {modalTour && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-[#004AC6]" />
                <div>
                  <h3 className="text-sm font-bold text-[#0B1C30]">
                    Registrar TML — Mapa #{modalTour.external_tour_id}
                  </h3>
                  <p className="text-[11px] text-slate-500">{orDash(modalTour.driver_name)} • {orDash(modalTour.vehicle_plate)}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#0B1C30]">
              {/* Saída já conhecida */}
              {modalTour.trip_start && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-900">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">Saída do CDD (Bees)</div>
                  <div className="font-black text-base">
                    {new Date(modalTour.trip_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Horário de chegada do motorista no CDD: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={arrivedAtCdd}
                  onChange={(e) => setArrivedAtCdd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-[#004AC6] focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Limite: {TML_LIMIT_MINUTES} minutos até a saída registrada no Bees.
                </p>
              </div>

              {/* Campo de motivo — aparece sempre para facilitar, obrigatório se TML > 30 min */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Motivo do estouro (preencher se TML &gt; {TML_LIMIT_MINUTES} min):
                </label>
                <input
                  type="text"
                  value={exceededReason}
                  onChange={(e) => setExceededReason(e.target.value)}
                  placeholder="Ex: Fila na doca, aguardando checklist..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#004AC6] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!arrivedAtCdd || saving}
                  onClick={() => { void handleSaveTML(); }}
                  className="px-4 py-1.5 text-xs font-bold bg-[#004AC6] hover:bg-[#003BA3] text-white rounded-lg shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar TML'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
