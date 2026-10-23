import { useEffect, useState } from 'react';
import { fetchSectors, Sector } from '../services/api/sectors';

export function useSectors() {
  const [sectors,  setSectors]  = useState<Sector[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchSectors()
      .then(setSectors)
      .finally(() => setLoading(false));
  }, []);

  function getVendedor(code: string | null): string | null {
    if (!code) return null;
    return sectors.find(s => s.code === code)?.vendedor ?? null;
  }

  return { sectors, loading, getVendedor };
}