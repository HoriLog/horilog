import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, Search, Filter, Plus, Upload, ArrowUpRight } from 'lucide-react';
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
  'Pendente':     'bg-amber-50 text-amber-700 border border-amber-200/80 font-medium',
  'Em andamento': 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
  'Concluída':    'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
};

const INPUT = 'w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all duration-200';

// ─── Componente principal ─────────────────────────────────────────────────────

export const GestaoDevolucaoScreen: React.FC = () => {
  const { devolutions, loading, updateStatus, createManual, refresh } = useDevolutions();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeFilter, setActiveFilter] = useState<'pending' | 'concluded'>('pending');
  const [searchQuery, setSearchQuery]   = useState('');
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
  const total      = devolutions.length;
  const pending    = devolutions.filter(d => getStatus(d) === 'Pendente').length;
  const inProgress = devolutions.filter(d => getStatus(d) === 'Em andamento').length;
  const concluded  = devolutions.filter(d => getStatus(d) === 'Concluída').length;

  const filtered = devolutions.filter(d => {
    const matchesTab = activeFilter === 'pending'
      ? getStatus(d) !== 'Concluída'
      : getStatus(d) === 'Concluída';

    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tourStr = String(d.external_tour_id ?? '').toLowerCase();
    const pocIdStr = String(d.poc_external_id ?? '').toLowerCase();
    const pocNameStr = String(d.poc_name ?? '').toLowerCase();
    const reasonStr = String(d.reason_description ?? d.reason ?? '').toLowerCase();

    return tourStr.includes(q) || pocIdStr.includes(q) || pocNameStr.includes(q) || reasonStr.includes(q);
  });

  // ── Importação CSV ──────────────────────────────────────────────────────────

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const text = await file.text();
      const r    = await importBeesRoutes(text);
      alert(
        `Importação concluída\\n\n` +
        'Mapas: ${r.toursUpdated}\n' +
        'Paradas: ${r.deliveriesUpdated}\n' +
        'Ocorrências: ${r.devolutionsCreated}\n\n' +
        'Buffer resolvido automaticamente: ${r.bufferResolved} POCs'
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
        external_tour_id:    mTourId,
        poc_external_id:     mPocId,
        poc_name:            mPocName,
        reason:              mReason,
        reason_description:  found ? found.description : 'Motivo Manual',
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
    <div className="space-y-6 pb-12">
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

      {/* ── Header Corporativo (Horizonte Brand Theme) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">HoriLog — CDD Caruaru</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">Ocorrências e Devoluções</h1>
          <p className="text-sm text-slate-500 mt-0.5">Painel de controle e tratativas da operação last-mile.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200/90 rounded-xl hover:bg-slate-100 transition-all shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            {isImporting ? 'Importando...' : 'Importar CSV (BEES)'}
          </button>
          <button
            onClick={() => setIsManualOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Nova Ocorrência
          </button>
        </div>
      </div>

      {/* ── KPIs com a Nova Paleta ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrado',     value: total,      icon: <AlertTriangle className="w-5 h-5 text-slate-600" />,   cardBg: 'bg-white border-slate-200/80', textNum: 'text-slate-900' },
          { label: 'Aguardando Tratamento', value: pending,    icon: <Clock className="w-5 h-5 text-amber-600" />,         cardBg: 'bg-white border-amber-200/80', textNum: 'text-amber-700' },
          { label: 'Em Andamento',         value: inProgress, icon: <Clock className="w-5 h-5 text-indigo-600" />,        cardBg: 'bg-white border-indigo-200/80', textNum: 'text-indigo-700' },
          { label: 'Tratativas Concluídas', value: concluded,  icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, cardBg: 'bg-white border-emerald-200/80', textNum: 'text-emerald-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 border ${k.cardBg} shadow-xs transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{k.label}</span>
              <div className="p-2 rounded-xl bg-slate-50/80">{k.icon}</div>
            </div>
            <p className={`text-3xl font-extrabold tracking-tight ${k.textNum}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Área Principal com Sidebar e Tabela ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Sidebar de Filtros Rápidos */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Filtro de Ocorrências</p>
            <div className="space-y-1">
              {[
                { key: 'pending'   as const, label: 'Pendentes e em andamento', count: pending + inProgress },
                { key: 'concluded' as const, label: 'Concluídas',               count: concluded           },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeFilter === f.key
                      ? 'bg-orange-50 text-orange-900 font-bold border border-orange-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="text-left">{f.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activeFilter === f.key ? 'bg-orange-200/80 text-orange-900' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-600" /> Operação HoriLog
              </p>
              <p>As ocorrências importadas do BEES ficam vinculadas às rotas e PDVs para auditoria e tratativas imediatas.</p>
            </div>
          </div>
        </div>

        {/* Bloco da Tabela & Barra de Pesquisa */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          
          {/* Barra de Pesquisa */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por motivo, rota ou PDV..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-2xs"
              />
            </div>
            <div className="text-xs font-medium text-slate-500 whitespace-nowrap px-1">
              Exibindo <strong className="text-slate-800">{filtered.length}</strong> registro(s)
            </div>
          </div>

          {/* Tabela de Dados */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 text-center">
                <div className="inline-block w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-slate-400 font-medium">Carregando ocorrências...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">Nenhuma ocorrência encontrada nesta categoria.</p>
                <p className="text-xs text-slate-400">Tente ajustar o termo digitado na pesquisa ou alternar os filtros.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Tipo da ocorrência</th>
                    <th className="px-4 py-3.5">Rota</th>
                    <th className="px-4 py-3.5">PDV</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Atribuído para</th>
                    <th className="px-4 py-3.5">Relatada</th>
                    <th className="px-4 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(d => {
                    const st = getStatus(d);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900 max-w-xs truncate">
                          {d.reason_description || d.reason || '—'}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-600">
                          {d.external_tour_id ?? '—'}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <p className="font-semibold text-slate-800">{d.poc_external_id ?? '—'}</p>
                          {d.poc_name && <p className="text-xs text-slate-400 truncate max-w-[180px]">{d.poc_name}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[st]}`}>
                            {st}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 text-xs">
                          {d.supervisor_name ?? <span className="text-slate-300 font-medium">—</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap font-medium">
                          {relativeTime(d.created_at)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {st !== 'Concluída' ? (
                            <button
                              onClick={() => { setSelected(d); setTReason(d.reason ?? ''); setTComments(''); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/80 hover:bg-orange-100 transition-all shadow-2xs"
                            >
                              Tratar <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl inline-block">
                              Finalizada
                            </span>
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

      </div>

      {/* ── Modal: Ocorrência manual ── */}
      {isManualOpen && (
        <Modal title="Nova Ocorrência Manual" onClose={() => { setIsManualOpen(false); setMError(null); }}>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {mError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
                <XCircle className="w-4 h-4 shrink-0" /> {mError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nº da Rota *</label>
                <input required className={INPUT} placeholder="Ex: 439337" value={mTourId}
                  onChange={e => setMTourId(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Código do PDV *</label>
                <input required className={INPUT} placeholder="Ex: 93261" value={mPocId}
                  onChange={e => setMPocId(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nome do PDV *</label>
              <input required className={INPUT} placeholder="Nome do estabelecimento" value={mPocName}
                onChange={e => setMPocName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Motivo (Tabela Promax) *</label>
              <select required className={INPUT} value={mReason} onChange={e => setMReason(e.target.value)}>
                <option value="">Selecione o motivo...</option>
                {devolutionReasons.map((r: DevolutionReason) => (
                  <option key={r.code} value={r.code}>[{r.code}] {r.description} ({r.responsibility})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Observações</label>
              <textarea className={INPUT + ' resize-none'} rows={3}
                placeholder="Detalhes reportados pelo motorista..." value={mComments}
                onChange={e => setMComments(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={mSaving}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-sm shadow-orange-500/20">
                {mSaving ? 'Salvando...' : 'Registrar ocorrência'}
              </button>
              <button type="button" onClick={() => { setIsManualOpen(false); setMError(null); }}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Tratativa ── */}
      {selected && (
        <Modal
          title={`Tratativa de Ocorrência — PDV ${selected.poc_external_id}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-sm space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Motivo reportado</p>
              <p className="font-semibold text-slate-900">{selected.reason_description || selected.reason}</p>
              <div className="pt-2.5 border-t border-slate-200/60 flex justify-between text-xs text-slate-500 mt-2">
                <span>Rota: <strong className="text-slate-800 font-mono">{selected.external_tour_id ?? selected.tour_id}</strong></span>
                <span>Registrada: <strong className="text-slate-800">{relativeTime(selected.created_at)}</strong></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Motivo da tratativa (Promax)</label>
              <select className={INPUT} value={tReason} onChange={e => setTReason(e.target.value)}>
                <option value="">Selecione o motivo oficial...</option>
                {devolutionReasons.map((r: DevolutionReason) => (
                  <option key={r.code} value={r.code}>[{r.code}] {r.description} ({r.responsibility})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Comentários do supervisor</label>
              <textarea className={INPUT + ' resize-none'} rows={3} value={tComments}
                onChange={e => setTComments(e.target.value)}
                placeholder="Ex: Cliente reagendou para amanhã cedo..." />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setSelected(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                Voltar
              </button>
              <button onClick={() => handleAction('REJECTED')} disabled={tSaving}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all shadow-sm shadow-rose-600/20">
                Rejeitar Ocorrência
              </button>
              <button onClick={() => handleAction('APPROVED')} disabled={tSaving}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm shadow-emerald-600/20">
                Aprovar Tratativa
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-base">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}