import React, { useState } from 'react';
import { useTours } from '../../hooks/useTours';
import { useToast } from '../../hooks/useToast';
import { percent, orDash } from '../../utils/format';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import type { TourWithTML, Delivery } from '../../types';
import {
  PackageCheck,
  Truck,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  MoonStar,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';

function deliveryStatusBadge(status: string) {
  switch (status) {
    case 'CONCLUDED':
      return <TangramBadge variant="success">Entregue</TangramBadge>;
    case 'RESCHEDULED':
      return <TangramBadge variant="danger">Devolvida</TangramBadge>;
    case 'DEFINITELY_RETURNED':
      return <TangramBadge variant="danger">Devolução Definitiva</TangramBadge>;
    case 'PARTIAL_DELIVERY':
      return <TangramBadge variant="warning">Parcial</TangramBadge>;
    case 'DELIVERY_STARTED':
      return <TangramBadge variant="info">Em Atendimento</TangramBadge>;
    case 'ON_THE_WAY':
      return <TangramBadge variant="info">A Caminho</TangramBadge>;
    default:
      return <TangramBadge variant="neutral">Pendente</TangramBadge>;
  }
}

function tourStatusBadge(tour: TourWithTML) {
  if (tour.is_overnight)
    return <TangramBadge variant="warning">Pernoite</TangramBadge>;
  if (tour.status === 'CONCLUDED')
    return <TangramBadge variant="success">Concluído</TangramBadge>;
  return <TangramBadge variant="info">Em Rota</TangramBadge>;
}

export const GestaoEntregasScreen: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [expandedTour, setExpandedTour] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const { tours, kpis, loading, error, reload } = useTours(selectedDate);

  const filteredTours = tours.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      (t.driver_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.vehicle_plate ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.external_tour_id).includes(searchQuery);

    if (statusFilter === 'todos') return matchesSearch;
    if (statusFilter === 'em_rota') return matchesSearch && t.status !== 'CONCLUDED' && !t.is_overnight;
    if (statusFilter === 'concluido') return matchesSearch && t.status === 'CONCLUDED';
    if (statusFilter === 'pernoite') return matchesSearch && t.is_overnight;
    return matchesSearch;
  });

  const toggleTour = (id: string) =>
    setExpandedTour((prev) => (prev === id ? null : id));

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
              Gestão de Entregas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Mapas do dia • Paradas por PDV • Volumes entregues e devolvidos
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
            onClick={() => { void reload(); showToast('Dados atualizados'); }}
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
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.tours_in_route} em rota</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>POCs Entregues</span>
            <CheckCircle2 className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">
            {kpis.pocs_concluded}
            <span className="text-xs font-semibold text-slate-500 ml-1.5">
              ({percent(kpis.pocs_concluded, kpis.total_pocs)})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">de {kpis.total_pocs} programados</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Devolvidos</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#DC2626]">
            {kpis.pocs_rescheduled}
            <span className="text-xs font-semibold text-slate-500 ml-1.5">
              ({percent(kpis.pocs_rescheduled, kpis.total_pocs)})
            </span>
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Requer análise</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Aderência ao Raio</span>
            <MapPin className="w-4 h-4 text-[#F39818]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{kpis.adherence_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">POCs dentro do raio</div>
        </div>
      </div>

      {/* Filtros e busca */}
      <TangramCard>
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F5F9]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por mapa, motorista ou placa..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#004AC6]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'em_rota', label: 'Em Rota' },
              { id: 'concluido', label: 'Concluídos' },
              { id: 'pernoite', label: 'Pernoite' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[#004AC6] text-white'
                    : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de tours */}
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando mapas...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-rose-500">{error}</div>
        ) : filteredTours.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Nenhum mapa encontrado para {selectedDate}.
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filteredTours.map((tour) => {
              const isExpanded = expandedTour === tour.id;
              const deliveries: Delivery[] = tour.deliveries ?? [];
              const concluded = deliveries.filter((d) => d.status === 'CONCLUDED').length;
              const rescheduled = deliveries.filter((d) => d.status === 'RESCHEDULED').length;
              const totalVol = deliveries.reduce((a, d) => a + (d.total_delivered_vol_hl ?? 0), 0);

              return (
                <div key={tour.id}>
                  {/* Linha do mapa */}
                  <button
                    type="button"
                    onClick={() => toggleTour(tour.id)}
                    className="w-full text-left px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors flex items-center gap-3"
                  >
                    <span className="text-slate-400">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </span>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 items-center text-xs">
                      <div>
                        <div className="font-black text-[#0B1C30] text-sm">#{tour.external_tour_id}</div>
                        <div className="text-[11px] text-slate-500">{tour.tour_date}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#0B1C30]">{orDash(tour.driver_name)}</div>
                        <div className="font-mono text-[11px] text-[#004AC6]">{orDash(tour.vehicle_plate)}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-[#737686] text-[11px]">POCs</div>
                        <div className="font-bold text-[#0B1C30]">
                          {concluded}/{deliveries.length}
                          {rescheduled > 0 && (
                            <span className="ml-1.5 text-rose-600">({rescheduled} dev.)</span>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-[#737686] text-[11px]">Volume entregue</div>
                        <div className="font-bold text-[#0B1C30]">
                          {totalVol > 0 ? `${totalVol.toFixed(2)} hl` : '—'}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {tourStatusBadge(tour)}
                      </div>
                    </div>
                  </button>

                  {/* Paradas expandidas */}
                  {isExpanded && (
                    <div className="bg-[#F8FAFC] border-t border-[#F1F5F9]">
                      {deliveries.length === 0 ? (
                        <div className="px-10 py-4 text-xs text-slate-400">
                          Paradas não carregadas. Importe o CSV do dia.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs text-[#0B1C30]">
                          <thead className="text-[#737686] font-bold border-b border-[#E2E8F0]">
                            <tr>
                              <th className="py-2 px-10">Ordem</th>
                              <th className="py-2 px-4">PDV</th>
                              <th className="py-2 px-4">Vol. Entregue</th>
                              <th className="py-2 px-4">Vol. Recusado</th>
                              <th className="py-2 px-4">No Raio</th>
                              <th className="py-2 px-4">Motivo Dev.</th>
                              <th className="py-2 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {deliveries.map((d) => (
                              <tr key={d.id} className="hover:bg-white transition-colors">
                                <td className="py-2 px-10 font-mono text-slate-500">{orDash(d.visit_order)}</td>
                                <td className="py-2 px-4">
                                  <div className="font-semibold">{d.poc_name}</div>
                                  {d.critical_poc && (
                                    <span className="text-[10px] text-amber-700 font-bold">⚡ Crítico</span>
                                  )}
                                </td>
                                <td className="py-2 px-4 font-mono">
                                  {d.total_delivered_vol_hl != null ? `${d.total_delivered_vol_hl} hl` : '—'}
                                </td>
                                <td className="py-2 px-4 font-mono">
                                  {d.total_refused_vol_hl != null
                                    ? <span className="text-rose-600">{d.total_refused_vol_hl} hl</span>
                                    : '—'}
                                </td>
                                <td className="py-2 px-4">
                                  {d.within_radius === true
                                    ? <span className="text-emerald-600 font-bold">Sim</span>
                                    : d.within_radius === false
                                    ? <span className="text-rose-600 font-bold">Não</span>
                                    : '—'}
                                </td>
                                <td className="py-2 px-4 text-slate-500 max-w-xs truncate">
                                  {orDash(d.reschedule_reason)}
                                </td>
                                <td className="py-2 px-4">{deliveryStatusBadge(d.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </TangramCard>
    </div>
  );
};
