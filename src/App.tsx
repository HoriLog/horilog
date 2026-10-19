import React, { useState, useEffect } from 'react';
import { Sidebar }               from './components/layout/Sidebar';
import { Header }                from './components/layout/Header';
import { GestaoBufferScreen }    from './components/screens/GestaoBufferScreen';
import { GestaoEntregasScreen }  from './components/screens/GestaoEntregasScreen';
import { GestaoDevolucaoScreen } from './components/screens/GestaoDevolucaoScreen';
import { CadastrosScreen }       from './components/screens/CadastrosScreen';
import { ConfiguracoesScreen }   from './components/screens/Configuracoes';
import { useAuth }               from './hooks/useAuth';
import { LoginScreen }           from './components/auth/LoginScreen';
import { LoadingScreen }         from './components/LoadingScreen';
import { Loader2 }               from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [minLoadingDone,     setMinLoadingDone]     = useState(false);
  const [activeArea,         setActiveArea]         = useState('cadastros');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed,  setIsSidebarCollapsed]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinLoadingDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0D4E96' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  if (!minLoadingDone)  return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        activeTab={activeArea}
        onSelectTab={setActiveArea}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(p => !p)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeArea as any}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {activeArea === 'cadastros'        && <CadastrosScreen />}
          {activeArea === 'buffer'           && <GestaoBufferScreen />}
          {activeArea === 'gestao-entregas'  && <GestaoEntregasScreen />}
          {activeArea === 'gestao-devolucao' && <GestaoDevolucaoScreen />}
          {activeArea === 'configuracoes'    && <ConfiguracoesScreen />}
        </main>
      </div>
    </div>
  );
}