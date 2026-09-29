import React from 'react';
import { Compass, MapPin, Truck, AlertTriangle, ShieldCheck, Navigation } from 'lucide-react';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import { INITIAL_VEHICLES } from '../../data/erpData';

export const RastreamentoTMS: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30]">Rastreamento TMS Malha</h1>
          <p className="text-xs sm:text-sm text-[#737686]">Rastreamento satelital multi-operadora, cerca eletrônica e roteirização dinâmica.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#006C49] animate-pulse" />
            100% dos Veículos Conectados
          </span>
        </div>
      </div>

      {/* Corridor Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#0B1C30]">Corredor Dutra (SP ⇄ RJ)</span>
            <TangramBadge variant="success">Fluxo Normal</TangramBadge>
          </div>
          <p className="text-xs text-slate-500">148 veículos em trânsito • Velocidade média: 74 km/h</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#006C49] h-full rounded-full" style={{ width: '92%' }} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#0B1C30]">Fernão Dias (SP ⇄ MG)</span>
            <TangramBadge variant="warning">Chuva / Atenção</TangramBadge>
          </div>
          <p className="text-xs text-slate-500">86 veículos em trânsito • Velocidade média: 52 km/h</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: '74%' }} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#0B1C30]">Régis Bittencourt (SP ⇄ PR)</span>
            <TangramBadge variant="success">Fluxo Normal</TangramBadge>
          </div>
          <p className="text-xs text-slate-500">112 veículos em trânsito • Velocidade média: 68 km/h</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#006C49] h-full rounded-full" style={{ width: '88%' }} />
          </div>
        </div>
      </div>

      {/* Live Tracked Units */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B1C30]">Posicionamento Satelital Instantâneo</h2>
          <span className="text-xs text-slate-500 font-mono">Sinal GPS/GPRS Atualizado</span>
        </div>

        <div className="divide-y divide-slate-100">
          {INITIAL_VEHICLES.map((v) => (
            <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#004AC6]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0B1C30]">{v.model}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{v.plate}</span>
                    <TangramBadge variant={v.status === 'Em Rota' ? 'success' : 'warning'}>{v.status}</TangramBadge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#004AC6]" /> {v.location}</span>
                    <span>•</span>
                    <span>Motorista: {v.driver.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="font-bold text-slate-800">{v.currentSpeed} km/h</div>
                  <div className="text-[11px] text-slate-500">GSM: {v.gsmLatency}</div>
                </div>
                <TangramButton variant="outline" size="sm">
                  Abrir Mapa
                </TangramButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
