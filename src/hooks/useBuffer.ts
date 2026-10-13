import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  fetchBufferEntries,
  createBufferEntry,
  updateBufferEntry,
  deleteBufferEntry,
} from '../services/api/buffer';
import type { BufferEntry } from '../types';

export function useBuffer() {
  const [entries, setEntries] = useState<BufferEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBufferEntries();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar buffer');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channelName = `buffer-entries-${Date.now()}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buffer_entries' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  async function addEntry(
    payload: Omit<BufferEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    await createBufferEntry(payload);
  }

  async function editEntry(
    id: string,
    updates: Partial<Pick<BufferEntry, 'scheduled_date' | 'status' | 'reason' | 'notes' | 'volume_hl' | 'assigned_tour_id'>>
  ): Promise<void> {
    await updateBufferEntry(id, updates);
  }

  async function removeEntry(id: string): Promise<void> {
    await deleteBufferEntry(id);
  }

  return { entries, loading, error, addEntry, editEntry, removeEntry, reload: load };
}