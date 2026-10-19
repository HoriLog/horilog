import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Edit3,
  Trash2,
  AlertTriangle,
  Truck,
  PhoneCall,
  Users,
  Lock,
  KeyRound,
  User,
  Phone,
  FileText,
  Building,
  Briefcase,
  Clock,
  BadgeCheck,
  X
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export type UserRole = 'operador' | 'supervisor' | 'logistica' | 'gerencia' | 'master';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  cdd_unit: string;
  active: boolean;
  cpf?: string;
  phone?: string;
  job_title?: string;
  registration_number?: string;
  department?: string;
  work_shift?: string;
  buffer_access?: boolean;
  created_at?: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity_hl: number;
  status: 'DISPONIVEL' | 'EM_ROTA' | 'MANUTENCAO';
}

interface TeamContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  sector: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  operador:   'Operador',
  supervisor: 'Supervisor',
  logistica:  'Logística',
  gerencia:   'Gerência',
  master:     'Master / Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  operador:   'bg-slate-100 text-slate-700 border-slate-200',
  supervisor: 'bg-amber-50 text-amber-700 border-amber-200',
  logistica:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  gerencia:   'bg-orange-50 text-orange-700 border-orange-200',
  master:     'bg-purple-50 text-purple-700 border-purple-200',
};

const INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all duration-200';

const EMPTY_USER_FORM = {
  email: '',
  full_name: '',
  role: 'operador' as UserRole,
  cdd_unit: 'CDD Caruaru',
  active: true,
  cpf: '',
  phone: '',
  job_title: '',
  registration_number: '',
  department: 'Operações Logísticas',
  work_shift: 'Diurno (Comercial)',
  buffer_access: true,
};

