import React, { useState } from 'react';
import { ReturnItem } from '../../types';
import { OperationalStorage } from '../../services/storageService';
import { usePersistedList } from '../../hooks/usePersistedList';
import { useToast } from '../../hooks/useToast';
import { downloadFile, toCsv } from '../../utils/csv';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Warehouse,
  Search,
  Truck,
  DollarSign,
  ClipboardCheck,
  X,
} from 'lucide-react';

export const GestaoDevolucaoScreen: React.FC = () => {
  const [returns, setReturns] = usePersistedList<ReturnItem>(
    OperationalStorage.getReturns,
    OperationalStorage.setReturns
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('todos');
  const [selectedReturnForInspection, setSelectedReturnForInspection] = useState<ReturnItem | null>(null);
  const [actionSuccessMsg, showToast] = useToast(4000);

  // Inspector form
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionDecision, setInspectionDecision] = useState<'Estornado ao Estoque' | 'Destinado a Seguradora'>('Estornado ao Estoque');
  const [inspectionNotes, setInspectionNotes] = useState('');

  const filteredReturns = returns.filter((item) => {
    const matchesSearch =
      item.returnCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nfeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());

    if (reasonFilter === 'todos') return matchesSearch;
    return matchesSearch && item.reason === reasonFilter;
  });

  const deliveriesTotal = OperationalStorage.getDeliveries().length;
  const totalValue = returns.reduce((acc, r) => acc + r.totalValue, 0);

  const handleCompleteInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnForInspection) return;

    setReturns((prev) =>
      prev.map((r) =>
        r.id === selectedReturnForInspection.id
          ? {
              ...r,
              warehouseStatus: inspectionDecision,
              checkedBy: inspectorName,
              notes: inspectionNotes || r.notes,
            }
          : r
      )
    );

    showToast(
      inspectionDecision === 'Estornado ao Estoque'
        ? `Devolução ${selectedReturnForInspection.returnCode} estornada com sucesso e registrada como estornada ao estoque.`
        : `Devolução ${selectedReturnForInspection.returnCode} direcionada para sinistro da seguradora.`
    );
    setSelectedReturnForInspection(null);
    setInspectionNotes('');
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

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE]">
              Horizonte Reversa
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Gestão de Devoluções & Logística Reversa
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Operações Horizonte Logística • Controle de mercadorias recusadas, retorno aos CDs e estorno contábil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              downloadFile(
                `devolucoes_${new Date().toISOString().slice(0, 10)}.csv`,
                toCsv(
                  ['Código', 'NFe', 'CTe', 'Cliente', 'Cidade', 'Motorista', 'Placa', 'Itens', 'Volumes', 'Valor', 'Motivo', 'Status', 'Conferente'],
                  returns.map((r) => [r.returnCode, r.nfeNumber, r.cteNumber, r.clientName, r.city, r.driverName, r.vehiclePlate, r.itemsDescription, r.volumeUnits, r.totalValue, r.reason, r.warehouseStatus, r.checkedBy])
                )
              )
            }
            className="text-xs font-bold text-[#004AC6] hover:bg-[#EFF4FF] border border-[#BFDBFE] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Exportar Devoluções (CSV)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Taxa Geral de Devolução</span>
            <RotateCcw className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{deliveriesTotal > 0 ? `${((returns.length / deliveriesTotal) * 100).toFixed(2)}%` : '—'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Devoluções ÷ entregas cadastradas</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Valor Retido em Devolução</span>
            <DollarSign className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#D97706]">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{returns.length} notas em trâmite</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Retornando ao CD</span>
            <Truck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2563EB]">
            {returns.filter((r) => r.warehouseStatus === 'A Caminho do CD').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Veículos em rota de volta</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Aguardando Laudo no CD</span>
            <Warehouse className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#DC2626]">
            {returns.filter((r) => r.warehouseStatus === 'Em Conferência no Pátio').length}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Requer conferência física</div>
        </div>
      </div>

      {/* Main Table Card */}
      <TangramCard>
        {/* Filters */}
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F5F9]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, NFe, cliente ou placa..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-hidden focus:border-[#004AC6]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'todos', label: 'Todos Motivos' },
              { id: 'Divergência de Pedido', label: 'Divergência' },
              { id: 'Avaria de Transporte', label: 'Avaria' },
              { id: 'Recusa Comercial', label: 'Recusa Comercial' },
              { id: 'Cliente Fechado (3 tentativas)', label: 'Cliente Fechado' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReasonFilter(tab.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  reasonFilter === tab.id
                    ? 'bg-[#004AC6] text-white'
                    : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Returns Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0B1C30]">
            <thead className="bg-[#F8FAFC] text-[#737686] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Código / NFe</th>
                <th className="py-3 px-4">Cliente / Origem</th>
                <th className="py-3 px-4">Mercadorias / Valor</th>
                <th className="py-3 px-4">Motivo da Recusa</th>
                <th className="py-3 px-4">Status no Armazém</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-[#004AC6]">{ret.returnCode}</div>
                    <div className="text-[11px] text-slate-700 font-semibold">{ret.nfeNumber}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Reg: {ret.registeredAt}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0B1C30]">{ret.clientName}</div>
                    <div className="text-[11px] text-slate-500">{ret.city}</div>
                    <div className="text-[10px] text-slate-400">
                      Veículo: <strong className="font-mono">{ret.vehiclePlate}</strong> ({ret.driverName})
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{ret.itemsDescription}</div>
                    <div className="text-[11px] font-bold text-[#0B1C30] mt-0.5">
                      R$ {ret.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-semibold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      {ret.reason}
                    </span>
                    {ret.notes && (
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">
                        "{ret.notes}"
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {ret.warehouseStatus === 'Estornado ao Estoque' && (
                      <TangramBadge variant="success">Estornado ao Estoque</TangramBadge>
                    )}
                    {ret.warehouseStatus === 'Em Conferência no Pátio' && (
                      <TangramBadge variant="warning">Em Conferência no CD</TangramBadge>
                    )}
                    {ret.warehouseStatus === 'A Caminho do CD' && (
                      <TangramBadge variant="info">Retornando ({ret.estimatedArrivalAtCD})</TangramBadge>
                    )}
                    {ret.warehouseStatus === 'Laudo Aprovado' && (
                      <TangramBadge variant="neutral">Laudo Aprovado</TangramBadge>
                    )}
                    {ret.warehouseStatus === 'Destinado a Seguradora' && (
                      <TangramBadge variant="danger">Acionado Sinistro</TangramBadge>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReturnForInspection(ret)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#004AC6] hover:bg-[#EFF4FF] border border-[#BFDBFE] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Inspecionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TangramCard>

      {/* Modal: Inspecionar e Estornar Devolução */}
      {selectedReturnForInspection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCompleteInspection}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95"
          >
            <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#004AC6]" />
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Laudo de Entrada & Estorno • {selectedReturnForInspection.returnCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReturnForInspection(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#0B1C30]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">NFe Original:</span>
                  <strong className="font-mono">{selectedReturnForInspection.nfeNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente Recusante:</span>
                  <strong>{selectedReturnForInspection.clientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor das Mercadorias:</span>
                  <strong className="text-[#006C49]">
                    R$ {selectedReturnForInspection.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Motivo Informado:</span>
                  <span className="font-semibold text-amber-700">{selectedReturnForInspection.reason}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Decisão da Vistoria Técnica:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                      inspectionDecision === 'Estornado ao Estoque'
                        ? 'border-[#006C49] bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={inspectionDecision === 'Estornado ao Estoque'}
                      onChange={() => setInspectionDecision('Estornado ao Estoque')}
                      className="sr-only"
                    />
                    <span>Reincorporar ao Estoque</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Itens 100% íntegros, retornam ao estoque.
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                      inspectionDecision === 'Destinado a Seguradora'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={inspectionDecision === 'Destinado a Seguradora'}
                      onChange={() => setInspectionDecision('Destinado a Seguradora')}
                      className="sr-only"
                    />
                    <span>Sinistro / Seguradora</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Avaria total ou dano irreparável. Encaminha para indenização.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observações do Laudo / Conferente:
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Ex: Embalagem externa com pequena ressalva, produto interno testado e aprovado para revenda."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#004AC6] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReturnForInspection(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#004AC6] hover:bg-[#003899] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Aprovar Laudo & Emitir NFe de Entrada
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
