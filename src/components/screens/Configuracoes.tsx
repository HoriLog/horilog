import React, { useState } from 'react';
import { Settings, Sliders, Shield, Bell, Database, CheckCircle2 } from 'lucide-react';
import { TangramButton } from '../tangram/TangramButton';
import { TangramInput } from '../tangram/TangramInput';

export const Configuracoes: React.FC = () => {
  const [telemetryPing, setTelemetryPing] = useState('10');
  const [tempAlertMin, setTempAlertMin] = useState('-20.0');
  const [tempAlertMax, setTempAlertMax] = useState('-16.0');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1C30] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>Configurações do ERP LogiFlow salvas com sucesso.</span>
        </div>
      )}

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <h1 className="text-xl font-bold text-[#0B1C30]">Configurações do Sistema ERP</h1>
        <p className="text-xs sm:text-sm text-[#737686]">Parametrização de telemetria CAN-bus, tolerâncias térmicas e design system Tangram.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#004AC6]" />
            Parâmetros de Telemetria & Rastreamento
          </h2>
          <TangramInput
            label="Frequência de Ping do Rastreador Satelital (Segundos)"
            value={telemetryPing}
            onChange={(e) => setTelemetryPing(e.target.value)}
            hint="Recomendado: 10s para trânsito rápido rodoviário."
          />
          <div className="grid grid-cols-2 gap-3">
            <TangramInput
              label="Temp Mínima Baú Frigorífico (°C)"
              value={tempAlertMin}
              onChange={(e) => setTempAlertMin(e.target.value)}
            />
            <TangramInput
              label="Temp Máxima Baú Frigorífico (°C)"
              value={tempAlertMax}
              onChange={(e) => setTempAlertMax(e.target.value)}
            />
          </div>
          <TangramButton variant="primary" size="sm" onClick={handleSave}>
            Salvar Parâmetros
          </TangramButton>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#006C49]" />
            Certificado Digital & Emissão Fiscal
          </h2>
          <div className="p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE] text-xs">
            <div className="font-bold text-[#0B1C30]">Certificado A1 (e-CNPJ) LogiFlow S/A</div>
            <div className="text-slate-600 mt-0.5">Emissor: Autoridade Certificadora SERPRO • Válido até 18/12/2026</div>
            <div className="mt-2 text-[#006C49] font-bold">Status: Ativo & Conectado à SEFAZ</div>
          </div>
          <div className="text-xs text-slate-500">
            Ambiente de Produção Nacional ativo. Manifestos MDF-e e Conhecimentos CT-e são sincronizados automaticamente.
          </div>
          <TangramButton variant="outline" size="sm">
            Testar Conectividade SEFAZ
          </TangramButton>
        </div>
      </div>
    </div>
  );
};
