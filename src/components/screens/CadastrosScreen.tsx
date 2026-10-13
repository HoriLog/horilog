import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useVehicles }    from '../../hooks/useVehicles';
import type { TeamMemberSchedule, VehicleTelemetry } from '../../types';

type Tab = 'motoristas' | 'ajudantes' | 'placas';

const MOTORISTA_ROLES: TeamMemberSchedule['role'][] = ['Motorista Titular', 'Motorista Reserva'];
const AJUDANTE_ROLES:  TeamMemberSchedule['role'][] = ['Ajudante de Carga', 'Conferente Externo'];

const VEHICLE_CATEGORIES = ['ROTA', 'VAN', 'FRETEIRO', 'EMPILHADEIRA GLP', 'PALETEIRA MANUAL'];
const CNH_CATEGORIES     = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ─── Tipos de formulário ──────────────────────────────────────────────────────

interface MemberForm {
  name:         string;
  role:         TeamMemberSchedule['role'];
  phone:        string;
  cnhNumber:    string;
  cnhCategory:  string;
}

interface VehicleForm {
  plate:    string;
  model:    string;
  category: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CadastrosScreen() {
  const {
    teamMembers, loading: loadingTeam,
    addMember, editMember, removeMember,
  } = useTeamMembers();

  const {
    vehicles, loading: loadingVeh,
    addVehicle, editVehicle, removeVehicle,
  } = useVehicles();

  const [tab, setTab] = useState<Tab>('motoristas');

  const motoristas = teamMembers.filter(m => MOTORISTA_ROLES.includes(m.role));
  const ajudantes  = teamMembers.filter(m => AJUDANTE_ROLES.includes(m.role));

  if (loadingTeam || loadingVeh) return <Spinner />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Cadastros</h1>
        <p className="text-sm text-gray-500 mt-0.5">Motoristas, ajudantes e placas</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'motoristas' as Tab, label: `Motoristas (${motoristas.length})` },
          { key: 'ajudantes'  as Tab, label: `Ajudantes (${ajudantes.length})`   },
          { key: 'placas'     as Tab, label: `Placas (${vehicles.length})`        },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'motoristas' && (
        <MembersSection
          members={motoristas}
          defaultRole="Motorista Titular"
          roleOptions={MOTORISTA_ROLES}
          showCnh
          onAdd={addMember}
          onEdit={editMember}
          onRemove={removeMember}
        />
      )}

      {tab === 'ajudantes' && (
        <MembersSection
          members={ajudantes}
          defaultRole="Ajudante de Carga"
          roleOptions={AJUDANTE_ROLES}
          showCnh={false}
          onAdd={addMember}
          onEdit={editMember}
          onRemove={removeMember}
        />
      )}

      {tab === 'placas' && (
        <VehiclesSection
          vehicles={vehicles}
          onAdd={addVehicle}
          onEdit={editVehicle}
          onRemove={removeVehicle}
        />
      )}
    </div>
  );
}

// ─── MembersSection ───────────────────────────────────────────────────────────

