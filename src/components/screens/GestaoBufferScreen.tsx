import React, { useState } from 'react';
import { Plus, Calendar, CheckCircle, XCircle, Trash2 } from 'lucide-react';
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
  PENDING:   'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-blue-100   text-blue-800',
  DELIVERED: 'bg-green-100  text-green-800',
  CANCELLED: 'bg-gray-100   text-gray-500',
};

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
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

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

  async function handleSubmit() {
    if (!form.poc_external_id.trim() || !form.poc_name.trim() || !form.original_date) return;
    setSaving(true);
    try {
      await addEntry({
        poc_external_id: form.poc_external_id.trim(),
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
  if (error)   return <p className="p-6 text-sm text-red-600">{error}</p>;

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Buffer de Entregas</h1>
          <p className="text-sm text-gray-500 mt-0.5">POCs sem mapa atribuído — aguardando rota</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar ao Buffer
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: counts.total,     color: 'bg-gray-50   text-gray-700'   },
          { label: 'Pendentes', value: counts.pending,   color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Agendados', value: counts.scheduled, color: 'bg-blue-50   text-blue-700'   },
          { label: 'Entregues', value: counts.delivered, color: 'bg-green-50  text-green-700'  },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-4 ${k.color}`}>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs font-medium mt-1 opacity-75">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['ALL', 'PENDING', 'SCHEDULED', 'DELIVERED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por POC..."
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {statusFilter === 'ALL' && !search
            ? 'Nenhum POC em buffer no momento.'
            : 'Nenhum resultado para os filtros aplicados.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['POC', 'Data Original', 'Agendado Para', 'Volume (hl)', 'Motivo', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{entry.poc_name}</p>
                    <p className="text-xs text-gray-400">{entry.poc_external_id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(entry.original_date)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.scheduled_date
                      ? fmtDate(entry.scheduled_date)
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.volume_hl != null
                      ? entry.volume_hl.toFixed(3)
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{orDash(entry.reason)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Adicionar ── */}
      {showForm && (
        <Modal title="Adicionar ao Buffer" onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="ID do POC *">
                <input className={INPUT_CLASS} value={form.poc_external_id}
                  onChange={e => setForm(p => ({ ...p, poc_external_id: e.target.value }))}
                  placeholder="Ex: 123456" />
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
                  placeholder="Ex: Alta demanda"
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </Field>
            </div>
            <Field label="Notas">
              <textarea className={`${INPUT_CLASS} resize-none`} rows={2} value={form.notes}
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
            <p className="text-sm text-gray-500">
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
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
        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Salvando...' : confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
    blue:  'text-blue-400 hover:text-blue-600 hover:bg-blue-50',
    green: 'text-green-400 hover:text-green-600 hover:bg-green-50',
    red:   'text-red-400 hover:text-red-600 hover:bg-red-50',
    gray:  'text-gray-300 hover:text-gray-500 hover:bg-gray-100',
  }[color];
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${cls}`}>
      {icon}
    </button>
  );
}