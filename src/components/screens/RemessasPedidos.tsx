import React, { useState } from 'react';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import { TangramInput } from '../tangram/TangramInput';
import { Boxes, Search, Filter, PlusCircle, CheckCircle2, AlertTriangle, FileText, ArrowUpDown } from 'lucide-react';

export const RemessasPedidos: React.FC<{ onNewShipment: () => void }> = ({ onNewShipment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const shipments = [
    { id: 'REM-8921', nfe: 'NFe-44120', client: 'Atacadão S/A', origin: 'Cajamar/SP', dest: 'Curitiba/PR', weight: '38.400 kg', sla: 'Hoje 17:30', status: 'Em Trânsito', badge: 'info' as const },
    { id: 'REM-8922', nfe: 'NFe-44121', client: 'GPA Alimentos', origin: 'Betim/MG', dest: 'Resende/RJ', weight: '42.100 kg', sla: 'Hoje 19:00', status: 'Em Trânsito', badge: 'info' as const },
    { id: 'REM-8923', nfe: 'NFe-44122', client: 'Drogaria Pacheco', origin: 'Cajamar/SP', dest: 'Rio de Janeiro/RJ', weight: '14.200 kg', sla: 'Hoje 14:00', status: 'Atrasado', badge: 'danger' as const },
    { id: 'REM-8924', nfe: 'NFe-44123', client: 'Ambev Centro', origin: 'Campinas/SP', dest: 'Belo Horizonte/MG', weight: '44.800 kg', sla: 'Amanhã 08:00', status: 'Em Rota', badge: 'success' as const },
    { id: 'REM-8925', nfe: 'NFe-44124', client: 'Nestlé Brasil', origin: 'Curitiba/PR', dest: 'São Paulo/SP', weight: '28.000 kg', sla: 'Hoje 18:45', status: 'Entregue', badge: 'success' as const },
  ];

  const filtered = shipments.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nfe.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30]">Remessas & Pedidos</h1>
          <p className="text-xs sm:text-sm text-[#737686]">Controle de carregamentos, agendamento de janelas e conferência de NFe/CT-e.</p>
        </div>
        <TangramButton variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />} onClick={onNewShipment}>
          Nova Carga / Remessa
        </TangramButton>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por remessa, cliente ou NFe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#EFF4FF] border border-transparent focus:border-[#004AC6] focus:bg-white rounded-lg outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Total: <strong>{filtered.length}</strong> remessas</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#EFF4FF] text-[#434655] text-[11px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Código & NFe</th>
                <th className="py-2.5 px-4">Cliente / Tomador</th>
                <th className="py-2.5 px-4">Origem → Destino</th>
                <th className="py-2.5 px-4">Peso</th>
                <th className="py-2.5 px-4">Previsão SLA</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0B1C30]">{s.id}</div>
                    <div className="font-mono text-[11px] text-[#004AC6]">{s.nfe}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{s.client}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{s.origin} → {s.dest}</td>
                  <td className="py-3 px-4 font-mono">{s.weight}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{s.sla}</td>
                  <td className="py-3 px-4">
                    <TangramBadge variant={s.badge}>{s.status}</TangramBadge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <TangramButton variant="outline" size="sm">
                      Detalhes
                    </TangramButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
