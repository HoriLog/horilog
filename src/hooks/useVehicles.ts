import { useCallback, useEffect, useState } from 'react';
import { VehicleTelemetry } from '../types';
import {
  listVehicles,
  subscribeToVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  NewVehicleInput,
  VehicleUpdateInput,
} from '../services/api/vehicles';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setVehicles(await listVehicles());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    return subscribeToVehicles(reload);
  }, [reload]);

  async function addVehicle(input: NewVehicleInput): Promise<void> {
    await createVehicle(input);
  }

  async function editVehicle(id: string, patch: VehicleUpdateInput): Promise<void> {
    await updateVehicle(id, patch);
    await reload();
  }

  async function removeVehicle(id: string): Promise<void> {
    await deleteVehicle(id);
  }

  return { vehicles, loading, error, reload, addVehicle, editVehicle, removeVehicle };
}