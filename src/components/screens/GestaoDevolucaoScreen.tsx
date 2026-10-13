import React, { useState, useRef } from 'react';
import { useDevolutions } from '../../hooks/useTours';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { orDash } from '../../utils/format';
import { importBeesRoutes, type ImportBeesResult } from '../../services/importBeesRoutes';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import type { Devolution, DevolutionApproval } from '../../types';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  ClipboardCheck,
  X,
  AlertTriangle,
  Upload,
  FileText,
} from 'lucide-react';

function devolutionStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED': return <TangramBadge variant="success">Aprovada</TangramBadge>;
    case 'REJECTED': return <TangramBadge variant="danger">Rejeitada</TangramBadge>;
    default:         return <TangramBadge variant="warning">Pendente</TangramBadge>;
  }
}

export const GestaoDevolucaoScreen: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalModal, setApprovalModal] = useState<Devolution | null>(null);
  const [supervisorComment, setSupervisorComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportBeesResult | null>(null);
  const [toast, showToast] = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { devolutions, pending, loading, error, approve, reload } = useDevolutions();
  const { session, profile } = useAuth();

  const isSupervisorOrAbove =
    profile?.role === 'supervisor' || profile?.role === 'gerencia';

  const filtered = devolutions.filter((d) => {
  const matchesSearch =
    !searchQuery ||
    (d.poc_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.reason ?? '').toLowerCase().includes(searchQuery.toLowerCase());
  const matchesStatus = statusFilter === 'todos' || d.status === statusFilter;
  return matchesSearch && matchesStatus;
});

  // ── Importação CSV ───────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await importBeesRoutes(text);
      setImportResult(result);

      if (result.errors.length === 0) {
        showToast(
          `Importado: ${result.toursUpserted} mapas, ${result.deliveriesUpserted} entregas, ${result.devolutionsCreated} devoluções criadas.`
        );
        void reload();
      } else {
        showToast(`Importado com avisos. Verifique o relatório.`);
        void reload();
      }
    } catch (err) {
      showToast('Erro ao processar o arquivo. Verifique o formato.');
    } finally {
      setImporting(false);
      // Limpa o input para permitir reimportar o mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Aprovação ────────────────────────────────────────────────

  const openApprovalModal = (dev: Devolution) => {
    setApprovalModal(dev);
    setSupervisorComment('');
  };

  const closeApprovalModal = () => {
    setApprovalModal(null);
    setSupervisorComment('');
  };

  const handleApprove = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!approvalModal || !session?.user) return;
    setSaving(true);
    try {
      const approval: DevolutionApproval = {
        status: decision,
        supervisor_comments: supervisorComment || undefined,
      };
      await approve(approvalModal.id, approval, session.user.id);
      showToast(decision === 'APPROVED' ? 'Devolução aprovada.' : 'Devolução rejeitada.');
      closeApprovalModal();
    } catch {
      showToast('Erro ao processar. Tente novamente.');
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
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Gestão de Devolução
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Devoluções pendentes de aprovação • Fluxo supervisor
          </p>
        </div>

        {/* Botão de importação */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { void handleFileSelect(e); }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#1E2D72] hover:bg-[#162260] text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            {importing ? 'Importando...' : 'Importar CSV do BEES'}
          </button>
        </div>
      </div>

      {/* Resultado da importação */}
      {importResult && (
        <div className={`rounded-xl border p-4 text-xs ${
          importResult.errors.length > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-start gap-3">
            <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${
              importResult.errors.length > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`} />
            <div className="flex-1">
              <div className="font-bold text-[#0B1C30] mb-1">Resultado da importação</div>
              <div className="flex flex-wrap gap-4 text-[11px]">
                <span>✅ <strong>{importResult.toursUpserted}</strong> mapas</span>
                <span>✅ <strong>{importResult.deliveriesUpserted}</strong> entregas</span>
                <span>🔄 <strong>{importResult.devolutionsCreated}</strong> devoluções criadas</span>
                {importResult.skipped > 0 && (
                  <span>⚠️ <strong>{importResult.skipped}</strong> linhas ignoradas</span>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="text-rose-700 text-[11px]">• {e}</div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Total de Devoluções</span>
            <RotateCcw className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{devolutions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">todos os registros</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Pendentes Aprovação</span>
            <Clock className="w-4 h-4 text-[#F39818]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#F39818]">{pending.length}</div>
          <div className={`text-[11px] font-semibold mt-0.5 ${pending.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {pending.length > 0 ? 'Aguardando supervisor' : 'Nenhuma pendente'}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Aprovadas</span>
            <CheckCircle2 className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">
            {devolutions.filter((d) => d.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">pelo supervisor</div>
        </div>
      </div>

      {/* Alerta de pendentes para supervisor */}
      {isSupervisorOrAbove && pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-amber-800">
              {pending.length} devolução{pending.length > 1 ? 'ões' : ''} aguardando sua aprovação
            </div>
            <div className="text-xs text-amber-700 mt-0.5">
              Use o botão "Analisar" na tabela abaixo para aprovar ou rejeitar.
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <TangramCard>
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F5F9]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por PDV ou motivo..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#004AC6]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'PENDING', label: 'Pendentes' },
              { id: 'APPROVED', label: 'Aprovadas' },
              { id: 'REJECTED', label: 'Rejeitadas' },
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
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando devoluções...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-rose-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <RotateCcw className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-400">Nenhuma devolução encontrada</div>
            <div className="text-xs text-slate-400 mt-1">
              Importe o CSV do BEES para carregar as devoluções do dia.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0B1C30]">
              <thead className="bg-[#F8FAFC] text-[#737686] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">PDV</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Registrado em</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Obs. Supervisor</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((dev) => (
                  <tr key={dev.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{orDash(dev.poc_name)}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{orDash(dev.poc_external_id)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{dev.reason}</div>
                      {dev.reason_description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{dev.reason_description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(dev.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">{devolutionStatusBadge(dev.status)}</td>
                    <td className="py-3 px-4 max-w-xs text-slate-500">
                      {orDash(dev.supervisor_comments)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {dev.status === 'PENDING' && isSupervisorOrAbove ? (
                        <button
                          type="button"
                          onClick={() => openApprovalModal(dev)}
                          className="inline-flex items-center gap-1 text-xs font-bold bg-[#F39818] hover:bg-[#D97F10] text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          Analisar
                        </button>
                      ) : dev.status === 'PENDING' ? (
                        <span className="text-[11px] text-slate-400">Aguard. supervisor</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TangramCard>

      {/* Modal de aprovação */}
      {approvalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#F39818]" />
                <div>
                  <h3 className="text-sm font-bold text-[#0B1C30]">Analisar Devolução</h3>
                  <p className="text-[11px] text-slate-500">{approvalModal.poc_name}</p>
                </div>
              </div>
              <button onClick={closeApprovalModal} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#0B1C30]">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Motivo</span>
                  <div className="font-semibold text-slate-800">{approvalModal.reason}</div>
                </div>
                {approvalModal.reason_description && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Descrição</span>
                    <div className="text-slate-700">{approvalModal.reason_description}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observação do supervisor (opcional):
                </label>
                <textarea
                  value={supervisorComment}
                  onChange={(e) => setSupervisorComment(e.target.value)}
                  rows={3}
                  placeholder="Ex: Mapa pernoitado, cliente reagendou para amanhã..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#004AC6] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeApprovalModal}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => { void handleApprove('REJECTED'); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rejeitar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => { void handleApprove('APPROVED'); }}
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-[#006C49] hover:bg-[#005538] text-white rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
