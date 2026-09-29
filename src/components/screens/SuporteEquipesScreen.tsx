import React, { useState } from 'react';
import { SupportTicket } from '../../types';
import { OperationalStorage } from '../../services/storageService';
import { usePersistedList } from '../../hooks/usePersistedList';
import { useToast } from '../../hooks/useToast';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import {
  Headphones,
  AlertCircle,
  Clock,
  Send,
  PhoneCall,
  CheckCircle2,
  MapPin,
  FileWarning,
  X,
  Plus,
} from 'lucide-react';

export const SuporteEquipesScreen: React.FC = () => {
  const [tickets, setTickets] = usePersistedList<SupportTicket>(
    OperationalStorage.getTickets,
    OperationalStorage.setTickets
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;
  const setSelectedTicket = (t: SupportTicket | null) => setSelectedId(t?.id ?? null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [draft, setDraft] = useState({ plate: '', driver: '', phone: '', category: 'Endereço Não Localizado' as SupportTicket['category'], severity: 'media' as SupportTicket['severity'], description: '' });
  const [newResponseText, setNewResponseText] = useState('');
  const [actionSuccessMsg, showToast] = useToast(4000);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'todos') return true;
    return t.status === filterStatus;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newResponseText.trim()) return;

    const newMessage = {
      sender: 'support' as const,
      text: newResponseText.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              messages: [...t.messages, newMessage],
              lastUpdate: 'Agora mesmo',
            }
          : t
      )
    );

    setNewResponseText('');
  };

  const handleResolveTicket = (ticketId: string, resolutionType: 'Resolvido' | 'Devolução Autorizada') => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: resolutionType, lastUpdate: 'Agora mesmo' } : t))
    );

    showToast(
      resolutionType === 'Resolvido'
        ? `Chamado encerrado.`
        : `Devolução autorizada para o CD.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006C49] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE]">
              Horizonte Apoio Operacional
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Suporte à Equipes de Entregas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Central Horizonte Logística • Apoio operacional e resolução ágil de impedimentos em rota e socorro mecânico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#004AC6] hover:bg-[#003899] text-white px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Chamado
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Chamados em Aberto</span>
            <Headphones className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">
            {tickets.filter((t) => t.status === 'Aberto' || t.status === 'Em Atendimento').length}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Abertos + em atendimento</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Resolvidos</span>
            <CheckCircle2 className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">{tickets.filter((t) => t.status === 'Resolvido').length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Chamados encerrados sem devolução</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Devoluções Autorizadas</span>
            <FileWarning className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#D97706]">
            {tickets.filter((t) => t.status === 'Devolução Autorizada').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Encaminhadas ao armazém</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Total de Chamados</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2563EB]">{tickets.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tempo de resposta ainda não medido</div>
        </div>
      </div>

      {/* Main Grid: Ticket List (Left) + Interactive Live Chat & Resolution (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E2E8F0] gap-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {['todos', 'Aberto', 'Em Atendimento', 'Resolvido'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    filterStatus === status
                      ? 'bg-[#004AC6] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : status}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {filteredTickets.length} registros
            </span>
          </div>

          <div className="space-y-2.5 max-h-155 overflow-y-auto pr-1">
            {filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EFF4FF] border-[#004AC6] shadow-xs ring-1 ring-[#004AC6]'
                      : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-[#004AC6]">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'Resolvido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'Devolução Autorizada'
                          ? 'bg-amber-100 text-amber-800'
                          : t.status === 'Em Atendimento'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-[#0B1C30] truncate">{t.clientName}</div>
                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                    {t.category} • <span className="font-mono text-slate-800">{t.vehiclePlate}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                    <span>Motorista: {t.driverName}</span>
                    <span className="font-mono text-slate-500">{t.openedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Ticket Workspace & Live Chat */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <TangramCard className="flex flex-col h-167.5">
              {/* Ticket Details Header */}
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#0B1C30]">
                        {selectedTicket.ticketNumber} • {selectedTicket.category}
                      </h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedTicket.severity === 'alta'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Urgência {selectedTicket.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Destinatário: <strong className="text-slate-800">{selectedTicket.clientName}</strong> •{' '}
                      {selectedTicket.nfeNumber}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedTicket.driverPhone}`}
                      className="p-2 rounded-lg bg-emerald-50 text-[#006C49] hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Ligar para Motorista"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Ligar
                    </a>
                  </div>
                </div>

                {/* Team and Route Context Strip */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Veículo / Rota</span>
                    <span className="font-bold text-[#0B1C30]">
                      {selectedTicket.vehiclePlate} ({selectedTicket.routeName})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Motorista & Ajudante</span>
                    <span className="font-semibold text-slate-700">
                      {selectedTicket.driverName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Operador Responsável</span>
                    <span className="font-semibold text-[#004AC6]">
                      {selectedTicket.assignedOperator}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Resolution Bar */}
              <div className="p-3 bg-white border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">Ações Rápidas de Resolução:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolveTicket(selectedTicket.id, 'Resolvido')}
                    className="px-3 py-1 bg-[#006C49] hover:bg-[#005538] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Encerrar com Sucesso
                  </button>
                  <button
                    onClick={() => handleResolveTicket(selectedTicket.id, 'Devolução Autorizada')}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Autorizar Devolução
                  </button>
                </div>
              </div>

              {/* Live Chat Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFBFD]">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Descrição Inicial da Ocorrência:</span>
                  {selectedTicket.description}
                </div>

                {selectedTicket.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'support' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs ${
                        msg.sender === 'support'
                          ? 'bg-[#004AC6] text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 mb-1">
                        <span className="font-bold">
                          {msg.sender === 'support' ? 'Central de Suporte (Você)' : selectedTicket.driverName}
                        </span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Message Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#E2E8F0] flex gap-2">
                <input
                  type="text"
                  value={newResponseText}
                  onChange={(e) => setNewResponseText(e.target.value)}
                  placeholder="Instrua o motorista ou digite uma orientação para a equipe de rua..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#004AC6]"
                />
                <button
                  type="submit"
                  disabled={!newResponseText.trim()}
                  className="px-4 py-2 bg-[#004AC6] hover:bg-[#003899] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>
            </TangramCard>
          ) : (
            <div className="h-full bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Headphones className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">Selecione um chamado na fila lateral</p>
              <p className="text-xs text-slate-400 mt-1">Veja os detalhes, histórico e envie mensagens em tempo real.</p>
            </div>
          )}
        </div>
      </div>
      {isNewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const now = new Date();
              const t: SupportTicket = {
                id: `tkt-${Date.now()}`,
                ticketNumber: `SUP-${now.getFullYear()}-${String(tickets.length + 1).padStart(4, '0')}`,
                vehiclePlate: draft.plate.trim().toUpperCase(),
                driverName: draft.driver.trim(),
                driverPhone: draft.phone.trim(),
                routeName: '',
                clientName: '',
                nfeNumber: '',
                category: draft.category,
                severity: draft.severity,
                description: draft.description.trim(),
                status: 'Aberto',
                openedAt: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                assignedOperator: '',
                slaMinutesRemaining: 0,
                lastUpdate: 'Agora',
                messages: [],
              };
              setTickets([t, ...tickets]);
              setSelectedId(t.id);
              setIsNewOpen(false);
              setDraft({ ...draft, plate: '', driver: '', phone: '', description: '' });
              showToast(`Chamado ${t.ticketNumber} aberto.`);
            }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-[#0B1C30]">Novo chamado de suporte</h3>
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Placa" value={draft.plate} onChange={(e) => setDraft({ ...draft, plate: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg" />
              <input required placeholder="Motorista" value={draft.driver} onChange={(e) => setDraft({ ...draft, driver: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <input placeholder="Telefone do motorista (opcional)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as SupportTicket['category'] })} className="px-3 py-2 border border-slate-300 rounded-lg bg-white">
                {['Endereço Não Localizado', 'Cliente Fechado / Ausente', 'Avaria na Carga', 'Recusa Comercial', 'Problema Mecânico', 'Atraso em Doca Externa', 'Área de Risco'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as SupportTicket['severity'] })} className="px-3 py-2 border border-slate-300 rounded-lg bg-white">
                <option value="alta">Urgência alta</option>
                <option value="media">Urgência média</option>
                <option value="baixa">Urgência baixa</option>
              </select>
            </div>
            <textarea required rows={3} placeholder="Descrição do problema" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsNewOpen(false)} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 font-bold bg-[#004AC6] text-white rounded-lg">Abrir chamado</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
