import React, { useState, useEffect } from 'react';
import { MonitoramentoArea } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GestaoEntregasScreen }  from './components/screens/GestaoEntregasScreen';
import { GestaoDevolucaoScreen } from './components/screens/GestaoDevolucaoScreen';
import { GestaoBufferScreen }    from './components/screens/GestaoBufferScreen';
import { CadastrosScreen }       from './components/screens/CadastrosScreen';
import { useAuth }               from './hooks/useAuth';
import { LoginScreen }           from './components/auth/LoginScreen';
import { LoadingScreen }         from './components/LoadingScreen';
import {
  PackageCheck,
  RotateCcw,
  Clock,
  BookUser,
  Loader2,
  ChevronDown,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [minLoadingDone, setMinLoadingDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const [activeArea, setActiveArea]                     = useState<MonitoramentoArea>('gestao-entregas');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed]     = useState(false);
  const [isEmbeddedMenuCollapsed, setIsEmbeddedMenuCollapsed] = useState(false);
  const [isQuickAreaPickerOpen, setIsQuickAreaPickerOpen] = useState(false);

  // Ctrl+B — recolhe sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const tabs = [
    { id: 'gestao-entregas'  as MonitoramentoArea, label: 'Gestão de Entregas',  icon: PackageCheck },
    { id: 'gestao-devolucao' as MonitoramentoArea, label: 'Gestão de Devolução', icon: RotateCcw   },
    { id: 'buffer'           as MonitoramentoArea, label: 'Buffer',               icon: Clock       },
    { id: 'cadastros'        as MonitoramentoArea, label: 'Cadastros',            icon: BookUser    },
  ];

  const currentTab   = tabs.find(t => t.id === activeArea) ?? tabs[0];
  const CurrentIcon  = currentTab.icon;

  // ── Auth & loading guards ──────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#004AC6] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  if (!minLoadingDone) return <LoadingScreen />;

  // ── Main layout ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar
        activeTab={activeArea}
        activeArea={activeArea}
        onSelectTab={(tab) => setActiveArea(tab as MonitoramentoArea)}
        onSelectArea={setActiveArea}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeArea}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Menu de navegação embutido ─────────────────────────────── */}
          {isEmbeddedMenuCollapsed ? (

            /* Modo compacto */
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <div className="flex items-center gap-1.5 text-xs text-[#0B1C30]">
                  <span className="text-slate-500 font-semibold hidden sm:inline">
                    Horizonte Monitoramento:
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EFF6FF] text-[#1E2D72] rounded-lg font-bold border border-[#BFDBFE]">
                    <CurrentIcon className="w-3.5 h-3.5 text-[#F39818]" />
                    <span>{currentTab.label}</span>
                  </div>
                </div>

                {/* Seletor rápido */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsQuickAreaPickerOpen(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#1E2D72] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <span>Trocar Área</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isQuickAreaPickerOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsQuickAreaPickerOpen(false)} />
                      <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-40 p-1.5">
                        {tabs.map(tab => {
                          const Icon = tab.icon;
                          const isSelected = activeArea === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => { setActiveArea(tab.id); setIsQuickAreaPickerOpen(false); }}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-[#EFF6FF] text-[#1E2D72]'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#1E2D72]'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#F39818]' : 'text-slate-400'}`} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmbeddedMenuCollapsed(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E2D72] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#F39818]" />
                <span>Exibir Menu</span>
              </button>
            </div>

          ) : (

            /* Modo expandido */
            <div className="bg-white p-2.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="px-3 pt-1 pb-2 flex items-center justify-between gap-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#1E2D72]">
                    Horizonte Logística
                  </span>
                  <span className="text-[11px] text-[#F39818] font-bold hidden sm:inline">
                    • Operacional
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmbeddedMenuCollapsed(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#1E2D72] hover:bg-[#EFF6FF] rounded-lg transition-colors border border-slate-200"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ocultar Abas</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 pt-2 pb-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isCurrent = activeArea === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveArea(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        isCurrent
                          ? 'bg-[#1E2D72] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#EFF6FF] hover:text-[#1E2D72] border border-slate-200/70'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#F39818]' : 'text-[#4A82C5]'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tela ativa ────────────────────────────────────────────── */}
          <div className="w-full">
            {activeArea === 'gestao-entregas'  && <GestaoEntregasScreen />}
            {activeArea === 'gestao-devolucao' && <GestaoDevolucaoScreen />}
            {activeArea === 'buffer'           && <GestaoBufferScreen />}
            {activeArea === 'cadastros'        && <CadastrosScreen />}
          </div>

        </main>
      </div>
    </div>
  );
}