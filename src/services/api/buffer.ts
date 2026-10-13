import { supabase } from '../supabaseClient';
import type { BufferEntry } from '../../types';

export async function fetchBufferEntries(): Promise<BufferEntry[]> {
  const { data, error } = await supabase
    .from('buffer_entries')
    .select('*')
    .order('original_date', { ascending: false });
  if (error) throw error;
  return (data as BufferEntry[]) ?? [];
}

export async function createBufferEntry(
  payload: Omit<BufferEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<BufferEntry> {
  const { data, error } = await supabase
    .from('buffer_entries')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as BufferEntry;
}

export async function updateBufferEntry(
  id: string,
  updates: Partial<
    Pick<BufferEntry, 'scheduled_date' | 'status' | 'reason' | 'notes' | 'volume_hl' | 'assigned_tour_id'>
  >
): Promise<BufferEntry> {
  const { data, error } = await supabase
    .from('buffer_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as BufferEntry;
}

export async function deleteBufferEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('buffer_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}