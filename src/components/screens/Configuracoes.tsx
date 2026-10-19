import React, { useEffect, useState } from 'react';
import { Shield, Users, Eye, Check, X, RefreshCw } from 'lucide-react';
import { supabase }        from '../../services/supabaseClient';
import { useAuth }         from '../../hooks/useAuth';
import { usePermissions }  from '../../hooks/usePermissions';

type Role = 'analista' | 'supervisor' | 'gerencia';

interface UserProfile {
  id:        string;
  full_name: string | null;
  role:      Role;
  created_at: string;
}

interface Permission {
  id:       string;
  role:     string;
  resource: string;
  action:   string;
  allowed:  boolean;
}

const ROLE_LABELS: Record<Role, string> = {
  analista:  'Analista',
  supervisor:'Supervisor',
  gerencia:  'Gerência',
};

const ROLE_COLORS: Record<Role, string> = {
  analista:   'bg-blue-50   text-blue-700   border-blue-200',
  supervisor: 'bg-amber-50  text-amber-700  border-amber-200',
  gerencia:   'bg-purple-50 text-purple-700 border-purple-200',
};

type Tab = 'usuarios' | 'permissoes';

export function ConfiguracoesScreen() {
  const { profile }  = useAuth();
  const { can }      = usePermissions();
  const [tab, setTab] = useState<Tab>('usuarios');

  // Usuários
  const [users,      setUsers]      = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingId,   setSavingId]   = useState<string | null>(null);

  // Permissões
  const [perms,      setPerms]      = useState<Permission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const isSupervisor = profile?.role === 'supervisor' || profile?.role === 'gerencia';

  // ── Carregar usuários ──────────────────────────────────────────────────────
  async function loadUsers() {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (!error) setUsers((data as UserProfile[]) ?? []);
    setLoadingUsers(false);
  }

  // ── Carregar permissões ────────────────────────────────────────────────────
  async function loadPerms() {
    setLoadingPerms(true);
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role').order('resource').order('action');
    if (!error) setPerms((data as Permission[]) ?? []);
    setLoadingPerms(false);
  }

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (tab === 'permissoes') loadPerms(); }, [tab]);

  // ── Alterar role do usuário ────────────────────────────────────────────────
  async function handleRoleChange(userId: string, newRole: Role) {
    if (!can('contacts', 'update')) return;
    setSavingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setSavingId(null);
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  // ── Matriz de permissões ───────────────────────────────────────────────────
  const resources = [...new Set(perms.map(p => p.resource))].sort();
  const actions   = [...new Set(perms.map(p => p.action))].sort();
  const roles     = ['analista', 'supervisor', 'gerencia'] as Role[];

  function isAllowed(role: string, resource: string, action: string): boolean {
    return perms.some(p =>
      p.role === role && p.resource === resource && p.action === action && p.allowed
    );
  }

  if (!isSupervisor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <Shield className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-medium">Acesso restrito a supervisores e gerência.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configurações do Sistema</h1>
          <p className="text-sm text-slate-500 mt-0.5">Usuários, roles e matriz de permissões</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'usuarios'   as Tab, label: 'Usuários',    icon: Users  },
          { key: 'permissoes' as Tab, label: 'Permissões',  icon: Shield },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Usuários ── */}
      {tab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Usuários do Sistema</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Para convidar novos usuários, use o painel do Supabase → Authentication → Users
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center text-sm text-slate-400">Carregando usuários...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Usuário', 'Role Atual', 'Desde', 'Alterar Role'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase"
                          style={{ background: 'rgba(13,78,150,0.1)', color: '#0D4E96' }}
                        >
                          {(u.full_name ?? 'US').substring(0, 2)}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {u.full_name ?? 'Sem nome'}
                          {u.id === profile?.id && (
                            <span className="ml-2 text-[10px] font-bold text-slate-400">(você)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      {u.id === profile?.id ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <div className="flex gap-1.5">
                          {roles.map(r => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(u.id, r)}
                              disabled={savingId === u.id || u.role === r}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                u.role === r
                                  ? ROLE_COLORS[r]
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              } disabled:opacity-60`}
                            >
                              {savingId === u.id && u.role !== r ? '...' : ROLE_LABELS[r]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Permissões ── */}
      {tab === 'permissoes' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Matriz de Permissões</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Leitura da tabela <code className="bg-slate-100 px-1 rounded">role_permissions</code>
            </p>
          </div>

          {loadingPerms ? (
            <div className="p-8 text-center text-sm text-slate-400">Carregando permissões...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wide">Recurso</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wide">Ação</th>
                    {roles.map(r => (
                      <th key={r} className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[r]}`}>
                          {ROLE_LABELS[r]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {resources.map(resource =>
                    actions.map(action => {
                      const hasAny = roles.some(r => perms.some(
                        p => p.role === r && p.resource === resource && p.action === action
                      ));
                      if (!hasAny) return null;
                      return (
                        <tr key={`${resource}-${action}`} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-mono text-slate-600 font-medium">{resource}</td>
                          <td className="px-4 py-2.5 text-slate-500">{action}</td>
                          {roles.map(r => (
                            <td key={r} className="px-4 py-2.5 text-center">
                              {isAllowed(r, resource, action)
                                ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                : <X     className="w-4 h-4 text-slate-200  mx-auto" />}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[11px] text-slate-400">
              Para editar permissões, acesse diretamente a tabela <code className="bg-slate-100 px-1 rounded">role_permissions</code> no Supabase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}