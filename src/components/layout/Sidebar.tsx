import React from 'react';
import {
  PackageCheck,
  RotateCcw,
  Clock,
  BookUser,
  Truck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { profile } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const menuSections = [
    {
      title: 'Planejamento',
      items: [
        { id: 'buffer', label: 'Buffer de Pedidos', icon: Clock },
      ],
    },
    {
      title: 'Operações',
      items: [
        { id: 'gestao-entregas', label: 'Gestão de Entregas', icon: PackageCheck },
        { id: 'gestao-devolucao', label: 'Gestão de Devoluções', icon: RotateCcw },
      ],
    },
    {
      title: 'Frota & Telemetria',
      items: [
        { id: 'frota', label: 'Frota & Veículos', icon: Truck },
      ],
    },
    {
      title: 'Governança',
      items: [
        { id: 'cadastros', label: 'Centro de Cadastros', icon: BookUser },
      ],
    },
  ];

  return (
    <>
      {isOpenMobile && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#071322] text-slate-300 transition-all duration-300 border-r border-slate-800 shadow-xl ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Identidade Visual: Horizonte Logística */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0B1C30]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
              HL
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white tracking-wide truncate">Horizonte Logística</span>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> CDD Caruaru
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Links de navegação */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Rodapé com Perfil */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1C30]">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {profile?.fullName ? profile.fullName.substring(0, 2) : 'US'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-white truncate">{profile?.fullName || 'Operador'}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{profile?.role || 'operador'}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleSignOut}
              title="Sair"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}