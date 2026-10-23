import React, { useState, useEffect } from 'react';
import {
  Plus, Calendar, CheckCircle, XCircle, Trash2,
  MessageSquare, Search, AlertTriangle, Send,
  User, FileText, CheckSquare, Square, Upload,
  Filter, Users,
} from 'lucide-react';
import { useBuffer }           from '../../hooks/useBuffer';
import { useContacts }         from '../../hooks/useContacts';
import { useAuth }             from '../../hooks/useAuth';
import { usePermissions }      from '../../hooks/usePermissions';
import { useSectors }          from '../../hooks/useSectors';
import { parseBufferReport }   from '../../services/importBufferReport';
import { sendWhatsAppMessage, sendWhatsAppBulk } from '../../services/whatsappService';
import type { BufferEntry, BufferStatus } from '../../types';
import type { Contact }        from '../../services/api/contacts';
import { orDash }              from '../../utils/format';

// ─── Tipos e constantes ───────────────────────────────────────────────────────

type StatusFilter = 'ALL' | BufferStatus;

const STATUS_LABELS: Record<BufferStatus, string> = {
  PENDING:   'Pendente',
  SCHEDULED: 'Agendado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<BufferStatus, string> = {
  PENDING:   'bg-amber-50   text-amber-700  border border-amber-200/80  font-medium',
  SCHEDULED: 'bg-indigo-50  text-indigo-700 border border-indigo-200/80 font-medium',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
  CANCELLED: 'bg-slate-100  text-slate-500  border border-slate-200     font-medium',
};

interface FormState {
  poc_external_id: string;
  poc_name:        string;
  poc_phone:       string;
  original_date:   string;
  scheduled_date:  string;
  volume_hl:       string;
  reason:          string;
  notes:           string;
  sector_code:     string;
}

const EMPTY_FORM: FormState = {
  poc_external_id: '',
  poc_name:        '',
  poc_phone:       '',
  original_date:   new Date().toISOString().slice(0, 10),
  scheduled_date:  '',
  volume_hl:       '',
  reason:          '',
  notes:           '',
  sector_code:     '',
};

const INPUT =
  'w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 ' +
  'focus:border-orange-500 focus:outline-none transition-all duration-200';

type DispatchMode = 'single' | 'sector' | 'all' | 'clients';

// ─── Componente principal ─────────────────────────────────────────────────────

