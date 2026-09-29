import React from 'react';
import { DollarSign, FileText, CheckCircle2, AlertCircle, ArrowUpRight, Download } from 'lucide-react';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';

export const Faturamento: React.FC = () => {
  const invoices = [
    { cte: 'CTe 3524-00192', client: 'Atacadão Distribuição S/A', val: 'R$ 14.850,00', date: '20/09/2026', status: 'Autorizado SEFAZ', badge: 'success' as const },
    { cte: 'CTe 3524-00193', client: 'GPA Alimentos e Bebidas', val: 'R$ 22.400,00', date: '20/09/2026', status: 'Autorizado SEFAZ', badge: 'success' as const },
    { cte: 'CTe 3524-00194', client: 'Ambev Logística Reversa', val: 'R$ 8.920,00', date: '20/09/2026', status: 'Em Processamento', badge: 'warning' as const },
    { cte: 'CTe 3524-00195', client: 'Nestlé Brasil Alimentos', val: 'R$ 31.500,00', date: '19/09/2026', status: 'Liquidado', badge: 'info' as const },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30]">Faturamento & Conhecimentos de Transporte (CT-e / MDF-e)</h1>
          <p className="text-xs sm:text-sm text-[#737686]">Emissão em lote, conciliação fiscal e integração direta com SEFAZ nacional.</p>
        </div>
        <TangramButton variant="primary" size="sm" icon={<Download className="w-4 h-4" />}>
          Exportar SPED Fiscal
        </TangramButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Faturamento Hoje</span>
          <div className="text-2xl font-bold font-mono text-[#0B1C30] mt-1">R$ 184.250,00</div>
          <span className="text-xs text-[#006C49] font-semibold mt-1 inline-block">+8.4% vs média diária</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">CT-e Emitidos (Mês)</span>
          <div className="text-2xl font-bold font-mono text-[#004AC6] mt-1">3.418</div>
          <span className="text-xs text-slate-500 mt-1 inline-block">100% validados na SEFAZ</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">A Receber (Próximos 7D)</span>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">R$ 642.100,00</div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Inadimplência: 0.2%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B1C30]">Últimos Conhecimentos Emitidos</h2>
          <span className="text-xs text-[#737686]">Gateway Sefaz Conectado</span>
        </div>

        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#EFF4FF] text-[#434655] text-[11px] uppercase font-semibold">
            <tr>
              <th className="py-2.5 px-4">Documento CT-e</th>
              <th className="py-2.5 px-4">Tomador do Serviço</th>
              <th className="py-2.5 px-4">Data Emissão</th>
              <th className="py-2.5 px-4">Valor Total</th>
              <th className="py-2.5 px-4">Status SEFAZ</th>
              <th className="py-2.5 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-[#004AC6]">{inv.cte}</td>
                <td className="py-3 px-4 font-medium text-[#0B1C30]">{inv.client}</td>
                <td className="py-3 px-4 text-slate-500 font-mono">{inv.date}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.val}</td>
                <td className="py-3 px-4">
                  <TangramBadge variant={inv.badge}>{inv.status}</TangramBadge>
                </td>
                <td className="py-3 px-4 text-right">
                  <TangramButton variant="outline" size="sm">
                    XML / DACTE
                  </TangramButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