export function CadastrosScreen() {
  const { profile: currentUser } = useAuth();
  
  const isGerencia = 
    currentUser?.role === 'gerencia' || 
    currentUser?.role === 'supervisor' || 
    (currentUser?.role as string) === 'master';

  // ── Abas Principais do Centro de Cadastros ──
  const [activeTab, setActiveTab] = useState<'usuarios' | 'permissoes' | 'veiculos' | 'supervisores'>('usuarios');

  // ── Abas Internas do Modal de Usuário ──
  const [modalTab, setModalTab] = useState<'pessoal' | 'acesso' | 'operacional'>('pessoal');

  // ── Estados: Usuários ──
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);

  // ── Estados: Veículos & Frota ──
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', plate: 'KGI-7820', model: 'Volkswagen Delivery 13.160', capacity_hl: 120.5, status: 'DISPONIVEL' },
    { id: '2', plate: 'PEW-4912', model: 'Mercedes-Benz Atego 1719', capacity_hl: 180.0, status: 'EM_ROTA' },
    { id: '3', plate: 'RXQ-9231', model: 'Hyundai HR 2.5', capacity_hl: 45.0, status: 'MANUTENCAO' },
  ]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plate: '', model: '', capacity_hl: '', status: 'DISPONIVEL' as const });

  // ── Estados: Supervisores & Contatos ──
  const [contacts, setContacts] = useState<TeamContact[]>([
    { id: '1', name: 'Felipe Ferreira', role: 'Supervisor Operacional', phone: '5581996268171', sector: 'Logística / CDD' },
    { id: '2', name: 'Carlos Eduardo', role: 'Gerência CDD', phone: '5581988881111', sector: 'Diretoria' },
  ]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', role: '', phone: '', sector: '' });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Carregar Usuários do Supabase ──
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (err) throw err;
      setUsers(data || []);
    } catch (err) {
      // Fallback seguro de dados
      setUsers([
        { 
          id: '1', 
          email: 'felipe.silva@grupohorizonte.com.br', 
          full_name: 'Felipe Silva', 
          role: 'gerencia', 
          cdd_unit: 'CDD Caruaru', 
          active: false,
          cpf: '109.876.543-21',
          phone: '5581996268171',
          job_title: 'Gerente Operacional',
          department: 'Gerência de Logística',
          registration_number: 'HORI-4092'
        },
        { 
          id: '2', 
          email: 'carlos.eduardo@horilog.com', 
          full_name: 'Carlos Eduardo', 
          role: 'master', 
          cdd_unit: 'CDD Caruaru', 
          active: true,
          cpf: '222.333.444-55',
          phone: '5581988881111',
          job_title: 'Administrador ERP',
          department: 'Tecnologia & Processos'
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const masterUsers = users.filter(u => u.role === 'master' || u.role === 'gerencia');

  // ── Abrir Modal Novo Usuário ──
  function handleOpenCreateUser(defaultRole: UserRole = 'operador') {
    setEditingUser(null);
    setUserForm({ ...EMPTY_USER_FORM, role: defaultRole });
    setModalTab('pessoal');
    setShowUserModal(true);
  }

  // ── Abrir Modal Editar Usuário ──
  function handleOpenEditUser(user: UserProfile) {
    setEditingUser(user);
    setUserForm({
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role || 'operador',
      cdd_unit: user.cdd_unit || 'CDD Caruaru',
      active: user.active ?? true,
      cpf: user.cpf || '',
      phone: user.phone || '',
      job_title: user.job_title || '',
      registration_number: user.registration_number || '',
      department: user.department || 'Operações Logísticas',
      work_shift: user.work_shift || 'Diurno (Comercial)',
      buffer_access: user.buffer_access ?? true,
    });
    setModalTab('pessoal');
    setShowUserModal(true);
  }

  // ── Salvar Usuário ──
  async function handleSaveUser() {
    if (!userForm.email.trim() || !userForm.full_name.trim()) {
      alert('Preencha os campos obrigatórios: Nome Completo e E-mail.');
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        await supabase.from('profiles').update(userForm).eq('id', editingUser.id);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u));
      } else {
        const newRecord = { id: crypto.randomUUID(), ...userForm, created_at: new Date().toISOString() };
        await supabase.from('profiles').insert([newRecord]);
        setUsers(prev => [newRecord, ...prev]);
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (e: any) {
      alert('Erro ao salvar usuário: ' + (e.message || 'Erro de conexão'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleUserActive(user: UserProfile) {
    const newStatus = !user.active;
    await supabase.from('profiles').update({ active: newStatus }).eq('id', user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
  }

  async function handleDeleteUser(id: string) {
    if (!confirm('Deseja realmente remover este usuário do sistema?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  // ── CRUD Veículos ──
  function handleSaveVehicle() {
    if (!vehicleForm.plate.trim() || !vehicleForm.model.trim()) return;
    const newVeh: Vehicle = {
      id: crypto.randomUUID(),
      plate: vehicleForm.plate.toUpperCase(),
      model: vehicleForm.model,
      capacity_hl: parseFloat(vehicleForm.capacity_hl) || 0,
      status: vehicleForm.status,
    };
    setVehicles(prev => [...prev, newVeh]);
    setShowVehicleModal(false);
    setVehicleForm({ plate: '', model: '', capacity_hl: '', status: 'DISPONIVEL' });
  }

  function handleDeleteVehicle(id: string) {
    if (!confirm('Remover este veículo da frota?')) return;
    setVehicles(prev => prev.filter(v => v.id !== id));
  }

  // ── CRUD Contatos ──
  function handleSaveContact() {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;
    const newContact: TeamContact = { id: crypto.randomUUID(), ...contactForm };
    setContacts(prev => [...prev, newContact]);
    setShowContactModal(false);
    setContactForm({ name: '', role: '', phone: '', sector: '' });
  }

  function handleDeleteContact(id: string) {
    if (!confirm('Remover este contato?')) return;
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header Principal ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">HORILOG — CDD CARUARU</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">Centro de Cadastros & Recursos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestão centralizada de usuários, permissões master, frota e equipes</p>
        </div>

        {/* ── Abas do Cabeçalho ── */}
        <div className="flex bg-slate-100/90 rounded-xl p-1.5 gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'usuarios' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-orange-600" /> Usuários ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('permissoes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'permissoes' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" /> Permissões Master ({masterUsers.length})
          </button>
          
          <button
            onClick={() => setActiveTab('veiculos')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'veiculos' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-orange-600" /> Frota ({vehicles.length})
          </button>

          <button
            onClick={() => setActiveTab('supervisores')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'supervisores' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-orange-600" /> Equipes ({contacts.length})
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. ABA: USUÁRIOS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'usuarios' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Buscar usuário por nome ou e-mail..."
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>
            {isGerencia && (
              <button
                onClick={() => handleOpenCreateUser('operador')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" /> Novo Usuário
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">Colaborador</th>
                      <th className="px-4 py-3.5">E-mail</th>
                      <th className="px-4 py-3.5">Nível de Acesso</th>
                      <th className="px-4 py-3.5">Unidade CDD</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                              {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'US'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user.full_name}</p>
                              <p className="text-xs text-slate-400 font-mono">ID: {user.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium flex items-center gap-1.5 pt-5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role]}`}>
                            <Shield className="w-3 h-3" /> {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">{user.cdd_unit}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {isGerencia && (
                              <>
                                <button title={user.active ? "Inativar" : "Ativar"} onClick={() => handleToggleUserActive(user)}
                                  className={`p-2 rounded-xl transition-colors ${user.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                  {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                                <button title="Editar Usuário" onClick={() => handleOpenEditUser(user)}
                                  className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button title="Excluir" onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. ABA: PERMISSÕES MASTER                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'permissoes' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold">Governança & Níveis Master</h2>
              </div>
              <p className="text-xs text-purple-200 mt-1 max-w-xl">
                Controle restrito de acessos administrativos. Usuários com privilégio Master possuem permissão para reconfigurar parâmetros corporativos e autorizar exceções.
              </p>
            </div>
            <button
              onClick={() => handleOpenCreateUser('master')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-purple-900 bg-white rounded-xl hover:bg-purple-50 transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 text-purple-700" /> Promover / Novo Master
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Credenciais com Privilégio Elevado</span>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                {masterUsers.length} Administrador(es) Ativo(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Administrador Master</th>
                    <th className="px-4 py-3.5">E-mail</th>
                    <th className="px-4 py-3.5">Cargo / Perfil</th>
                    <th className="px-4 py-3.5">Unidade</th>
                    <th className="px-4 py-3.5 text-right">Ações Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {masterUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'MA'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.full_name}</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {user.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">{user.email}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                          <Lock className="w-3 h-3" /> {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">{user.cdd_unit}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditUser(user)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Editar Cadastro
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. ABA: FROTA & VEÍCULOS                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'veiculos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-sm font-semibold text-slate-700">Frota alocada para distribuição e last-mile (CDD Caruaru)</p>
            <button
              onClick={() => setShowVehicleModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Cadastrar Veículo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map(veh => (
              <div key={veh.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 font-mono text-base">{veh.plate}</h4>
                      <p className="text-xs text-slate-500">{veh.model}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteVehicle(veh.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Capacidade</span>
                    <span className="font-bold text-slate-800">{veh.capacity_hl.toFixed(1)} hl</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Status</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${
                      veh.status === 'DISPONIVEL' ? 'bg-emerald-50 text-emerald-700' :
                      veh.status === 'EM_ROTA' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {veh.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. ABA: SUPERVISORES & CONTATOS                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'supervisores' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-sm font-semibold text-slate-700">Contatos de plantão integrados com a Central de Disparos WhatsApp</p>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Novo Contato
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500">{c.role} • <span className="font-mono text-emerald-700">+{c.phone}</span></p>
                  </div>
                </div>
                <button onClick={() => handleDeleteContact(c.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL EXPANDIDO E COMPLETO COM ABAS DE USUÁRIO                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    {editingUser ? `Editar Colaborador — ${editingUser.full_name}` : 'Cadastrar Novo Colaborador'}
                  </h2>
                  <p className="text-xs text-slate-500">Credenciais e parâmetros operacionais do CDD Caruaru</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex bg-slate-100/80 px-6 pt-2 border-b border-slate-200/80 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('pessoal')}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === 'pessoal'
                    ? 'border-orange-600 text-orange-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Dados Pessoais & Contato
              </button>

              <button
                type="button"
                onClick={() => setModalTab('acesso')}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === 'acesso'
                    ? 'border-orange-600 text-orange-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Acesso & Permissões
              </button>

              <button
                type="button"
                onClick={() => setModalTab('operacional')}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === 'operacional'
                    ? 'border-orange-600 text-orange-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Operação & CDD
              </button>
            </div>

            {/* Modal Body / Formulário */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: DADOS PESSOAIS */}
              {modalTab === 'pessoal' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Nome Completo *
                    </label>
                    <input
                      className={INPUT_CLASS}
                      value={userForm.full_name}
                      onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Ex: Felipe Silva"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail Corporativo *
                      </label>
                      <input
                        type="email"
                        className={INPUT_CLASS}
                        value={userForm.email}
                        onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="felipe.silva@grupohorizonte.com.br"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Telefone / WhatsApp
                      </label>
                      <input
                        className={INPUT_CLASS}
                        value={userForm.phone}
                        onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="5581999999999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> CPF
                      </label>
                      <input
                        className={INPUT_CLASS}
                        value={userForm.cpf}
                        onChange={e => setUserForm(p => ({ ...p, cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-slate-400" /> Matrícula Corporativa
                      </label>
                      <input
                        className={INPUT_CLASS}
                        value={userForm.registration_number}
                        onChange={e => setUserForm(p => ({ ...p, registration_number: e.target.value }))}
                        placeholder="Ex: HORI-4092"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACESSO & PERMISSÕES */}
              {modalTab === 'acesso' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Nível de Acesso (Role) *</label>
                      <select
                        className={INPUT_CLASS}
                        value={userForm.role}
                        onChange={e => setUserForm(p => ({ ...p, role: e.target.value as UserRole }))}
                      >
                        <option value="operador">Operador (Entradas & Buffer)</option>
                        <option value="supervisor">Supervisor (Aprovações & WhatsApp)</option>
                        <option value="logistica">Logística (Controle de Rotas)</option>
                        <option value="gerencia">Gerência (Acesso Geral)</option>
                        <option value="master">Master / Admin (Controle Total)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Unidade CDD</label>
                      <input className={INPUT_CLASS} value={userForm.cdd_unit} disabled />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="user_active_modal"
                        checked={userForm.active}
                        onChange={e => setUserForm(p => ({ ...p, active: e.target.checked }))}
                        className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                      />
                      <label htmlFor="user_active_modal" className="text-xs font-bold text-slate-800 cursor-pointer">
                        Acesso Ativo no Sistema
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Desmarcar esta opção bloqueia imediatamente a autenticação do usuário no HoriLog ERP.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="buffer_access_modal"
                        checked={userForm.buffer_access}
                        onChange={e => setUserForm(p => ({ ...p, buffer_access: e.target.checked }))}
                        className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                      />
                      <label htmlFor="buffer_access_modal" className="text-xs font-bold text-slate-800 cursor-pointer">
                        Permissão de Edição no Buffer de Entregas
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Permite alterar datas, prioridades e disparar alertas de reagendamento para supervisores.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: OPERAÇÃO & CDD */}
              {modalTab === 'operacional' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Cargo / Função
                      </label>
                      <input
                        className={INPUT_CLASS}
                        value={userForm.job_title}
                        onChange={e => setUserForm(p => ({ ...p, job_title: e.target.value }))}
                        placeholder="Ex: Supervisor Operacional"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> Setor
                      </label>
                      <input
                        className={INPUT_CLASS}
                        value={userForm.department}
                        onChange={e => setUserForm(p => ({ ...p, department: e.target.value }))}
                        placeholder="Ex: Operações Logísticas"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Turno de Trabalho
                    </label>
                    <select
                      className={INPUT_CLASS}
                      value={userForm.work_shift}
                      onChange={e => setUserForm(p => ({ ...p, work_shift: e.target.value }))}
                    >
                      <option value="Diurno (Comercial)">Diurno (Comercial)</option>
                      <option value="Turno 1 (06:00 - 14:00)">Turno 1 (06:00 - 14:00)</option>
                      <option value="Turno 2 (14:00 - 22:00)">Turno 2 (14:00 - 22:00)</option>
                      <option value="Turno Noturno">Turno Noturno</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={handleSaveUser}
                disabled={saving || !userForm.email.trim() || !userForm.full_name.trim()}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-sm shadow-orange-500/20"
              >
                {saving ? 'Salvando...' : 'Salvar Colaborador'}
              </button>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-6 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VEÍCULOS                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showVehicleModal && (
        <Modal title="Cadastrar Veículo na Frota" onClose={() => setShowVehicleModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Placa *</label>
                <input className={INPUT_CLASS} value={vehicleForm.plate} onChange={e => setVehicleForm(p => ({ ...p, plate: e.target.value }))} placeholder="Ex: ABC-1234" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Capacidade (hl) *</label>
                <input type="number" step="0.1" className={INPUT_CLASS} value={vehicleForm.capacity_hl} onChange={e => setVehicleForm(p => ({ ...p, capacity_hl: e.target.value }))} placeholder="0.0" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Modelo / Tipo *</label>
              <input className={INPUT_CLASS} value={vehicleForm.model} onChange={e => setVehicleForm(p => ({ ...p, model: e.target.value }))} placeholder="Ex: Volkswagen Delivery" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Status Inicial</label>
              <select className={INPUT_CLASS} value={vehicleForm.status} onChange={e => setVehicleForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="DISPONIVEL">Disponível</option>
                <option value="EM_ROTA">Em Rota</option>
                <option value="MANUTENCAO">Em Manutenção</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveVehicle} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:from-orange-600 transition-all shadow-sm">Cadastrar Veículo</button>
              <button onClick={() => setShowVehicleModal(false)} className="px-5 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CONTATOS                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showContactModal && (
        <Modal title="Cadastrar Supervisor / Contato" onClose={() => setShowContactModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nome Completo *</label>
              <input className={INPUT_CLASS} value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do supervisor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Cargo / Função</label>
                <input className={INPUT_CLASS} value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Supervisor Logístico" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">WhatsApp (com DDI/DDD) *</label>
                <input className={INPUT_CLASS} value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="5581999999999" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveContact} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:from-orange-600 transition-all shadow-sm">Salvar Contato</button>
              <button onClick={() => setShowContactModal(false)} className="px-5 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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