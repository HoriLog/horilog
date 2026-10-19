import React, { useState, useEffect } from 'react';
import { MonitoramentoArea } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GestaoEntregasScreen } from './components/screens/GestaoEntregasScreen';
import { GestaoDevolucaoScreen } from './components/screens/GestaoDevolucaoScreen';
import { GestaoBufferScreen } from './components/screens/GestaoBufferScreen';
import { CadastrosScreen } from './components/screens/CadastrosScreen';
import { GestaoFrota } from './components/screens/GestaoFrota';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/auth/LoginScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [minLoadingDone, setMinLoadingDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const [activeArea, setActiveArea] = useState<string>('gestao-entregas');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#004AC6] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  if (!minLoadingDone) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar
        activeTab={activeArea}
        onSelectTab={(tab) => setActiveArea(tab)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Forçamos activeTab com 'as any' para evitar conflito com o TabId estrito do Header */}
        <Header
          activeTab={activeArea as any}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="w-full">
            {activeArea === 'buffer' && <GestaoBufferScreen />}
            {activeArea === 'gestao-entregas' && <GestaoEntregasScreen />}
            {activeArea === 'gestao-devolucao' && <GestaoDevolucaoScreen />}
            {activeArea === 'frota' && <GestaoFrota />}
            {activeArea === 'cadastros' && <CadastrosScreen />}
          </div>
        </main>
      </div>
    </div>
  );
}