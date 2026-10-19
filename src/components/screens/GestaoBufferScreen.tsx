import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  MessageSquare,
  Search,
  Filter,
  AlertTriangle,
  Send,
  User,
  FileText,
  CheckSquare,
  Square,
  Upload
} from 'lucide-react';
import { useBuffer } from '../../hooks/useBuffer';
import { useAuth } from '../../hooks/useAuth';
import type { BufferEntry, BufferStatus } from '../../types';
import { orDash } from '../../utils/format';

type StatusFilter = 'ALL' | BufferStatus;

const STATUS_LABELS: Record<BufferStatus, string> = {
  PENDING:   'Pendente',
  SCHEDULED: 'Agendado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<BufferStatus, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200/80 font-medium',
  SCHEDULED: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
  CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200 font-medium',
};

// ── Contatos Reais de Supervisores / Operação (CDD Caruaru) ──
interface LogisticsContact {
  id: string;
  name: string;
  role: string;
  phone: string; // Formato internacional sem símbolos, ex: 5581999999999
}

const LOGISTICS_CONTACTS: LogisticsContact[] = [
  { id: '1', name: 'Felipe Ferreira (Supervisão Operacional)', role: 'Supervisor', phone: '5581996268171' },
  { id: '2', name: 'Supervisão de Logística - CDD Caruaru', role: 'Logística', phone: '5581988882222' },
  { id: '3', name: 'Equipe Comercial / Vendas', role: 'Comercial', phone: '5581988883333' },
];

interface FormState {
  poc_external_id: string;
  poc_name:        string;
  original_date:   string;
  scheduled_date:  string;
  volume_hl:       string;
  reason:          string;
  notes:           string;
}

const EMPTY_FORM: FormState = {
  poc_external_id: '',
  poc_name:        '',
  original_date:   new Date().toISOString().slice(0, 10),
  scheduled_date:  '',
  volume_hl:       '',
  reason:          '',
  notes:           '',
};

const INPUT_CLASS =
  'w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all duration-200';

