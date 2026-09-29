import React, { useState } from 'react';
import { TabId, MonitoramentoArea } from '../../types';
import { HorizonteLogo } from '../common/HorizonteLogo';
import { OperationalStorage } from '../../services/storageService';
import { useStorageVersion } from '../../hooks/useStorageVersion';
import { UNITS } from '../../config/operation';
import {
  Activity,
  Truck,
  PackageCheck,
  Headphones,
  RotateCcw,
  Timer,
  ShieldCheck,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  PanelLeftClose,
} from 'lucide-react';

export interface SidebarProps {
  activeTab: TabId;
  activeArea?: MonitoramentoArea;
  onSelectTab: (tab: TabId) => void;
  onSelectArea?: (area: MonitoramentoArea) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const FILIAIS = UNITS.map((u) => ({ ...u, status: 'Ativa' }));

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activeArea = 'torre-kpis',
  onSelectTab,
  onSelectArea,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  useStorageVersion();
  const [selectedFilial, setSelectedFilial] = useState(FILIAIS[0]);
  const [isFilialDropdownOpen, setIsFilialDropdownOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(true);

  const realVehiclesCount = OperationalStorage.getVehicles().length;
  const realDeliveriesCount = OperationalStorage.getDeliveries().length;
  const realTicketsCount = OperationalStorage.getTickets().filter((t) => t.status === 'Aberto').length;
  const realReturnsCount = OperationalStorage.getReturns().length;
  const realTmlCount = OperationalStorage.getTmlVehicles().length;
  const realSolturasCount = OperationalStorage.getSolturas().length;
  const realTeamCount = OperationalStorage.getTeamMembers().length;

  const monitoramentoSubAreas = [
    {
      id: 'torre-kpis' as MonitoramentoArea,
      label: 'Analytics',
      icon: Activity,
      badge: undefined,
    },
    {
      id: 'frota' as MonitoramentoArea,
      label: 'Frota',
      icon: Truck,
      badge: realVehiclesCount > 0 ? `${realVehiclesCount} veíc.` : undefined,
    },
    {
      id: 'gestao-entregas' as MonitoramentoArea,
      label: 'Gestão de entregas',
      icon: PackageCheck,
      badge: realDeliveriesCount > 0 ? `${realDeliveriesCount} NFs` : undefined,
    },
    {
      id: 'suporte-equipes' as MonitoramentoArea,
      label: 'Suporte à equipes',
      icon: Headphones,
      badge: realTicketsCount > 0 ? `${realTicketsCount} abertos` : undefined,
    },
    {
      id: 'gestao-devolucao' as MonitoramentoArea,
      label: 'Gestão de devolução',
      icon: RotateCcw,
      badge: realReturnsCount > 0 ? `${realReturnsCount}` : undefined,
    },
    {
      id: 'gestao-tml' as MonitoramentoArea,
      label: 'Gestão de TML',
      icon: Timer,
      badge: realTmlCount > 0 ? `${realTmlCount}` : undefined,
    },
    {
      id: 'soltura' as MonitoramentoArea,
      label: 'Soltura',
      icon: ShieldCheck,
      badge: realSolturasCount > 0 ? `${realSolturasCount}` : undefined,
    },
    {
      id: 'gestao-equipes' as MonitoramentoArea,
      label: 'Gestão de equipes',
      icon: Users,
      badge: realTeamCount > 0 ? `${realTeamCount}` : undefined,
    },
  ];

  const handleMonitoramentoClick = () => {
    onSelectTab('monitoramento');
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  const isMonitoramentoSectorActive =
    activeTab === 'monitoramento' ||
    activeTab === 'dashboard-kpis' ||
    activeTab === 'gestao-frota' ||
    monitoramentoSubAreas.some((a) => a.id === (activeTab as any)) ||
    Boolean(activeArea);

  const handleSubAreaClick = (areaId: MonitoramentoArea) => {
    if (onSelectArea) {
      onSelectArea(areaId);
    }
    onSelectTab(areaId as TabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xs ${
          isOpenMobile
            ? 'translate-x-0'
            : isCollapsed
            ? '-translate-x-full'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header: Horizonte Logística */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-2">
              <HorizonteLogo variant="full" size="md" />
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop collapse button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-[#1E2D72] hover:bg-[#EFF4FF] transition-colors cursor-pointer"
                  title="Ocultar Menu Lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              {/* Mobile close button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filial Selector */}
          <div className="px-3 py-2.5 relative">
            <button
              type="button"
              onClick={() => setIsFilialDropdownOpen(!isFilialDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#EFF4FF] hover:bg-[#E5EEFF] rounded-lg text-[#0B1C30] text-xs font-medium transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-[#004AC6] shrink-0" />
                <span className="truncate font-semibold">{selectedFilial.name}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#737686] shrink-0 ml-1" />
            </button>

            {isFilialDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilialDropdownOpen(false)}
                />
                <div className="absolute left-3 right-3 top-12 z-20 bg-white border border-[#CBD5E1] rounded-lg shadow-lg py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Selecione a Unidade
                  </div>
                  {FILIAIS.map((filial) => (
                    <button
                      key={filial.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilial(filial);
                        setIsFilialDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{filial.name}</div>
                        <div className="text-[11px] text-slate-400">{filial.location}</div>
                      </div>
                      {selectedFilial.id === filial.id && (
                        <Check className="w-4 h-4 text-[#004AC6]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Section Label */}
          <div className="px-4 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#737686]">
            Setor Operacional
          </div>

          {/* Navigation Items - Only Monitoramento as Sector Root */}
          <nav className="flex-1 px-2.5 py-1 flex flex-col gap-1 overflow-y-auto">
            {/* Monitoramento Primary Sector Button */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={handleMonitoramentoClick}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  isMonitoramentoSectorActive
                    ? 'bg-[#004AC6] text-white shadow-sm'
                    : 'text-[#434655] hover:bg-[#EFF4FF] hover:text-[#0B1C30]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isMonitoramentoSectorActive ? 'bg-white/15 text-white' : 'bg-[#EFF4FF] text-[#004AC6]'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs font-bold truncate ${
                        isMonitoramentoSectorActive ? 'text-white' : 'text-[#0B1C30]'
                      }`}
                    >
                      Monitoramento
                    </span>
                    <span
                      className={`text-[11px] truncate ${
                        isMonitoramentoSectorActive ? 'text-blue-100' : 'text-[#737686]'
                      }`}
                    >
                      Torre & Telemetria
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                      isMonitoramentoSectorActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#D1FAE5] text-[#006C49]'
                    }`}
                  >
                    Ao Vivo
                  </span>
                  <div
                    className={`p-1 rounded transition-transform ${
                      isSubMenuOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 ${
                        isMonitoramentoSectorActive ? 'text-white/80' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Embedded Sub-areas under Monitoramento */}
              {isSubMenuOpen && (
                <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-200 flex flex-col gap-0.5 py-1">
                  <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                    Áreas deste Setor
                  </div>
                  {monitoramentoSubAreas.map((area) => {
                    const AreaIcon = area.icon;
                    const isAreaActive =
                      activeTab === area.id ||
                      (activeTab === 'monitoramento' && activeArea === area.id) ||
                      (activeTab === 'dashboard-kpis' && area.id === 'torre-kpis') ||
                      (activeTab === 'gestao-frota' && area.id === 'telemetria-frota');

                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleSubAreaClick(area.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all text-xs cursor-pointer ${
                          isAreaActive
                            ? 'bg-[#EFF4FF] text-[#004AC6] font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1C30] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AreaIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isAreaActive ? 'text-[#004AC6]' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{area.label}</span>
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                            isAreaActive
                              ? 'bg-blue-100 text-[#004AC6] font-bold'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {area.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Horizonte Operational Telemetry Status Footer */}
        <div className="p-3 bg-[#EFF6FF] m-3 rounded-xl border border-[#BFDBFE]">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1E2D72] transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
              <span>Ocultar Menu Lateral</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
