import { useState, useEffect, useCallback } from 'react';
import { supabase }          from '../services/supabaseClient';
import { logAudit }          from '../services/audit';
import {
  fetchBufferEntries,
  createBufferEntry,
  updateBufferEntry,
  deleteBufferEntry,
} from '../services/api/buffer';
import type { BufferEntry } from '../types';

export function useBuffer() {
  const [entries,    setEntries]    = useState<BufferEntry[]>([]);
  const [loading,    setLoading]    = useState(true);   // primeira carga
  const [refreshing, setRefreshing] = useState(false);  // atualizações em bg
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    try {
      if (background) setRefreshing(true);
      else            setLoading(true);

      const data = await fetchBufferEntries();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar buffer');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);

    const channelName = `buffer-entries-${Date.now()}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'buffer_entries' },
        () => load(true)   // ← background: sem spinner
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  async function addEntry(
    payload: Omit<BufferEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    const created = await createBufferEntry(payload);
    await logAudit({ action: 'INSERT', resource: 'buffer', resource_id: created.id, payload: { poc_name: payload.poc_name } });
    await load(true); // Fix 3: reload explícito
  }

  async function editEntry(
    id: string,
    updates: Partial<Pick<BufferEntry, 'scheduled_date' | 'status' | 'reason' | 'notes' | 'volume_hl' | 'assigned_tour_id'>>
  ): Promise<void> {
    await updateBufferEntry(id, updates);
    await logAudit({ action: 'UPDATE', resource: 'buffer', resource_id: id, payload: updates as Record<string, unknown> });
    await load(true); // Fix 3
  }

  async function removeEntry(id: string): Promise<void> {
    await deleteBufferEntry(id);
    await logAudit({ action: 'DELETE', resource: 'buffer', resource_id: id });
    await load(true); // Fix 3
  }

  return { entries, loading, refreshing, error, addEntry, editEntry, removeEntry, reload: load };
}