export function GestaoBufferScreen() {
  const { entries, loading, error, addEntry, editEntry, removeEntry } = useBuffer();
  const { profile } = useAuth();
  const isSupervisor =
    profile?.role === 'supervisor' || profile?.role === 'gerencia';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search,       setSearch]       = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);

  // Seleção por Checkbox
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados do Modal de Alertas do WhatsApp e Edição de Mensagem
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedContact, setSelectedContact]         = useState<LogisticsContact>(LOGISTICS_CONTACTS[0]);
  const [messageTemplate, setMessageTemplate]         = useState<'standard' | 'urgent' | 'summary'>('standard');
  const [editableMessage, setEditableMessage]         = useState('');

  // Schedule sub-modal
  const [scheduleTarget, setScheduleTarget] = useState<BufferEntry | null>(null);
  const [scheduledDate,  setScheduledDate]  = useState('');

  const filtered = entries.filter(e => {
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      e.poc_name.toLowerCase().includes(q) ||
      e.poc_external_id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
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

  // ── Tratamento do ID do cliente (Remover prefixo 598) ──
  function formatPocExternalId(rawId: string): string {
    const trimmed = String(rawId || '').trim();
    if (trimmed.startsWith('598') && trimmed.length > 3) {
      return trimmed.substring(3);
    }
    return trimmed;
  }

  // ── Leitor e Importador do Relatório CSV de Pedidos ──
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(';');
        if (cols.length >= 11) {
          const rawCode = cols[9]?.replace(/"/g, '') || '';
          const pocName = cols[10]?.replace(/"/g, '') || 'Cliente sem Nome';
          const volumeStr = cols[2]?.replace(/"/g, '').replace(',', '.') || '0';
          const reasonStr = cols[5]?.replace(/"/g, '') || 'Importado via Relatório';

          const pocExternalId = formatPocExternalId(rawCode);
          const volumeHl = parseFloat(volumeStr) || null;

          if (pocExternalId && pocName) {
            try {
              await addEntry({
                poc_external_id: pocExternalId,
                poc_name: pocName,
                original_date: new Date().toISOString().slice(0, 10),
                scheduled_date: null,
                volume_hl: volumeHl,
                reason: reasonStr,
                notes: 'Importado via relatório CSV de pedidos',
                status: 'PENDING',
                assigned_tour_id: null,
                created_by: profile?.id ?? null,
              });
              successCount++;
            } catch (err) {
              console.error('Erro ao cadastrar entrada do relatório:', err);
            }
          }
        }
      }
      alert(`${successCount} registro(s) importado(s) para o Buffer com sucesso!`);
      e.target.value = '';
    };
    reader.readAsText(file, 'latin1');
  }

  // ── Gerador de Texto Operacional para WhatsApp baseado nas seleções ──
  function generateLogisticsMessage(templateType: 'standard' | 'urgent' | 'summary'): string {
    const targetEntries = selectedIds.length > 0
      ? entries.filter(e => selectedIds.includes(e.id))
      : (filtered.length > 0 ? filtered : entries);

    const todayStr = new Date().toLocaleDateString('pt-BR');

    if (templateType === 'urgent') {
      let text = `🚨 *URGENTE: Alerta de Buffer HoriLog (CDD Caruaru)* 🚚\nData: ${todayStr}\n\n`;
      text += `Atenção equipe, existem *${targetEntries.length}* cliente(s) selecionados exigindo tratativa imediata:\n\n`;
      targetEntries.filter(e => e.status === 'PENDING').slice(0, 10).forEach((e, idx) => {
        text += `${idx + 1}. *[PDV ${e.poc_external_id}]* ${e.poc_name}\n`;
      });
      text += `\n_Favor verificar no sistema o quanto antes._`;
      return text;
    }

    if (templateType === 'summary') {
      let totalVol = targetEntries.reduce((acc, curr) => acc + (curr.volume_hl || 0), 0);
      let text = `📊 *Resumo Operacional - Buffer CDD Caruaru* 📈\nData: ${todayStr}\n\n`;
      text += `• Total de PDVs Selecionados: *${targetEntries.length}*\n`;
      text += `• Volume Total Acumulado: *${totalVol.toFixed(2)} hl*\n\n`;
      text += `_Relatório gerado via HoriLog ERP Enterprise._`;
      return text;
    }

    // Padrão (Standard)
    let text = `*HoriLog — Relatório de Clientes em Buffer (CDD Caruaru)* 🚚\nData: ${todayStr}\n\n`;
    text += `📋 Segue a relação dos clientes selecionados para tratativa:\n\n`;
    targetEntries.forEach((e, idx) => {
      text += `${idx + 1}. *[PDV ${e.poc_external_id}]* ${e.poc_name}\n`;
      text += `   - Status: ${STATUS_LABELS[e.status]}\n`;
      if (e.original_date) text += `   - Data Original: ${fmtDate(e.original_date)}\n`;
      if (e.reason) text += `   - Motivo: ${e.reason}\n`;
      text += `\n`;
    });
    text += `_Favor priorizar o alinhamento comercial e logístico._`;
    return text;
  }

  function handleSelectTemplate(type: 'standard' | 'urgent' | 'summary') {
    setMessageTemplate(type);
    setEditableMessage(generateLogisticsMessage(type));
  }

  function handleOpenWhatsAppModal() {
    setMessageTemplate('standard');
    setEditableMessage(generateLogisticsMessage('standard'));
    setIsWhatsAppModalOpen(true);
  }

  function handleSendWhatsApp() {
    const encoded = encodeURIComponent(editableMessage);
    const phone = selectedContact.phone;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');
    setIsWhatsAppModalOpen(false);
  }

  // Checkbox helpers
  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(e => e.id));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!form.poc_external_id.trim() || !form.poc_name.trim() || !form.original_date) return;
    setSaving(true);
    try {
      const cleanId = formatPocExternalId(form.poc_external_id);
      await addEntry({
        poc_external_id: cleanId,
        poc_name:        form.poc_name.trim(),
        original_date:   form.original_date,
        scheduled_date:  form.scheduled_date || null,
        volume_hl:       form.volume_hl ? parseFloat(form.volume_hl) : null,
        reason:          form.reason.trim() || null,
        notes:           form.notes.trim() || null,
        status:          form.scheduled_date ? 'SCHEDULED' : 'PENDING',
        assigned_tour_id: null,
        created_by:      profile?.id ?? null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule() {
    if (!scheduleTarget || !scheduledDate) return;
    setSaving(true);
    try {
      await editEntry(scheduleTarget.id, { scheduled_date: scheduledDate, status: 'SCHEDULED' });
      setScheduleTarget(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeliver(entry: BufferEntry) {
    await editEntry(entry.id, { status: 'DELIVERED' });
  }

  async function handleCancel(entry: BufferEntry) {
    await editEntry(entry.id, { status: 'CANCELLED' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este registro do buffer?')) return;
    await removeEntry(id);
  }

  if (loading) return <Spinner />;
  if (error)   return <p className="p-6 text-sm text-rose-600 font-medium">{error}</p>;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header Corporativo HoriLog ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">HoriLog — CDD Caruaru</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">Buffer de Entregas</h1>
          <p className="text-sm text-slate-500 mt-0.5">POCs sem mapa atribuído — aguardando reagendamento ou rota</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer">
            <Upload className="w-4 h-4 text-orange-600" />
            Importar Relatório
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleOpenWhatsAppModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Enviar Buffer {selectedIds.length > 0 ? `(${selectedIds.length} selecionados)` : '(Todos)'}
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Adicionar ao Buffer
          </button>
        </div>
      </div>

      {/* ── KPIs Modernos ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total no Buffer', value: counts.total,     cardBg: 'bg-white border-slate-200/80', textNum: 'text-slate-900' },
          { label: 'Pendentes',       value: counts.pending,   cardBg: 'bg-white border-amber-200/80', textNum: 'text-amber-700' },
          { label: 'Agendados',       value: counts.scheduled, cardBg: 'bg-white border-indigo-200/80', textNum: 'text-indigo-700' },
          { label: 'Entregues',       value: counts.delivered, cardBg: 'bg-white border-emerald-200/80', textNum: 'text-emerald-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 border ${k.cardBg} shadow-xs transition-all hover:shadow-md`}>
            <p className="text-xs font-medium text-slate-500 mb-2">{k.label}</p>
            <p className={`text-3xl font-extrabold tracking-tight ${k.textNum}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros e Barra de Busca ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap bg-slate-100/80 rounded-xl p-1 gap-1 w-full md:w-auto">
          {(['ALL', 'PENDING', 'SCHEDULED', 'DELIVERED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID do POC..."
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ── Tabela com Checkboxes ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-600">
              {statusFilter === 'ALL' && !search
                ? 'Nenhum POC em buffer no momento.'
                : 'Nenhum resultado para os filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-800">
                      {selectedIds.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">POC</th>
                  <th className="px-4 py-3.5">Data Original</th>
                  <th className="px-4 py-3.5">Agendado Para</th>
                  <th className="px-4 py-3.5">Volume (hl)</th>
                  <th className="px-4 py-3.5">Motivo</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(entry => {
                  const isSelected = selectedIds.includes(entry.id);
                  return (
                    <tr key={entry.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleSelectOne(entry.id)} className="text-slate-400 hover:text-slate-700">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{entry.poc_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{entry.poc_external_id}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">{fmtDate(entry.original_date)}</td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {entry.scheduled_date
                          ? fmtDate(entry.scheduled_date)
                          : <span className="text-slate-300 font-medium">—</span>}
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {entry.volume_hl != null
                          ? entry.volume_hl.toFixed(3)
                          : <span className="text-slate-300 font-medium">—</span>}
                      </td>
                      <td className="px-4 py-4 text-slate-600 max-w-xs truncate">{orDash(entry.reason)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[entry.status]}`}>
                          {STATUS_LABELS[entry.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {entry.status === 'PENDING' && (
                            <IconBtn
                              icon={<Calendar className="w-4 h-4" />}
                              title="Agendar"
                              color="blue"
                              onClick={() => { setScheduleTarget(entry); setScheduledDate(''); }}
                            />
                          )}
                          {(entry.status === 'PENDING' || entry.status === 'SCHEDULED') && (
                            <IconBtn
                              icon={<CheckCircle className="w-4 h-4" />}
                              title="Marcar como Entregue"
                              color="green"
                              onClick={() => handleDeliver(entry)}
                            />
                          )}
                          {entry.status !== 'CANCELLED' && entry.status !== 'DELIVERED' && (
                            <IconBtn
                              icon={<XCircle className="w-4 h-4" />}
                              title="Cancelar"
                              color="red"
                              onClick={() => handleCancel(entry)}
                            />
                          )}
                          {isSupervisor && (
                            <IconBtn
                              icon={<Trash2 className="w-4 h-4" />}
                              title="Remover"
                              color="gray"
                              onClick={() => handleDelete(entry.id)}
                            />
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

      {/* ── Modal: Central de Disparo de WhatsApp com Mensagem Editável ── */}
      {isWhatsAppModalOpen && (
        <Modal title="Central de Disparo de WhatsApp" onClose={() => setIsWhatsAppModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Selecionar Contato Destinatário *
              </label>
              <select
                className={INPUT_CLASS}
                value={selectedContact.id}
                onChange={e => {
                  const found = LOGISTICS_CONTACTS.find(c => c.id === e.target.value);
                  if (found) setSelectedContact(found);
                }}
              >
                {LOGISTICS_CONTACTS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — [{c.role}] ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-600" /> Template de Mensagem Padronizada
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'standard' as const, label: 'Lista Completa' },
                  { key: 'urgent'   as const, label: 'Alerta Urgente' },
                  { key: 'summary'  as const, label: 'Resumo Operacional' },
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleSelectTemplate(t.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                      messageTemplate === t.key
                        ? 'bg-orange-50 text-orange-800 border-orange-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Mensagem {selectedIds.length > 0 ? `(${selectedIds.length} itens selecionados)` : '(Todos os filtrados)'} - Editável
              </label>
              <textarea
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all resize-none shadow-2xs"
                rows={8}
                value={editableMessage}
                onChange={e => setEditableMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Disparar no WhatsApp
              </button>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-5 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Adicionar Manualmente ── */}
      {showForm && (
        <Modal title="Adicionar ao Buffer" onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="ID do POC *">
                <input className={INPUT_CLASS} value={form.poc_external_id}
                  onChange={e => setForm(p => ({ ...p, poc_external_id: e.target.value }))}
                  placeholder="Ex: 99536" />
              </Field>
              <Field label="Nome do POC *">
                <input className={INPUT_CLASS} value={form.poc_name}
                  onChange={e => setForm(p => ({ ...p, poc_name: e.target.value }))}
                  placeholder="Nome do estabelecimento" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data original *">
                <input type="date" className={INPUT_CLASS} value={form.original_date}
                  onChange={e => setForm(p => ({ ...p, original_date: e.target.value }))} />
              </Field>
              <Field label="Agendar para">
                <input type="date" className={INPUT_CLASS} value={form.scheduled_date}
                  min={form.original_date}
                  onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Volume (hl)">
                <input type="number" step="0.001" min="0" className={INPUT_CLASS}
                  value={form.volume_hl} placeholder="0.000"
                  onChange={e => setForm(p => ({ ...p, volume_hl: e.target.value }))} />
              </Field>
              <Field label="Motivo">
                <input className={INPUT_CLASS} value={form.reason}
                  placeholder="Ex: Prioridade Alta - Reprogramado"
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </Field>
            </div>
            <Field label="Notas">
              <textarea className={`${INPUT_CLASS} resize-none`} rows={3} value={form.notes}
                placeholder="Observações adicionais..."
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </Field>
            <ModalActions
              onConfirm={handleSubmit}
              onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              saving={saving}
              disabled={!form.poc_external_id.trim() || !form.poc_name.trim()}
              confirmLabel="Salvar"
            />
          </div>
        </Modal>
      )}

      {/* ── Modal: Agendar ── */}
      {scheduleTarget && (
        <Modal
          title={`Agendar — ${scheduleTarget.poc_name}`}
          onClose={() => setScheduleTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Defina a data em que este POC será atendido.
            </p>
            <Field label="Data agendada *">
              <input type="date" className={INPUT_CLASS} value={scheduledDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setScheduledDate(e.target.value)} />
            </Field>
            <ModalActions
              onConfirm={handleSchedule}
              onCancel={() => setScheduleTarget(null)}
              saving={saving}
              disabled={!scheduledDate}
              confirmLabel="Confirmar agendamento"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>
  );
}

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
      <button
        onClick={onConfirm}
        disabled={saving || disabled}
        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-sm shadow-orange-500/25"
      >
        {saving ? 'Salvando...' : confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
      >
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
    blue:  'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50',
    green: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50',
    red:   'text-rose-600 hover:text-rose-800 hover:bg-rose-50',
    gray:  'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
  }[color];
  return (
    <button title={title} onClick={onClick}
      className={`p-2 rounded-xl transition-colors ${cls}`}>
      {icon}
    </button>
  );
}