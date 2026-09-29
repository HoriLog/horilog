import React, { useState } from 'react';
import { TabId } from '../../types';
import { HorizonteLogo } from '../common/HorizonteLogo';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  User,
  LogOut,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Database,
} from 'lucide-react';
import { OperationalStorage } from '../../services/storageService';
import { useStorageVersion } from '../../hooks/useStorageVersion';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/api/auth';
import { initials } from '../../utils/format';

export interface HeaderProps {
  activeTab: TabId;
  onOpenNewVehicle?: () => void;
  onOpenDataModal?: () => void;
  onToggleMobileSidebar: () => void;
  onSearchSelect?: (query: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  isEmbeddedMenuCollapsed?: boolean;
  onToggleEmbeddedMenu?: () => void;
}

const TAB_TITLES: Record<TabId, string> = {
  monitoramento: 'Torre de Controle',
  'torre-kpis': 'Torre de Controle & KPIs',
  'telemetria-frota': 'Telemetria & Frota',
  'gestao-entregas': 'Gestão de Entregas',
  'suporte-equipes': 'Suporte à Equipes',
  'gestao-devolucao': 'Gestão de Devoluções',
  'gestao-tml': 'Gestão de TML',
  soltura: 'Soltura de Frota',
  'gestao-equipes': 'Gestão de Equipes',
  'dashboard-kpis': 'Torre de Controle',
  'gestao-frota': 'Telemetria & Frota',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewVehicle,
  onOpenDataModal,
  onToggleMobileSidebar,
  onSearchSelect,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  isEmbeddedMenuCollapsed = false,
  onToggleEmbeddedMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  useStorageVersion();
  const { profile } = useAuth();
  const displayName = profile?.fullName ?? 'Usuário';

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    try {
      await signOut();
    } catch (e) {
      console.error('Erro ao sair:', e);
    } finally {
      window.location.reload(); // garante que a tela de login apareça mesmo se o listener de sessão atrasar
    }
  };
  const displayRole = profile?.role ?? '';
  const incidents = OperationalStorage.getIncidents();
  const [readCount, setReadCount] = useState(0);
  const unreadNotifications = Math.max(0, incidents.length - readCount);

  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-white/95 backdrop-blur-md z-30 px-3 sm:px-6 border-b border-[#E2E8F0] flex items-center justify-between shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out left-0 ${
        isSidebarCollapsed ? 'lg:left-0' : 'lg:left-72'
      }`}
    >
      {/* Left section: Toggles + Title + Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#0B1C30] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle icon button */}
        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-[#1E2D72] hover:bg-[#EFF6FF] transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Expandir Menu Lateral (Ctrl+B)' : 'Ocultar Menu Lateral (Ctrl+B)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#1E2D72]" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Brand Icon when Sidebar is Collapsed */}
        {isSidebarCollapsed && (
          <div className="hidden sm:flex items-center pr-1 shrink-0">
            <HorizonteLogo variant="icon" size="xs" />
          </div>
        )}

        {/* Active Section Title */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="font-bold text-sm text-[#1E2D72] tracking-tight">
            {TAB_TITLES[activeTab] || 'Monitoramento'}
          </span>
          <span className="text-slate-300">|</span>
        </div>

        {/* Search Bar - Sleek & Minimal */}
        <div className="relative w-full max-w-xs sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearchSelect) {
                onSearchSelect(searchQuery);
              }
            }}
            placeholder="Buscar placa, remessa, NFe..."
            className="w-full h-8 pl-8 pr-3 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-[#0B1C30] placeholder-slate-400 text-xs rounded-lg border border-transparent focus:border-[#BFDBFE] focus:ring-1 focus:ring-[#004AC6] transition-all outline-none"
          />
        </div>
      </div>

      {/* Right section: Embedded menu toggle + Data Management + Notifications + User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Gestão e Importação de Dados Reais Button */}
        {onOpenDataModal && (
          <button
            type="button"
            onClick={onOpenDataModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#1E2D72] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors cursor-pointer"
            title="Importar planilhas CSV ou gerenciar dados reais da operação"
          >
            <Database className="w-3.5 h-3.5 text-[#F39818]" />
            <span className="hidden md:inline">Dados Reais</span>
          </button>
        )}

        {/* Toggle Abas de Áreas icon button */}
        {onToggleEmbeddedMenu && (
          <button
            type="button"
            onClick={onToggleEmbeddedMenu}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isEmbeddedMenuCollapsed
                ? 'text-[#004AC6] bg-[#EFF4FF]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={isEmbeddedMenuCollapsed ? 'Exibir Abas de Áreas' : 'Ocultar Abas de Áreas'}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Notificações"
            title="Notificações e Alertas"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-[#F8FAFC] border-b border-[#F1F5F9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0B1C30]">Alertas Operacionais</span>
                    <span className="px-1.5 py-0.2 bg-[#EFF4FF] text-[#004AC6] text-[10px] font-bold rounded-full">
                      {unreadNotifications} novos
                    </span>
                  </div>
                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      onClick={() => setReadCount(incidents.length)}
                      className="text-[11px] text-[#004AC6] hover:underline font-semibold cursor-pointer"
                    >
                      Marcar lidos
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F1F5F9] max-h-72 overflow-y-auto">
                  {incidents.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <div className="font-bold text-xs text-[#0B1C30]">Nenhum alerta crítico ativo</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Sua operação rodoviária está operando sem sinistros ou anomalias registradas.
                      </p>
                    </div>
                  ) : (
                    incidents.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-[#F8FAFC] transition-colors flex items-start gap-3 cursor-pointer"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        <div className="p-2 rounded-lg shrink-0 text-[#DC2626] bg-[#FEF2F2]">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-[#0B1C30] truncate">
                              {item.incidentType}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                              {item.plate}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#737686] mt-0.5 leading-snug">
                            {item.location}{item.landmark ? ` • ${item.landmark}` : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative pl-1 border-l border-slate-200">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Menu do Usuário"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-[#1E2D72] text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-slate-200">
                {initials(displayName)}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#006C49] ring-1 ring-white" />
            </div>
            <span className="hidden md:inline text-xs font-semibold text-[#0B1C30]">
              {displayName}
            </span>
          </button>

          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="px-3.5 py-2 border-b border-[#F1F5F9]">
                  <div className="font-bold text-[#1E2D72]">{displayName}</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-[#EFF6FF] text-[#1E2D72] font-semibold px-2 py-0.5 rounded border border-[#BFDBFE] capitalize">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F39818]" />
                    <span>Horizonte • {displayRole}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" /> Meu Perfil
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> Configurações
                </button>
                <div className="border-t border-[#F1F5F9] my-1" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