function MembersSection({
  members, defaultRole, roleOptions, showCnh, onAdd, onEdit, onRemove,
}: {
  members:      TeamMemberSchedule[];
  defaultRole:  TeamMemberSchedule['role'];
  roleOptions:  TeamMemberSchedule['role'][];
  showCnh:      boolean;
  onAdd:        (input: { name: string; role: TeamMemberSchedule['role']; phone?: string; cnhNumber?: string }) => Promise<void>;
  onEdit:       (id: string, patch: { name?: string; phone?: string | null; cnh_number?: string | null; cnh_category?: string | null }) => Promise<void>;
  onRemove:     (id: string) => Promise<void>;
}) {
  const emptyForm: MemberForm = { name: '', role: defaultRole, phone: '', cnhNumber: '', cnhCategory: '' };

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<MemberForm>(emptyForm);
  const [editing,  setEditing]  = useState<TeamMemberSchedule | null>(null);
  const [saving,   setSaving]   = useState(false);

  function openAdd()  { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(m: TeamMemberSchedule) {
    setEditing(m);
    setForm({
      name:        m.name,
      role:        m.role,
      phone:       m.phone ?? '',
      cnhNumber:   m.cnhNumber ?? '',
      cnhCategory: m.cnhCategory ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await onEdit(editing.id, {
          name:         form.name.trim(),
          phone:        form.phone.trim() || null,
          cnh_number:   showCnh ? (form.cnhNumber.trim() || null) : undefined,
          cnh_category: showCnh ? (form.cnhCategory || null)      : undefined,
        });
      } else {
        await onAdd({
          name:      form.name.trim(),
          role:      form.role,
          phone:     form.phone.trim() || undefined,
          cnhNumber: showCnh ? (form.cnhNumber.trim() || undefined) : undefined,
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(m: TeamMemberSchedule) {
    if (!confirm(`Remover ${m.name}?`)) return;
    await onRemove(m.id);
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showCnh ? 'Novo motorista' : 'Novo ajudante'}
        </button>
      </div>

      {members.length === 0 ? (
        <Empty label={`Nenhum ${showCnh ? 'motorista' : 'ajudante'} cadastrado.`} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <TH>Nome</TH>
                <TH>Função</TH>
                {showCnh && <><TH>CNH</TH><TH>Categoria</TH></>}
                <TH>Telefone</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <TD className="font-medium text-gray-900">{m.name}</TD>
                  <TD className="text-gray-600">{m.role}</TD>
                  {showCnh && (
                    <>
                      <TD className="text-gray-600">{m.cnhNumber   ?? <Dash />}</TD>
                      <TD className="text-gray-600">{m.cnhCategory ?? <Dash />}</TD>
                    </>
                  )}
                  <TD className="text-gray-600">{m.phone ?? <Dash />}</TD>
                  <TD>
                    <div className="flex gap-1 justify-end">
                      <IconBtn icon={<Pencil className="w-4 h-4" />} title="Editar"  color="blue" onClick={() => openEdit(m)} />
                      <IconBtn icon={<Trash2  className="w-4 h-4" />} title="Remover" color="red"  onClick={() => handleRemove(m)} />
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Editar cadastro' : (showCnh ? 'Novo motorista' : 'Novo ajudante')} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <Field label="Nome *">
              <input className={INPUT} value={form.name} placeholder="Nome completo"
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Função">
              <select className={INPUT} value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as TeamMemberSchedule['role'] }))}>
                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            {showCnh && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nº CNH">
                  <input className={INPUT} value={form.cnhNumber} placeholder="Número"
                    onChange={e => setForm(p => ({ ...p, cnhNumber: e.target.value }))} />
                </Field>
                <Field label="Categoria">
                  <select className={INPUT} value={form.cnhCategory}
                    onChange={e => setForm(p => ({ ...p, cnhCategory: e.target.value }))}>
                    <option value="">Selecione</option>
                    {CNH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            )}
            <Field label="Telefone">
              <input className={INPUT} value={form.phone} placeholder="(81) 9 0000-0000"
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Actions onConfirm={handleSubmit} onCancel={() => setShowForm(false)}
              saving={saving} disabled={!form.name.trim()}
              label={editing ? 'Salvar' : 'Cadastrar'} />
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── VehiclesSection ──────────────────────────────────────────────────────────

function VehiclesSection({
  vehicles, onAdd, onEdit, onRemove,
}: {
  vehicles:  VehicleTelemetry[];
  onAdd:     (input: { plate: string; model: string; category: string }) => Promise<void>;
  onEdit:    (id: string, patch: { plate?: string; model?: string; category?: string; type?: string }) => Promise<void>;
  onRemove:  (id: string) => Promise<void>;
}) {
  const empty: VehicleForm = { plate: '', model: '', category: 'ROTA' };

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<VehicleForm>(empty);
  const [editing,  setEditing]  = useState<VehicleTelemetry | null>(null);
  const [saving,   setSaving]   = useState(false);

  function openAdd() { setEditing(null); setForm(empty); setShowForm(true); }
  function openEdit(v: VehicleTelemetry) {
    setEditing(v);
    setForm({ plate: v.plate, model: v.model, category: v.category ?? v.type });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.plate.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await onEdit(editing.id, {
          plate:    form.plate.trim().toUpperCase(),
          model:    form.model.trim(),
          category: form.category,
          type:     form.category,
        });
      } else {
        await onAdd({
          plate:    form.plate.trim().toUpperCase(),
          model:    form.model.trim(),
          category: form.category,
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(v: VehicleTelemetry) {
    if (!confirm(`Remover veículo ${v.plate}?`)) return;
    await onRemove(v.id);
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Nova placa
        </button>
      </div>

      {vehicles.length === 0 ? (
        <Empty label="Nenhum veículo cadastrado." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <TH>Placa</TH><TH>Modelo</TH><TH>Categoria</TH><TH>Status</TH><TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <TD className="font-mono font-medium text-gray-900">{v.plate}</TD>
                  <TD className="text-gray-600">{v.model}</TD>
                  <TD className="text-gray-600">{v.category ?? v.type}</TD>
                  <TD>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.status === 'Em Rota'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {v.status}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex gap-1 justify-end">
                      <IconBtn icon={<Pencil className="w-4 h-4" />} title="Editar"  color="blue" onClick={() => openEdit(v)} />
                      <IconBtn icon={<Trash2  className="w-4 h-4" />} title="Remover" color="red"  onClick={() => handleRemove(v)} />
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Editar veículo' : 'Novo veículo'} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Placa *">
                <input className={INPUT} value={form.plate} placeholder="ABC-1D23" maxLength={8}
                  onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))} />
              </Field>
              <Field label="Categoria">
                <select className={INPUT} value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {VEHICLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Modelo">
              <input className={INPUT} value={form.model} placeholder="Ex: Mercedes Atego"
                onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
            </Field>
            <Actions onConfirm={handleSubmit} onCancel={() => setShowForm(false)}
              saving={saving} disabled={!form.plate.trim()}
              label={editing ? 'Salvar' : 'Cadastrar'} />
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Componentes utilitários ──────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-center py-16 text-gray-400 text-sm">{label}</div>;
}

function Dash() { return <span className="text-gray-300">—</span>; }

function TH({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
      {children}
    </th>
  );
}

function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function Actions({ onConfirm, onCancel, saving, disabled, label }: {
  onConfirm: () => void; onCancel: () => void;
  saving: boolean; disabled: boolean; label: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onConfirm} disabled={saving || disabled}
        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {saving ? 'Salvando...' : label}
      </button>
      <button onClick={onCancel}
        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
        Cancelar
      </button>
    </div>
  );
}

function IconBtn({ icon, title, color, onClick }: {
  icon: React.ReactNode; title: string;
  color: 'blue' | 'red'; onClick: () => void;
}) {
  const cls = color === 'blue'
    ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'
    : 'text-red-400 hover:text-red-600 hover:bg-red-50';
  return (
    <button title={title} onClick={onClick} className={`p-1.5 rounded-md transition-colors ${cls}`}>
      {icon}
    </button>
  );
}