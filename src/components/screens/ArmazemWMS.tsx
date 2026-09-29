import React from 'react';
import { Warehouse, Boxes, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import { INITIAL_DOCKS } from '../../data/erpData';

export const ArmazemWMS: React.FC = () => {
  const zones = [
    { name: 'Setor A - Refrigerados (-18°C)', capacity: '92%', pallets: '1.420 / 1.550', temp: '-18.2 °C', status: 'Estável' },
    { name: 'Setor B - Secos & Mercearia', capacity: '78%', pallets: '3.120 / 4.000', temp: 'Ambiente', status: 'Normal' },
    { name: 'Setor C - Químicos & Perigosos', capacity: '45%', pallets: '450 / 1.000', temp: '22.0 °C', status: 'Certificado' },
    { name: 'Setor D - Cross-Docking Ativo', capacity: '88%', pallets: '880 / 1.000', temp: 'Ambiente', status: 'Giro Rápido' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <h1 className="text-xl font-bold text-[#0B1C30]">Armazém & Gestão WMS de Pátio</h1>
        <p className="text-xs sm:text-sm text-[#737686]">Controle de estoque verticalizado, esteiras de cross-docking e ocupação de docas.</p>
      </div>

      {/* Warehouse Zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((z, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1C30]">{z.name}</span>
                <TangramBadge variant="success">{z.status}</TangramBadge>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#004AC6]">{z.capacity}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">Ocupação: {z.pallets} posições</div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Sensor: {z.temp}</span>
              <button className="text-[#004AC6] font-semibold hover:underline">Ver Mapa</button>
            </div>
          </div>
        ))}
      </div>

      {/* Docks Live Matrix */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B1C30]">Ocupação de Docas - Centro de Distribuição Cajamar</h2>
            <span className="text-xs text-[#737686]">Monitoramento de esteiras, conferência cega e empilhadeiras em operação</span>
          </div>
          <TangramButton variant="primary" size="sm">
            Chamar Próximo da Fila
          </TangramButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {INITIAL_DOCKS.map((d) => (
            <div key={d.id} className="p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-[#0B1C30]">{d.dockNumber}</span>
                <TangramBadge variant={d.status === 'livre' ? 'neutral' : d.status === 'carregando' ? 'success' : 'info'}>
                  {d.status}
                </TangramBadge>
              </div>
              {d.truckModel ? (
                <div className="text-xs text-slate-700">
                  <div className="font-semibold truncate">{d.truckModel}</div>
                  <div className="font-mono text-[11px] text-[#004AC6]">{d.truckPlate}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Conferência: {d.progressPercentage}%</div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">Doca desocupada</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
