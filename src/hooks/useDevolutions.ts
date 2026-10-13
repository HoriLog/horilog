import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { devolutionsApi, Devolution } from '../services/api/devolutions';

export function useDevolutions() {
  const [devolutions, setDevolutions] = useState<Devolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevolutions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await devolutionsApi.getAll();
      setDevolutions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevolutions();

    const channel = supabase
      .channel('public:devolutions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devolutions' },
        () => {
          fetchDevolutions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevolutions]);

  const handleUpdateStatus = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    supervisorId: string,
    comments?: string
  ) => {
    try {
      await devolutionsApi.updateStatus(id, status, supervisorId, comments);
      await fetchDevolutions();
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar status da devolução');
    }
  };

  return {
    devolutions,
    loading,
    error,
    updateStatus: handleUpdateStatus,
    refresh: fetchDevolutions,
  };
}