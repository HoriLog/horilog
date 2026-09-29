import { useCallback, useEffect, useState } from 'react';
import { VehicleTelemetry } from '../types';
import { listVehicles, subscribeToVehicles } from '../services/api/vehicles';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return subscribeToVehicles(reload); // qualquer mudança no banco (sua ou de outro usuário) recarrega a lista
  }, [reload]);

  return { vehicles, loading, error, reload };
}