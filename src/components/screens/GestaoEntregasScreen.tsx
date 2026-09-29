import React, { useState } from 'react';
import { DeliveryItem } from '../../types';
import { OperationalStorage } from '../../services/storageService';
import { usePersistedList } from '../../hooks/usePersistedList';
import { useToast } from '../../hooks/useToast';
import { formatBRL, percent } from '../../utils/format';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import {
  PackageCheck,
  Truck,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  FileText,
  Phone,
  MapPin,
  X,
} from 'lucide-react';

export const GestaoEntregasScreen: React.FC = () => {
  const [deliveries, setDeliveries] = usePersistedList<DeliveryItem>(
    OperationalStorage.getDeliveries,
    OperationalStorage.setDeliveries
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedProofDelivery, setSelectedProofDelivery] = useState<DeliveryItem | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [targetDeliveryForAction, setTargetDeliveryForAction] = useState<DeliveryItem | null>(null);
  const [actionSuccessMsg, showToast] = useToast(4000);

  // Form states for manual delivery confirmation
  const [recipientName, setRecipientName] = useState('');
  const [recipientRg, setRecipientRg] = useState('');

  const filteredDeliveries = deliveries.filter((item) => {
    const matchesSearch =
      item.nfeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.driverName.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'todos') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  const totalCount = deliveries.length;
  const deliveredCount = deliveries.filter((d) => d.status === 'Entregue').length;
  const inRouteCount = deliveries.filter((d) => d.status === 'Em Rota').length;
  const delayedCount = deliveries.filter((d) => d.status === 'Atrasada' || d.status === 'Tentativa Frustrada').length;

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeliveryForAction) return;

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === targetDeliveryForAction.id
          ? {
              ...d,
              status: 'Entregue',
              deliveryCompletedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              recipientName: recipientName.trim(),
              recipientRg: recipientRg.trim() || undefined,
            }
          : d
      )
    );

    setIsRegisterModalOpen(false);
    showToast(`Baixa da ${targetDeliveryForAction.nfeNumber} efetuada com sucesso!`);
    setRecipientName('');
    setRecipientRg('');
    setTargetDeliveryForAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006C49] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Screen Title & High Level KPIs */}
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
            Operações Horizonte Logística • Acompanhamento em tempo real de notas fiscais, janelas e baixas de canhoto digital.
          </p>
        </div>

      </div>

      {/* KPI Counters Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Total Programadas</span>
            <PackageCheck className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Notas cadastradas</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Entregues (Baixadas)</span>
            <CheckCircle2 className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">
            {deliveredCount}
            <span className="text-xs font-semibold text-slate-500 ml-1.5">
              ({percent(deliveredCount, totalCount)})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Com baixa registrada</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Em Trânsito / Rota</span>
            <Truck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2563EB]">{inRouteCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Status Em Rota</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Pendências / Insucesso</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#DC2626]">{delayedCount}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Requer suporte operacional</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <TangramCard>
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F5F9]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por NFe, cliente, placa, motorista ou cidade..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-hidden focus:border-[#004AC6]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'Em Rota', label: 'Em Rota' },
              { id: 'Entregue', label: 'Entregues' },
              { id: 'Aguardando Descarga', label: 'Em Doca' },
              { id: 'Atrasada', label: 'Atrasadas' },
              { id: 'Tentativa Frustrada', label: 'Frustradas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#004AC6] text-white'
                    : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0B1C30]">
            <thead className="bg-[#F8FAFC] text-[#737686] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Documento / NFe</th>
                <th className="py-3 px-4">Destinatário & Endereço</th>
                <th className="py-3 px-4">Veículo & Equipe</th>
                <th className="py-3 px-4">Janela / Horário</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredDeliveries.map((del) => {
                const getStatusBadge = (status: DeliveryItem['status']) => {
                  switch (status) {
                    case 'Entregue':
                      return <TangramBadge variant="success">Entregue{del.deliveryCompletedAt ? ` (${del.deliveryCompletedAt})` : ''}</TangramBadge>;
                    case 'Em Rota':
                      return <TangramBadge variant="info">Em Rota</TangramBadge>;
                    case 'Aguardando Descarga':
                      return <TangramBadge variant="warning">Aguardando Descarga</TangramBadge>;
                    case 'Atrasada':
                      return <TangramBadge variant="danger">Atraso Crítico</TangramBadge>;
                    case 'Tentativa Frustrada':
                      return <TangramBadge variant="danger">Tentativa Frustrada</TangramBadge>;
                  }
                };

                return (
                  <tr key={del.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0B1C30]">{del.nfeNumber}</div>
                      <div className="text-[11px] text-[#737686] font-mono">{del.cteNumber}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {del.packagesCount !== undefined ? `${del.packagesCount} vols` : '— vols'} • {del.weightKg !== undefined ? `${(del.weightKg / 1000).toFixed(1)}t` : '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-[#0B1C30] truncate">{del.clientName}</div>
                      <div className="text-[11px] text-[#737686] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{[del.address, del.city && del.state ? `${del.city} - ${del.state}` : del.city || del.state].filter(Boolean).join(', ') || 'Endereço não informado'}</span>
                      </div>
                      {del.failureReason && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded mt-1 font-medium">
                          Motivo: {del.failureReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#004AC6]">{del.vehiclePlate}</div>
                      <div className="text-[11px] text-slate-700">{del.driverName}</div>
                      {del.driverPhone && <a
                        href={`tel:${del.driverPhone}`}
                        className="text-[10px] text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-2.5 h-2.5" /> {del.driverPhone}
                      </a>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {del.deliveryWindow || 'Janela não informada'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatBRL(del.value)}
                      </div>
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(del.status)}</td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {del.status === 'Entregue' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofDelivery(del)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#004AC6] hover:bg-[#EFF4FF] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Canhoto
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetDeliveryForAction(del);
                            setIsRegisterModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold bg-[#006C49] hover:bg-[#005538] text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Baixar Entrega
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TangramCard>

      {/* Modal: Canhoto Digital / Comprovante de Entrega */}
      {selectedProofDelivery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#004AC6]" />
                <div>
                  <h3 className="text-sm font-bold text-[#0B1C30]">
                    Canhoto Digital • {selectedProofDelivery.nfeNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedProofDelivery.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProofDelivery(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#0B1C30]">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Recebedor:</span>
                  <div className="font-bold text-slate-800">{selectedProofDelivery.recipientName}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Documento RG:</span>
                  <div className="font-mono text-slate-800">{selectedProofDelivery.recipientRg || 'Não informado'}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Horário de Baixa:</span>
                  <div className="font-bold text-[#006C49]">{selectedProofDelivery.deliveryCompletedAt ?? '—'}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Motorista:</span>
                  <div className="font-semibold text-slate-800">{selectedProofDelivery.driverName}</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Registro manual de baixa. Imagem do canhoto e assinatura digital ainda não são armazenadas pelo sistema.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <TangramButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProofDelivery(null)}
                >
                  Fechar
                </TangramButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Baixa de Entrega */}
      {isRegisterModalOpen && targetDeliveryForAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmDelivery}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95"
          >
            <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#006C49]" />
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Confirmar Baixa de Entrega
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-[#0B1C30]">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-900">
                <div className="font-bold">{targetDeliveryForAction.nfeNumber}</div>
                <div className="text-[11px]">{targetDeliveryForAction.clientName}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome do Recebedor no Local:
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ex: Geraldo Antunes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#004AC6] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  RG / CPF do Recebedor (opcional):
                </label>
                <input
                  type="text"
                  value={recipientRg}
                  onChange={(e) => setRecipientRg(e.target.value)}
                  placeholder="Ex: 28.192.401-X"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#004AC6] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#006C49] hover:bg-[#005538] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Confirmar Baixa Imediata
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
