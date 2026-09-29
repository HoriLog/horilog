import React, { useState } from 'react';
import { TangramModal } from './TangramModal';
import { TangramInput } from './TangramInput';
import { TangramSelect } from './TangramSelect';
import { TangramButton } from './TangramButton';
import { Truck } from 'lucide-react';
import { normalizePlate } from '../../utils/format';
import { OperationalStorage } from '../../services/storageService';

export interface NewVehicleData {
  model: string;
  plate: string; // already normalised (ABC-1D23)
  category: string;
  fuelCapacity: string;
  currentOdometer: string;
  driver: string;
  iotDeviceSerial: string;
}

export interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicle: NewVehicleData) => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    model: '',
    plate: '',
    category: 'Carreta 9 Eixos',
    fuelCapacity: '',
    currentOdometer: '',
    driver: '',
    iotDeviceSerial: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plate = normalizePlate(formData.plate);
    if (!formData.model.trim()) return setError('Informe o modelo.');
    if (!plate) return setError('Placa inválida. Use ABC-1234 ou ABC1D23.');
    if (OperationalStorage.getVehicles().some((v) => v.plate === plate)) {
      return setError(`A placa ${plate} já está cadastrada.`);
    }
    setError('');
    onSuccess({ ...formData, model: formData.model.trim(), plate });
    setFormData({
      model: '',
      plate: '',
      category: 'Carreta 9 Eixos',
      fuelCapacity: '',
      currentOdometer: '',
      driver: '',
      iotDeviceSerial: '',
    });
    onClose();
  };

  return (
    <TangramModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Veículo na Frota"
      subtitle="Integração de telemetria CAN-bus, tacógrafo e IoT"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs sm:text-sm">
        <div className="grid grid-cols-2 gap-3">
          <TangramInput
            label="Modelo / Fabricante"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Ex: Scania R 500"
            error={error === 'Informe o modelo.' ? error : undefined}
          />
          <TangramInput
            label="Placa Mercosul"
            value={formData.plate}
            onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
            placeholder="Ex: ABC1D23"
            error={error.toLowerCase().includes('placa') ? error : undefined}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TangramSelect
            label="Categoria de Frota"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'Carreta 9 Eixos', label: 'Carreta 9 Eixos' },
              { value: 'Bitrem', label: 'Bitrem 7 Eixos' },
              { value: 'Cavalo Mecânico', label: 'Cavalo Mecânico 6x4' },
              { value: 'Toco', label: 'Caminhão Toco' },
              { value: 'VUC', label: 'VUC Urbano' },
              { value: 'Fiorino', label: 'Fiorino Express' },
            ]}
          />
          <TangramInput
            label="Hodômetro Inicial (km)"
            value={formData.currentOdometer}
            onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
            placeholder="0 km"
          />
        </div>

        <TangramInput
          label="Motorista (opcional)"
          value={formData.driver}
          onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
          placeholder="Nome do motorista titular"
        />

        <TangramInput
          label="Número Serial do Rastreador Satelital (IoT / CAN)"
          value={formData.iotDeviceSerial}
          onChange={(e) => setFormData({ ...formData, iotDeviceSerial: e.target.value })}
          placeholder="CAN-IOT-xxxxxx"
        />

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
            Cadastrar Veículo
          </TangramButton>
        </div>
      </form>
    </TangramModal>
  );
};
