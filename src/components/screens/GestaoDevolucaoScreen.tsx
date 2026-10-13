import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useDevolutions } from '../../hooks/useDevolutions';
import { useAuth } from '../../hooks/useAuth';
import { devolutionReasons, DevolutionReason } from '../../constants/devolutionReasons';
import { importBeesRoutes } from '../../services/importBeesRoutes';
import type { DevolutionRow } from '../../services/api/devolutions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

type OcorrenciaStatus = 'Pendente' | 'Em andamento' | 'Concluída';

function getStatus(d: DevolutionRow): OcorrenciaStatus {
  if (d.status === 'APPROVED' || d.status === 'REJECTED') return 'Concluída';
  if (d.supervisor_id) return 'Em andamento';
  return 'Pendente';
}

const STATUS_BADGE: Record<OcorrenciaStatus, string> = {
  'Pendente':     'bg-amber-100 text-amber-800',
  'Em andamento': 'bg-blue-100  text-blue-800',
  'Concluída':    'bg-slate-100 text-slate-600',
};

const INPUT = 'w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none';

// ─── Componente principal ─────────────────────────────────────────────────────

export const GestaoDevolucaoScreen: React.FC = () => {
  const { devolutions, loading, updateStatus, createManual, refresh } = useDevolutions();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeFilter, setActiveFilter] = useState<'pending' | 'concluded'>('pending');
  const [selected, setSelected]         = useState<DevolutionRow | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isImporting, setIsImporting]   = useState(false);

  // Form manual
  const [mTourId,    setMTourId]    = useState('');
  const [mPocId,     setMPocId]     = useState('');
  const [mPocName,   setMPocName]   = useState('');
  const [mReason,    setMReason]    = useState('');
  const [mComments,  setMComments]  = useState('');
  const [mSaving,    setMSaving]    = useState(false);
  const [mError,     setMError]     = useState<string | null>(null);

  // Form tratativa
  const [tReason,   setTReason]    = useState('');
  const [tComments, setTComments]  = useState('');
  const [tSaving,   setTSaving]    = useState(false);

  // KPIs
  const total     = devolutions.length;
  const pending   = devolutions.filter(d => getStatus(d) === 'Pendente').length;
  const inProgress = devolutions.filter(d => getStatus(d) === 'Em andamento').length;
  const concluded = devolutions.filter(d => getStatus(d) === 'Concluída').length;

  const filtered = devolutions.filter(d =>
    activeFilter === 'pending'
      ? getStatus(d) !== 'Concluída'
      : getStatus(d) === 'Concluída'
  );

  // ── Importação CSV ──────────────────────────────────────────────────────────

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const text = await file.text();
      const r    = await importBeesRoutes(text);
      alert(
        `Importação concluída!\n\nMapas: ${r.toursUpserted}\nParadas: ${r.deliveriesUpserted}\nOcorrências: ${r.devolutionsCreated}`
      );
      await refresh();
    } catch (err: any) {
      alert(`Erro na importação: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Devolução manual ────────────────────────────────────────────────────────

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mTourId || !mPocId || !mPocName || !mReason) return;
    const found = devolutionReasons.find((r: DevolutionReason) => r.code.toString() === mReason);
    setMSaving(true);
    setMError(null);
    try {
      await createManual({
        external_tour_id:   mTourId,
        poc_external_id:    mPocId,
        poc_name:           mPocName,
        reason:             mReason,
        reason_description: found ? found.description : 'Motivo Manual',
        supervisor_comments: mComments || undefined,
      });
      setMTourId(''); setMPocId(''); setMPocName('');
      setMReason(''); setMComments('');
      setIsManualOpen(false);
    } catch (err: any) {
      setMError(err.message);
    } finally {
      setMSaving(false);
    }
  }

  // ── Tratativa ───────────────────────────────────────────────────────────────

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    if (!selected || !profile) return;
    setTSaving(true);
    try {
      await updateStatus(selected.id, status, profile.id, tComments || null);
      setSelected(null);
      setTReason(''); setTComments('');
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar tratativa');
    } finally {
      setTSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ocorrências e Devoluções</h1>
          <p className="text-sm text-gray-500 mt-0.5">CDD Caruaru — Gestão Last-mile</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {isImporting ? 'Importando...' : 'Importar CSV (BEES)'}
          </button>
          <button
            onClick={() => setIsManualOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            + Nova Ocorrência Manual
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',        value: total,      icon: <AlertTriangle className="w-4 h-4" />, color: 'text-slate-600 bg-slate-50   border-slate-200'  },
          { label: 'Pendentes',    value: pending,    icon: <Clock className="w-4 h-4" />,         color: 'text-amber-700 bg-amber-50   border-amber-200'  },
          { label: 'Em andamento', value: inProgress, icon: <Clock className="w-4 h-4" />,         color: 'text-blue-700  bg-blue-50    border-blue-200'   },
          { label: 'Concluídas',   value: concluded,  icon: <CheckCircle className="w-4 h-4" />,   color: 'text-green-700 bg-green-50   border-green-200'  },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-4 border ${k.color}`}>
            <div className="flex items-center gap-2 mb-1 opacity-75">{k.icon}<span className="text-xs font-medium">{k.label}</span></div>
            <p className="text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Barra de status de entregas ── */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { label: 'Devolução esperando tratamento', count: pending,    color: 'bg-amber-400' },
          { label: 'Devolução em tratamento',        count: inProgress, color: 'bg-blue-500'  },
          { label: 'Concluídas',                     count: concluded,  color: 'bg-green-500' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            {s.label} <span className="font-bold text-slate-800">{s.count}</span>
          </div>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex gap-4">

        {/* Sidebar filtros */}
        <div className="w-52 shrink-0 bg-white rounded-xl border border-slate-200 p-3 h-fit">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Ocorrências</p>
          <div className="space-y-0.5">
            {([
              { key: 'pending'   as const, label: 'Pendentes e em andamento', count: pending + inProgress },
              { key: 'concluded' as const, label: 'Concluídas',               count: concluded           },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f.key
                    ? 'bg-amber-50 text-amber-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeFilter === f.key ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Carregando ocorrências...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">Nenhuma ocorrência nesta categoria.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Tipo da ocorrência', 'Rota', 'Código do PDV', 'Status da ocorrência', 'Atribuído para', 'Relatada', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(d => {
                  const st = getStatus(d);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {d.reason_description || d.reason || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {d.external_tour_id ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-medium">{d.poc_external_id ?? '—'}</p>
                        {d.poc_name && <p className="text-xs text-slate-400">{d.poc_name}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[st]}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {d.supervisor_name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {relativeTime(d.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {st !== 'Concluída' && (
                          <button
                            onClick={() => { setSelected(d); setTReason(d.reason ?? ''); setTComments(''); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap"
                          >
                            Tratar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal: Ocorrência manual ── */}
      {isManualOpen && (
        <Modal title="Nova Ocorrência Manual" onClose={() => { setIsManualOpen(false); setMError(null); }}>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {mError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                <XCircle className="w-4 h-4 shrink-0" /> {mError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nº da Rota *</label>
                <input required className={INPUT} placeholder="Ex: 439337" value={mTourId}
                  onChange={e => setMTourId(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Código do PDV *</label>
                <input required className={INPUT} placeholder="Ex: 93261" value={mPocId}
                  onChange={e => setMPocId(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nome do PDV *</label>
              <input required className={INPUT} placeholder="Nome do estabelecimento" value={mPocName}
                onChange={e => setMPocName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Motivo (Tabela Promax) *</label>
              <select required className={INPUT} value={mReason} onChange={e => setMReason(e.target.value)}>
                <option value="">Selecione o motivo...</option>
                {devolutionReasons.map((r: DevolutionReason) => (
                  <option key={r.code} value={r.code}>[{r.code}] {r.description} ({r.responsibility})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Observações</label>
              <textarea className={INPUT + ' resize-none'} rows={2}
                placeholder="Detalhes reportados pelo motorista..." value={mComments}
                onChange={e => setMComments(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={mSaving}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors">
                {mSaving ? 'Salvando...' : 'Registrar ocorrência'}
              </button>
              <button type="button" onClick={() => { setIsManualOpen(false); setMError(null); }}
                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Tratativa ── */}
      {selected && (
        <Modal
          title={`Tratativa — PDV ${selected.poc_external_id}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase">Motivo reportado</p>
              <p className="font-medium text-slate-800">{selected.reason_description || selected.reason}</p>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-500 mt-2">
                <span>Rota: <strong className="text-slate-700">{selected.external_tour_id ?? selected.tour_id}</strong></span>
                <span>Registrada: <strong className="text-slate-700">{relativeTime(selected.created_at)}</strong></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Motivo da tratativa (Promax)</label>
              <select className={INPUT} value={tReason} onChange={e => setTReason(e.target.value)}>
                <option value="">Selecione o motivo oficial...</option>
                {devolutionReasons.map((r: DevolutionReason) => (
                  <option key={r.code} value={r.code}>[{r.code}] {r.description} ({r.responsibility})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Comentários do supervisor</label>
              <textarea className={INPUT + ' resize-none'} rows={3} value={tComments}
                onChange={e => setTComments(e.target.value)}
                placeholder="Ex: Cliente reagendou para amanhã cedo..." />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleAction('REJECTED')} disabled={tSaving}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                Rejeitar
              </button>
              <button onClick={() => handleAction('APPROVED')} disabled={tSaving}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                Aprovar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}