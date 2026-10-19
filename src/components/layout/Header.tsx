import React from 'react';
import { Menu, Bell, Search, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  activeTab: string;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function Header({ activeTab, onToggleMobileSidebar }: HeaderProps) {
  const { profile } = useAuth();

  const getTitle = (tab: string) => {
    switch (tab) {
      case 'buffer': return 'Buffer de Pedidos';
      case 'gestao-entregas': return 'Gestão de Entregas';
      case 'gestao-devolucao': return 'Gestão de Devoluções';
      case 'frota': return 'Frota & Veículos';
      case 'cadastros': return 'Centro de Cadastros';
      default: return 'Painel Operacional';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
      {/* Esquerda: Botão mobile + Título dinâmico da aba */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {getTitle(activeTab)}
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
            <Building2 className="w-3 h-3" /> CDD Caruaru
          </span>
        </div>
      </div>

      {/* Direita: Pesquisa rápida + Perfil do usuário logado */}
      <div className="flex items-center gap-4">
        {/* Barra de busca global opcional */}
        <div className="hidden xl:flex items-center relative w-64">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar placa, remessa, NFe..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
          />
        </div>

        <button
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {profile?.fullName ? profile.fullName.substring(0, 2) : 'HL'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {profile?.fullName || 'Operador Logístico'}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {profile?.role || 'CDD Caruaru'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}