import React from 'react';
import {
  PackageCheck,
  RotateCcw,
  Clock,
  BookUser,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth }    from '../../hooks/useAuth';
import { supabase }   from '../../services/supabaseClient';

export interface SidebarProps {
  activeTab:        string;
  onSelectTab:      (tabId: string) => void;
  isOpenMobile:     boolean;
  onCloseMobile:    () => void;
  isCollapsed:      boolean;
  onToggleCollapse: () => void;
}

const NAV = [
  {
    section: 'Cadastros',
    items: [
      { id: 'cadastros', label: 'Cadastros', icon: BookUser },
    ],
  },
  {
    section: 'Operações',
    items: [
      { id: 'buffer',           label: 'Buffer',               icon: Clock        },
      { id: 'gestao-entregas',  label: 'Gestão de Entregas',   icon: PackageCheck },
      { id: 'gestao-devolucao', label: 'Gestão de Devoluções', icon: RotateCcw    },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { id: 'configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

// ── Logo inline (versão compacta do SVG da marca) ────────────────────────────
function HorizonLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden min-w-0">
      {/* Ícone H em paralelogramos — inspirado no SVG da marca */}
      <svg
        viewBox="0 0 36 40"
        className="w-9 h-9 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Coluna esquerda — Cyan */}
        <polygon points="6,2 14,2 10,38 2,38" fill="#2CA1D3" />
        {/* Coluna direita — Azul Horizonte */}
        <polygon points="18,2 26,2 22,38 14,38" fill="#0D4E96" />
        {/* Barra horizontal — Laranja */}
        <rect x="2" y="17" width="28" height="5" rx="1"
          fill="#EA9C2F" transform="skewX(-8)" />
      </svg>

      {!collapsed && (
        <div className="flex flex-col leading-tight truncate">
          <span
            className="text-sm font-black tracking-wide uppercase truncate"
            style={{ color: '#FFFFFF', fontStyle: 'italic', letterSpacing: '0.04em' }}
          >
            HORIZONTE
          </span>
          <span
            className="text-xs font-bold italic truncate"
            style={{ color: '#EA9C2F' }}
          >
            Logística
          </span>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function Sidebar({
  activeTab, onSelectTab,
  isOpenMobile, onCloseMobile,
  isCollapsed, onToggleCollapse,
}: SidebarProps) {
  const { profile } = useAuth();

  const initials = profile?.fullName
    ? profile.fullName.split(' ').slice(0, 2).map((n: string) => n[0]).join('')
    : 'US';

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-slate-900/60 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        style={{ background: '#071322' }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          border-r border-slate-800/80 shadow-2xl
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Header com logo ── */}
        <div
          className="flex items-center justify-between px-3 py-4 border-b border-slate-800/80"
          style={{ background: '#0B1C30' }}
        >
          <HorizonLogo collapsed={isCollapsed} />
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors shrink-0"
          >
            {isCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft  className="w-4 h-4" />}
          </button>
        </div>

        {/* ── CDD badge ── */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-b border-slate-800/60">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60">
              <Building2 className="w-3 h-3 shrink-0" style={{ color: '#EA9C2F' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#EA9C2F' }}>
                CDD Caruaru
              </span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* ── Navegação ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {NAV.map((group) => (
            <div key={group.section} className="space-y-0.5">
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => {
                const Icon     = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onSelectTab(item.id); onCloseMobile(); }}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 rounded-xl text-xs font-semibold
                      transition-all duration-150 group
                      ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                    `}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #0D4E96 0%, #0a3d78 100%)',
                      boxShadow: '0 4px 12px rgba(13,78,150,0.35)',
                    } : undefined}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? '#EA9C2F' : undefined }}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!isCollapsed && isActive && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: '#EA9C2F' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Rodapé com perfil ── */}
        <div
          className="p-2.5 border-t border-slate-800/80"
          style={{ background: '#0B1C30' }}
        >
          <div className={`
            flex items-center gap-2.5 p-2 rounded-xl border border-slate-800
            bg-slate-900/50
            ${isCollapsed ? 'justify-center' : ''}
          `}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs uppercase shrink-0"
              style={{ background: 'rgba(234,156,47,0.15)', color: '#EA9C2F' }}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate">
                    {profile?.fullName || 'Operador'}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {profile?.role || 'operador'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sair"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}