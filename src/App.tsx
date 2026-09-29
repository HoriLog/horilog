import React, { useState, useEffect } from 'react';
import { TabId, MonitoramentoArea } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TorreDeControle } from './components/screens/TorreDeControle';
import { GestaoFrota } from './components/screens/GestaoFrota';
import { GestaoEntregasScreen } from './components/screens/GestaoEntregasScreen';
import { SuporteEquipesScreen } from './components/screens/SuporteEquipesScreen';
import { GestaoDevolucaoScreen } from './components/screens/GestaoDevolucaoScreen';
import { GestaoTmlScreen } from './components/screens/GestaoTmlScreen';
import { SolturaScreen } from './components/screens/SolturaScreen';
import { GestaoEquipesScreen } from './components/screens/GestaoEquipesScreen';
import { NewVehicleModal, NewVehicleData } from './components/tangram/NewVehicleModal';
import { useStorageVersion } from './hooks/useStorageVersion';
import { useVehicles } from './hooks/useVehicles';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/auth/LoginScreen';
import { Loader2 } from 'lucide-react';
import { DataManagementModal } from './components/common/DataManagementModal';
import { OperationalStorage } from './services/storageService';
import { createVehicle } from './services/api/vehicles';
import {
  CheckCircle2,
  Activity,
  Truck,
  PackageCheck,
  Headphones,
  RotateCcw,
  Timer,
  ShieldCheck,
  Users,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  ChevronDown,
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeArea, setActiveArea] = useState<MonitoramentoArea>('torre-kpis');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEmbeddedMenuCollapsed, setIsEmbeddedMenuCollapsed] = useState(false);
  const [isQuickAreaPickerOpen, setIsQuickAreaPickerOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [globalToast, setGlobalToast] = useState<string | null>(null);
  useStorageVersion(); // keep sidebar/tab badges in sync with writes made by the (ainda não migrados) screens
  const { vehicles: allVehicles } = useVehicles(); // Frota já migrada para o Supabase
  const { teamMembers: allTeamMembers } = useTeamMembers(); // Equipes já migrada para o Supabase

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string) => {
    setGlobalToast(message);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  const handleNewVehicleCreated = async (v: NewVehicleData) => {
    try {
      await createVehicle({
        plate: v.plate,
        model: v.model,
        category: v.category,
        driverName: v.driver,
        odometerKm: v.currentOdometer ? Number(v.currentOdometer.replace(/\D/g, '')) || undefined : undefined,
        fuelCapacityL: v.fuelCapacity ? Number(v.fuelCapacity.replace(/\D/g, '')) || undefined : undefined,
        iotDeviceSerial: v.iotDeviceSerial || undefined,
      });
      showToast(`Veículo ${v.model} (${v.plate}) cadastrado na frota.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao cadastrar veículo.');
    }
  };

  const handleSelectArea = (area: MonitoramentoArea) => {
    setActiveArea(area);
  };

  const handleSelectTab = (tab: TabId) => {
    if (tab === 'monitoramento' || tab === 'dashboard-kpis') {
      setActiveArea('torre-kpis');
    } else if (tab === 'gestao-frota') {
      setActiveArea('telemetria-frota');
    } else if (
      tab === 'torre-kpis' ||
      tab === 'telemetria-frota' ||
      tab === 'gestao-entregas' ||
      tab === 'suporte-equipes' ||
      tab === 'gestao-devolucao' ||
      tab === 'gestao-tml' ||
      tab === 'soltura' ||
      tab === 'gestao-equipes'
    ) {
      setActiveArea(tab as MonitoramentoArea);
    }
  };

  const vehiclesCount = allVehicles.length;
  const deliveriesCount = OperationalStorage.getDeliveries().length;
  const ticketsCount = OperationalStorage.getTickets().filter((t) => t.status === 'Aberto').length;
  const returnsCount = OperationalStorage.getReturns().length;
  const tmlCount = OperationalStorage.getTmlVehicles().length;
  const solturaCount = OperationalStorage.getSolturas().length;
  const teamCount = allTeamMembers.length;

  const monitoramentoTabs = [
    { id: 'torre-kpis' as MonitoramentoArea, label: 'Torre de Controle & KPIs', icon: Activity },
    {
      id: 'telemetria-frota' as MonitoramentoArea,
      label: 'Telemetria & Frota',
      icon: Truck,
      badge: vehiclesCount > 0 ? String(vehiclesCount) : undefined,
    },
    {
      id: 'gestao-entregas' as MonitoramentoArea,
      label: 'Gestão de Entregas',
      icon: PackageCheck,
      badge: deliveriesCount > 0 ? String(deliveriesCount) : undefined,
    },
    {
      id: 'suporte-equipes' as MonitoramentoArea,
      label: 'Suporte à Equipes',
      icon: Headphones,
      badge: ticketsCount > 0 ? String(ticketsCount) : undefined,
    },
    {
      id: 'gestao-devolucao' as MonitoramentoArea,
      label: 'Gestão de Devolução',
      icon: RotateCcw,
      badge: returnsCount > 0 ? String(returnsCount) : undefined,
    },
    {
      id: 'gestao-tml' as MonitoramentoArea,
      label: 'Gestão de TML',
      icon: Timer,
      badge: tmlCount > 0 ? String(tmlCount) : undefined,
    },
    {
      id: 'soltura' as MonitoramentoArea,
      label: 'Soltura',
      icon: ShieldCheck,
      badge: solturaCount > 0 ? String(solturaCount) : undefined,
    },
    {
      id: 'gestao-equipes' as MonitoramentoArea,
      label: 'Gestão de Equipes',
      icon: Users,
      badge: teamCount > 0 ? String(teamCount) : undefined,
    },
  ];

  const currentAreaInfo = monitoramentoTabs.find((t) => t.id === activeArea) || monitoramentoTabs[0];
  const CurrentAreaIcon = currentAreaInfo.icon;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#004AC6] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans antialiased selection:bg-[#EFF6FF] selection:text-[#1E2D72]">
      {/* Global Action Toast */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E2D72] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm border border-blue-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#F39818] shrink-0" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* Tangram Design System Sidebar with Collapse Support */}
      <Sidebar
        activeTab="monitoramento"
        activeArea={activeArea}
        onSelectTab={handleSelectTab}
        onSelectArea={handleSelectArea}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Floating Button to Re-expand Sidebar when Collapsed */}
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed bottom-5 left-5 z-40 bg-[#1E2D72] hover:bg-[#162256] text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-blue-800 flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 cursor-pointer animate-in fade-in zoom-in-90 duration-200"
          title="Expandir Menu Lateral (Ctrl+B)"
        >
          <PanelLeftOpen className="w-4 h-4 text-[#F39818]" />
          <span className="hidden sm:inline">Menu Horizonte</span>
        </button>
      )}

      {/* Main Content Area - Fluidly Adapts Padding when Sidebar Collapses */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-72'
        }`}
      >
        {/* Sticky Top Header */}
        <Header
          activeTab={activeArea as TabId}
          onOpenNewVehicle={() => setIsNewVehicleOpen(true)}
          onOpenDataModal={() => setIsDataModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onSearchSelect={() => showToast('Busca global ainda não implementada: use o filtro de cada tela.')}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isEmbeddedMenuCollapsed={isEmbeddedMenuCollapsed}
          onToggleEmbeddedMenu={() => setIsEmbeddedMenuCollapsed((prev) => !prev)}
        />

        {/* Dynamic Screen View - Spacious 1600px Max Fluid Layout */}
        <main className="flex-1 pt-18 p-3 sm:p-5 lg:p-6 max-w-[1600px] w-full mx-auto pb-12 space-y-5 transition-all duration-300">
          {/* Top Embedded Areas Switcher inside Setor de Monitoramento */}
          {isEmbeddedMenuCollapsed ? (
            /* Compact Collapsed Bar Mode */
            <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <div className="flex items-center gap-1.5 text-xs text-[#0B1C30]">
                  <span className="text-slate-500 font-semibold hidden sm:inline">
                    Horizonte Monitoramento:
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EFF6FF] text-[#1E2D72] rounded-lg font-bold border border-[#BFDBFE]">
                    <CurrentAreaIcon className="w-3.5 h-3.5 text-[#F39818]" />
                    <span>{currentAreaInfo.label}</span>
                  </div>
                </div>

                {/* Quick Switch Area Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsQuickAreaPickerOpen(!isQuickAreaPickerOpen)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#1E2D72] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>Trocar Área</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isQuickAreaPickerOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsQuickAreaPickerOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-40 p-1.5 divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                        {monitoramentoTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isSelected = activeArea === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                handleSelectArea(tab.id);
                                setIsQuickAreaPickerOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#EFF6FF] text-[#1E2D72] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#1E2D72]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#F39818]' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                              </div>
                              {tab.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                  {tab.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Button to Re-expand Full Embedded Tabs */}
              <button
                type="button"
                onClick={() => setIsEmbeddedMenuCollapsed(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E2D72] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors cursor-pointer"
                title="Expandir todas as 8 abas de monitoramento"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#F39818]" />
                <span>Exibir Menu de Áreas</span>
              </button>
            </div>
          ) : (
            /* Full Expanded Tabs Mode */
            <div className="bg-white p-2.5 rounded-2xl border border-[#E2E8F0] shadow-xs transition-all duration-300">
              <div className="px-3 pt-1 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#1E2D72]">
                    Setor de Monitoramento
                  </span>
                  <span className="text-[11px] text-[#F39818] font-bold hidden sm:inline">
                    • Horizonte Logística
                  </span>
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    (8 Áreas Operacionais Integradas)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 hidden lg:inline">
                    Acompanhamento operacional em tempo real
                  </span>
                  {/* Button to Collapse Embedded Menu */}
                  <button
                    type="button"
                    onClick={() => setIsEmbeddedMenuCollapsed(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#1E2D72] hover:bg-[#EFF6FF] rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    title="Ocultar menu embutido para foco nas operações"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ocultar Abas</span>
                  </button>
                </div>
              </div>

              {/* Area Navigation Pills - NO NUMBERS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin">
                {monitoramentoTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isCurrent = activeArea === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectArea(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-[#1E2D72] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#EFF6FF] hover:text-[#1E2D72] border border-slate-200/70'
                      }`}
                    >
                      <TabIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#F39818]' : 'text-[#4A82C5]'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Render Active Area Screen */}
          <div className="w-full" key={dataVersion}>
            {activeArea === 'torre-kpis' && (
              <TorreDeControle onNavigateToFleet={() => handleSelectArea('telemetria-frota')} />
            )}

            {activeArea === 'telemetria-frota' && (
              <GestaoFrota onOpenNewVehicleModal={() => setIsNewVehicleOpen(true)} />
            )}

            {activeArea === 'gestao-entregas' && <GestaoEntregasScreen />}

            {activeArea === 'suporte-equipes' && <SuporteEquipesScreen />}

            {activeArea === 'gestao-devolucao' && <GestaoDevolucaoScreen />}

            {activeArea === 'gestao-tml' && <GestaoTmlScreen />}

            {activeArea === 'soltura' && <SolturaScreen />}

            {activeArea === 'gestao-equipes' && <GestaoEquipesScreen />}
          </div>
        </main>
      </div>

      {/* Modal: Novo Veículo na Frota */}
      <NewVehicleModal
        isOpen={isNewVehicleOpen}
        onClose={() => setIsNewVehicleOpen(false)}
        onSuccess={handleNewVehicleCreated}
      />

      {/* Modal: Gestão e Importação de Dados Reais */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataChanged={() => {
          setDataVersion((v) => v + 1);
          showToast('Dados operacionais atualizados.');
        }}
      />
    </div>
  );
}
