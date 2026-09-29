import React, { useState } from 'react';
import { TangramModal } from './TangramModal';
import { TangramInput } from './TangramInput';
import { TangramSelect } from './TangramSelect';
import { TangramButton } from './TangramButton';
import { Package, Truck, MapPin, Calendar, FileText } from 'lucide-react';

export interface NewShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shipment: any) => void;
}

export const NewShipmentModal: React.FC<NewShipmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    origin: 'Cajamar, SP (Hub Central)',
    destination: 'Curitiba, PR (CD Pinhais)',
    vehicleType: 'Carreta 9 Eixos',
    cargoType: 'Alimentos Congelados',
    weightKg: '38500',
    driver: 'Carlos Alberto Rocha',
    plate: 'BRA-4E29',
    slaDate: '2026-09-22',
    isRefrigerated: true,
    nfeNumber: 'NFe-89410',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData);
    onClose();
  };

  return (
    <TangramModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Carga & Remessa Operacional"
      subtitle="Despacho de frota, geração de manifesto MDF-e e SLA"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TangramSelect
            label="Hub de Origem"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            options={[
              { value: 'Cajamar, SP (Hub Central)', label: 'Cajamar, SP (Hub Central)' },
              { value: 'Betim, MG (Hub Regional)', label: 'Betim, MG (Hub Regional)' },
              { value: 'Resende, RJ (Hub Dutra)', label: 'Resende, RJ (Hub Dutra)' },
              { value: 'Curitiba, PR (Hub Sul)', label: 'Curitiba, PR (Hub Sul)' },
            ]}
          />
          <TangramSelect
            label="Destino / Centro de Distribuição"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            options={[
              { value: 'Curitiba, PR (CD Pinhais)', label: 'Curitiba, PR (CD Pinhais)' },
              { value: 'Rio de Janeiro, RJ (CD Pavuna)', label: 'Rio de Janeiro, RJ (CD Pavuna)' },
              { value: 'Belo Horizonte, MG (CD Contagem)', label: 'Belo Horizonte, MG (CD Contagem)' },
              { value: 'São Paulo, SP (CD Cajamar)', label: 'São Paulo, SP (CD Cajamar)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TangramSelect
            label="Tipo de Veículo / Conjunto"
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            options={[
              { value: 'Carreta 9 Eixos', label: 'Carreta 9 Eixos (Vanderleia/Graneleiro)' },
              { value: 'Bitrem 7 Eixos', label: 'Bitrem 7 Eixos' },
              { value: 'Cavalo Mecânico 6x4 Sider', label: 'Cavalo Mecânico 6x4 Sider' },
              { value: 'VUC Urbano', label: 'VUC Urbano' },
              { value: 'Fiorino Express', label: 'Fiorino Express' },
            ]}
          />
          <TangramInput
            label="Número da NFe / MDF-e"
            value={formData.nfeNumber}
            onChange={(e) => setFormData({ ...formData, nfeNumber: e.target.value })}
            placeholder="Ex: NFe-89410"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TangramInput
            label="Placa do Veículo"
            value={formData.plate}
            onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
            placeholder="Ex: BRA-4E29"
          />
          <TangramInput
            label="Motorista Designado"
            value={formData.driver}
            onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
            placeholder="Nome do motorista"
          />
          <TangramInput
            label="Peso Total (kg)"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
            placeholder="Ex: 38500"
          />
        </div>

        <div className="p-3 bg-[#EFF4FF] rounded-lg border border-[#DBE8FE] flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-[#0B1C30]">Monitoramento Térmico Ativo</div>
            <div className="text-[11px] text-[#737686]">
              Ativa telemetria do baú frigorífico com alarme para desvio de faixa (-20°C a -16°C).
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.isRefrigerated}
            onChange={(e) => setFormData({ ...formData, isRefrigerated: e.target.checked })}
            className="w-4 h-4 text-[#004AC6] rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <TangramButton
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </TangramButton>
          <TangramButton
            type="submit"
            variant="primary"
            fullWidth
            icon={<Truck className="w-4 h-4" />}
          >
            Emitir & Despachar Carga
          </TangramButton>
        </div>
      </form>
    </TangramModal>
  );
};