export function GestaoBufferScreen() {
  const { entries, loading, refreshing, error, addEntry, editEntry, removeEntry } = useBuffer();
  const { contacts }  = useContacts();
  const { profile }   = useAuth();
  const { can }       = usePermissions();
  const { sectors, getVendedor } = useSectors();

  // Filtros lista
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search,       setSearch]       = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  // Form add manual
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<FormState>(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [sectorOpen, setSectorOpen] = useState(false);

  // Seleção checkbox
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal WhatsApp
  const [isWaOpen,       setIsWaOpen]       = useState(false);
  const [dispatchMode,   setDispatchMode]   = useState<DispatchMode>('single');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sectorDispatch, setSectorDispatch] = useState('');
  const [msgTemplate,    setMsgTemplate]    = useState<'standard' | 'urgent' | 'summary'>('standard');
  const [editableMsg,    setEditableMsg]    = useState('');
  const [sending,        setSending]        = useState(false);
  const [sendResult,     setSendResult]     = useState<string | null>(null);
  const [waQueue,        setWaQueue]        = useState<Contact[]>([]);
  const [waQueueIndex,   setWaQueueIndex]   = useState(0);

  // Agenda sub-modal
  const [scheduleTarget, setScheduleTarget] = useState<BufferEntry | null>(null);
  const [scheduledDate,  setScheduledDate]  = useState('');

  // Inicializa contato quando contacts carrega
  useEffect(() => {
    if (contacts.length > 0 && !selectedContact) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  // ── Setores únicos dos contatos (exceto supervisores sem setor) ─────────────
  const sectorContacts = contacts.filter(c => c.sector_code);
  const supervisorContacts = contacts.filter(c => !c.sector_code);
  const uniqueSectors = sectors.map(s => s.code);

  // ── Dados filtrados ─────────────────────────────────────────────────────────
  const filtered = entries.filter(e => {
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      e.poc_name.toLowerCase().includes(q) ||
      e.poc_external_id.toLowerCase().includes(q);
    const matchSector = !sectorFilter || (e as any).sector_code === sectorFilter;
    return matchStatus && matchSearch && matchSector;
  });

  const counts = {
    total:     entries.length,
    pending:   entries.filter(e => e.status === 'PENDING').length,
    scheduled: entries.filter(e => e.status === 'SCHEDULED').length,
    delivered: entries.filter(e => e.status === 'DELIVERED').length,
  };

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // ── Gerador de mensagem ─────────────────────────────────────────────────────
  function buildMessage(type: 'standard' | 'urgent' | 'summary' | 'client', targets: BufferEntry[], contactName?: string): string {
  const today = new Date().toLocaleDateString('pt-BR');

  if (type === 'client') {
    return `Olá${contactName ? ` *${contactName}*` : ''}! 👋\n\n` +
      `Passando para informar que sua entrega prevista para hoje não foi possível de ser realizada.\n\n` +
      `📦 Estamos trabalhando para reagendar o mais breve possível.\n\n` +
      `Em caso de dúvidas, entre em contato conosco.\n\n` +
      `_HoriLog — CDD Caruaru_`;
  }

  if (type === 'urgent') {
    let t = `🚨 *URGENTE — Buffer HoriLog CDD Caruaru* 🚚\nData: ${today}\n\n`;
    t += `*${targets.length}* cliente(s) exigindo tratativa imediata:\n\n`;
    targets.filter(e => e.status === 'PENDING').slice(0, 10).forEach((e, i) => {
      t += `${i + 1}. *[PDV ${e.poc_external_id}]* ${e.poc_name}\n`;
    });
    t += `\n_Favor verificar no sistema o quanto antes._`;
    return t;
  }
  if (type === 'summary') {
    const vol = targets.reduce((a, e) => a + (e.volume_hl ?? 0), 0);
    return `📊 *Resumo Buffer — CDD Caruaru*\nData: ${today}\n\n` +
      `• Total PDVs: *${targets.length}*\n• Volume: *${vol.toFixed(2)} hl*\n\n` +
      `_Relatório HoriLog ERP._`;
  }
  let t = `*HoriLog — Buffer CDD Caruaru* 🚚\nData: ${today}\n\n📋 Clientes para tratativa:\n\n`;
  targets.forEach((e, i) => {
    t += `${i + 1}. *[PDV ${e.poc_external_id}]* ${e.poc_name}\n`;
    t += `   - Status: ${STATUS_LABELS[e.status]}\n`;
    if (e.original_date) t += `   - Data: ${fmtDate(e.original_date)}\n`;
    if (e.reason)        t += `   - Motivo: ${e.reason}\n`;
    t += `\n`;
  });
  t += `_Favor priorizar o alinhamento._`;
  return t;
}

  function getDispatchTargets(): BufferEntry[] {
    if (selectedIds.length > 0) return entries.filter(e => selectedIds.includes(e.id));
    return filtered;
  }

  function getDispatchContacts(): Contact[] {
    if (dispatchMode === 'single') return selectedContact ? [selectedContact] : [];
    if (dispatchMode === 'sector') {
      return [
        ...contacts.filter(c => c.sector_code === sectorDispatch),
        ...supervisorContacts,
      ];
    }
    if (dispatchMode === 'clients') {
      const targets = getDispatchTargets();
      return targets
        .filter(e => e.poc_phone)
        .map(e => ({
        id: e.id,
        name: e.poc_name,
        role: 'Cliente',
        department: 'null',
        phone: e.poc_phone!,
        active: true,
        sector_code: e.sector_code ?? null,
        }));
    }
    return contacts;
  }

  function handleOpenWa() {
    const targets = getDispatchTargets();
  setEditableMsg(buildMessage(msgTemplate, targets));
  setSendResult(null);
  setWaQueueIndex(0);  // ← Fix ponto 1: reseta índice ao abrir
  setIsWaOpen(true);
  }

  function handleSelectTemplate(type: 'standard' | 'urgent' | 'summary') {
    setMsgTemplate(type);
    setEditableMsg(buildMessage(type, getDispatchTargets()));
  }

  async function handleSendWa() {
    const dispContacts = getDispatchContacts();
    if (dispContacts.length === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      if (dispContacts.length === 1) {
        await sendWhatsAppMessage({ phone: dispContacts[0].phone, message: editableMsg });
        setSendResult(`✓ Mensagem enviada para ${dispContacts[0].name}`);
      } else {
        const r = await sendWhatsAppBulk(
          dispContacts.map(c => ({ phone: c.phone, name: c.name })),
          editableMsg
        );
        setSendResult(`✓ Enviado: ${r.sent} | ✗ Falha: ${r.failed}`);
      }
    } catch (e) {
      setSendResult(`Erro: ${e instanceof Error ? e.message : 'Falha no envio'}`);
    } finally {
      setSending(false);
    }
  }

  // ── Checkbox ────────────────────────────────────────────────────────────────
  function toggleAll() {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(e => e.id));
  }
  function toggleOne(id: string) {
    setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  }

  // ── Import CSV ──────────────────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { rows, errors } = parseBufferReport(text);
    if (errors.length > 0) console.warn('Avisos:', errors);
    let count = 0;
    for (const row of rows) {
      try {
        await addEntry({
          poc_external_id: row.pocExternalId,
          poc_name:        row.pocName,
          poc_phone:       null,
          original_date:   new Date().toISOString().slice(0, 10),
          scheduled_date:  null,
          volume_hl:       row.volumeHl,
          reason:          row.reason,
          notes:           'Importado via relatório CSV',
          status:          'PENDING',
          sector_code:      form.sector_code || null,
          created_by:      profile?.id ?? null,
          assigned_tour_id: null,
        });
        count++;
      } catch (err) { console.error(err); }
    }
    alert(`${count} importado(s).${errors.length ? `\n${errors.length} ignorado(s).` : ''}`);
    e.target.value = '';
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.poc_external_id.trim() || !form.poc_name.trim()) return;
    setSaving(true);
    try {
      await addEntry({
        poc_external_id:  form.poc_external_id.trim(),
        poc_name:         form.poc_name.trim(),
        poc_phone:        form.poc_phone.trim() || null,
        original_date:    form.original_date,
        scheduled_date:   form.scheduled_date || null,
        volume_hl:        form.volume_hl ? parseFloat(form.volume_hl) : null,
        reason:           form.reason.trim() || null,
        notes:            form.notes.trim() || null,
        status:           form.scheduled_date ? 'SCHEDULED' : 'PENDING',
        sector_code:      form.sector_code || null,
        assigned_tour_id: null,
        created_by:       profile?.id ?? null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally { setSaving(false); }
  }

  async function handleSchedule() {
    if (!scheduleTarget || !scheduledDate) return;
    setSaving(true);
    try {
      await editEntry(scheduleTarget.id, { scheduled_date: scheduledDate, status: 'SCHEDULED' });
      setScheduleTarget(null);
    } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;
  if (error)   return <p className="p-6 text-sm text-rose-600">{error}</p>;

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              HoriLog — CDD Caruaru
              {refreshing && <span className="ml-2 text-slate-400 normal-case font-normal">atualizando...</span>}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Buffer de Entregas</h1>
          <p className="text-sm text-slate-500 mt-0.5">POCs sem mapa atribuído — aguardando reagendamento</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('buffer', 'create') && (
            <label className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer">
              <Upload className="w-4 h-4 text-orange-500" />
              Importar
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
          <button
            onClick={handleOpenWa}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Disparar {selectedIds.length > 0 ? `(${selectedIds.length})` : '(Filtrados)'}
          </button>
          {can('buffer', 'create') && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm"
              style={{ background: 'linear-gradient(135deg, #EA9C2F, #d4870a)' }}
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: counts.total,     border: 'border-slate-200',   text: 'text-slate-900'   },
          { label: 'Pendentes', value: counts.pending,   border: 'border-amber-200',   text: 'text-amber-700'   },
          { label: 'Agendados', value: counts.scheduled, border: 'border-indigo-200',  text: 'text-indigo-700'  },
          { label: 'Entregues', value: counts.delivered, border: 'border-emerald-200', text: 'text-emerald-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 bg-white border ${k.border} shadow-xs`}>
            <p className="text-xs font-medium text-slate-500 mb-1">{k.label}</p>
            <p className={`text-3xl font-extrabold tracking-tight ${k.text}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex bg-slate-100/80 rounded-xl p-1 gap-1">
          {(['ALL', 'PENDING', 'SCHEDULED', 'DELIVERED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Filtro por setor */}
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Todos os setores</option>
            {uniqueSectors.map(s => (
              <option key={s} value={s}>Setor {s}</option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID do POC..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">
              {statusFilter === 'ALL' && !search && !sectorFilter
                ? 'Nenhum POC em buffer no momento.'
                : 'Nenhum resultado para os filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 w-10 text-center">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700">
                      {selectedIds.length === filtered.length && filtered.length > 0
                        ? <CheckSquare className="w-4 h-4 text-orange-500" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">POC</th>
                  <th className="px-4 py-3 text-left">Setor / Vendedor</th>
                  <th className="px-4 py-3 text-left">Data Original</th>
                  <th className="px-4 py-3 text-left">Agendado Para</th>
                  <th className="px-4 py-3 text-left">Vol (hl)</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(entry => {
                  const isSel = selectedIds.includes(entry.id);
                  return (
                    <tr key={entry.id} className={`hover:bg-slate-50/70 transition-colors ${isSel ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => toggleOne(entry.id)} className="text-slate-400 hover:text-slate-700">
                          {isSel
                            ? <CheckSquare className="w-4 h-4 text-orange-500" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{entry.poc_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{entry.poc_external_id}</p>
                      </td>
                      {/* Setor / Vendedor — nova célula */}
                      <td className="px-4 py-3.5">
                        {entry.sector_code ? (
                          <div>
                            <span
                            className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{ background: 'rgba(13,78,150,0.08)', color: '#0D4E96', borderColor: 'rgba(13,78,150,0.2)' }}
                            >
                              Setor {entry.sector_code}
                            </span>
                            {getVendedor(entry.sector_code) && (
                              <p className="text-xs text-slate-500 mt-0.5">{getVendedor(entry.sector_code)}</p>
                            )}
                          </div>
                        ) : (
                        <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">{fmtDate(entry.original_date)}</td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {entry.scheduled_date ? fmtDate(entry.scheduled_date) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {entry.volume_hl != null ? entry.volume_hl.toFixed(3) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{orDash(entry.reason)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs ${STATUS_COLORS[entry.status]}`}>
                          {STATUS_LABELS[entry.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {can('buffer', 'update') && entry.status === 'PENDING' && (
                            <IconBtn icon={<Calendar className="w-4 h-4" />} title="Agendar" color="blue"
                              onClick={() => { setScheduleTarget(entry); setScheduledDate(''); }} />
                          )}
                          {can('buffer', 'update') && (entry.status === 'PENDING' || entry.status === 'SCHEDULED') && (
                            <IconBtn icon={<CheckCircle className="w-4 h-4" />} title="Entregue" color="green"
                              onClick={() => editEntry(entry.id, { status: 'DELIVERED' })} />
                          )}
                          {can('buffer', 'update') && entry.status !== 'CANCELLED' && entry.status !== 'DELIVERED' && (
                            <IconBtn icon={<XCircle className="w-4 h-4" />} title="Cancelar" color="red"
                              onClick={() => editEntry(entry.id, { status: 'CANCELLED' })} />
                          )}
                          {can('buffer', 'delete') && (
                            <IconBtn icon={<Trash2 className="w-4 h-4" />} title="Remover" color="gray"
                              onClick={() => { if (confirm('Remover?')) removeEntry(entry.id); }} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal WhatsApp ── */}
      {/* ── Modal WhatsApp ── */}
{isWaOpen && (
<Modal title="Central de Disparo — WhatsApp" onClose={() => { setIsWaOpen(false); setSendResult(null); setWaQueueIndex(0); }}>    <div className="space-y-4">

      {waQueueIndex === 0 ? (
        <>
          {/* ── Configuração inicial ── */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Modo de disparo</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'single' as DispatchMode, label: 'Contato único', icon: User   },
                { key: 'sector' as DispatchMode, label: 'Por setor',     icon: Filter },
                { key: 'all'    as DispatchMode, label: 'Todos',         icon: Users  },
                { key: 'clients' as DispatchMode, label: 'Clientes',      icon: FileText },
              ]).map(m => (
                <button
                  key={m.key}
                  onClick={() => setDispatchMode(m.key)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    dispatchMode === m.key
                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {dispatchMode === 'single' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Contato
              </label>
              <select className={INPUT} value={selectedContact?.id ?? ''}
                onChange={e => { const c = contacts.find(c => c.id === e.target.value); if (c) setSelectedContact(c); }}>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.role} {c.sector_code ? `[Setor ${c.sector_code}]` : '[Supervisão]'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dispatchMode === 'sector' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-500" /> Setor
              </label>
              <select className={INPUT} value={sectorDispatch} onChange={e => setSectorDispatch(e.target.value)}>
                <option value="">Selecione o setor...</option>
                {uniqueSectors.map(s => {
                  const vendedor = contacts.find(c => c.sector_code === s);
                  return <option key={s} value={s}>Setor {s} — {vendedor?.name ?? 'Sem vendedor'}</option>;
                })}
              </select>
              {sectorDispatch && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Será enviado para: {getDispatchContacts().map(c => c.name).join(', ')}
                </p>
              )}
            </div>
          )}

          {dispatchMode === 'all' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
              Será disparado para todos os {contacts.length} contatos — um por vez.
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-500" /> Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'standard' as const, label: 'Lista'   },
                { key: 'urgent'   as const, label: 'Urgente' },
                { key: 'summary'  as const, label: 'Resumo'  },
              ]).map(t => (
                <button key={t.key} onClick={() => handleSelectTemplate(t.key)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    msgTemplate === t.key
                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Mensagem — {selectedIds.length > 0 ? `${selectedIds.length} selecionados` : `${filtered.length} filtrados`}
            </label>
            <textarea
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none resize-none"
              rows={6} value={editableMsg} onChange={e => setEditableMsg(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                const list = getDispatchContacts();
                if (list.length === 0) return;
                setWaQueue(list);
                setWaQueueIndex(1);
                setSendResult(null);
              }}
              disabled={dispatchMode === 'sector' && !sectorDispatch}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #25D366, #1da851)' }}
            >
              <Send className="w-4 h-4" />
              Iniciar fila ({getDispatchContacts().length} contato{getDispatchContacts().length !== 1 ? 's' : ''})
            </button>
            <button 
            onClick={() => {
              const list = getDispatchContacts();
              if (list.length === 0) return;
              setWaQueue(list);
              setWaQueueIndex(1);
              setSendResult(null);
              if (dispatchMode === 'clients') {
                setEditableMsg(buildMessage('client', getDispatchTargets()));
              }
            }}
              className="px-5 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ── Fila de disparo ── */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Contato {waQueueIndex} de {waQueue.length}
            </span>
            <div className="flex gap-1">
              {waQueue.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                  i + 1 < waQueueIndex  ? 'bg-emerald-400' :
                  i + 1 === waQueueIndex ? 'bg-orange-500 scale-125' :
                  'bg-slate-200'
                }`} />
              ))}
            </div>
          </div>

          {/* Card do contato atual */}
          {(() => {
            const contact = waQueue[waQueueIndex - 1];
            const isLast  = waQueueIndex === waQueue.length;
            return (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase shrink-0"
                    style={{ background: 'rgba(13,78,150,0.1)', color: '#0D4E96' }}>
                    {contact.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{contact.name}</p>
                    <p className="text-xs text-slate-500">
                      {contact.role}
                      {contact.sector_code ? ` · Setor ${contact.sector_code}` : ' · Supervisão'}
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {contact.phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Mensagem — editável para este contato
                  </label>
                  <textarea
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none resize-none"
                    rows={6} value={editableMsg} onChange={e => setEditableMsg(e.target.value)}
                  />
                </div>

                {sendResult && (
                  <div className="text-xs font-medium px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sendResult}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const clean   = contact.phone.replace(/\D/g, '');
                      const encoded = encodeURIComponent(editableMsg);
                      window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`, '_blank');
                      setSendResult(`✓ WhatsApp aberto para ${contact.name}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, #25D366, #1da851)' }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Abrir WhatsApp
                  </button>

                  {!isLast ? (
                    <button
                      onClick={() => {
                        setWaQueueIndex(i => i + 1);
                        setSendResult(null);
                        setEditableMsg(buildMessage(msgTemplate, getDispatchTargets()));
                      }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'linear-gradient(135deg, #0D4E96, #0a3d78)' }}
                    >
                      Próximo →
                    </button>
                  ) : (
                    <button
                      onClick={() => { 
                        setIsWaOpen(false); 
                        setWaQueueIndex(0); 
                        setSendResult(null);
                        setSelectedIds([]); // Fix ponto 1: limpa seleção após concluir
                        setEditableMsg('')
                       }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" /> Concluir
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { setWaQueueIndex(0); setSendResult(null); }}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Voltar para configuração
                </button>
              </div>
            );
          })()}
        </>
      )}
    </div>
  </Modal>
)}

      {/* ── Modal Add manual ── */}
      {showForm && (
        <Modal title="Adicionar ao Buffer" onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
  <Field label="ID do POC *">
    <input className={INPUT} value={form.poc_external_id} placeholder="Ex: 99536"
      onChange={e => setForm(p => ({ ...p, poc_external_id: e.target.value }))} />
  </Field>
  <Field label="Nome do POC *">
    <input className={INPUT} value={form.poc_name} placeholder="Nome do estabelecimento"
      onChange={e => setForm(p => ({ ...p, poc_name: e.target.value }))} />
  </Field>
</div>
<div className="grid grid-cols-2 gap-4">
  <Field label="Telefone do cliente">
    <input className={INPUT} value={form.poc_phone} placeholder="Ex: 81 9 9999-0000"
      onChange={e => setForm(p => ({ ...p, poc_phone: e.target.value }))} />
  </Field>
  <Field label="Setor">
  <div className="relative">
    <button
      type="button"
      onClick={() => setSectorOpen(p => !p)}
      className={`${INPUT} text-left flex items-center justify-between`}
    >
      <span className={form.sector_code ? 'text-slate-800' : 'text-slate-400'}>
        {form.sector_code
          ? `Setor ${form.sector_code}${getVendedor(form.sector_code) ? ` — ${getVendedor(form.sector_code)}` : ''}`
          : 'Sem setor'}
      </span>
      <svg className={`w-4 h-4 text-slate-400 transition-transform ${sectorOpen ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {sectorOpen && (
      <>
        <div className="fixed inset-0 z-10" onClick={() => setSectorOpen(false)} />
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          <button
            type="button"
            onClick={() => { setForm(p => ({ ...p, sector_code: '' })); setSectorOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            Sem setor
          </button>
          {uniqueSectors.map(s => {
            const v = getVendedor(s);
            const isSelected = form.sector_code === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setForm(p => ({ ...p, sector_code: s })); setSectorOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Setor {s}{v ? ` — ${v}` : ''}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </>
    )}
  </div>
</Field>
</div>
<div className="grid grid-cols-2 gap-4">
  <Field label="Data original *">
    <input type="date" className={INPUT} value={form.original_date}
      onChange={e => setForm(p => ({ ...p, original_date: e.target.value }))} />
  </Field>
  <Field label="Agendar para">
    <input type="date" className={INPUT} value={form.scheduled_date} min={form.original_date}
      onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
  </Field>
</div>

<Field label="Volume (hl)">
  <input type="number" step="0.001" min="0" className={INPUT} value={form.volume_hl}
    placeholder="0.000" onChange={e => setForm(p => ({ ...p, volume_hl: e.target.value }))} />
</Field>
            <Field label="Prioridade">
              <select className={INPUT} value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}>
                <option value="">Selecione...</option>
                  <option value="1">1 - Prioridade Alta - Reprogramado</option>
                  <option value="2">2 - Prioridade Baixa - Fora de Rota</option>
                  <option value="3">3 - Alta Demanda</option>
                  <option value="4">4 - AS</option>
                </select>
            </Field>
            <Field label="Notas">
              <textarea className={`${INPUT} resize-none`} rows={2} value={form.notes}
                placeholder="Observações..." onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </Field>
            <ModalActions onConfirm={handleSubmit} onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              saving={saving} disabled={!form.poc_external_id.trim() || !form.poc_name.trim()} confirmLabel="Salvar" />
          </div>
        </Modal>
      )}

      {/* ── Modal Agendar ── */}
      {scheduleTarget && (
        <Modal title={`Agendar — ${scheduleTarget.poc_name}`} onClose={() => setScheduleTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Defina a data de entrega para este POC.</p>
            <Field label="Data agendada *">
              <input type="date" className={INPUT} value={scheduledDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setScheduledDate(e.target.value)} />
            </Field>
            <ModalActions onConfirm={handleSchedule} onCancel={() => setScheduleTarget(null)}
              saving={saving} disabled={!scheduledDate} confirmLabel="Confirmar" />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors">
            ✕
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ onConfirm, onCancel, saving, disabled, confirmLabel }: {
  onConfirm: () => void; onCancel: () => void;
  saving: boolean; disabled: boolean; confirmLabel: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onConfirm} disabled={saving || disabled}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
        style={{ background: 'linear-gradient(135deg, #EA9C2F, #d4870a)' }}>
        {saving ? 'Salvando...' : confirmLabel}
      </button>
      <button onClick={onCancel}
        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
        Cancelar
      </button>
    </div>
  );
}

function IconBtn({ icon, title, color, onClick }: {
  icon: React.ReactNode; title: string;
  color: 'blue' | 'green' | 'red' | 'gray'; onClick: () => void;
}) {
  const cls = {
    blue:  'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50',
    green: 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50',
    red:   'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
    gray:  'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
  }[color];
  return (
    <button title={title} onClick={onClick} className={`p-2 rounded-xl transition-colors ${cls}`}>
      {icon}
    </button>
  );
}