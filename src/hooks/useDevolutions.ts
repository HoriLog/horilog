import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  listDevolutions,
  createManualDevolution,
  resolveDevolution,
  DevolutionRow,
} from '../services/api/devolutions';

export function useDevolutions() {
  const [devolutions, setDevolutions] = useState<DevolutionRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setDevolutions(await listDevolutions());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const channelName = `devolutions-${Date.now()}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devolutions' }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reload]);

  async function createManual(params: {
    external_tour_id: string;
    poc_external_id: string;
    poc_name: string;
    reason: string;
    reason_description: string;
    supervisor_comments?: string;
  }): Promise<void> {
    await createManualDevolution(params);
    await reload();
  }

  async function updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    supervisorId: string,
    comments: string | null
  ): Promise<void> {
    await resolveDevolution(id, status, supervisorId, comments);
    await reload();
  }

  return { devolutions, loading, error, refresh: reload, createManual, updateStatus };
}